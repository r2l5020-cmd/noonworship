-- Apply once in a dedicated Supabase project. No secret keys or invitation codes belong in this file.
begin;
create extension if not exists pgcrypto with schema extensions;
create schema studio_private;
revoke all on schema studio_private from public,anon;
grant usage on schema studio_private to authenticated;
create table public.studio_rooms (
  id uuid primary key default gen_random_uuid(), name text not null,
  invite_hash text not null, running boolean not null default false,
  tempo integer not null default 84 check(tempo between 50 and 160), started bigint not null default 0
);
create table public.studio_memberships (
  room_id uuid references public.studio_rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  primary key(room_id,user_id)
);
create table public.studio_actors (
  room_id uuid references public.studio_rooms on delete cascade,
  character integer check(character between 0 and 6), user_id uuid references auth.users on delete cascade,
  session_id uuid not null, x real not null, y real not null,
  mood text not null default 'smile', seen bigint not null,
  last_action bigint not null default 0, last_chat bigint not null default 0,
  primary key(room_id,character)
);
create table public.studio_chats (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.studio_rooms on delete cascade,
  character integer not null check(character between 0 and 6),
  text text not null check(length(text) between 1 and 300), at bigint not null
);
create index studio_chats_room_id on public.studio_chats(room_id,id desc);
create index studio_memberships_user_id on public.studio_memberships(user_id);
create index studio_actors_user_id on public.studio_actors(user_id);
create sequence public.studio_event_seq;
alter table public.studio_rooms enable row level security;
alter table public.studio_memberships enable row level security;
alter table public.studio_actors enable row level security;
alter table public.studio_chats enable row level security;
revoke all on public.studio_rooms,public.studio_memberships,public.studio_actors,public.studio_chats from anon,authenticated;
revoke all on sequence public.studio_event_seq from anon,authenticated;

create function public.studio_is_member(p_room uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.studio_memberships where room_id=p_room and user_id=(select auth.uid()));
$$;
revoke all on function public.studio_is_member(uuid) from public,anon;
grant execute on function public.studio_is_member(uuid) to authenticated;

-- Clients receive server-authored events only. No INSERT policy is granted on realtime.messages.
create policy studio_receive on realtime.messages for select to authenticated using (
 extension='broadcast' and exists(
  select 1 from public.studio_memberships m
  where m.user_id=(select auth.uid()) and 'studio:'||m.room_id::text=(select realtime.topic())
 )
);
grant select on public.studio_memberships to authenticated;
create policy studio_own_membership on public.studio_memberships for select to authenticated
 using(user_id=(select auth.uid()));

create function studio_private.studio_enter(p_code text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_room uuid;
begin
 if auth.uid() is null then raise exception '로그인이 필요해요.' using errcode='28000'; end if;
 if p_code is null or length(p_code)<12 or length(p_code)>100 then
  raise exception '초대코드를 확인해 주세요.' using errcode='22023';
 end if;
 select id into v_room from public.studio_rooms
 where invite_hash=extensions.crypt(p_code,invite_hash) limit 1;
 if v_room is null then raise exception '초대코드가 맞지 않아요.' using errcode='28000'; end if;
 insert into public.studio_memberships values(v_room,auth.uid()) on conflict do nothing;
 return v_room;
end;
$$;

create function studio_private.studio_snapshot(p_room uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_now bigint:=(extract(epoch from clock_timestamp())*1000)::bigint; v_result jsonb;
begin
 if not public.studio_is_member(p_room) then raise exception '방에 입장해 주세요.' using errcode='28000'; end if;
 select jsonb_build_object(
  'members',coalesce((select jsonb_agg(jsonb_build_object('character',a.character,'x',a.x,'y',a.y,'mood',a.mood,'seen',a.seen)) from public.studio_actors a where a.room_id=p_room and a.seen>v_now-30000),'[]'::jsonb),
  'messages',coalesce((select jsonb_agg(to_jsonb(c) order by c.id) from (select id,character,text,at from public.studio_chats where room_id=p_room order by id desc limit 80)c),'[]'::jsonb),
  'events','[]'::jsonb,'now',v_now,'jam',jsonb_build_object('running',case when r.running then 1 else 0 end,'tempo',r.tempo,'started',r.started)
 ) into v_result from public.studio_rooms r where r.id=p_room;
 return v_result;
end;
$$;

create function studio_private.studio_act(p_room uuid,p_session uuid,p_character integer,p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_now bigint:=(extract(epoch from clock_timestamp())*1000)::bigint;
 v_actor public.studio_actors; v_event jsonb; v_data jsonb;
 v_x real; v_y real; v_mood text; v_text text; v_note integer; v_instrument text;
 v_tempo integer; v_running boolean; v_rows integer; v_positions jsonb:='[[25,76],[18,56],[61,62],[44,69],[79,77],[77,49],[48,49]]';
begin
 if not public.studio_is_member(p_room) then raise exception '초대 링크로 다시 입장해 주세요.' using errcode='28000'; end if;
 if p_session is null or p_character is null or p_character not between 0 and 6 then raise exception '캐릭터를 골라 주세요.' using errcode='22023'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>4096 then raise exception '전송할 내용이 너무 커요.' using errcode='22023'; end if;
 -- Serializes claims and actions within this seven-person room, including concurrent joins.
 perform pg_advisory_xact_lock(hashtextextended(p_room::text,0));
 if p_action='join' then
  insert into public.studio_actors(room_id,character,user_id,session_id,x,y,mood,seen)
  values(p_room,p_character,auth.uid(),p_session,(v_positions->p_character->>0)::real,(v_positions->p_character->>1)::real,'smile',v_now)
  on conflict(room_id,character) do update set user_id=excluded.user_id,session_id=excluded.session_id,seen=excluded.seen
  where studio_actors.seen<v_now-30000 or (studio_actors.user_id=auth.uid() and studio_actors.session_id=p_session);
  get diagnostics v_rows=row_count;
  if v_rows=0 then raise exception '이 캐릭터는 다른 친구가 사용 중이에요.' using errcode='23505'; end if;
 else
  select * into v_actor from public.studio_actors where room_id=p_room and character=p_character and user_id=auth.uid() and session_id=p_session and seen>v_now-30000;
  if not found then raise exception '접속이 끊어졌어요. 캐릭터를 다시 골라 주세요.' using errcode='28000'; end if;
  if p_action='leave' then
   delete from public.studio_actors where room_id=p_room and character=p_character;
   v_event:=jsonb_build_object('type','leave','character',p_character);
  elsif p_action='heartbeat' then
   update public.studio_actors set seen=v_now where room_id=p_room and character=p_character;
   return jsonb_build_object('ok',true,'now',v_now);
  elsif p_action='move' then
   v_x:=(p_payload->>'x')::real; v_y:=(p_payload->>'y')::real;
   if v_x is null or v_y is null or v_x::text in ('NaN','Infinity','-Infinity') or v_y::text in ('NaN','Infinity','-Infinity') then raise exception '이동 위치를 확인해 주세요.' using errcode='22023'; end if;
   update public.studio_actors set x=greatest(10,least(89,v_x)),y=greatest(44,least(83,v_y)) where room_id=p_room and character=p_character;
  elsif p_action='mood' then
   v_mood:=p_payload->>'mood';
   if v_mood is null or v_mood not in ('smile','laugh','heart','wow','sing','sad') then raise exception '표정을 골라 주세요.' using errcode='22023'; end if;
   update public.studio_actors set mood=v_mood where room_id=p_room and character=p_character;
  elsif p_action='chat' then
   if v_now-v_actor.last_chat<500 then raise exception '조금만 천천히 보내 주세요.' using errcode='P0001'; end if;
   v_text:=left(trim(p_payload->>'text'),300);
   if v_text is null or length(v_text)=0 then raise exception '메시지를 입력해 주세요.' using errcode='22023'; end if;
   insert into public.studio_chats(room_id,character,text,at) values(p_room,p_character,v_text,v_now)
   returning jsonb_build_object('id',id,'character',character,'text',text,'at',at) into v_data;
   update public.studio_actors set last_chat=v_now where room_id=p_room and character=p_character;
   delete from public.studio_chats where room_id=p_room and id not in(select id from public.studio_chats where room_id=p_room order by id desc limit 300);
   v_event:=jsonb_build_object('type','chat','message',v_data);
  elsif p_action='note' then
   v_note:=(p_payload->>'note')::integer; v_instrument:=p_payload->>'instrument';
   if v_note is null or v_note not between 0 and 7 or v_instrument is null or v_instrument not in ('piano','guitar','bell','drum') then raise exception '연주할 음을 골라 주세요.' using errcode='22023'; end if;
   v_event:=jsonb_build_object('type','note','character',p_character,'note',v_note,'instrument',v_instrument);
  elsif p_action='jam' then
   v_tempo:=greatest(50,least(160,coalesce((p_payload->>'tempo')::integer,84)));
   v_running:=coalesce((p_payload->>'running')::boolean,false);
   update public.studio_rooms set running=v_running,tempo=v_tempo,started=v_now+3000 where id=p_room;
   v_event:=jsonb_build_object('type','jam','jam',jsonb_build_object('running',case when v_running then 1 else 0 end,'tempo',v_tempo,'started',v_now+3000));
  else raise exception '지원하지 않는 동작이에요.' using errcode='22023';
  end if;
  if p_action not in ('leave','chat') and v_now-v_actor.last_action<100 then raise exception '조금만 천천히 움직여 주세요.' using errcode='P0001'; end if;
 end if;
 if p_action<>'leave' then
  update public.studio_actors set seen=v_now,last_action=v_now where room_id=p_room and character=p_character;
 end if;
 if v_event is null then
  select jsonb_build_object('type','actor','actor',jsonb_build_object('character',character,'x',x,'y',y,'mood',mood,'seen',seen)) into v_event from public.studio_actors where room_id=p_room and character=p_character;
 end if;
 v_event:=v_event||jsonb_build_object('id',nextval('public.studio_event_seq'),'at',v_now);
 perform realtime.send(v_event,'room','studio:'||p_room::text,true);
 return jsonb_build_object('ok',true,'now',v_now,'event',v_event);
end;
$$;
revoke all on function studio_private.studio_enter(text),studio_private.studio_snapshot(uuid),studio_private.studio_act(uuid,uuid,integer,text,jsonb) from public,anon;
grant execute on function studio_private.studio_enter(text),studio_private.studio_snapshot(uuid),studio_private.studio_act(uuid,uuid,integer,text,jsonb) to authenticated;
create function public.studio_enter(p_code text) returns uuid
language sql security invoker set search_path='' as $$ select studio_private.studio_enter(p_code); $$;
create function public.studio_snapshot(p_room uuid) returns jsonb
language sql security invoker set search_path='' as $$ select studio_private.studio_snapshot(p_room); $$;
create function public.studio_act(p_room uuid,p_session uuid,p_character integer,p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select studio_private.studio_act(p_room,p_session,p_character,p_action,p_payload); $$;
revoke all on function public.studio_enter(text),public.studio_snapshot(uuid),public.studio_act(uuid,uuid,integer,text,jsonb) from public,anon;
grant execute on function public.studio_enter(text),public.studio_snapshot(uuid),public.studio_act(uuid,uuid,integer,text,jsonb) to authenticated;
commit;

-- Reset location and station on a new claim; preserve same-session reconnects.
begin;
CREATE OR REPLACE FUNCTION studio_private.studio_act(p_room uuid, p_session uuid, p_character integer, p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_now bigint:=(extract(epoch from clock_timestamp())*1000)::bigint;
 v_actor public.studio_actors; v_event jsonb; v_data jsonb;
 v_x real; v_y real; v_mood text; v_text text; v_note integer; v_instrument text;
 v_space text; v_pose text; v_spot text; v_path text;
 v_tempo integer; v_running boolean; v_rows integer; v_positions jsonb:='[[25,76],[18,56],[61,62],[44,69],[79,77],[77,49],[48,49]]';
begin
 if not public.studio_is_member(p_room) then raise exception '초대 링크로 다시 입장해 주세요.' using errcode='28000'; end if;
 if p_session is null or p_character is null or p_character not between 0 and 6 then raise exception '캐릭터를 골라 주세요.' using errcode='22023'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>4096 then raise exception '전송할 내용이 너무 커요.' using errcode='22023'; end if;
 -- Serializes claims and actions within this seven-person room, including concurrent joins.
 perform pg_advisory_xact_lock(hashtextextended(p_room::text,0));
 if p_action='join' then
  v_space:=coalesce(p_payload->>'space','hall');
  if v_space not in ('hall','forest') then raise exception '공간을 확인해 주세요.' using errcode='22023'; end if;
  if v_space='forest' then v_positions:='[[24,78],[38,70],[52,78],[64,72],[76,79],[85,66],[46,59]]'; end if;
  insert into public.studio_actors(room_id,character,user_id,session_id,x,y,mood,seen,space)
  values(p_room,p_character,auth.uid(),p_session,(v_positions->p_character->>0)::real,(v_positions->p_character->>1)::real,'smile',v_now,v_space)
  on conflict(room_id,character) do update set user_id=excluded.user_id,session_id=excluded.session_id,seen=excluded.seen,space=case when studio_actors.user_id=excluded.user_id and studio_actors.session_id=excluded.session_id then studio_actors.space else excluded.space end,x=case when studio_actors.user_id=excluded.user_id and studio_actors.session_id=excluded.session_id then studio_actors.x else excluded.x end,y=case when studio_actors.user_id=excluded.user_id and studio_actors.session_id=excluded.session_id then studio_actors.y else excluded.y end,pose=case when studio_actors.user_id=excluded.user_id and studio_actors.session_id=excluded.session_id then studio_actors.pose else 'stand' end,spot=case when studio_actors.user_id=excluded.user_id and studio_actors.session_id=excluded.session_id then studio_actors.spot else null end
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
   update public.studio_actors set pose='stand',spot=null,x=greatest(10,least(89,v_x)),y=greatest(44,least(83,v_y)) where room_id=p_room and character=p_character;
  elsif p_action='space' then
   v_space:=p_payload->>'space';
   if v_space is null or v_space not in ('hall','forest') then raise exception '공간을 확인해 주세요.' using errcode='22023'; end if;
   if v_space='forest' then v_positions:='[[24,78],[38,70],[52,78],[64,72],[76,79],[85,66],[46,59]]'; end if;
   update public.studio_actors set space=v_space,pose='stand',spot=null,x=(v_positions->p_character->>0)::real,y=(v_positions->p_character->>1)::real where room_id=p_room and character=p_character;
  elsif p_action='pose' then
   v_pose:=p_payload->>'pose';
   if v_pose is null or v_pose not in ('stand','sit','wave','clap') then raise exception '동작을 선택해 주세요.' using errcode='22023'; end if;
   update public.studio_actors set x=case when spot='keyboard' and v_pose<>'sit' then greatest(10,x-7) else x end,y=case when spot='keyboard' and v_pose<>'sit' then least(83,y+12) else y end,pose=v_pose,spot=case when spot='keyboard' and v_pose<>'sit' then null else spot end where room_id=p_room and character=p_character;
  elsif p_action='spot' then
   v_spot:=p_payload->>'spot';
   if v_spot is null or v_spot not in ('keyboard','stand-1','stand-2','none') or v_actor.space<>'hall' then raise exception '디모데홀의 자리를 선택해 주세요.' using errcode='22023'; end if;
   if v_spot<>'none' and exists(select 1 from public.studio_actors where room_id=p_room and space='hall' and spot=v_spot and character<>p_character and seen>v_now-30000) then raise exception '이미 사용 중인 자리입니다.' using errcode='23505'; end if;
   v_x:=case v_spot when 'keyboard' then 84 when 'stand-1' then 45 when 'stand-2' then 70 else greatest(10,v_actor.x-7) end;
   v_y:=case v_spot when 'keyboard' then 57 when 'stand-1' then 70 when 'stand-2' then 73 else least(83,v_actor.y+7) end;
   update public.studio_actors set spot=nullif(v_spot,'none'),pose=case when v_spot='keyboard' then 'sit' else 'stand' end,x=v_x,y=v_y where room_id=p_room and character=p_character;
  elsif p_action='photo' then
   v_path:=p_payload->>'path';
   if p_payload->>'space' is distinct from v_actor.space or v_path is null or v_path !~ ('^'||p_room::text||'/'||auth.uid()::text||'/[0-9a-f-]{36}\.jpg$') then raise exception '사진 업로드 경로를 확인해 주세요.' using errcode='22023'; end if;
   if not exists(select 1 from storage.objects where bucket_id='studio-photos' and name=v_path and owner_id=auth.uid()::text) then raise exception '업로드한 사진을 찾지 못했습니다.' using errcode='22023'; end if;
   insert into public.studio_photos(room_id,space,object_path,character,at) values(p_room,v_actor.space,v_path,p_character,v_now)
   returning jsonb_build_object('id',id,'space',space,'path',object_path,'character',character,'at',at) into v_data;
   v_event:=jsonb_build_object('type','photo','photo',v_data);
  elsif p_action='mood' then
   v_mood:=p_payload->>'mood';
   if v_mood is null or v_mood not in ('smile','laugh','heart','wow','sing','sad') then raise exception '표정을 골라 주세요.' using errcode='22023'; end if;
   update public.studio_actors set mood=v_mood where room_id=p_room and character=p_character;
  elsif p_action='chat' then
   if v_now-v_actor.last_chat<500 then raise exception '조금만 천천히 보내 주세요.' using errcode='P0001'; end if;
   v_text:=left(trim(p_payload->>'text'),300);
   if v_text is null or length(v_text)=0 then raise exception '메시지를 입력해 주세요.' using errcode='22023'; end if;
   insert into public.studio_chats(room_id,character,text,at,space) values(p_room,p_character,v_text,v_now,v_actor.space)
   returning jsonb_build_object('id',id,'character',character,'text',text,'at',at,'space',space) into v_data;
   update public.studio_actors set last_chat=v_now where room_id=p_room and character=p_character;
   delete from public.studio_chats where room_id=p_room and id not in(select id from public.studio_chats where room_id=p_room order by id desc limit 300);
   v_event:=jsonb_build_object('type','chat','message',v_data);
  elsif p_action='note' then
   v_note:=(p_payload->>'note')::integer; v_instrument:=p_payload->>'instrument';
   if v_note is null or v_note not between 0 and 7 or v_instrument is null or v_instrument not in ('piano','guitar','bell','drum') then raise exception '연주할 음을 골라 주세요.' using errcode='22023'; end if;
   v_event:=jsonb_build_object('type','note','character',p_character,'note',v_note,'instrument',v_instrument,'space',v_actor.space);
  elsif p_action='jam' then
   if v_actor.space<>'hall' then raise exception '합주는 디모데홀에서 시작해 주세요.' using errcode='22023'; end if;
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
  select jsonb_build_object('type','actor','actor',jsonb_build_object('character',character,'x',x,'y',y,'mood',mood,'seen',seen,'space',space,'pose',pose,'spot',spot)) into v_event from public.studio_actors where room_id=p_room and character=p_character;
 end if;
 v_event:=v_event||jsonb_build_object('id',nextval('public.studio_event_seq'),'at',v_now);
 perform realtime.send(v_event,'room','studio:'||p_room::text,true);
 return jsonb_build_object('ok',true,'now',v_now,'event',v_event);
end;
$function$
;

commit;

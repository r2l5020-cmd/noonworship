-- Preserve the latest frame and 24 recent photos independently in each space.
begin;
CREATE OR REPLACE FUNCTION studio_private.studio_snapshot(p_room uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_now bigint:=(extract(epoch from clock_timestamp())*1000)::bigint; v_result jsonb;
begin
 if not public.studio_is_member(p_room) then raise exception '방에 입장해 주세요.' using errcode='28000'; end if;
 select jsonb_build_object(
  'members',coalesce((select jsonb_agg(jsonb_build_object('character',a.character,'x',a.x,'y',a.y,'mood',a.mood,'seen',a.seen,'space',a.space,'pose',a.pose,'spot',a.spot)) from public.studio_actors a where a.room_id=p_room and a.seen>v_now-30000),'[]'::jsonb),
  'messages',coalesce((select jsonb_agg(to_jsonb(c) order by c.id) from (select id,character,text,at,space from public.studio_chats where room_id=p_room order by id desc limit 80)c),'[]'::jsonb),
  'photos',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'space',p.space,'path',p.object_path,'character',p.character,'at',p.at) order by p.at desc) from (select * from (select p.*,row_number() over(partition by p.space order by p.at desc) as photo_rank from public.studio_photos p where p.room_id=p_room) ranked where photo_rank<=24)p),'[]'::jsonb),
  'events','[]'::jsonb,'now',v_now,'jam',jsonb_build_object('running',case when r.running then 1 else 0 end,'tempo',r.tempo,'started',r.started)
 ) into v_result from public.studio_rooms r where r.id=p_room;
 return v_result;
end;
$function$
;
commit;

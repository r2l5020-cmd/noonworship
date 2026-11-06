import {applyRoomEvent,emptyRoom,type Room} from './room-state';
declare global {interface Window {STUDIO_CONFIG?:{supabaseUrl:string,publishableKey:string};supabase?:any;}}
type Observer=(room:Room,connected:boolean)=>void;
export class RoomClient {
 private sdk:any; private channel:any; private roomId=''; private state=emptyRoom();
 private observers=new Set<Observer>(); private ready=false; private socketReady=false; private generation=0; private timer:ReturnType<typeof setInterval>|null=null;
 private syncInFlight=false; private queued:any[]=[]; private eventIds=new Set<number>(); private offset=0;
 private pendingMove:any=null; private moveTimer:ReturnType<typeof setTimeout>|null=null;
 get configured(){const c=window.STUDIO_CONFIG;return !!c&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(c.supabaseUrl)&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(c.publishableKey);}
 onChange(fn:Observer){this.observers.add(fn);return()=>{this.observers.delete(fn)}}
 private emit(){for(const fn of this.observers)fn(this.read(),this.ready)}
 read():Room{return {...this.state,now:Date.now()+this.offset,members:this.state.members.filter(m=>m.seen>Date.now()+this.offset-30000)}}
 private apply(event:any){if(!event||this.eventIds.has(event.id))return;if(this.syncInFlight){this.queued.push(event);return}this.eventIds.add(event.id);if(this.eventIds.size>2000)this.eventIds=new Set([...this.eventIds].slice(-500));this.state=applyRoomEvent(this.state,event);this.emit();}
 async open(code:string){
  const generation=++this.generation;
  if(!this.configured)throw Error('방 주인이 합주실 연결을 준비하고 있어요. 잠시 후 다시 와 주세요.');
  if(!window.supabase)throw Error('연결 프로그램을 불러오지 못했어요. 새로고침해 주세요.');
  if(this.channel)await this.sdk.removeChannel(this.channel);if(this.timer)clearInterval(this.timer);
  this.ready=false;this.socketReady=false;this.state=emptyRoom();this.eventIds.clear();this.emit();
  const cfg=window.STUDIO_CONFIG!;
  if(!this.sdk){this.sdk=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
   this.sdk.auth.onAuthStateChange((_event:string,session:any)=>{if(session?.access_token)setTimeout(()=>{void this.sdk.realtime.setAuth(session.access_token)},0)});
  }
  const {data:auth,error:sessionError}=await this.sdk.auth.getSession();if(sessionError)throw sessionError;
  let session=auth.session;
  if(!session){const signed=await this.sdk.auth.signInAnonymously();if(signed.error)throw Error('게스트 입장에 실패했어요. 방 주인에게 알려 주세요.');session=signed.data.session;}
  const entered=await this.sdk.rpc('studio_enter',{p_code:code.trim()});if(entered.error)throw Error(entered.error.message);this.roomId=entered.data;
  await this.sdk.realtime.setAuth(session.access_token);
  this.channel=this.sdk.channel('studio:'+this.roomId,{config:{private:true}}).on('broadcast',{event:'room'},({payload}:any)=>{if(generation===this.generation)this.apply(payload)});
  await new Promise<void>((resolve,reject)=>{
   let settled=false;const timeout=setTimeout(()=>{if(!settled){settled=true;this.ready=false;reject(Error('방 연결이 늦어지고 있어요. 잠시 후 다시 입장해 주세요.'))}},15000);
   this.channel.subscribe(async(status:string)=>{
    if(generation!==this.generation)return;
    if(status==='SUBSCRIBED'){this.socketReady=true;
     try{await this.sync();this.ready=true;this.emit();if(!settled){settled=true;clearTimeout(timeout);resolve()}}
     catch(e){this.ready=false;this.emit();if(!settled){settled=true;clearTimeout(timeout);reject(e)}}
    }else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){this.socketReady=false;this.ready=false;this.emit();if(!settled){settled=true;clearTimeout(timeout);reject(Error('합주실 연결을 확인해 주세요.'))}}
   });
  });
  this.timer=setInterval(()=>{void this.sync().catch(()=>{this.ready=false;this.emit()})},20000);
 }
 async sync(){
  if(!this.roomId||this.syncInFlight)return;this.syncInFlight=true;const start=Date.now();
  try{const {data,error}=await this.sdk.rpc('studio_snapshot',{p_room:this.roomId});if(error)throw Error(error.message);this.offset=data.now-(start+Date.now())/2;this.state={...data,events:this.state.events};if(this.socketReady)this.ready=true;}
  finally{this.syncInFlight=false;const buffered=this.queued.splice(0).sort((a,b)=>a.id-b.id);for(const e of buffered)this.apply(e)}
  this.emit();
 }
 async act(action:string,values:Record<string,unknown>,character:number,session:string){
  if(!this.ready)throw Error('초대코드로 방에 먼저 입장해 주세요.');
  const {data,error}=await this.sdk.rpc('studio_act',{p_room:this.roomId,p_session:session,p_character:character,p_action:action,p_payload:values});
  if(error){const e=Object.assign(new Error(error.message),{code:error.code});throw e;}
  if(data.event)this.apply(data.event);return data;
 }
 move(values:Record<string,unknown>,character:number,session:string,onError:(e:any)=>void){
  this.pendingMove={values,character,session};if(this.moveTimer)return;
  const send=()=>{this.moveTimer=null;const pending=this.pendingMove;this.pendingMove=null;if(pending)void this.act('move',pending.values,pending.character,pending.session).catch(onError)};
  this.moveTimer=setTimeout(send,450);
 }
 async close(){this.generation++;this.socketReady=false;if(this.timer)clearInterval(this.timer);if(this.moveTimer)clearTimeout(this.moveTimer);this.pendingMove=null;this.ready=false;if(this.channel)await this.sdk.removeChannel(this.channel);this.channel=null;this.emit()}
}
export const backend=new RoomClient();

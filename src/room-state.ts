export type Space='hall'|'forest';
export type Pose='stand'|'sit'|'wave'|'clap';
export type Member={character:number,x:number,y:number,mood:string,seen:number,space?:Space,pose?:Pose,spot?:string|null};
export type Message={id:number,character:number,text:string,at:number,space?:Space};
export type Photo={id:string,space:Space,path:string,character:number,at:number};
export type Jam={running:number,tempo:number,started:number};
export type Room={members:Member[],messages:Message[],events:any[],jam:Jam,now:number,photos?:Photo[]};
export const emptyRoom=():Room=>({members:[],messages:[],events:[],photos:[],jam:{running:0,tempo:84,started:0},now:Date.now()});
export function applyRoomEvent(state:Room,e:any):Room{
 if(!e||!Number.isFinite(e.id)||!Number.isFinite(e.at)||e.at<state.now-30000)return state;
 let next={...state,now:Math.max(state.now,e.at),events:state.events.filter(n=>n.at>e.at-8000)};
 if(e.type==='actor'&&e.actor){const a=e.actor;const prev=state.members.find(m=>m.character===a.character);if(!prev||prev.seen<=a.seen)next.members=[...state.members.filter(m=>m.character!==a.character),a];}
 if(e.type==='leave')next.members=state.members.filter(m=>m.character!==e.character||m.seen>e.at);
 if(e.type==='chat'&&e.message&&!state.messages.some(m=>m.id===e.message.id))next.messages=[...state.messages,e.message].sort((a,b)=>a.id-b.id).slice(-80);
 if(e.type==='jam'&&e.jam&&e.at>=state.jam.started-3000)next.jam=e.jam;
 if(e.type==='note'&&!state.events.some(n=>n.id===e.id))next.events=[...next.events,{id:e.id,character:e.character,kind:'note',at:e.at,space:e.space||'hall',value:JSON.stringify({note:e.note,instrument:e.instrument})}];
 if(e.type==='photo'&&e.photo){const photos=[...(state.photos||[]).filter(p=>p.id!==e.photo.id),e.photo].sort((a,b)=>b.at-a.at);next.photos=['hall','forest'].flatMap(space=>photos.filter(p=>p.space===space).slice(0,24)).sort((a,b)=>b.at-a.at);}
 return next;
}

import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Camera,ChevronLeft,ChevronRight,ImagePlus,X} from 'lucide-react';
import {backend} from './room-client';
import {characters} from './characters';
import type {Photo} from './room-state';

export async function preparePhoto(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG, PNG, WebP 사진을 선택하세요.');
 if(file.size>20*1024*1024)throw Error('20MB 이하의 사진을 선택하세요.');
 const url=URL.createObjectURL(file),img=new Image();
 try{
  img.src=url;await img.decode();
  const scale=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  // Re-encoding removes source EXIF/GPS metadata and caps stored file size.
  const encode=(quality:number)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('사진을 변환하지 못했습니다.')),'image/jpeg',quality));
  let blob=await encode(.84);if(blob.size>1048576)blob=await encode(.6);if(blob.size>1048576)throw Error('조금 더 작은 사진을 선택하세요.');return blob;
 }catch(e){if(e instanceof Error&&e.message)throw e;throw Error('사진을 읽지 못했습니다.');}finally{URL.revokeObjectURL(url)}
}
function usePhotoUrl(photo?:Photo){
 const [url,setUrl]=useState(''),[error,setError]=useState(false);
 useEffect(()=>{let alive=true;setUrl('');setError(false);const load=()=>backend.photoUrl(photo!.path).then(u=>{if(alive){setUrl(u);setError(false)}}).catch(()=>{if(alive)setError(true)});if(!photo)return;void load();const timer=setInterval(()=>void load(),50*60*1000);return()=>{alive=false;clearInterval(timer)}},[photo?.id,photo?.path]);return {url,error};
}
function PhotoImage({photo}:{photo:Photo}){const {url,error}=usePhotoUrl(photo);return url?<img src={url} alt={characters[photo.character].name+'이 올린 사진'} draggable={false}/>:<span className="photo-loading">{error?'사진을 불러오지 못했습니다.':'사진 불러오는 중…'}</span>}
export function PhotoWall({photos,uploading,canUpload,onUpload,onNeedJoin}:{photos:Photo[],uploading:boolean,canUpload:boolean,onUpload:(file:File)=>void,onNeedJoin:()=>void}){
 const input=useRef<HTMLInputElement>(null),[viewing,setViewing]=useState<string|null>(null);
 const index=Math.max(0,photos.findIndex(p=>p.id===viewing)),photo=photos[index];
 const pick=()=>canUpload?input.current?.click():onNeedJoin();
 useEffect(()=>{if(!viewing)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setViewing(null)};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[viewing]);
 return <div className="photo-wall" onClick={e=>e.stopPropagation()}>
  <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="공유할 사진 선택" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)onUpload(file)}}/>
  <button className={'wall-frame '+(photos.length?'has-photo':'')} aria-label={photos.length?'공유 사진 크게 보기':'액자에 사진 걸기'} onClick={()=>photos.length?setViewing(photos[0].id):pick()} disabled={uploading}>{photos[0]?<PhotoImage photo={photos[0]}/>:<><Camera size={25}/><span>{uploading?'업로드 중…':'사진 걸기'}</span></>}</button>
  <button className="photo-upload" onClick={pick} disabled={uploading} aria-label="사진 올리기"><ImagePlus size={14}/><span>{uploading?'업로드 중…':'사진 올리기'}</span></button>
  {viewing&&photo&&createPortal(<div className="modal-backdrop photo-backdrop" onClick={()=>setViewing(null)}><section className="photo-viewer" role="dialog" aria-modal="true" aria-labelledby="photo-title" onClick={e=>e.stopPropagation()}><header><h2 id="photo-title">공유 사진</h2><button onClick={()=>setViewing(null)} aria-label="사진 닫기"><X size={20}/></button></header><div className="photo-large"><PhotoImage photo={photo}/></div><footer><button aria-label="이전 사진" disabled={index===0} onClick={()=>setViewing(photos[index-1].id)}><ChevronLeft size={20}/></button><span>{characters[photo.character].name} · {index+1}/{photos.length}</span><button aria-label="다음 사진" disabled={index>=photos.length-1} onClick={()=>setViewing(photos[index+1].id)}><ChevronRight size={20}/></button></footer></section></div>,document.body)}
 </div>
}

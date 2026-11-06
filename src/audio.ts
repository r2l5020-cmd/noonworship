let context:AudioContext|null=null;
export function audioContext(){if(!context)context=new AudioContext();if(context.state==='suspended')void context.resume();return context;}
const notes=[261.63,293.66,329.63,349.23,392,440,493.88,523.25];
export function playTone(note:number,instrument:string,volume=.2,when?:number){
 const ctx=audioContext();scheduleTone(ctx,note,instrument,volume,when??ctx.currentTime);
}
export function scheduleTone(ctx:BaseAudioContext,note:number,instrument:string,volume=.2,when=ctx.currentTime){
 const t=Math.max(ctx.currentTime,when),freq=notes[((note%8)+8)%8];
 const output=ctx.createGain();output.connect(ctx.destination);
 if(instrument==='guitar'){
  // Karplus–Strong: noise decays through a vibrating string loop.
  const duration=2,period=Math.round(ctx.sampleRate/freq),buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),samples=buffer.getChannelData(0);
  for(let i=0;i<period;i++)samples[i]=Math.random()*2-1;
  for(let i=period;i<samples.length;i++)samples[i]=.496*(samples[i-period]+samples[i-period+1]);
  const source=ctx.createBufferSource(),body=ctx.createBiquadFilter();source.buffer=buffer;body.type='lowpass';body.frequency.value=3600;body.Q.value=.5;
  source.connect(body);body.connect(output);output.gain.setValueAtTime(volume*1.5,t);output.gain.setTargetAtTime(.0001,t+.75,.25);
  source.onended=()=>{source.disconnect();body.disconnect();output.disconnect()};source.start(t);return;
 }
 if(instrument==='drum'){
  const source=ctx.createOscillator();source.frequency.setValueAtTime(note%2?180:110,t);source.frequency.exponentialRampToValueAtTime(45,t+.17);source.connect(output);
  output.gain.setValueAtTime(volume,t);output.gain.exponentialRampToValueAtTime(.0001,t+.2);
  source.onended=()=>{source.disconnect();output.disconnect()};source.start(t);source.stop(t+.22);return;
 }
 // Bells have inharmonic overtones with separate decays; piano uses harmonic overtones.
 const bell=instrument==='bell',ratios=bell?[1,2.76,5.4,8.93]:[1,2,3,4],levels=bell?[.75,.5,.23,.12]:[1,.24,.08,.035],decays=bell?[2.5,1.5,.8,.35]:[1.05,.55,.32,.2];
 let remaining=ratios.length;output.gain.value=volume;
 ratios.forEach((ratio,i)=>{const source=ctx.createOscillator(),partial=ctx.createGain();source.type='sine';source.frequency.value=freq*ratio;source.connect(partial);partial.connect(output);
  partial.gain.setValueAtTime(0,t);partial.gain.linearRampToValueAtTime(levels[i],t+(bell?.002:.008));partial.gain.exponentialRampToValueAtTime(.0001,t+decays[i]);
  source.onended=()=>{source.disconnect();partial.disconnect();if(--remaining===0)output.disconnect()};source.start(t);source.stop(t+decays[i]+.03);
 });
}

let context:AudioContext|null=null;
export function audioContext(){if(!context)context=new AudioContext(); if(context.state==='suspended')void context.resume(); return context;}
const notes=[261.63,293.66,329.63,349.23,392,440,493.88,523.25];
export function playTone(note:number,instrument:string,volume=.2,when?:number){
 const ctx=audioContext(),t=when??ctx.currentTime, freq=notes[note%8];
 const g=ctx.createGain();g.connect(ctx.destination);
 if(instrument==='drum'){
  const o=ctx.createOscillator(); o.frequency.setValueAtTime(note%2?180:110,t);o.frequency.exponentialRampToValueAtTime(45,t+.17);o.connect(g);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.start(t);o.stop(t+.22);return;
 }
 const duration=instrument==='bell'?1.8:instrument==='guitar'?1.2:.9;
 [1,2,3].forEach((harmonic,i)=>{const o=ctx.createOscillator(),a=ctx.createGain();o.type='sine';o.frequency.value=freq*harmonic;o.connect(a);a.gain.value=[1,.24,.08][i];a.connect(g);o.start(t);o.stop(t+duration+.03)});
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+duration);
}

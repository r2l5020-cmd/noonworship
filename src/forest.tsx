export function Forest(){return <svg className="studio-art forest-art" viewBox="0 0 900 600" fill="none" aria-hidden="true">
 <defs><linearGradient id="forest-light" x1="450" y1="0" x2="450" y2="600" gradientUnits="userSpaceOnUse"><stop stopColor="#e1edb3"/><stop offset=".55" stopColor="#b7ce8a"/><stop offset="1" stopColor="#6e9560"/></linearGradient><linearGradient id="deck-color" x1="450" y1="350" x2="450" y2="600" gradientUnits="userSpaceOnUse"><stop stopColor="#be9a70"/><stop offset="1" stopColor="#e0c294"/></linearGradient></defs>
 <path d="M0 0H900V600H0Z" fill="url(#forest-light)"/>
 {[30,120,235,340,485,610,742,858].map((x,i)=><g key={x} opacity={.26+i%3*.1}><path d={`M${x} 0l${i%2?24:-15} 420h${28+i*2}L${x+24} 0Z`} fill="#738f64"/><path d={`M${x+14} 155l-62 -97M${x+12} 245l74 -130`} stroke="#738f64" strokeWidth="13"/></g>)}
 <path d="M540 10L284 458H410L695 0Z" fill="#fffbd0" opacity=".23"/>
 <path d="M0 352Q142 300 283 361T566 347T900 345V600H0Z" fill="#88ab6b"/>
 {Array.from({length:29},(_,i)=>{const x=(i*137)%930-15,y=248+(i*59)%155;return <g key={i}><ellipse cx={x} cy={y} rx={32+i%4*8} ry={22+i%3*9} fill={['#688e57','#85a764','#a7c57b','#779b5e'][i%4]}/><path d={`M${x} ${y+24}l7 -27m-7 19l-10 -9`} stroke="#597e4d" strokeWidth="2" opacity=".4"/></g>})}
 <path d="M0 40L21 0H57L80 386L48 430L29 370Z M826 0H871L880 390L839 420Z" fill="#7a7652" stroke="#53684a" strokeWidth="3"/>
 <path d="M40 197L122 90M855 173L775 90M855 108L896 65" stroke="#7a7652" strokeWidth="19" strokeLinecap="round"/>
 {Array.from({length:27},(_,i)=>{const x=(i*113)%970-35,y=-20+(i*37)%130;return <ellipse key={i} cx={x} cy={y} rx={65+i%3*13} ry={45+i%4*6} fill={['#789b56','#97b966','#b4ce7b','#c4db8c'][i%4]} opacity=".88"/>})}
 <path d="M0 404L900 362V600H0Z" fill="url(#deck-color)" stroke="#997950" strokeWidth="3"/>
 {Array.from({length:14},(_,i)=><path key={i} d={`M${-420+i*130} 386L${-230+i*130} 600`} stroke="#9e805a" strokeWidth="1.5" opacity=".65"/>)}
 <path d="M0 475L900 433M0 545L900 503" stroke="#af8c61" strokeWidth="1" opacity=".4"/>
 <g stroke="#42594b" strokeLinecap="round"><path d="M0 325L900 284M0 338L900 297" strokeWidth="7"/>{Array.from({length:16},(_,i)=>{const x=i*60;return <path key={i} d={`M${x} ${330-x*.046}v77`} strokeWidth="4"/>})}<path d="M0 407L900 366" strokeWidth="5"/></g>
 <g fill="#f9f3c8" opacity=".6"><circle cx="318" cy="199" r="3"/><circle cx="637" cy="255" r="2.5"/><circle cx="184" cy="173" r="2"/><circle cx="723" cy="320" r="2"/></g>
 <path d="M392 42H618V174H392Z" fill="#e6d9b7" stroke="#887653" strokeWidth="7"/><path d="M408 177V299M600 177V289" stroke="#887653" strokeWidth="10"/>
 </svg>}

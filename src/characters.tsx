export const characters = [
  {name:'시원',part:'기타',tag:'우리의 리듬',color:'#526c91',bg:'#e8edf5',outfit:'#283e65',hair:'#252c2d',glasses:true},
  {name:'은환',part:'촬영',tag:'순간을 담는 사람',color:'#626a62',bg:'#edf0e8',outfit:'#303532',hair:'#272526',glasses:true},
  {name:'진우',part:'테너',tag:'잘생김도 담당',color:'#b18466',bg:'#f5e9dd',outfit:'#d4b68a',hair:'#302a25',glasses:false},
  {name:'혜인',part:'소프라노',tag:'맑게 울리는 목소리',color:'#83718d',bg:'#eee8f1',outfit:'#36383c',hair:'#322e2b',glasses:false},
  {name:'진아',part:'알토',tag:'오늘도 조금 추워',color:'#89a5a9',bg:'#e8f1f0',outfit:'#f7f5ee',hair:'#523e31',glasses:false},
  {name:'아람',part:'건반',tag:'든든한 학생회장',color:'#598477',bg:'#e4eee8',outfit:'#728f81',hair:'#2d302c',glasses:true},
  {name:'인영',part:'메조소프라노',tag:'기린을 제일 좋아해',color:'#c29b43',bg:'#faf1ce',outfit:'#e1bc6d',hair:'#805736',glasses:false},
];
export const homePositions = [[25,76],[18,56],[61,62],[44,69],[79,77],[77,49],[48,49]];
export function Avatar({id,mood='smile',small=false,pose='stand'}:{id:number,mood?:string,small?:boolean,pose?:string}) {
 const c=characters[id],woman=id>2,long=[4,5,6].includes(id),curly=id===4||id===6;
 return <svg viewBox="0 0 100 148" fill="none" className={'avatar pose-'+pose+' '+(small?'small-avatar':'')} aria-label={c.name+' 캐릭터'} role="img">
  <ellipse cx="50" cy="141" rx="26" ry="5" fill="#273b2b" opacity=".13"/>
  {long&&<path d={curly?'M25 34 Q16 42 22 53 Q13 61 23 70 Q15 80 24 91 Q17 105 34 110 L73 108 Q86 99 77 87 Q87 77 78 68 Q88 55 77 48 Q81 30 63 23 Z':'M24 38Q24 17 50 17Q77 17 77 40L80 109H21Z'} fill={c.hair} stroke="#31372c" strokeWidth="1.5"/>}
  {pose==='sit'&&<g stroke="#695a42" strokeWidth="2"><path d="M31 97H69V120H31Z" fill="#c1a27a"/><path d="M32 118L29 142M68 118L72 142"/></g>}
  <path d={pose==='sit'?'M35 110L23 120L35 138L44 134L36 122L51 119L65 123L59 137L68 138L78 120L63 110Z':'M35 112 L34 136 Q36 140 44 137 L49 113 M52 112 L57 138 Q64 140 67 136 L64 110'} fill={id===0||woman?'#65829b':'#59605c'} stroke="#38483e" strokeWidth="1.6"/>
  <path d={pose==='sit'?'M34 133L43 133L45 140H30Q29 136 34 133 M58 134H68L73 141H58Z':'M34 134L44 134L44 141H30Q29 136 34 134 M57 135H67L72 140Q72 143 57 141Z'} fill={id===2?'#5e483a':'#f2eee2'} stroke="#4c5147" strokeWidth="1.4"/>
  <path d={id===4?'M33 68Q26 69 25 84L26 125Q50 133 76 125L74 83Q74 68 64 68Z':'M34 68Q28 67 25 80L25 110Q50 120 75 110L75 81Q74 69 65 68Z'} fill={c.outfit} stroke="#374438" strokeWidth="1.6"/>
  {id===2&&<><path d="M49 74V114M39 69L48 82L52 72L60 82L65 69" stroke="#897758" strokeWidth="1.4"/><path d="M57 84H66V94H57Z" fill="#bba07a"/><circle cx="52" cy="91" r="1" fill="#665c43"/><circle cx="52" cy="103" r="1" fill="#665c43"/></>}
  {id===5&&<g opacity=".65" stroke="#dae5dc" strokeWidth="2"><path d="M32 72V113M43 76V116M56 75V116M68 73V113M27 82H74M26 94H75M26 106H75"/><path d="M49 73V115" stroke="#3c554c" strokeWidth="2.5"/></g>}
  {id===4&&<g stroke="#d0d1c7" strokeWidth="1.2"><path d="M31 83H70M28 96H72M27 110H73M51 76V129"/><path d="M35 66Q50 85 64 66L69 80L53 93L33 79Z" fill="#b4c4be"/></g>}
  {(id===3||id===6)&&<><path d="M34 70Q50 86 66 70L61 85H39Z" fill={id===3?'#232b2a':'#b18a43'}/><path d="M42 85L40 96M58 85L60 96" stroke="#e6d8b6" strokeWidth="1.4"/><path d="M36 100H64L61 110H40Z" stroke="#262b26" opacity=".4"/></>}
  {id===6&&<g fill="#956a31" opacity=".9"><path d="M29 83L36 80L38 89L31 92ZM66 94L73 91L75 99L68 102ZM43 98L51 95L54 102L48 109ZM60 76L65 80L60 87L55 82Z"/><path d="M30 101L36 104L33 111H26Z"/></g>}
  {pose==='wave'?<g><path d="M29 78Q22 79 21 91L24 108Q27 112 31 108L31 87" fill={c.outfit} stroke="#374438" strokeWidth="1.6"/><ellipse cx="28" cy="109" rx="5" ry="6" fill="#efc9a4"/><g className="gesture-wave"><path d="M70 77Q82 71 84 50L92 51Q94 80 75 89Z" fill={c.outfit} stroke="#374438" strokeWidth="1.6"/><path d="M84 51L80 43Q79 40 82 41L86 45L85 34Q86 30 88 35L89 42L92 34Q95 32 95 36L93 44Q101 42 99 46L93 53Z" fill="#efc9a4" stroke="#776347"/></g></g>:pose==='clap'?<g><path d="M28 80Q29 94 45 91L49 83L37 85L36 77M72 80Q70 94 55 91L51 83L63 85L64 77" fill={c.outfit} stroke="#374438" strokeWidth="1.6"/><g className="gesture-clap"><ellipse cx="47" cy="84" rx="5" ry="8" fill="#efc9a4" stroke="#776347"/><ellipse cx="54" cy="83" rx="5" ry="8" fill="#efc9a4" stroke="#776347"/></g></g>:<><path d="M29 78Q22 79 21 91L24 108Q27 112 31 108L31 87M71 78Q78 78 80 91L77 108Q73 112 69 108L69 88" fill={c.outfit} stroke="#374438" strokeWidth="1.6"/><ellipse cx="28" cy="109" rx="5" ry="6" fill="#efc9a4" stroke="#776347" strokeWidth="1"/><ellipse cx="73" cy="109" rx="5" ry="6" fill="#efc9a4" stroke="#776347" strokeWidth="1"/></>}
  <path d="M43 62V73Q50 79 57 73V61" fill="#e8bd96" stroke="#79634c" strokeWidth="1"/>
  {id===3&&<path d="M23 40Q19 17 47 17Q78 14 78 44L76 71L62 76L64 46H36L37 75L23 68Z" fill={c.hair} stroke="#3e392c" strokeWidth="1.5"/>}
  <ellipse cx="27" cy="46" rx="5" ry="7" fill="#eec5a0"/><ellipse cx="73" cy="46" rx="5" ry="7" fill="#eec5a0"/>
  <path d="M28 33Q29 17 50 19Q72 19 72 35L71 51Q68 68 50 69Q32 67 29 52Z" fill="#f4d2ad" stroke="#7c6950" strokeWidth="1.3"/>
  <path d={id===2?'M27 40Q19 17 45 17Q70 11 75 37L61 31L54 28Q44 40 27 40Z':woman?'M27 39Q25 17 50 18Q74 18 74 40L63 32L59 24Q48 41 27 39Z':'M26 38Q20 19 43 17Q69 12 75 38L62 31L58 35L51 26L43 34L37 29L32 38Z'} fill={c.hair} stroke="#33362c" strokeWidth="1.4"/>
  {curly&&<g stroke={id===6?'#a77b4a':'#78563c'} strokeWidth="1.5" opacity=".6"><path d="M28 34Q15 42 28 51Q18 58 28 66Q19 74 28 84Q19 93 30 103M71 34Q83 43 72 52Q82 59 72 68Q83 77 73 85Q84 96 71 104"/></g>}
  <g className="eyes" fill="#323c31" stroke="#323c31" strokeWidth="1.7" strokeLinecap="round">
  {mood==='laugh'||mood==='sing'?<><path d="M35 47Q40 41 44 47M56 47Q60 41 65 47" fill="none"/></>:mood==='heart'?<g fill="#d77a76" stroke="none"><path d="M33 43Q36 38 40 43Q44 38 47 43Q46 47 40 51Q34 47 33 43M53 43Q56 38 60 43Q64 38 67 43Q66 47 60 51Q54 47 53 43"/></g>:<><ellipse cx="40" cy="46" rx="1.4" ry={mood==='wow'?3:2.3}/><ellipse cx="61" cy="46" rx="1.4" ry={mood==='wow'?3:2.3}/></>}
  </g>
  {c.glasses&&<g stroke="#4c5141" strokeWidth="1.8"><rect x="31" y="39" width="16" height="13" rx="5"/><rect x="54" y="39" width="16" height="13" rx="5"/><path d="M47 44Q50 42 54 44M27 42L31 43M70 43L74 42"/></g>}
  <path d="M50 47L48 53H52" stroke="#bc9776" strokeWidth="1" strokeLinecap="round"/>
  <ellipse cx="34" cy="55" rx="5" ry="2.4" fill="#df9d88" opacity=".5"/><ellipse cx="66" cy="55" rx="5" ry="2.4" fill="#df9d88" opacity=".5"/>
  {['sing','wow','laugh'].includes(mood)?<ellipse cx="50" cy="59" rx={mood==='laugh'?5:3} ry={mood==='wow'?4:3.5} fill="#935849"/>:<path d={mood==='sad'?'M45 61Q50 56 55 61':'M44 57Q50 63 56 57'} stroke="#925c47" strokeWidth="1.7" strokeLinecap="round"/>}
  {id===6&&<><path d="M25 31Q20 10 48 10Q73 9 73 30Z" fill="#e9be43" stroke="#8c793b" strokeWidth="1.5"/><path d="M25 27Q49 22 76 29L82 35Q54 31 25 34Z" fill="#f5d35f" stroke="#8c793b" strokeWidth="1.5"/><path d="M44 17Q48 13 52 17L50 24H46Z" fill="#b09036"/><circle cx="48" cy="19" r="1" fill="#faf1bf"/></>}
  {id===0&&<g transform="rotate(-28 53 101)"><path d="M42 88Q32 79 29 94Q18 98 28 111Q38 122 47 112Q58 112 55 101Q54 94 48 94Z" fill="#b4814e" stroke="#5e4b30" strokeWidth="1.5"/><circle cx="41" cy="101" r="5" fill="#59482e"/><path d="M44 97L65 70L70 74L48 102" fill="#855c3b" stroke="#5e4b30" strokeWidth="1.5"/><path d="M65 72L70 65L76 68L71 77Z" fill="#b99a65"/><path d="M38 106L71 70M35 105L68 70" stroke="#e1ca9c" strokeWidth=".7"/></g>}
  {id===1&&<g><path d="M40 72L51 96L65 73" stroke="#242924" strokeWidth="2"/><rect x="40" y="90" width="24" height="16" rx="3" fill="#454b46" stroke="#252d27" strokeWidth="1.5"/><circle cx="52" cy="98" r="6" fill="#8d9e9b" stroke="#262d28" strokeWidth="2"/><circle cx="52" cy="98" r="3" fill="#394a4b"/><rect x="43" y="87" width="8" height="4" fill="#454b46"/></g>}
  {[2,3,4,6].includes(id)&&<g transform="rotate(-14 74 100)"><path d="M73 94V116" stroke="#626d65" strokeWidth="3"/><rect x="68" y="83" width="10" height="14" rx="5" fill="#777f73" stroke="#374137"/><path d="M70 87H76M70 90H76" stroke="#bfc5b8" strokeWidth="1"/></g>}
 </svg>;
}

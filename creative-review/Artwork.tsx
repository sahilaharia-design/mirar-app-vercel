import React, {useId} from 'react';

export type Direction='aperture'|'weave'|'field';
/** Bespoke conceptual diagrams. They depict a story state, never a user's measured mind. */
export function Artwork({direction,phase=0,small=false}:{direction:Direction;phase?:number;small?:boolean}) {
 const uid=useId().replace(/:/g,'');
 if(direction==='aperture') return <svg aria-hidden="true" viewBox="0 0 600 600" className={`art aperture-art phase-${phase}`}>
  <defs><clipPath id={uid}><circle cx={phase===0?335:300} cy="300" r={phase===0?220:phase===1?145:185}/></clipPath><pattern id={`${uid}lines`} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 0V22" stroke="currentColor" strokeWidth=".6"/></pattern></defs>
  <circle className="aperture-halo" cx="300" cy="300" r="275" fill="none" stroke="currentColor" strokeWidth=".8"/>
  <path d="M25 300H575M300 25V575" stroke="currentColor" strokeWidth=".7" strokeDasharray="3 9"/>
  <g clipPath={`url(#${uid})`}><rect width="600" height="600" fill="var(--accent)"/><rect width="600" height="600" fill={`url(#${uid}lines)`}/>
   {[0,1,2,3,4].map(i=><path key={i} className="attention-line" d={`M-30 ${100+i*80} C150 ${phase===0?580-i*65:100+i*75},370 ${phase===0?i*70:100+i*75},640 ${500-i*85}`} fill="none" stroke="var(--paper)" strokeWidth={i===2?15:3}/>)}</g>
  <circle cx={phase===0?335:300} cy="300" r={phase===0?220:phase===1?145:185} fill="none" stroke="currentColor" strokeWidth="1"/>
  <path d="M300 10V32M300 568V590M10 300H32M568 300H590" stroke="currentColor" strokeWidth="2"/>
  {!small&&<><text x="37" y="58">A FIELD OF ATTENTION</text><text x="425" y="560">NOT A MEASUREMENT</text></>}
 </svg>;
 if(direction==='weave') return <svg aria-hidden="true" viewBox="0 0 600 600" className={`art weave-art phase-${phase}`}>
  <defs><pattern id={uid} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0H6" stroke="var(--ink)" strokeOpacity=".17" strokeWidth="1"/></pattern>{[0,1,2,3,4].map(j=><clipPath key={j} id={`${uid}cross${j}`}><rect x="0" y={90+j*80} width="600" height="48"/></clipPath>)}</defs>
  <g transform="translate(300 300) rotate(-12) translate(-300 -300)">
   {[0,1,2,3,4].map(i=><g key={i}><path d={`M${115+i*80} 15 C${30+i*85} 210,${200+i*65} 380,${110+i*85} 585`} fill="none" stroke={i%2?'var(--accent)':'var(--ink)'} strokeWidth={phase===0?20:36} opacity={phase===0?.45:1}/></g>)}
   {[0,1,2,3,4].map(i=><g key={i}><path d={`M15 ${120+i*80} C210 ${40+i*90},390 ${190+i*70},585 ${110+i*80}`} fill="none" stroke={i%2?'var(--paper)':'var(--warm)'} strokeWidth={phase===0?16:36}/></g>)}
   {phase>0&&[0,1,2,3,4].flatMap(i=>[0,1,2,3,4].filter(j=>(i+j)%2===0).map(j=><path key={`${i}-${j}`} clipPath={`url(#${uid}cross${j})`} d={`M${115+i*80} 15 C${30+i*85} 210,${200+i*65} 380,${110+i*85} 585`} fill="none" stroke={i%2?'var(--accent)':'var(--ink)'} strokeWidth="36"/>))}
   <rect x="70" y="70" width="460" height="460" fill={`url(#${uid})`} opacity=".5"/>
  </g>
  {!small&&<><text x="25" y="42">A MATERIAL MADE OF MOMENTS</text><text x="390" y="575">NO UNBROKEN CHAIN</text></>}
 </svg>;
 return <svg aria-hidden="true" viewBox="0 0 600 600" className={`art field-art phase-${phase}`}>
  <defs><pattern id={uid} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--ink)" opacity=".25"/></pattern></defs>
  <rect x="35" y="35" width="530" height="530" fill={`url(#${uid})`}/>
  <g className="specimen" transform={phase===0?'rotate(-12 300 300)':phase===1?'rotate(8 300 300)':'rotate(0 300 300)'}>
   <path d="M95 390 C100 180 220 95 335 140 C450 185 492 320 395 420 C310 505 145 470 95 390Z" fill="var(--accent)"/>
   <path d="M160 360 C160 230 230 190 300 220 C390 250 405 340 340 390 C275 435 195 420 160 360Z" fill="var(--paper)"/>
   <path d="M70 470C170 430 215 355 270 300 S420 170 540 125" stroke="var(--ink)" strokeWidth="3" fill="none"/>
   <path d="M185 397L165 320M275 300L350 325M390 200L370 135" stroke="var(--ink)" strokeWidth="2" fill="none"/>
  </g>
  <path d="M440 360H555M440 355V365M555 355V365M90 140V70H175" fill="none" stroke="var(--ink)"/>
  {!small&&<><text x="90" y="60">LOOK AGAIN</text><text x="435" y="389">A STUDY, NOT A VERDICT</text><text x="50" y="558">FIG. A · THE PRACTICE OF NOTICING</text></>}
 </svg>;
}

export function ChoiceMark({index,direction}:{index:number;direction:Direction}){
 if(direction==='weave')return <svg viewBox="0 0 200 64" aria-hidden="true" className="choice-mark weave"><path d={index===1?'M0 50Q70 0 200 35':'M0 30Q90 55 200 20'} stroke="var(--warm)" strokeWidth="14" fill="none"/><path d="M80 0Q110 35 90 64" stroke="var(--ink)" strokeWidth="12" fill="none"/><path d="M82 24L97 35" stroke="var(--warm)" strokeWidth="14"/></svg>;
 if(direction==='field')return <svg viewBox="0 0 200 64" aria-hidden="true" className="choice-mark field"><path d={index===0?'M5 45C70 0 105 0 130 38S175 65 195 20':'M5 30Q55 60 80 18T140 42T195 16'}/><path d="M90 8V55M83 8H97M83 55H97" strokeDasharray="2 4"/><circle cx="130" cy="38" r="6" fill="var(--accent)" stroke="none"/></svg>;
 return <svg viewBox="0 0 200 64" aria-hidden="true" className={`choice-mark ${direction}`}>
  {index===0?<><path d="M5 32H195"/><circle cx="100" cy="32" r="19"/></>:index===1?<><path d="M5 32C35 0 60 65 95 32S160 0 195 32"/><circle cx="100" cy="32" r="19"/></>:<><path d="M5 32H60M140 32H195"/><circle cx="100" cy="32" r="19" strokeDasharray="3 5"/></>}
 </svg>;
}

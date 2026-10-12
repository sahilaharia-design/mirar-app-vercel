import React,{useId} from 'react';
import mark from '../assets/brand/mirar-mark.png';
export type Direction='aperture'|'weave'|'field';
export const canonicalMark=mark as string;
/** The supplied PNG's alpha is the window. No oval path, tracing, recolouring or replacement logo. */
export function Artwork({direction,phase=0,small=false}:{direction:Direction;phase?:number;small?:boolean}){
 const id=useId().replace(/:/g,'');
 const x=130,y=36,w=340,h=340*1640/1109;
 return <svg aria-hidden="true" viewBox="0 0 600 600" className={`art ${direction}-art phase-${phase}`}>
  <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600" style={{maskType:'alpha'}}><image href={canonicalMark} x={x} y={y} width={w} height={h}/></mask>
   <pattern id={`${id}grain`} width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 1H12" stroke="var(--ink)" strokeWidth=".4" strokeOpacity=".2"/></pattern>
  </defs>
  {/* The actual artwork stays pristine. Content reveals use a separate alpha-defined layer. */}
  <image href={canonicalMark} x={x} y={y} width={w} height={h}/>
  {direction==='aperture'?<>
   <g mask={`url(#${id})`}>
    <g className="reading-plane" transform={`translate(${phase===0?-32:phase===1?0:16} 0)`}>
     <path d="M175 170H395M160 195H370M155 220H405" className="attention-line" stroke="var(--ink)" strokeWidth="1.5" opacity=".65"/>
     <path d="M230 350H460M225 375H410M210 400H440" stroke="var(--ink)" strokeWidth="1.5" opacity={phase===0?.3:.65}/>
     <path d="M290 110L245 470" stroke="var(--paper)" strokeWidth="46"/>
     <path d="M290 110L245 470" stroke="var(--ink)" strokeWidth=".6" opacity=".6"/>
    </g>
   </g>
   <path d="M70 175H190M405 375H540" stroke="var(--ink)" fill="none"/>
   {!small&&<><text x="55" y="157">WHAT YOU SAID</text><text x="395" y="355">A READING, OPEN TO REVISION</text></>}
  </>:direction==='weave'?<>
   <g mask={`url(#${id})`}>
    <g className="reading-plane" transform={`translate(${phase===0?-40:phase===1?0:20} 0)`}>
     <path d="M70 180C210 100 340 300 530 195" stroke="var(--ink)" strokeWidth="22" fill="none" opacity=".85"/>
     <path d="M90 350C260 470 340 210 540 340" stroke="var(--paper)" strokeWidth="34" fill="none"/>
     <path d="M240 10C390 160 150 360 350 580" stroke="var(--warm)" strokeWidth="26" fill="none"/>
     <path d="M200 170C260 173 285 195 330 210" stroke="var(--ink)" strokeWidth="22" fill="none"/>
     <rect width="600" height="600" fill={`url(#${id}grain)`}/>
    </g>
   </g>
   <path d="M55 190H175M430 340H545" stroke="var(--ink)"/>
   {!small&&<><text x="40" y="170">A MOMENT, IN YOUR WORDS</text><text x="400" y="320">ITS MEANING IS NOT FIXED</text></>}
  </>:<>
   <g mask={`url(#${id})`} className="reading-plane" transform={`translate(0 ${phase===0?-16:phase===1?0:12})`}>
    <path d="M170 230H415M170 260H400M170 290H430" stroke="var(--ink)" strokeWidth="1"/>
    <path d="M205 358H380" stroke="var(--paper)" strokeWidth="22"/>
    <path d="M210 358H370" stroke="var(--ink)" strokeWidth="1" strokeDasharray="4 5"/>
   </g>
   <path d="M75 230H170M415 290H545M195 460H75V425" stroke="var(--ink)" fill="none"/>
   {!small&&<><text x="38" y="210">THE RESPONSE</text><text x="405" y="275">THE READING</text><text x="45" y="415">WHAT REMAINS OPEN</text></>}
  </>}
  {!small&&<text x="130" y="575">LOOK WITHIN. LOOK AGAIN.</text>}
 </svg>;
}
export function ChoiceMark({index,direction}:{index:number;direction:Direction}){
 const id=useId().replace(/:/g,'');
 return <svg viewBox="0 0 200 64" aria-hidden="true" className={`choice-mark ${direction}`}>
  <defs><mask id={id} style={{maskType:'alpha'}}><image href={canonicalMark} x="78" y="1" width="42" height="62"/></mask></defs>
  <image href={canonicalMark} x="78" y="1" width="42" height="62"/>
  <path d={index===1?'M8 37C45 8 65 58 100 32S150 8 192 32':'M8 32H192'} stroke="var(--ink)" strokeWidth="1" fill="none"/>
  <g mask={`url(#${id})`}><path d="M96 0L88 64" stroke="var(--paper)" strokeWidth="6"/></g>
 </svg>;
}
/** A structural edge, not another logo lockup. Text is never clipped inside the mark. */
export function MirrorEdge(){return <span className="mirror-edge" aria-hidden="true" style={{maskImage:`url(${canonicalMark})`,WebkitMaskImage:`url(${canonicalMark})`}}/>;}

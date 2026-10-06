import React, { useEffect, useState } from 'react';
import Serif from '../../../assets/fonts/InstrumentSerif-Regular.ttf';
import Sans from '../../../assets/fonts/DMSans-Variable.ttf';
import './focus.web.css';
let ready: Promise<void> | undefined;
function loadFonts() {
 return ready ??= Promise.all([
  new FontFace('Instrument Serif', `url(${Serif})`, { weight: '400' }).load(),
  new FontFace('DM Sans', `url(${Sans})`, { weight: '100 1000' }).load(),
 ]).then(faces => { const set = document.fonts as FontFaceSet & { add(face: FontFace): void }; faces.forEach(face => set.add(face)); });
}
export default function FontGate({ children }: { children: React.ReactNode }) {
 const [status,setStatus] = useState<'loading'|'ready'|'error'>('loading');
 useEffect(() => { let live = true; loadFonts().then(()=>{if(live)setStatus('ready');},()=>{if(live)setStatus('error');});return()=>{live=false;}; },[]);
 if(status==='error') return <p role="alert">The typefaces could not load. Please reload.</p>;
 if(status==='loading') return <p role="status">Loading…</p>;
 return <>{children}</>;
}

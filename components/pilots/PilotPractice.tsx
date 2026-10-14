import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ExperiencePage, X } from '../experience/ExperienceKit';
import { Action, Body, Eyebrow, Prompt } from '../inner-rep/v2/Foundation';
import { MirrorPanel, PilotOffers, PilotRunner, ValuePanel } from './PilotViews';
import { PILOT_TITLES, type PilotSession } from '../../lib/innerRep/pilots/session';
import { pilotReceipt, type PilotMirror, type PilotOffer, type PilotReceipt } from '../../lib/innerRep/pilots/read';
import type { PAnswer, PilotId, PilotRecord } from '../../lib/innerRep/pilots/types';
import { SAFETY_RESOURCES } from '../../lib/innerRep/safety';

/** One presentation used by the device-local app and memory-only review. All writes belong to the supplied runtime. */
export interface PilotPort {
 session: PilotSession | null; offers: PilotOffer[]; mirror: PilotMirror;
 start: (id: PilotId) => void; answer: (a: PAnswer) => Promise<void>; back: () => Promise<void>;
 close: (how: 'finish'|'leave') => Promise<PilotRecord|null>; discard: () => Promise<void>;
}
export function PilotPractice({port,onToday,initialPilot,reviewTools}:{port:PilotPort;onToday:()=>void;initialPilot?:PilotId;reviewTools?:React.ReactNode}) {
 const [mode,setMode]=useState<'hub'|'run'|'closing'|'safety'>('hub');const [receipt,setReceipt]=useState<PilotReceipt|null>(null);const [record,setRecord]=useState<PilotRecord|null>(null);
 const [pending,setPending]=useState<PilotId>();const [error,setError]=useState('');const [busy,setBusy]=useState(false);const closeLock=useRef(false);const initial=useRef(false);
 const begin=(id:PilotId)=>{if(port.session&&!port.session.isComplete&&port.session.pilot!==id){setPending(id);return;}if(!port.session||port.session.isComplete)port.start(id);setMode('run');};
 useEffect(()=>{if(!initial.current){initial.current=true;if(initialPilot)begin(initialPilot);}},[]); // initial route intent only; steps come from the session
 const close=async(how:'finish'|'leave')=>{if(closeLock.current)return;closeLock.current=true;setBusy(true);setError('');try{const r=await port.close(how);setRecord(r);setReceipt(r?pilotReceipt(r):null);setMode(r?'closing':'hub');}catch{setError('Couldn’t open the practice record. Please try again.');}finally{closeLock.current=false;setBusy(false);}};
 const safety=()=>{setMode('safety');void (async()=>{try{const step=port.session?.step();if(step)await port.answer({stepId:step.id,kind:'safety'});await port.discard();}catch{setError('Couldn’t clear the session. Please leave this screen.');}})();};
 return <ExperiencePage action={mode==='closing'||mode==='safety'?undefined:<Action secondary onPress={onToday}>Back to Today</Action>}><View style={{gap:24}}>
  {pending?<View style={X.space}><Prompt compact level={1}>One unfinished practice is here.</Prompt><Body>You can resume it, or leave it before opening another. Earlier words are not restored.</Body><View style={X.row}><Action onPress={()=>{setPending(undefined);setMode('run');}}>{`Resume ${PILOT_TITLES[port.session?.pilot??pending]}`}</Action><Action secondary disabled={busy} onPress={()=>{const id=pending;setBusy(true);void port.close('leave').then(()=>{port.start(id);setPending(undefined);setMode('run');}).catch(()=>setError('Couldn’t leave the earlier practice. Try again.')).finally(()=>setBusy(false));}}>{`Leave it and begin ${PILOT_TITLES[pending]}`}</Action><Action secondary onPress={()=>setPending(undefined)}>Keep it for now</Action></View></View>
  :mode==='run'&&port.session?<PilotRunner session={port.session} title={PILOT_TITLES[port.session.pilot]} onAnswer={port.answer} onBack={port.back} onLeave={()=>void close('leave')} onFinish={()=>void close('finish')} onSafety={safety}/>
  :mode==='safety'?<View style={X.space}><Prompt compact level={1}>{SAFETY_RESOURCES.headline}</Prompt><Body>{SAFETY_RESOURCES.body}</Body>{SAFETY_RESOURCES.lines.map(l=><View key={l.label}><Body>{l.label}</Body><Body>{l.value}</Body></View>)}<Body>{SAFETY_RESOURCES.note}</Body><Action onPress={onToday}>Back to Today</Action></View>
  :mode==='closing'&&receipt?<View style={X.space}><ValuePanel receipt={receipt} record={record??undefined}/><View style={X.row}><Action onPress={onToday}>Back to Today</Action><Action secondary onPress={()=>setMode('hub')}>Another practice</Action></View></View>
  :<View style={X.space}><Eyebrow>Optional practice · preview</Eyebrow><Prompt display>More than one way to look.</Prompt><Body>Your daily Inner Rep has its own place. These practices are optional, and you can stop wherever you need.</Body><PilotOffers offers={port.offers} onBegin={begin}/><MirrorPanel mirror={port.mirror}/>{reviewTools}</View>}
  {!!error&&<View style={X.space}><Body role="alert">{error}</Body>{mode==='run'&&!port.session&&<Action onPress={()=>void close('finish')}>Try again</Action>}</View>}
 </View></ExperiencePage>;
}

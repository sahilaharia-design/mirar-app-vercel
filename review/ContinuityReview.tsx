/** LOCAL REVIEW ONLY. No network, auth or persistent storage. Never imported by app routes. */
import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {DailyInnerRep} from '../components/inner-rep/v2/DailyExperience';
import {MirrorExperience} from '../components/experience/MirrorExperience';
import {MeExperience} from '../components/experience/MeExperience';
import {Action,Body,Prompt,VisualFoundation} from '../components/inner-rep/v2/Foundation';
import {BackupInvitation,ContinuitySettings,ContinuityStatus,continuityPrivacy} from '../components/continuity/ContinuityExperience';
import {type ContinuityIntent,type ContinuitySnapshot,type ContinuityPhase,type ContinuityPort,statusTitle} from '../components/continuity/contract';
import {createRuntime,type TodayView,type KV} from '../lib/innerRep/runtime/v2-runtime';
import type {MirrorModel} from '../lib/innerRep/runtime/mirror-contract';
const memory=new Map<string,string>();
const kv:KV={getItem:async k=>memory.get(k)??null,setItem:async(k,v)=>{memory.set(k,v);},removeItem:async k=>{memory.delete(k);},getAllKeys:async()=>[...memory.keys()]};
const runtime=createRuntime({storage:kv});
const base:ContinuitySnapshot={phase:'device',consent:'off',consentVersion:'2026-10-v1',mayOfferCard:true,enabled:false,accountCopy:'none',pending:0,scope:'engine_only',fileTransferVerified:false,actions:{turnOn:true,turnOff:false,deleteBackedUp:false,exportFile:false,importFile:false,reviewDropped:false,chooseHistory:false,recover:false,clearDevice:true,retry:false,signOut:true}};
function example(phase:ContinuityPhase):ContinuitySnapshot {
 const off=['device','paused','recoverable','reconsent','account_removed','deleted','device_cleared'].includes(phase);
 const noCopy=['device','empty','deleted','account_removed','device_cleared'].includes(phase);
 const consent=phase==='reconsent'?'needs_reconsent':phase==='paused'?'paused':off?'off':'on';
 return {...base,phase,consent,mayOfferCard:phase==='device',enabled:!off,
 accountCopy:noCopy?'none':['unavailable','error'].includes(phase)?'unknown':'verified',
 pending:['offline','syncing','conflict'].includes(phase)?2:0,
 actions:{...base.actions!,turnOn:off,turnOff:!off,deleteBackedUp:!noCopy,chooseHistory:phase==='conflict',recover:phase==='recoverable',reviewDropped:phase==='kept_local',retry:['offline','unavailable','error'].includes(phase)},
 ...(phase==='conflict'?{deviceSummary:{completedReps:2,throughDay:'2026-10-15'},accountSummary:{completedReps:3,throughDay:'2026-10-14'}}:{}),
 ...(phase==='kept_local'?{droppedCount:2,dropped:[{day:'2026-10-14',reason:'day_already_recorded' as const},{day:'2026-10-15',reason:'history_changed' as const}]}:{}),
 ...(!noCopy?{lastConfirmedDay:'2026-10-14'}:{})};
}
export function ContinuityReview(){
 const [page,setPage]=useState('today');const [s,setS]=useState(base);
 const [pending,setPending]=useState<ContinuityIntent|null>(null);const [operation,setOperation]=useState<ContinuityIntent|null>(null);const [message,setMessage]=useState('');
 const [today,setToday]=useState<TodayView|null>(null);const [model,setModel]=useState<MirrorModel>();const [days,setDays]=useState(0);
 const [invitation,setInvitation]=useState(false); const [dismissed,setDismissed]=useState(false);
 const refresh=()=>{setToday(runtime.today());setModel(runtime.mirror());setDays(runtime.practiceDaysThisMonth());};
 useEffect(()=>{let live=true;memory.clear();void runtime.init('continuity-review-fictional').then(()=>{if(live)refresh();});return()=>{live=false;};},[]);
 const request=(intent:ContinuityIntent,context?:{consentVersion:string})=>{if(intent==='enable'&&context?.consentVersion!==s.consentVersion){setMessage('Disclosure version mismatch; opt-in was not submitted.');return;}setPending(intent);setMessage(`Requested: ${intent.replaceAll('_',' ')}. No service has confirmed this.`);};
 const port:ContinuityPort={snapshot:{...s,requestPending:!!pending},request};
 const status=<ContinuityStatus port={port} onManage={()=>setPage('history')}/>;
 const confirm=async()=>{
  if(!pending)return;
  const intent=pending;setPending(null);if(intent!=='retry')setOperation(intent);
  if(intent==='enable')setS({...s,consent:'on',mayOfferCard:false,actions:{...(s.actions??base.actions!),turnOn:false,turnOff:true,deleteBackedUp:true},enabled:true,phase:s.accountCopy==='verified'?'conflict':'syncing',pending:1,...(s.accountCopy==='verified'?{deviceSummary:{completedReps:days,throughDay:'15 October 2026'},accountSummary:{completedReps:3,throughDay:'14 October 2026'}}:{})});
  if(intent==='decline'){setS({...s,consent:'declined',mayOfferCard:false,phase:s.accountCopy==='verified'?'paused':'device'});setDismissed(true);}
  if(intent==='disable')setS({...s,consent:'paused',mayOfferCard:false,actions:{...(s.actions??base.actions!),turnOn:true,turnOff:false},enabled:false,phase:s.accountCopy==='verified'?'paused':'device'});
  if(intent==='retry')setS({...s,phase:s.accountCopy==='unknown'?'unavailable':operation==='recover'?'recovering':operation==='delete'?'deleting':'syncing'});
  if(intent==='recover')setS({...s,phase:'recovering'});
  if(intent==='keep_account'||intent==='keep_device')setS({...s,phase:'syncing'});
  if(intent==='delete')setS({...s,phase:'deleting'});
  if(intent==='clear_device'){memory.clear();await runtime.init('continuity-review-fictional');refresh();setS({...s,phase:'device_cleared'});}
  if(intent==='sign_out'){memory.clear();await runtime.init('continuity-review-fictional');refresh();setPage('signedout');}
  setMessage('Simulated request acknowledgment only. No real backup, recovery or deletion took place.');
 };
 const finish=async()=>{
  if(s.phase==='deleting'){setS({...example('deleted')});}
  else if(s.phase==='recovering'){setS({...s,phase:'restored',pending:0});setMessage('Simulated recovery acknowledgment. No fictional practice was injected into Today or the Mirror.');return;}
  else setS({...example('ready'),lastConfirmedDay:'2026-10-15'});
  setMessage('Simulated completion. This review does not store any real account history.');
 };
 return <SafeAreaProvider><View testID="continuity-review" style={{flex:1,minHeight:0}}><VisualFoundation>
 <View role="region" accessibilityLabel="Prototype controls" style={{padding:12,gap:10,backgroundColor:'#FAF7F2',borderBottomWidth:1,borderColor:'#BDB1A2'}}>
 <Body style={{color:'#2A2A30',fontSize:14}}>Continuity prototype · simulated service · memory only. Nothing is backed up.</Body>
 <View role="navigation" accessibilityLabel="Practice navigation" style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['today','mirror','me'].map(p=><Action key={p} secondary selected={page===p} onPress={()=>setPage(p)}>{p==='me'?'Me':p==='today'?'Today':'The Mirror'}</Action>)}<Action secondary expanded={page==='scenarios'} onPress={()=>setPage(page==='scenarios'?'today':'scenarios')}>Review states</Action></View>
 {page==='history'&&s.actions?.turnOn&&<Action secondary onPress={()=>setS({...s,consentVersion:s.consentVersion==='2026-10-v1'?'sample-revised':s.consentVersion==='sample-revised'?undefined:'2026-10-v1'})}>Change sample disclosure</Action>}
 {message&&<Body role="status" style={{fontSize:14}}>{message}</Body>}
 {pending&&<View style={{gap:8}}><Body>Simulator: choose the response. UI waits for the owner’s service.</Body><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Action secondary onPress={()=>void confirm()}>Simulate acknowledgment</Action><Action secondary onPress={()=>{setPending(null);setMessage('Simulated failure. Previous state preserved.');}}>Simulate failure</Action></View></View>}
 {['syncing','recovering','deleting'].includes(s.phase)&&!pending&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Action secondary onPress={()=>void finish()}>Simulate confirmed completion</Action><Action secondary onPress={()=>{setS({...s,phase:'error'});setMessage('Simulated operation failure. No success is claimed.');}}>Simulate operation failure</Action></View>}
 </View></VisualFoundation>
 {page==='scenarios'?<VisualFoundation><View role="main" style={{flex:1,overflow:'scroll',padding:24,gap:12}}><Prompt>Review a service state.</Prompt><Body>Fictional service snapshots, not personal history. Select one, then return to Today, Mirror or Me.</Body>{Object.keys(statusTitle).map(phase=><Action secondary key={phase} onPress={()=>{setS(example(phase as ContinuityPhase));setPending(null);setMessage(`Review snapshot: ${statusTitle[phase as ContinuityPhase]}`);setPage('history');}}>{statusTitle[phase as ContinuityPhase]}</Action>)}</View></VisualFoundation>
 :page==='history'?<ContinuitySettings port={port} onBack={()=>setPage('me')}/>
 :page==='signedout'?<VisualFoundation><View role="main" style={{padding:24,gap:20}}><Prompt>Signed out of the review.</Prompt><Body>Simulated sign-out complete. Review memory was cleared. No account or authentication service was contacted.</Body><Action secondary onPress={()=>setPage('today')}>Return to review</Action></View></VisualFoundation>
 :page==='mirror'?<MirrorExperience model={model} practiceDays={days} continuity={status} privacyNotice={continuityPrivacy(s)} onToday={()=>setPage('today')}/>
 :page==='me'?<MeExperience email="Review account" onIntroduction={()=>setPage('today')} onPrivacy={()=>setPage('history')} onSupport={()=>setMessage('Support is not contacted in this prototype.')} onSignOut={()=>request('sign_out')} continuity={status} privacyNotice={continuityPrivacy(s)} historyControls={<View style={{gap:16}}><Body>Review the device-clearing consequence before signing out.</Body><Action secondary onPress={()=>setPage('history')}>History and sign-out controls</Action></View>}/>
 :today?<View role="main" style={{flex:1}}><DailyInnerRep today={today} greeting="A moment for yourself." practiceDays={days} receipt={runtime.receipt()} privacyNotice={continuityPrivacy(s)} continuity={<>{status}{invitation&&!dismissed&&s.mayOfferCard&&<BackupInvitation onOpen={()=>setPage('history')} onDismiss={()=>{setDismissed(true);setInvitation(false);request('decline');}}/>}</>} onProgress={a=>void runtime.progress(a)} onComplete={async(a,d)=>{const result=await runtime.complete(a,d);refresh();setInvitation(true);return result;}} onSafety={()=>void runtime.discardForSafety().then(refresh)} onFeedback={async(id,f)=>{await runtime.feedback(id,f);refresh();}} onCorrection={async(id,r)=>{await runtime.correction(id,r);refresh();}}/></View>
 :<VisualFoundation><Body role="status">Getting review practice ready…</Body></VisualFoundation>}
 </View></SafeAreaProvider>;
}

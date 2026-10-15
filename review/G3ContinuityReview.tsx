/** Review-only: actual G3 controller + engine, in-memory service/KV. No network, accounts or filesystem writes. */
import React,{useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Action,Body,Prompt,VisualFoundation} from '../components/inner-rep/v2/Foundation';
import {ContinuitySettings,ContinuityStatus,continuityPrivacy} from '../components/continuity/ContinuityExperience';
import {type ContinuityPort} from '../components/continuity/contract';
import {ContinuityController,type ContinuitySnapshotX} from '../lib/innerRep/backup/continuity';
import {CONSENT_VERSION} from '../lib/innerRep/backup/events';
import {StubService} from '../lib/innerRep/backup/stub-service';
import {MemKV} from '../lib/innerRep/backup/replay';
import {phantomDay} from '../lib/innerRep/backup/phantom';
import {ENGINE_VERSION} from '../lib/innerRep/v2/config';
import {createRuntime} from '../lib/innerRep/runtime/v2-runtime';
import {recordRuntime} from '../lib/innerRep/backup/recorder';
import {DailyInnerRep} from '../components/inner-rep/v2/DailyExperience';
import {MirrorExperience} from '../components/experience/MirrorExperience';
import {MeExperience} from '../components/experience/MeExperience';
const uid='g3-fictional-review';const day=(n:number)=>new Date(2026,5,n,12);
const scenarios=['retained_upload','device','empty','ready','ready_with_export','paused','paused_with_export','syncing','offline','unavailable','error','recoverable','recovering','conflict_no_export','conflict_with_export','copy_was_deleted','deleting','deleted','account_copy_removed','history_reset','turned_off_elsewhere','account_copy_deleted_device_kept','server_flag_pending','export_unavailable_error','save_cancelled'];
type H={ctl:ContinuityController;svc:StubService;rt:ReturnType<typeof recordRuntime>;clock:{d:Date};release?:()=>void;pending?:Promise<void>;save:'confirm'|'cancel';fileAttempts:number;fileConfirmed:number;clearCount:number;applied:number;signedOut:boolean;callsAtOpen:number;};
async function build(name:string,update:(s:ContinuitySnapshotX)=>void):Promise<H>{
 const h={} as H;h.fileAttempts=0;h.fileConfirmed=0;h.save=name==='save_cancelled'?'cancel':'confirm';h.clearCount=0;h.applied=0;h.signedOut=false;
 let gate:Promise<void>|undefined;
 h.svc=new StubService({engine:ENGINE_VERSION,sleep:()=>gate??Promise.resolve()});h.clock={d:day(1)};
 const make=()=>{const clock={d:day(1)},kv=new MemKV();return {clock,kv,rt:createRuntime({storage:kv,now:()=>clock.d})};};
 const wrap=(b:ReturnType<typeof make>)=>{h.clock=b.clock;h.rt=recordRuntime(b.rt,{engine:ENGINE_VERSION,now:()=>h.clock.d,onEvent:e=>void h.ctl.onEvent(e)});};
 h.ctl=new ContinuityController({uid,engine:ENGINE_VERSION,port:h.svc.port(uid),kv:new MemKV(),now:()=>day(8),exportEnabled:['paused_with_export','ready_with_export','conflict_with_export','save_cancelled','deleting','deleted'].includes(name),saveFile:async()=>{h.fileAttempts++;if(h.save==='confirm')h.fileConfirmed++;return h.save==='confirm';},makeRuntime:make,applyRebuilt:async b=>{h.applied++;wrap(b as ReturnType<typeof make>);},clearDeviceState:async()=>{h.clearCount++;wrap(make());await h.rt.init(uid);},signOut:async()=>{h.signedOut=true;}});
 wrap(make());await h.rt.init(uid);await h.ctl.load();
 const seed=async(n:number)=>{const events=await phantomDay(uid,ENGINE_VERSION,h.ctl.client.journal(),day(n));for(const e of events)await h.ctl.onEvent(e);};
 const drain=async()=>{await new Promise(r=>setTimeout(r,15));};
 const enable=async()=>{await h.ctl.request('enable');if(h.ctl.snap.confirmUpload)await h.ctl.request('enable_and_upload');};
 const ready=async()=>{await seed(1);await seed(2);await enable();await drain();};
 const conflict=async()=>{await seed(1);const events=await phantomDay(uid,ENGINE_VERSION,[],day(2));h.svc.simulateAccountReset(uid,events);await h.ctl.request('check_account');};
 const hold=async(intent:'enable'|'recover'|'delete'|'enable_and_upload')=>{if(intent==='enable'&&h.ctl.client.outbox.length){await h.ctl.request('enable');intent='enable_and_upload';}gate=new Promise<void>(r=>{h.release=()=>{h.svc.mode='normal';r();};});h.svc.mode='slow';h.pending=h.ctl.request(intent);await drain();};
 if(name==='retained_upload'){await seed(1);await seed(2);await h.ctl.request('enable');}
 else if(name==='empty')await h.ctl.request('enable');
 else if(['ready','ready_with_export','paused','paused_with_export','paused_with_export','offline','unavailable','copy_was_deleted','deleting','deleted','account_copy_removed','history_reset','turned_off_elsewhere','account_copy_deleted_device_kept','server_flag_pending'].includes(name)){
  await ready();
  if(name==='paused'||name==='paused_with_export'){await h.ctl.request('disable');await seed(3);}
  if(name==='offline'||name==='unavailable'){h.svc.mode=name;await seed(3);await drain();}
  if(name==='copy_was_deleted'){await h.ctl.request('disable');h.svc.simulateCopyDeletedElsewhere(uid);await h.ctl.request('enable');}
  if(name==='deleting')await hold('delete');
  if(name==='deleted')await h.ctl.request('delete');
  if(name==='account_copy_deleted_device_kept')await h.ctl.request('delete_account_copy');
  if(name==='account_copy_removed'){h.svc.simulateCopyDeletedElsewhere(uid);await h.ctl.request('check_account');}
  if(name==='history_reset'){h.svc.simulateAccountReset(uid,await phantomDay(uid,ENGINE_VERSION,[],day(3)));await h.ctl.request('check_account');}
  if(name==='turned_off_elsewhere'){h.svc.core(uid).disable();await seed(3);await drain();}
  if(name==='server_flag_pending'){h.svc.mode='offline';await h.ctl.request('disable');await seed(3);}
 }else if(name==='syncing'){await seed(1);await hold('enable');}
 else if(name==='error'){await seed(1);h.svc.mode='offline';await enable();}
 else if(name==='recoverable'||name==='recovering'){h.svc.simulateAccountReset(uid,await phantomDay(uid,ENGINE_VERSION,[],day(1)));await h.ctl.request('check_account');if(name==='recovering')await hold('recover');}
 else if(name.startsWith('conflict')||name==='export_unavailable_error'||name==='save_cancelled'){await conflict();if(name==='export_unavailable_error'||name==='save_cancelled')await h.ctl.request('keep_account');}
 // Supply the real local runtime to Today/Mirror; remote-only recovery does not inject history early.
 if(h.ctl.client.journal().length){wrap(await h.ctl.client.rebuild() as ReturnType<typeof make>);}
 h.callsAtOpen=h.svc.calls.length;h.ctl.subscribe(update);return h;
}
export function G3ContinuityReview(){
 const [h,setH]=useState<H|null>(null),[s,setS]=useState<ContinuitySnapshotX|null>(null),[page,setPage]=useState('history'),[name,setName]=useState('device'),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const version=useRef(0);const current=useRef<H|null>(null);const [revision,redraw]=useState(0);
 const load=async(n:string)=>{const v=++version.current;current.current?.ctl.dispose();current.current?.release?.();setLoading(true);setH(null);setS(null);setError('');try{const next=await build(n,x=>{if(v===version.current)setS(x);});if(v!==version.current){next.ctl.dispose();next.release?.();return;}current.current=next;setH(next);setS(next.ctl.snap);setName(n);setPage('history');}catch(e){setError(String(e));}finally{if(v===version.current)setLoading(false);}};
 useEffect(()=>{void load('device');return()=>{version.current++;current.current?.ctl.dispose();current.current?.release?.();};},[]);
 useEffect(()=>{(window as unknown as {g3Review:unknown}).g3Review={scenario:name,snapshot:s,calls:h?.svc.calls.length,callsAtOpen:h?.callsAtOpen,fileAttempts:h?.fileAttempts,fileConfirmed:h?.fileConfirmed,applied:h?.applied,clearCount:h?.clearCount,signedOut:h?.signedOut};},[h,s,name,revision]);
 const port:ContinuityPort|null=h&&s?{serviceMode:'simulated',snapshot:{...s,consent:h.ctl.consent.s,consentVersion:CONSENT_VERSION,canUploadAgain:true,canKeepDeviceOnly:true},request:(i,context)=>{if(i==='decline'){void h.ctl.dismissInvitation();return;}if((i==='enable'||i==='enable_and_upload')&&context?.consentVersion!==CONSENT_VERSION)return;void h.ctl.request(i).then(()=>redraw(n=>n+1));}}:null;
 const status=port?<ContinuityStatus port={port} onManage={()=>setPage('history')}/>:null;
 return <SafeAreaProvider><View testID="continuity-review" style={{flex:1,minHeight:0}}><VisualFoundation><View role="region" accessibilityLabel="G3 review controls" style={{padding:12,gap:8,backgroundColor:'#FAF7F2'}}><Body style={{fontSize:14,color:'#2A2A30'}}>G3 local-only review · real controller, simulated service and file saver · no account persistence or filesystem writes.</Body><View role="navigation" accessibilityLabel="Practice navigation" style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['today','mirror','me','history','scenarios'].map(p=><Action key={p} secondary onPress={()=>setPage(p)}>{p==='scenarios'?'Review states':p==='mirror'?'The Mirror':p==='history'?'History':p==='me'?'Me':'Today'}</Action>)}</View>{h?.release&&s?.requestPending&&<Action secondary onPress={()=>{h.release?.();void h.pending;}}>Release simulated service response</Action>}{h&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Action secondary onPress={()=>{h.svc.mode='normal';redraw(n=>n+1);}}>Service responds normally</Action><Action secondary onPress={()=>{h.save='cancel';redraw(n=>n+1);}}>Cancel simulated file save</Action></View>}</View></VisualFoundation>
 {loading?<VisualFoundation><Body role="status">Preparing actual controller state…</Body></VisualFoundation>:error?<VisualFoundation><Body role="alert">{error}</Body></VisualFoundation>:page==='scenarios'?<VisualFoundation><View role="main" style={{flex:1,overflow:'scroll',padding:24,gap:12}}><Prompt>Review a controller state.</Prompt>{scenarios.map(n=><Action secondary key={n} onPress={()=>void load(n)}>{n}</Action>)}</View></VisualFoundation>:h&&s&&port?<>
 {h.signedOut?<VisualFoundation><View role="main" style={{padding:24,gap:16}}><Prompt>Signed out of the review.</Prompt><Body>The controller stopped. No account service was contacted.</Body></View></VisualFoundation>
 :page==='history'?<ContinuitySettings port={port} initialScreen={new URLSearchParams(location.search).get('screen')==='upload_again'?'upload_again':'overview'} onBack={()=>setPage('me')}/>
 :page==='me'?<MeExperience email="Fictional G3 account" onIntroduction={()=>setPage('today')} onPrivacy={()=>setPage('history')} onSupport={()=>{}} onSignOut={()=>{}} continuity={status} privacyNotice={continuityPrivacy(s)} historyControls={<Action secondary onPress={()=>setPage('history')}>History and sign-out controls</Action>}/>
 :page==='mirror'?<MirrorExperience model={h.rt.mirror()} practiceDays={h.rt.practiceDaysThisMonth()} continuity={status} privacyNotice={continuityPrivacy(s)} onToday={()=>setPage('today')}/>
 :<View role="main" style={{flex:1}}><DailyInnerRep today={h.rt.today()} receipt={h.rt.receipt()} greeting="A moment for yourself." practiceDays={h.rt.practiceDaysThisMonth()} continuity={status} privacyNotice={continuityPrivacy(s)} onProgress={a=>void h.rt.progress(a)} onComplete={async(a,d)=>{const c=await h.rt.complete(a,d);redraw(n=>n+1);return c;}} onSafety={()=>void h.rt.discardForSafety()} onFeedback={async(id,f)=>{await h.rt.feedback(id,f);redraw(n=>n+1);}} onCorrection={async(id,r)=>{await h.rt.correction(id,r);redraw(n=>n+1);}}/></View>}
 </>:null}
 </View></SafeAreaProvider>;
}

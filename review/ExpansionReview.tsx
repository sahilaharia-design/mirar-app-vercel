// Public REVIEW ONLY. Simulated account, real unchanged runtime with memory KV.
// Engine and pilot runtimes have separate memory adapters. Fixtures are labelled and never account history.
import React,{useState,useEffect} from 'react';
import {View,Text,StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {DiscoverExperience} from '../components/experience/DiscoverExperience';
import {EntryExperience} from '../components/experience/EntryExperience';
import {PracticeIntroduction} from '../components/experience/PracticeIntroduction';
import {MirrorExperience} from '../components/experience/MirrorExperience';
import {MeExperience} from '../components/experience/MeExperience';
import {PrivacyExperience} from '../components/experience/PrivacyExperience';
import {PilotPractice} from '../components/pilots/PilotPractice';
import {PilotOffers,MirrorPanel} from '../components/pilots/PilotViews';
import {useReviewPilots} from './PilotReview';
import {DailyInnerRep} from '../components/inner-rep/v2/DailyExperience';
import {HonestMirror} from '../components/inner-rep/v2/HonestMirror';
import {Action,Body,Eyebrow,VisualFoundation} from '../components/inner-rep/v2/Foundation';
import {ExperiencePage,X} from '../components/experience/ExperienceKit';
import {createRuntime,type TodayView} from '../lib/innerRep/runtime/v2-runtime';
import type {Receipt} from '../lib/innerRep/runtime/receipt';
import type {MirrorModel} from '../lib/innerRep/runtime/mirror-contract';
import type {CorrectionReason} from '../lib/innerRep/v2/types';
import {CORRECTION_REASONS} from '../lib/innerRep/v2/contracts';
import {engineInsight} from './fixtures';
import scenarios from './aperture-scenarios.json';
import {MIRAR as M} from '../design-system/native';
const uid='fictional-aperture-review';
function newAdapter(){const entries=new Map<string,string>();return {entries,runtime:createRuntime({storage:{getItem:async k=>entries.get(k)??null,setItem:async(k,v)=>{entries.set(k,v);},removeItem:async k=>{entries.delete(k);},getAllKeys:async()=>[...entries.keys()]}})};}
export function ExpansionReview(){
 const pilots=useReviewPilots();
 const params=new URLSearchParams(location.search);const [stage,setStage]=useState(params.get('journey')??'landing');const [email,setEmail]=useState('');const [sent,setSent]=useState(false);const [loading,setLoading]=useState(true);const [failed,setFailed]=useState(false);const [adapter]=useState(newAdapter);const [menu,setMenu]=useState(false);
 const [today,setToday]=useState<TodayView|null>(null);const [days,setDays]=useState(0);const [receipt,setReceipt]=useState<Receipt|null>(null);const [model,setModel]=useState<MirrorModel>();const [sessionKey,setSessionKey]=useState(0);const [scenario,setScenario]=useState('fresh');
 const [mirrorAudit,setMirrorAudit]=useState('');
 const refresh=()=>{setToday(adapter.runtime.today());setDays(adapter.runtime.practiceDaysThisMonth());setReceipt(adapter.runtime.receipt());setModel(adapter.runtime.mirror());};
 const load=async(name:string)=>{setLoading(true);setFailed(false);adapter.entries.clear();const fixture=(scenarios as Record<string,{blob:string}|undefined>)[name];if(fixture)adapter.entries.set('mirar_inner_rep_v2:'+uid,fixture.blob);try{await adapter.runtime.init(uid);refresh();setScenario(name);setSessionKey(k=>k+1);}catch{setFailed(true);}finally{setLoading(false);}};
 useEffect(()=>{void load(params.get('record')??'fresh');},[]);
 const navigate=(s:string)=>{setMenu(false);setStage(s);history.replaceState(null,'','?journey='+s);};
 const header=<VisualFoundation><View role="navigation" accessibilityLabel="Fictional review journey" style={S.nav}><View style={S.note}><Text style={S.noteTitle}>Mirar · Review</Text><Body style={S.noteBody}>Review · no account · memory only</Body></View><Action secondary expanded={menu} onPress={()=>setMenu(!menu)}>{menu?'Close menu':'Journey'}</Action>{menu&&<View style={S.links}>{[['landing','Landing'],['today','Today'],['pilot-reframe','Look Again pilot'],['pilot-attend','Attend pilot'],['mirror','Mirror'],['honest-mirror','Honest Mirror'],['me','Your space']].map(([s,label])=><Action key={s} secondary selected={stage===s} onPress={()=>navigate(s)}>{label}</Action>)}</View>}</View></VisualFoundation>;
 let content:React.ReactNode;
 if(stage==='landing')content=<DiscoverExperience onEnter={()=>navigate('entry')} onPrivacy={()=>navigate('privacy')} legalLinks={<View style={X.row}><Action secondary onPress={()=>navigate('privacy')}>Privacy in this preview</Action></View>}/>;
 else if(stage==='entry')content=<View><VisualFoundation><View role="region" accessibilityLabel="Simulated entry notice" style={S.mock}><Body>This is simulated sign-in. No email is sent.</Body><Action secondary onPress={()=>navigate('intro')}>Continue the preview without email</Action></View></VisualFoundation><EntryExperience email={email} onEmail={setEmail} onSubmit={()=>setSent(true)} onBack={()=>navigate('landing')} onRetry={()=>setSent(false)} loading={false} sent={sent} error={params.has('auth-error')?'Review fixture: the link expired. Please request another.':null}/>{sent&&<VisualFoundation><View role="region" accessibilityLabel="Simulated sign-in continuation" style={S.mock}><Action onPress={()=>navigate('intro')}>Continue the simulated sign-in</Action></View></VisualFoundation>}</View>;
 else if(stage==='intro')content=<PracticeIntroduction onBegin={()=>navigate('today')}/>;
 else if(stage==='pilot-reframe'||stage==='pilot-attend')content=pilots.ready?<PilotPractice key={stage+pilots.generation} initialPilot={stage==='pilot-reframe'?'look_again':'attend'} port={pilots.port} onToday={()=>navigate('today')}/>:<Body>Opening practice…</Body>;
 else if(stage==='mirror')content=<MirrorExperience pilotPlane={pilots.ready?<MirrorPanel mirror={pilots.port.mirror}/>:undefined} model={model} readingHistory="approved" practiceDays={days} onToday={()=>navigate('today')}/>;
 else if(stage==='honest-mirror')content=<ExperiencePage><View style={X.narrow}><Eyebrow>Fictional engine-generated study · callbacks simulated</Eyebrow><Body>This reading comes from a synthetic engine record, never from the visitor or either pilot.</Body>{engineInsight()&&<HonestMirror key={sessionKey} insight={engineInsight()!} onFeedback={async value=>{if(params.has('feedback-error'))throw new Error('Mock feedback failure');setMirrorAudit('Fictional feedback: '+({accurate:'Accurate',partly:'Partly',no:'No',unsure:'Not sure'}[value]));}} onCorrection={async(reason:CorrectionReason)=>{if(params.has('correction-error'))throw new Error('Mock correction failure');setMirrorAudit('Fictional correction: '+CORRECTION_REASONS.find(r=>r.id===reason)?.label);}} onSafety={()=>navigate('privacy')}/>}<Body accessibilityLiveRegion="polite" style={{marginTop:24}}>{mirrorAudit}</Body></View></ExperiencePage>;
 else if(stage==='me')content=<MeExperience email="fictional-review@example.test" onIntroduction={()=>navigate('intro')} onPrivacy={()=>navigate('privacy')} onSupport={()=>navigate('privacy')} onSignOut={()=>{void load('fresh');setEmail('');setSent(false);navigate('landing');}}/>;
 else if(stage==='privacy')content=<PrivacyExperience onBack={()=>navigate('landing')}/>;
 else content=loading?<VisualFoundation><View style={S.mock}><Body role="status">Preparing this fictional session…</Body></View></VisualFoundation>:failed?<VisualFoundation><View style={S.mock}><Body role="alert">Couldn’t open this review record.</Body><Action onPress={()=>void load(scenario)}>Try again</Action></View></VisualFoundation>:today?<View role="main"><DailyInnerRep extraPractice={pilots.ready?<PilotOffers offers={pilots.port.offers} onBegin={id=>navigate(id==='attend'?'pilot-attend':'pilot-reframe')}/>:undefined} key={sessionKey} today={today} receipt={receipt} greeting="A moment for yourself." practiceDays={days} draft={today.kind==='rep'?today.draft:undefined} onProgress={a=>{void adapter.runtime.progress(a);}} onComplete={async(a,d)=>{const result=await adapter.runtime.complete(a,d);refresh();return result;}} onSafety={()=>{void adapter.runtime.discardForSafety().then(refresh);}} onFeedback={async(id,f)=>{await adapter.runtime.feedback(id,f);setModel(adapter.runtime.mirror());}} onCorrection={async(id,r)=>{await adapter.runtime.correction(id,r);setModel(adapter.runtime.mirror());}}/></View>:null;
 return <SafeAreaProvider><View style={{flex:1}}>{header}{content}<VisualFoundation><View role="contentinfo" style={S.lab}><Eyebrow>Review records · not account history</Eyebrow><Body style={X.small}>Switching engine fixtures resets only that memory adapter. Pilot choices have their own memory records; typed words are never kept.</Body><View style={S.links}>{[['fresh','First visit'],['compare','Returning record'],['timeframe','Chosen intention record'],['commitment_check','Follow-up record'],['insight','Evidence record']].map(([name,label])=><Action key={name} secondary selected={scenario===name} onPress={()=>{void load(name);navigate('today');}}>{label}</Action>)}<Action secondary onPress={()=>{void adapter.runtime.init(uid).then(refresh);}}>Reopen current runtime view</Action></View>{pilots.fixture&&<Body>FIXTURE DATA · generated pilot history, not your practice.</Body>}<View style={S.links}><Action secondary onPress={()=>void pilots.reopen()}>Resume after simulated reload</Action><Action secondary onPress={()=>void pilots.loadFixtures()}>Load pilot fixture history</Action><Action secondary onPress={()=>void pilots.clear()}>Clear pilot review records</Action></View></View></VisualFoundation></View></SafeAreaProvider>;
}
const S=StyleSheet.create({nav:{gap:12,padding:12,flexDirection:'row',flexWrap:'wrap',alignItems:'center',borderBottomWidth:1,borderColor:M.color.border,backgroundColor:M.color.paper},note:{gap:4,flex:1},noteTitle:{fontFamily:M.font.display,fontSize:18,lineHeight:24,color:M.color.ink},noteBody:{fontSize:12,lineHeight:18},links:{flexDirection:'row',flexWrap:'wrap',gap:8},mock:{padding:24,gap:16,backgroundColor:M.color.paper},lab:{padding:24,gap:16,borderTopWidth:1,borderColor:M.color.border,backgroundColor:M.color.paper}});

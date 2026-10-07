// Local review only: simulated auth, real v2 runtime, memory-only storage. Never deployed.
import React,{useState,useEffect} from 'react';
import {View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {DiscoverExperience} from '../components/experience/DiscoverExperience';
import {EntryExperience} from '../components/experience/EntryExperience';
import {PracticeIntroduction} from '../components/experience/PracticeIntroduction';
import {MirrorExperience} from '../components/experience/MirrorExperience';
import {MeExperience} from '../components/experience/MeExperience';
import {PrivacyExperience} from '../components/experience/PrivacyExperience';
import {DailyInnerRep} from '../components/inner-rep/v2/DailyExperience';
import {Action,Body,VisualFoundation} from '../components/inner-rep/v2/Foundation';
import {createRuntime,type KV,type TodayView} from '../lib/innerRep/runtime/v2-runtime';
const memory:KV={getItem:async k=>entries.get(k)??null,setItem:async(k,v)=>{entries.set(k,v);},removeItem:async k=>{entries.delete(k);},getAllKeys:async()=>[...entries.keys()]};const entries=new Map<string,string>();const runtime=createRuntime({storage:memory});
export function ExperienceReview(){
 const [stage,setStage]=useState(new URLSearchParams(location.search).get('experience')??'discover');const [email,setEmail]=useState('');const [sent,setSent]=useState(false);const [today,setToday]=useState<TodayView|null>(null);const [days,setDays]=useState(0);
 useEffect(()=>{void runtime.init('synthetic-review-account').then(()=>{setToday(runtime.today());});},[]);
 const navigate=(next:string)=>{setStage(next);};
 const content=stage==='discover'?<DiscoverExperience onEnter={()=>navigate('entry')} onPrivacy={()=>navigate('privacy')}/>:stage==='entry'?<View style={{flex:1}}><EntryExperience email={email} onEmail={setEmail} onSubmit={()=>setSent(true)} onBack={()=>navigate('discover')} onRetry={()=>setSent(false)} loading={false} sent={sent} error={null}/>{sent&&<VisualFoundation><Action onPress={()=>navigate('intro')}>Local review: continue to introduction</Action></VisualFoundation>}</View>:stage==='intro'?<PracticeIntroduction onBegin={()=>navigate('today')}/>:stage==='mirror'?<MirrorExperience practiceDays={days} commitment={today?.kind==='rep'?today.context.commitment:undefined} onToday={()=>navigate('today')}/>:stage==='me'?<MeExperience email="synthetic-review@example.test" onIntroduction={()=>navigate('intro')} onPrivacy={()=>navigate('privacy')} onSupport={()=>{}} onSignOut={()=>navigate('discover')}/>:stage==='privacy'?<PrivacyExperience onBack={()=>navigate('discover')}/>:today?<View role="main" style={{flex:1}}><DailyInnerRep today={today} greeting="Good afternoon." practiceDays={days} draft={today.kind==='rep'?today.draft:undefined} onProgress={a=>{void runtime.progress(a);}} onComplete={async(a,d)=>{const c=await runtime.complete(a,d);setDays(runtime.practiceDaysThisMonth());setToday(runtime.today());return c;}} onSafety={()=>{void runtime.discardForSafety();}} onFeedback={(id,f)=>runtime.feedback(id,f)} onCorrection={(id,r)=>runtime.correction(id,r)}/></View>:null;
 return <SafeAreaProvider><View style={{flex:1}}><VisualFoundation><View role="navigation" accessibilityLabel="Local review navigation" style={{padding:12,backgroundColor:'#FAF7F2',flexDirection:'row',flexWrap:'wrap',gap:8}}><Body style={{fontSize:12}}>Local review · simulated sign-in · memory-only practice</Body>{['discover','today','mirror','me'].map(s=><Action secondary key={s} onPress={()=>navigate(s)}>{s[0].toUpperCase()+s.slice(1)}</Action>)}</View></VisualFoundation>{content}</View></SafeAreaProvider>;
}

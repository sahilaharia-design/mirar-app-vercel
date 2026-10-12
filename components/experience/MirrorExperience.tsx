import React,{useState} from 'react';
import {View,Text} from 'react-native';
import type {MirrorModel,MirrorStatement} from '../../lib/innerRep/runtime/mirror-contract';
import {Body,Eyebrow,Prompt,Action} from '../inner-rep/v2/Foundation';
import {ExperiencePage,Chapter,X,PrivacyTruth} from './ExperienceKit';

/**
 * The Mirror. Renders ONLY the typed runtime model (runtime.mirror()); it computes nothing and reads no stored state.
 * Every sentence below is a statement the contract has already traced to stored structured data. Sections appear only
 * when they have statements, so sparse and empty Mirrors stay short and honest.
 */
const fmt=(iso?:string)=>iso?new Date(iso+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
const Line=({s,date}:{s:MirrorStatement;date?:boolean})=><View style={X.receipt}><Text style={X.quote}>{s.text}</Text>{date&&s.date&&<Body style={X.small}>{fmt(s.date)}</Body>}</View>;

export function MirrorExperience({model,practiceDays=0,onToday}:{model:MirrorModel;practiceDays?:number;onToday:()=>void}){
 const [ledger,setLedger]=useState(false);
 const sec=model.sections;
 const readings=sec.readings.filter(s=>s.source==='inferred'), readingHistory=[...sec.readings,...sec.shifted].filter(s=>s.source!=='inferred');
 const shifted=sec.shifted.filter(s=>s.source==='inferred');
 return <ExperiencePage>
  <View style={X.space}><Eyebrow>The Mirror</Eyebrow><Prompt display>A clearer view, without a label.</Prompt>
   <Body style={X.lede}>{model.state==='empty'?'This begins quietly. You do not need a profile of yourself before you begin.':'Only what you chose, and what Mirar has counted from it. Nothing here is a score.'}</Body></View>
  {model.state==='empty'&&<Chapter label="Beginning" title="A clearer view begins with a little practice."><Body>When you complete an Inner Rep, what you chose can appear here. Mirar reflects something back only when there is real evidence for it.</Body><Action secondary onPress={onToday}>Go to Today</Action></Chapter>}
  {sec.practised.length>0&&<Chapter label="What you’ve practised" title="Areas you’ve exercised.">
   {practiceDays>0&&<View style={X.receipt}><Text style={X.quote}>{practiceDays} {practiceDays===1?'day':'days'} of practice this month</Text><Body style={X.small}>The days do not need to be consecutive.</Body></View>}
   <Body>From the Inner Reps you completed. Not a ranking, and not a measure of ability.</Body>
   {sec.practised.map(s=><Line key={s.id} s={s} date/>)}
  </Chapter>}
  {sec.carrying.length>0&&<Chapter label="What you’re carrying" title="Things you chose.">{sec.carrying.map(s=><Line key={s.id} s={s} date/>)}<Body>Its outcome is yours to name, when it comes up in Today.</Body></Chapter>}
  {sec.come_up.length>0&&<Chapter label="What has come up" title="Counted, not interpreted.">{sec.come_up.map(s=><Line key={s.id} s={s}/>)}<Body style={X.small}>This counts your own responses about the topic in this period. It does not say why, and it is not a verdict.</Body></Chapter>}
  {readings.length>0&&<Chapter label="Mirar’s readings" title="Offered with their evidence.">{readings.map(s=><Line key={s.id} s={s} date/>)}</Chapter>}
  {shifted.length>0&&<Chapter label="What may have shifted" title="A comparison with your own earlier answers.">{shifted.map(s=><Line key={s.id} s={s} date/>)}</Chapter>}
  {readingHistory.length>0&&<Chapter label="Your say on past readings" title="What you told Mirar.">{readingHistory.map(s=><Line key={s.id} s={s} date/>)}</Chapter>}
  {sec.unknown.length>0&&<Chapter label="What isn’t known" title="Plainly.">{sec.unknown.map(s=><Line key={s.id} s={s}/>)}</Chapter>}
  {sec.said.length>0&&<Chapter label="Your own choices" title="What you chose recently.">
   <Action secondary expanded={ledger} onPress={()=>setLedger(!ledger)}>{ledger?'Hide what you chose':'See what you chose'}</Action>
   {ledger&&<View style={X.space}>{sec.said.map(s=><Line key={s.id} s={s} date/>)}<Body style={X.small}>These are the exact questions and choices, as you saw them.</Body></View>}
  </Chapter>}
  {model.state==='sparse'&&<Body style={X.small}>There is not enough here yet for Mirar to reflect anything back. That is fine.</Body>}
  {model.retained.mayBeTruncated&&<Body style={X.small}>This view covers your most recent practice only.</Body>}
  <PrivacyTruth/>
 </ExperiencePage>;
}

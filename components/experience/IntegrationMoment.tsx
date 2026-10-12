import React from 'react';
import {View,Text} from 'react-native';
import {chosenOption,nextStep,type FlowContext,type StepAnswer,TIMEFRAME_LABEL} from '../../lib/innerRep/v2/contracts';
import type {Receipt} from '../../lib/innerRep/runtime/receipt';
import {Body,Eyebrow} from '../inner-rep/v2/Foundation';
import {X,SectionTitle} from './ExperienceKit';

/**
 * Integration: the user's own exact response, then a release that depends on what they actually did.
 * Source of truth is `Receipt` (runtime.receipt(): rebuilt from stored structured state, so it survives a reload).
 * No generic instruction is ever appended. "I don't know", an honest "nothing" and leaving it all end cleanly.
 * Nothing here is inferred about the person; the operation line only names what the exercise asked them to do.
 */
const OPERATION: Record<string,string>={
 recognition:'You noticed something and named it.',
 inventory:'You took stock.',
 contrast:'You compared two ways it could be and picked the closer one.',
 attribution:'You looked at where something comes from.',
 appreciation:'You gave attention to something worth acknowledging.',
 acknowledgment:'You acknowledged something that was waiting for you.',
 reappraisal:'You considered whether a view has shifted.',
 micro_commit:'You considered one small thing.',
 probe:'You said what is most on your mind.',
 commitment_check:'You said how something you chose is going.',
 thread_check:'You said whether something is still weighing on you.',
 event_check:'You said how something is sitting with you now.',
};

const timeframeText=(tf:string,date?:string)=>tf==='specific_date'?(date?new Date(date+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long'}):'On a date you chose'):tf==='today'?TIMEFRAME_LABEL.today:tf==='tomorrow'?TIMEFRAME_LABEL.tomorrow:tf==='this_week'?TIMEFRAME_LABEL.this_week:TIMEFRAME_LABEL.none;

export function IntegrationMoment({receipt,context,answers}:{receipt?:Receipt|null;context?:FlowContext;answers?:StepAnswer[]}){
 // Legacy path (review harness without a runtime): exact option only, same release rules.
 const fallback=!receipt&&context&&answers?(()=>{const c=chosenOption(context,answers);const q=nextStep(context,[])?.prompt??'';
  if(c==='unknown')return {steps:[{prompt:q,choice:{kind:'unknown'} as const}],commitment:undefined,mechanism:context.template.mechanism as string};
  if(!c)return null;
  const tf=answers.find(a=>a.kind==='timeframe');
  return {steps:[{prompt:q,choice:{kind:'option',label:c.label,absent:c.polarity==='absent',createsCommitment:c.creates==='commitment'} as const}],commitment:c.creates==='commitment'?{label:c.commitLabel??c.label,timeframe:tf&&tf.kind==='timeframe'?tf.timeframe:'none',date:tf&&tf.kind==='timeframe'?tf.date:undefined}:undefined,mechanism:context.template.mechanism as string};})():null;
 const view=receipt??fallback;
 if(!view)return <View style={[X.rule,X.space]}><SectionTitle>Today’s practice is complete.</SectionTitle><Body>There is nothing else to do with it.</Body></View>;
 const first=view.steps[0]?.choice;
 const unknown=first?.kind==='unknown';
 const absent=first?.kind==='option'&&first.absent;
 const commitment=view.commitment;
 const title=unknown?'Not knowing is a complete answer.':absent?'Nothing to look at today is a real result.':commitment?'Something you chose to carry.':'What you did today.';
 return <View style={[X.rule,X.space]}>
  <Eyebrow>Integrate → Live</Eyebrow>
  <SectionTitle>{title}</SectionTitle>
  <View style={X.receipt}>
   <Eyebrow>You chose</Eyebrow>
   {view.steps.map((s,i)=><View key={i} style={X.space}>
    <Body style={X.small}>{s.prompt}</Body>
    <Text style={X.quote}>{s.choice.kind==='unknown'?'I don’t know':s.choice.kind==='domain'?`Mostly connected to ${s.choice.label}`:s.choice.label}</Text>
   </View>)}
   {commitment&&<Body>{timeframeText(commitment.timeframe,commitment.date)}</Body>}
  </View>
  {unknown?<Body>Nothing here needs fixing, and nothing more is being asked.</Body>
   :absent?<Body>You can leave it there.</Body>
   :commitment?<Body>This is something you chose to carry. The next step belongs to you.</Body>
   :<Body>{OPERATION[view.mechanism]??'You took part in today’s practice.'}</Body>}
 </View>;
}

import React,{useState} from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Action, Body, Eyebrow, Prompt, SelectionSurface } from '../inner-rep/v2/Foundation';
import { V2RepFlow } from '../inner-rep/v2/RepFlow';
import { HonestMirror } from '../inner-rep/v2/HonestMirror';
import { TEMPLATE_BY_ID } from '../../lib/innerRep/v2/templates';
import type { FlowContext } from '../../lib/innerRep/v2/contracts';
import { MIRAR as M } from '../../design-system/native';
import { ExperiencePage, Chapter, X } from './ExperienceKit';
const sample:FlowContext={template:TEMPLATE_BY_ID.foc_settle,frame:'base',captureCooledDown:true,openThreadDomains:[],threadDeclinedDomains:[]};
const capacities=[['Direction','Notice whether a choice belongs to you.'],['Energy','Recognise what asks for recovery.'],['Focus','Practise returning your attention.'],['Relationships','See what a connection asks of you.'],['Growth','Make room for a different understanding.'],['Action','Move from noticing to an intentional next step.']] as const;
export function DiscoverExperience({onEnter,onPrivacy}:{onEnter:()=>void;onPrivacy:()=>void}){
 const {width}=useWindowDimensions();const [trying,setTrying]=useState(false);const [finished,setFinished]=useState(false);const [capacity,setCapacity]=useState(2);
 return <ExperiencePage action={<Action secondary onPress={onEnter}>Enter Mirar</Action>}>
  <View style={[S.hero,{flexDirection:width>=1024?'row':'column'}]}>
   <View style={S.intro}><Eyebrow>Everyday emotional fitness</Eyebrow><Prompt display>Your inner life needs practice, too.</Prompt><Body style={X.lede}>Small daily Inner Reps for noticing clearly, choosing intentionally, and living with what you feel.</Body><View style={X.row}><Action onPress={onEnter}>Begin your practice</Action></View><Body style={X.small}>No streak to protect. No right answer to perform.</Body></View>
   <View style={S.sample}>
    <Eyebrow>Try an Inner Rep · sample</Eyebrow>
    {!trying?<><Text style={X.quote}>A private moment. A different way of seeing.</Text><Body>A short exercise in attention. Try it before you enter.</Body><Action secondary onPress={()=>setTrying(true)}>Try a sample</Action></>:finished?<><Text accessibilityRole="header" aria-level={2} style={X.quote}>Notice the next time your attention moves.</Text><Body>You don’t have to change it. Recognising the movement is the practice.</Body><Action secondary onPress={()=>{setFinished(false);setTrying(false);}}>Try again</Action></>:<V2RepFlow context={sample} onComplete={async()=>{setFinished(true);}} onSafety={()=>setFinished(true)}/>}
    <Body style={X.small}>A sample only. Answers here are not saved or used to understand you.</Body>
   </View>
  </View>
  <Chapter label="Notice → Exercise → Integrate → Live" title="Become more capable of meeting your life.">
   <Body style={X.lede}>Emotional fitness isn’t always feeling good. It’s practising what you do with whatever you feel.</Body>
   <View style={[S.capacityComposition,{flexDirection:width>=768?'row':'column'}]}>
    <View style={S.capacityNames}>{capacities.map(([name],i)=><SelectionSurface key={name} selected={capacity===i} onPress={()=>setCapacity(i)}>{name}</SelectionSurface>)}</View>
    <View accessibilityLiveRegion="polite" style={S.capacityDetail}><Eyebrow>A capacity you can practise</Eyebrow><Text style={[S.capacityWord,{fontSize:width<768?36:64,lineHeight:width<768?44:72}]}>{capacities[capacity][0]}</Text><Body style={X.lede}>{capacities[capacity][1]}</Body><Body style={X.small}>These are areas of practice, not six scores.</Body></View>
   </View>
  </Chapter>
  <Chapter label="The Honest Mirror" title="A reflection you can disagree with.">
   <Body style={X.lede}>Mirar works with your responses. When there is enough evidence, it offers a reflection. You decide whether it fits.</Body>
   <View style={S.reflection}><Eyebrow>Example · fictional responses</Eyebrow><HonestMirror insight={{id:0,tier:'supported',text:'Work has come up 5 times (5 raised by you).',evidence:{independentN:5,promptedN:0,introducedN:5}}} onFeedback={async()=>{}}/></View>
   <Body>No claims about who you are. Uncertainty stays visible. “No” is as welcome as “Accurate”.</Body>
  </Chapter>
  <Chapter label="A practice, not a programme" title="One moment today. A clearer view over time.">
   <View style={S.timeline}>{[['Today','One real response. Something to notice in the rest of your day.'],['As you return','Practice can deepen. A commitment you chose may be remembered.'],['When evidence supports it','An Honest Mirror can reflect what your own responses suggest.']] .map(([label,copy])=><View key={label} style={X.receipt}><Eyebrow>{label}</Eyebrow><Body>{copy}</Body></View>)}</View>
   <Body style={X.small}>The beta currently offers daily reps and individual reflections. A fuller view of your practice is still being built.</Body>
  </Chapter>
  <Chapter label="Your mirror is yours" title="Truth over performance.">
   <Body style={X.lede}>“I don’t know” counts. Leaving is allowed. Disagreement helps correct the mirror.</Body><Body>Mirar is an everyday practice, not therapy or a diagnosis. You can use it without writing anything.</Body><Body style={X.small}>In this beta, practice stays on your device and is cleared when you sign out. Optional words are not saved. We use your email to send your sign-in link.</Body>
   <View style={X.row}><Action secondary onPress={onPrivacy}>Read privacy information</Action></View>
  </Chapter>
  <Chapter label="Why Mirar exists" title="Alignment is a daily recalibration."><Body>Built by Dr. Sahil Haria, PhD, from a question: what if we maintained our inner life as intentionally as everything else?</Body><Body style={X.small}>The practice is yours. Mirar helps you make room for it.</Body></Chapter>
  <Chapter label="Begin" title="Take a moment. Then take it into your life."><View style={X.row}><Action onPress={onEnter}>Enter Mirar</Action></View><Body style={X.small}>A passwordless sign-in. One small Inner Rep.</Body></Chapter>
 </ExperiencePage>;
}
const S=StyleSheet.create({hero:{gap:48,paddingBottom:64},intro:{flex:1,gap:24},sample:{flex:1,backgroundColor:M.color.paper,padding:24,borderTopWidth:2,borderTopColor:M.color.warmInk,gap:24,borderRadius:8},capacityComposition:{gap:32},capacityNames:{flex:1},capacityDetail:{flex:1,justifyContent:'center',gap:24,padding:24,backgroundColor:M.color.paper},capacityWord:{fontFamily:M.font.display,fontSize:64,lineHeight:72,color:M.color.ink},reflection:{maxWidth:920,gap:24,paddingTop:24},timeline:{gap:32}});

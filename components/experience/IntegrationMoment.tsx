import React from 'react';
import {View,Text} from 'react-native';
import {chosenOption,nextStep,type FlowContext,type StepAnswer,TIMEFRAME_LABEL} from '../../lib/innerRep/v2/contracts';
import {Body,Eyebrow} from '../inner-rep/v2/Foundation';
import {X,SectionTitle} from './ExperienceKit';
export function IntegrationMoment({context,answers}:{context?:FlowContext;answers?:StepAnswer[]}){
 const chosen=context&&answers?chosenOption(context,answers):null;
 const timeframe=answers?.find(a=>a.kind==='timeframe');
 const label=chosen&&chosen!=='unknown'?chosen.label:null;
 return <View style={[X.rule,X.space]}><Eyebrow>Integrate → Live</Eyebrow><SectionTitle>Let the noticing meet your day.</SectionTitle>
 {label?<View style={X.receipt}><Eyebrow>You chose</Eyebrow>{context&&<Body style={X.small}>{nextStep(context,[])?.prompt}</Body>}<Text style={X.quote}>{label}</Text>{timeframe?.kind==='timeframe'&&<Body>{timeframe.timeframe==='specific_date'?timeframe.date:TIMEFRAME_LABEL[timeframe.timeframe]}</Body>}</View>:chosen==='unknown'?<Body>You left room for not knowing. Nothing more needs to be answered here.</Body>:<Body>Today’s practice is complete. There is no need to make it into another task.</Body>}
 <Body>{chosen&&chosen!=='unknown'&&chosen.creates==='commitment'?'This is something you chose to carry forward. The next step belongs to you.':'Notice once, later today, whether this comes up again. You can leave it there; noticing does not oblige you to change it.'}</Body>
 </View>;
}

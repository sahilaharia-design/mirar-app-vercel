import React from 'react';
import {View} from 'react-native';
import {Action,Body,Eyebrow,Prompt} from '../inner-rep/v2/Foundation';
import {ExperiencePage,PrivacyTruth,X} from './ExperienceKit';
export function PracticeIntroduction({onBegin}:{onBegin:()=>void}){
 return <ExperiencePage><View style={[X.narrow,X.space]}><Eyebrow>Before your first Inner Rep</Eyebrow><Prompt display>You don’t need a better answer. Just a truer one.</Prompt><Body style={X.lede}>An Inner Rep is a short exercise in noticing, understanding or choosing. Mirar learns from the structured responses you choose, not from guessing what your words mean.</Body>
 <View style={X.rule}><Body>If an answer isn’t clear, “I don’t know” and “I’d rather leave this for now” are both complete answers. Nothing needs to be resolved.</Body></View>
 <Body>You can leave any rep. You can disagree with any Mirror reflection. There is no score to improve and no streak to lose.</Body><PrivacyTruth/><Body style={X.small}>Mirar is not therapy or a diagnosis. There is no need to share a personal story.</Body><View style={X.row}><Action onPress={onBegin}>Meet today’s Inner Rep</Action></View></View></ExperiencePage>;
}

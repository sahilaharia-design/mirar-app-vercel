import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Action, Body, Eyebrow, Prompt } from '../inner-rep/v2/Foundation';
import { ExperiencePage, PrivacyTruth, X } from './ExperienceKit';
import { WindowStudy } from './WindowStudy';
import { MIRAR as M } from '../../design-system/native';
export function PracticeIntroduction({ onBegin }: { onBegin: () => void }) {
 const {width}=useWindowDimensions();
 return <ExperiencePage><View style={[S.spread,{flexDirection:width>=768?'row':'column'}]}><View style={{flex:1,gap:24}}><Eyebrow>A first opening</Eyebrow><Prompt display style={{marginBottom:0}}>Meet one moment. Leave room around it.</Prompt><Body style={X.lede}>An offered question. Your response. A clear place to stop.</Body><Action onPress={onBegin}>Go to Today</Action></View><View style={S.folio}><View style={{height:160}}><WindowStudy quiet height={160}/></View>{[['Your pace','Leave whenever you want.'],['Your uncertainty','“I don’t know” is a real answer.'],['Your say','A Mirror reading can be questioned.']].map(([title,body])=><View key={title} style={S.line}><Text style={S.lineTitle}>{title}</Text><Body>{body}</Body></View>)}</View></View><View style={[X.rule,{marginTop:32,gap:12}]}><PrivacyTruth/><Body style={X.small}>This introduction asks nothing about you. Mirar is a practice, not therapy or a diagnosis.</Body></View></ExperiencePage>;
}
const S=StyleSheet.create({spread:{gap:32},folio:{flex:1,backgroundColor:M.color.paper,padding:24,gap:20},line:{borderTopWidth:1,borderColor:M.color.border,paddingTop:16,gap:8},lineTitle:{fontFamily:M.font.display,fontSize:30,lineHeight:36,color:M.color.ink}});

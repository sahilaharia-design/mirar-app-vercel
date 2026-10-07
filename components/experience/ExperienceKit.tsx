import React from 'react';
import { ScrollView, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { MIRAR as M } from '../../design-system/native';
import { BrandAsset, VisualFoundation, Body, Eyebrow } from '../inner-rep/v2/Foundation';

export function ExperiencePage({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
 const { width } = useWindowDimensions();
 return <VisualFoundation><SafeAreaView style={X.page} edges={['top','bottom']}><ScrollView style={X.page} contentContainerStyle={[X.pageContent,{paddingHorizontal:width<768?24:64}]} keyboardShouldPersistTaps="handled">
  <View role="banner" style={X.header}><BrandAsset/><View style={X.actions}>{action}<Eyebrow>Beta</Eyebrow></View></View>
  <View role="main" style={X.bound}>{children}</View>
 </ScrollView></SafeAreaView></VisualFoundation>;
}
export function SectionTitle({ children }: { children: string }) {return <Text accessibilityRole="header" aria-level={2} style={X.sectionTitle}>{children}</Text>;}
export function Chapter({ label, title, children }: {label:string;title:string;children:React.ReactNode}) {return <View style={X.chapter}><Eyebrow>{label}</Eyebrow><SectionTitle>{title}</SectionTitle>{children}</View>;}
export function PrivacyTruth(){return <Body style={X.small}>In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.</Body>;}
export const X=StyleSheet.create({
 page:{flex:1,backgroundColor:M.color.surface},pageContent:{flexGrow:1,paddingTop:24,paddingBottom:64},bound:{width:'100%',maxWidth:1120,alignSelf:'center'},header:{maxWidth:1120,width:'100%',alignSelf:'center',flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:48,marginBottom:64},actions:{flex:1,marginLeft:16,flexDirection:'row',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'flex-end'},
 chapter:{paddingVertical:48,borderTopWidth:1,borderTopColor:M.color.border,gap:24},sectionTitle:{fontFamily:M.font.display,fontSize:36,lineHeight:42,color:M.color.ink,maxWidth:720},small:{fontSize:14,lineHeight:22},lede:{fontSize:20,lineHeight:30,maxWidth:600},row:{flexDirection:'row',flexWrap:'wrap',gap:12},narrow:{maxWidth:680,width:'100%',alignSelf:'center'},space:{gap:24},rule:{borderTopWidth:1,borderTopColor:M.color.border,paddingTop:24},field:{minHeight:52,fontFamily:M.font.body,fontSize:18,lineHeight:26,color:M.color.ink,backgroundColor:M.color.paper,borderBottomWidth:1,borderColor:M.color.warmInk,borderRadius:8,padding:16},receipt:{borderLeftWidth:2,borderLeftColor:M.color.warmInk,paddingLeft:24,gap:12},quote:{fontFamily:M.font.display,fontSize:30,lineHeight:38,color:M.color.ink},
});

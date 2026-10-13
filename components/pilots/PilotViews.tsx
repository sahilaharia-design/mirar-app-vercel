import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { MIRAR as M } from '../../design-system/native';
import { containsCrisisLanguage } from '../../lib/innerRep/safety';
import type { PAnswer, POption, PStep, PilotRecord } from '../../lib/innerRep/pilots/types';
import type { PilotSession } from '../../lib/innerRep/pilots/session';
import type { PilotMirror, PilotOffer, PilotReceipt } from '../../lib/innerRep/pilots/read';
import { PULLS, DISPOSITION_LABEL } from '../../lib/innerRep/pilots/attend';
import { SITUATIONS } from '../../lib/innerRep/pilots/look-again';
import { Action, Body, Eyebrow, PageTransition, Prompt, SelectionSurface } from '../inner-rep/v2/Foundation';
import { WindowStudy } from '../experience/WindowStudy';
import { ReflectiveFrame } from '../experience/ApertureScenes';

// Presentation only: session.step() owns sequencing. Words never reach callbacks, drafts or read models.
export function PilotRunner({ session, title, onAnswer, onBack, onLeave, onFinish, onSafety }: {
 session: PilotSession; title: string; onAnswer: (a: PAnswer) => Promise<void>; onBack: () => Promise<void>;
 onLeave: () => void; onFinish: () => void; onSafety: () => void;
}) {
 const [words, setWords] = useState<Record<string,string>>({});
 const [busy,setBusy] = useState(false); const lock=useRef(false); const [error,setError]=useState('');
 const runner=useRef<View>(null);
 const step=session.step();
 useEffect(()=>{if(Platform.OS==='web'&&step)(runner.current as unknown as HTMLElement|null)?.scrollIntoView({block:'start',behavior:'instant'});},[step?.id]);
 const answers=session.snapshot().answers;
 const record=session.record(0); const facts=record?.pilot==='look_again'?record.facts:null;
 const situation=SITUATIONS.find(s=>s.id===facts?.situation)??SITUATIONS[SITUATIONS.length-1];
 const interpretation=facts?.interpretation;
 const reading=interpretation&&typeof interpretation==='object'?situation.interps.find(i=>i.id===interpretation.id)?.label:undefined;
 const observationId=answers.some(a=>a.stepId==='observation_retry'&&a.kind==='words')?'observation_retry':'observation';
 const wrote=answers.some(a=>a.stepId===observationId&&a.kind==='words');
 const observation=wrote?words[observationId]:undefined;
 const act=async(fn:()=>Promise<void>)=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await fn();}catch{setError('That choice could not be applied. Please try again.');}finally{lock.current=false;setBusy(false);}};
 if(session.isHalted)return <Body>Nothing about this moment is kept.</Body>;
 if(!step)return <Done onFinish={()=>{setWords({});onFinish();}}/>;
 const previous=answers[answers.length-1]?.stepId;
 // The session also blocks crossing a hold or rearrangement, even when the new step permits Back.
 const canBack=step.allowBack&&session.answerCount>0&&!['hold','hold_offer','rearrange'].includes(previous);
 const isPlace=session.pilot==='attend'&&step.id.startsWith('place:');
 const hasFrame=session.pilot==='look_again'&&step.id!=='situation'&&step.type!=='words';
 return <View ref={runner} style={S.runner}>
  <View style={S.bar}><Eyebrow>{title} · optional practice</Eyebrow><View style={S.actions}>
   {canBack&&<Action secondary disabled={busy} onPress={()=>void act(onBack)}>Back</Action>}
   <Action secondary disabled={busy} onPress={()=>{setWords({});onLeave();}}>Leave</Action>
  </View></View>
  <PageTransition key={step.id}><View style={S.step}>
   <Prompt compact level={1}>{step.prompt}</Prompt>
   {hasFrame&&<ReflectiveFrame separate open={step.id==='exit'} left={<><Eyebrow>What happened · your words</Eyebrow><Text style={S.quote}>{observation??(wrote?'Earlier words were not restored.':'No words supplied.')}</Text>{wrote&&!observation&&<Body style={S.hint}>Your earlier words are not kept after a reload. Only structured choices resume.</Body>}</>} right={<><Eyebrow>A carried reading · your choice</Eyebrow><Text style={S.quote}>{reading??'No reading named.'}</Text>{!!facts?.alternativesChosen.length&&<Possibilities key={facts.alternativesChosen.join(':')} labels={facts.alternativesChosen.map(id=>situation.alts.find(a=>a.id===id)?.label??'')}/>}</>}/>}
   {session.pilot==='attend'&&<AttentionField session={session} step={step} busy={busy} onAnswer={a=>act(()=>onAnswer(a))}/>}
   <StepView key={step.id} step={step} spatial={isPlace} busy={busy} onAnswer={a=>act(()=>onAnswer(a))} onWords={text=>setWords(w=>({...w,[step.id]:text}))} onSafety={()=>{setWords({});onSafety();}}/>
   {!!error&&<Body role="alert">{error}</Body>}
  </View></PageTransition>
 </View>;
}

function Possibilities({labels}:{labels:string[]}) {
 const [index,setIndex]=useState(0);
 return <View style={S.alternative}><Eyebrow>Alongside it · possible, not established</Eyebrow><Body style={S.ink} accessibilityLiveRegion="polite">{labels[index]}</Body>{labels.length>1&&<View role="group" accessibilityLabel="Readings you set alongside your own" style={S.actions}>{labels.map((label,i)=><Pressable key={label} accessibilityRole="button" accessibilityLabel={`Read possibility ${i+1}: ${label}`} aria-pressed={index===i} accessibilityState={{selected:index===i}} onPress={()=>setIndex(i)} style={({pressed})=>[S.readingTab,(index===i||pressed)&&S.chosen]}><Text style={S.choiceText}>{i+1}</Text></Pressable>)}</View>}</View>;
}

function Choice({option,onPress,selected,spatial=false,disabled=false}:{option:POption;onPress:()=>void;selected?:boolean;spatial?:boolean;disabled?:boolean}) {
 return <View style={spatial?S.destination:S.choice}>
  <Pressable accessibilityRole="button" accessibilityState={{disabled:!!option.disabled||disabled,selected}} aria-pressed={selected} disabled={!!option.disabled||disabled} onPress={onPress} style={({pressed})=>[S.tile,spatial&&S.spatialTile,(selected||pressed)&&S.chosen,!!option.disabled&&S.disabled]}>
   <Text style={spatial?S.destinationTitle:S.choiceText}>{option.label}</Text>
  </Pressable>{option.disabled&&<Body style={S.reason}>{option.disabled}</Body>}
 </View>;
}
function StepView({step,spatial,busy,onAnswer,onWords,onSafety}:{step:PStep;spatial:boolean;busy:boolean;onAnswer:(a:PAnswer)=>Promise<void>;onWords:(t:string)=>void;onSafety:()=>void}) {
 const [selected,setSelected]=useState<string[]>([]);const [text,setText]=useState('');const live=useRef('');
 useEffect(()=>()=>{live.current='';},[]);
 const unknown=()=>step.type!=='hold'&&step.type!=='words'&&step.allowUnknown?<SelectionSurface disabled={busy} onPress={()=>void onAnswer({stepId:step.id,kind:'unknown'})}>{step.type==='multi'?'Hard to tell':'I don’t know'}</SelectionSurface>:null;
 if(step.type==='choice')return <View style={S.step}>{!spatial&&<View role="group" accessibilityLabel={step.prompt} style={spatial?S.destinations:S.choices}>{step.options.map(o=><Choice key={o.id} option={o} disabled={busy} spatial={spatial} onPress={()=>void onAnswer({stepId:step.id,kind:'option',optionId:o.id})}/>)}</View>}{unknown()}</View>;
 if(step.type==='multi')return <View style={S.step}>
  <View role="group" accessibilityLabel={step.prompt} style={S.destinations}>{step.options.map(o=><Choice key={o.id} option={o} spatial selected={selected.includes(o.id)} disabled={busy||(!selected.includes(o.id)&&selected.length>=step.max)} onPress={()=>setSelected(s=>s.includes(o.id)?s.filter(id=>id!==o.id):[...s,o.id])}/>)}</View>
  <Body accessibilityLiveRegion="polite">{selected.length} of {step.max} chosen{selected.length>=step.max?' · Unselect a choice to make room.':''}</Body><View style={S.actions}><Action disabled={busy||!selected.length} onPress={()=>void onAnswer({stepId:step.id,kind:'options',optionIds:selected})}>Continue</Action><Action secondary disabled={busy} onPress={()=>void onAnswer({stepId:step.id,kind:'options',optionIds:[]})}>{step.noneLabel}</Action></View>{unknown()}
 </View>;
 if(step.type==='words') {
  const clear=()=>{live.current='';setText('');};
  const next=()=>{const t=live.current.trim();if(!t||busy)return;if(containsCrisisLanguage(t)){clear();onSafety();return;}onWords(t);clear();void onAnswer({stepId:step.id,kind:'words',chars:t.length});};
  return <View style={S.step}><View style={S.writingFrame}><View style={S.writingMark}><WindowStudy quiet separate height={100}/></View><TextInput multiline value={text} editable={!busy} onChangeText={v=>{live.current=v;setText(v);}} maxLength={step.maxChars} autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" textContentType="none" accessibilityLabel={step.prompt} style={S.input}/></View><Body style={S.hint}>Optional. Stays on this screen only. Not saved, not sent anywhere.</Body><View style={S.actions}><Action disabled={busy||!text.trim()} onPress={next}>Continue</Action><Action secondary disabled={busy} onPress={()=>{clear();void onAnswer({stepId:step.id,kind:'skip'});}}>{step.id==='observation_retry'?'Keep it as it is':'Skip'}</Action></View></View>;
 }
 return <View style={S.hold}><WindowStudy quiet separate height={180}/><Body>Stay with it for as long as you like. Nothing is counting.</Body><Action disabled={busy} onPress={()=>void onAnswer({stepId:step.id,kind:'hold_end'})}>{step.endLabel}</Action></View>;
}

function AttentionField({session,step,busy,onAnswer}:{session:PilotSession;step:PStep;busy:boolean;onAnswer:(a:PAnswer)=>Promise<void>}) {
 const rec=session.record(0);const f=rec?.pilot==='attend'?rec.facts:null;
 if(!f?.pulls.length)return null;
 const awaiting=f.pulls.filter(p=>!f.dispositions.some(d=>d.pull===p));
 const label=(id:string)=>PULLS.find(p=>p.id===id)?.label??'';
 return <View role="region" accessibilityLabel="Attention arrangement" style={S.field}>
  <View style={S.fieldTop}><View style={S.fieldMark}><WindowStudy quiet separate height={90}/></View><Body style={[S.ink,{flex:1}]}>One place for each pull. At most one can have your attention now.</Body></View>
  {step.type==='choice'&&step.id.startsWith('place:')&&step.options.filter(o=>o.disabled).map(o=><Body key={o.id} style={S.reason}>{o.disabled}</Body>)}
  <View role={step.type==='choice'&&step.id.startsWith('place:')?'group':'region'} accessibilityLabel="Places for your attention" style={S.destinations}>{Object.entries(DISPOSITION_LABEL).map(([id,name])=>{
   const option=step.type==='choice'&&step.id.startsWith('place:')?step.options.find(o=>o.id===id):undefined;
   const placed=f.dispositions.filter(d=>d.disposition===id);
   const contents=<><Text style={S.placeTitle}>{name}</Text>{placed.map(d=><Text key={d.pull} style={S.placedPull}>{label(d.pull)}</Text>)}</>;
   return <View key={id} style={S.placeSlot}>{option?<Pressable accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{disabled:!!option.disabled||busy}} disabled={!!option.disabled||busy} onPress={()=>void onAnswer({stepId:step.id,kind:'option',optionId:id})} style={({pressed})=>[S.place,pressed&&S.chosen,!!option.disabled&&S.disabled]}>{contents}</Pressable>:<View style={S.place}>{contents}</View>}</View>;
  })}</View>
  {f.dispositions.some(d=>d.disposition==='unknown')&&<View style={S.openRow}><Eyebrow>Not yet known</Eyebrow>{f.dispositions.filter(d=>d.disposition==='unknown').map(d=><Body key={d.pull}>{label(d.pull)}</Body>)}</View>}
  {!!awaiting.length&&<View style={S.openRow}><Eyebrow>Still to place</Eyebrow>{awaiting.map(p=><Text key={p} style={[S.pull,step.id===`place:${p}`&&S.activePull]}>{label(p)}</Text>)}</View>}
 </View>;
}
function Done({onFinish}:{onFinish:()=>void}) {const fired=useRef(false);useEffect(()=>{if(!fired.current){fired.current=true;onFinish();}},[onFinish]);return <Body role="status">Opening your practice record…</Body>;}
function Lines({items}:{items:string[]}) {return <View style={S.lines}>{items.map((t,i)=><Body key={i} style={S.ink}>{t}</Body>)}</View>;}
export function ValuePanel({receipt,record}:{receipt:PilotReceipt;record?:PilotRecord}) {
 const unfinished=receipt.status==='left';
 const uncertainPlacement=record?.pilot==='attend'&&record.facts.dispositions.some(d=>d.disposition==='unknown');
 const [detail,setDetail]=useState(false);const v=receipt.value;const {width}=useWindowDimensions();
 return <PageTransition><View style={S.step}>
  <Eyebrow>{receipt.title} · {receipt.status==='left'?'Left partway':'Completed'} · {receipt.date}</Eyebrow>
  <Prompt display>{receipt.status==='left'?'Where you stopped.':'A practice, held here.'}</Prompt>
  {!unfinished&&<ReflectiveFrame separate left={<><Eyebrow>What you practised</Eyebrow><Lines items={v.practised}/></>} right={<><Eyebrow>Useful before you go</Eyebrow><Text style={S.quote}>{uncertainPlacement?'Your named pulls and the places you chose are here. Some places remain unknown.':v.usefulNow}</Text></>}/>}{unfinished&&<Body>You stopped before completion. Only the choices recorded before leaving are shown below.</Body>}
  <View style={[S.receiptSpread,{flexDirection:width>=768?'row':'column'}]}><View style={[S.receiptSide,width>=768?{flex:1}:{width:'100%'}]}><Eyebrow>Your choices · not an explanation</Eyebrow><Lines items={v.established.length?v.established:['No specific choice was established.']}/></View><View style={[S.receiptSide,width>=768?{flex:1}:{width:'100%'}]}><Eyebrow>What remains unknown</Eyebrow><Lines items={v.unknown}/></View></View>
  <Action secondary expanded={detail} onPress={()=>setDetail(!detail)}>{detail?'Close what is kept':'What is kept from this practice?'}</Action>{detail&&<View style={S.receiptSpread}><Eyebrow>Kept on this device</Eyebrow><Body style={S.ink}>Your choices stay on this device. They do not change your daily Inner Rep.</Body><Eyebrow>Not kept</Eyebrow><Lines items={v.notCarried}/></View>}
 </View></PageTransition>;
}
export function PilotOffers({offers,onBegin}:{offers:PilotOffer[];onBegin:(id:PilotOffer['pilot'])=>void}) {return <View style={S.offerSection}><Eyebrow>Another opening · optional practice preview</Eyebrow><View style={S.destinations}>{offers.map(o=><View key={o.pilot} style={S.offer}><Text style={S.offerTitle}>{o.title}</Text><Body>{o.line}</Body>{o.carried>0&&<Body style={S.hint}>{o.carried} {o.carried===1?'pull you set aside can':'pulls you set aside can'} be offered back once. “Not right now” is a complete answer.</Body>}<Action secondary onPress={()=>onBegin(o.pilot)}>{o.resume?`Resume ${o.title}`:`Begin ${o.title}`}</Action></View>)}</View></View>;}
export function MirrorPanel({mirror}:{mirror:PilotMirror}) {
 const [sources,setSources]=useState(false);
 const groups=[['observed','Extra practice facts'],['user_said','Your extra practice choices'],['unknown','What this practice cannot establish']] as const;
 return <View style={S.offerSection}><Eyebrow>Optional practice · its own records</Eyebrow><Text style={S.offerTitle}>Another plane of the Mirror.</Text><Body>These practice choices are kept apart from your daily Inner Rep. They do not change which daily exercise you are offered.</Body>
  {mirror.state==='empty'&&<View style={S.empty}><WindowStudy quiet separate height={120}/><Body>No pilot records yet. Nothing needs to fill this space.</Body></View>}
  {groups.map(([source,title])=>{const statements=mirror.statements.filter(s=>s.source===source&&!(s.facts.kind==='pilot_latest'&&!s.facts.lines.length));return statements.length?<View key={source} style={S.mirrorGroup}><Eyebrow>{title}</Eyebrow>{statements.map(s=><View key={s.id} style={S.statement}><Text style={source==='unknown'?S.choiceText:S.quote}>{s.text}</Text>{s.date&&<Body style={S.hint}>{s.date}</Body>}{sources&&<Body style={S.hint}>{s.trace.pilotRecordIds.length?`From ${s.trace.pilotRecordIds.length} stored practice ${s.trace.pilotRecordIds.length===1?'record':'records'} · exact`:'No supporting record · explicitly unknown'}</Body>}</View>)}</View>:null;})}
  <Action secondary expanded={sources} onPress={()=>setSources(!sources)}>{sources?'Close pilot sources':'Show pilot sources'}</Action>
  <Body style={S.hint}>Kept on this device for {mirror.retention.days} days, up to {mirror.retention.maxRecords} records. Not synced.</Body><Eyebrow>Not active</Eyebrow><Lines items={mirror.inactive}/>
 </View>;
}
const S=StyleSheet.create({
 readingTab:{minWidth:48,minHeight:48,borderWidth:1,borderColor:M.color.border,alignItems:'center',justifyContent:'center'},runner:{gap:24,maxWidth:1000,width:'100%',alignSelf:'center'},bar:{gap:12,marginBottom:8},actions:{flexDirection:'row',flexWrap:'wrap',gap:12},step:{gap:24},choices:{gap:8},choice:{width:'100%'},destinations:{flexDirection:'row',flexWrap:'wrap',gap:12},destination:{flexGrow:1,flexBasis:260,minWidth:0},tile:{minHeight:64,padding:16,borderBottomWidth:1,borderColor:M.color.border,backgroundColor:M.color.paper,justifyContent:'center'},spatialTile:{minHeight:104,borderTopWidth:2,borderTopColor:M.color.warmInk},chosen:{backgroundColor:M.color.selected,borderColor:M.color.warmInk},disabled:{backgroundColor:M.color.disabled},choiceText:{fontFamily:M.font.body,fontSize:17,lineHeight:26,color:M.color.ink},destinationTitle:{fontFamily:M.font.display,fontSize:26,lineHeight:32,color:M.color.ink},quote:{fontFamily:M.font.display,fontSize:28,lineHeight:34,color:M.color.ink},ink:{color:M.color.ink},hint:{fontSize:14,lineHeight:22},reason:{fontSize:14,lineHeight:22,padding:12,color:M.color.ink},alternative:{gap:8,borderTopWidth:1,borderColor:M.color.border,paddingTop:12},writingFrame:{backgroundColor:M.color.paper,borderLeftWidth:2,borderColor:M.color.warmInk},writingMark:{height:100},input:{fontFamily:M.font.body,fontSize:20,lineHeight:30,minHeight:120,padding:20,color:M.color.ink,textAlignVertical:'top'},hold:{gap:24,paddingVertical:24},field:{gap:16,borderTopWidth:1,borderColor:M.color.border,paddingTop:16},fieldTop:{flexDirection:'row',gap:16,alignItems:'center'},fieldMark:{width:70},placeSlot:{width:'48%',flexGrow:1,minWidth:0},place:{minHeight:120,padding:12,gap:12,borderTopWidth:2,borderColor:M.color.warmInk,backgroundColor:M.color.paper},placeTitle:{fontFamily:M.font.display,fontSize:23,lineHeight:28,color:M.color.ink},placedPull:{fontFamily:M.font.body,fontSize:14,lineHeight:20,color:M.color.ink},now:{borderTopWidth:2,borderColor:M.color.warmInk},pull:{fontFamily:M.font.body,fontSize:16,lineHeight:24,color:M.color.ink},activePull:{fontFamily:M.font.display,fontSize:24,lineHeight:30},openRow:{gap:8,borderLeftWidth:1,borderColor:M.color.warmInk,paddingLeft:16},lines:{gap:12},receiptSpread:{gap:24,paddingVertical:24,borderTopWidth:1,borderColor:M.color.border},receiptSide:{gap:12},offerSection:{gap:24,paddingVertical:32,borderTopWidth:2,borderColor:M.color.warmInk},offer:{flexGrow:1,flexBasis:280,minWidth:0,gap:16,padding:20,backgroundColor:M.color.paper},offerTitle:{fontFamily:M.font.display,fontSize:36,lineHeight:42,color:M.color.ink},mirrorGroup:{gap:16,paddingVertical:16},statement:{gap:8,borderTopWidth:1,borderColor:M.color.border,paddingTop:16},empty:{gap:16},
});

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Action, Body, Eyebrow, PageTransition } from '../inner-rep/v2/Foundation';
import { MIRAR as M } from '../../design-system/native';
import { WindowStudy } from './WindowStudy';
import { SectionTitle, X } from './ExperienceKit';

/** Supporting planes describe an operation. The canonical mark stays untouched. */
export function ReflectiveFrame({ left, right, open = false, separate = false, caption }: { left: React.ReactNode; right: React.ReactNode; open?: boolean; separate?: boolean; caption?: string }) {
 const { width } = useWindowDimensions();
 return <View style={S.frame}>
  <View style={[S.planes, { flexDirection: width < 768 ? 'column' : 'row', gap:separate?24:12 }]}>
   <View style={[S.plane, S.fixed]}>{left}</View>
   <View style={{ width: width < 768 ? '100%' : 120, height: width < 768 ? 100 : 180 }}><WindowStudy quiet height={width < 768 ? 100 : 180} separate={separate||open} perspective={open ? 'open' : 'original'} /></View>
   <View style={[S.plane, S.moving]}>{right}</View>
  </View>{caption && <Body style={[X.small,{color:M.color.ink}]}>{caption}</Body>}
 </View>;
}

const scenes = [
 { name: 'Direction', seed: 'An old yes. A current priority.', title: 'One afternoon. Two invitations.', a: 'Something you once wanted', b: 'Something that matters now', possibility: 'The two can be compared without deciding immediately.', open: 'Which invitation belongs in this afternoon is still open.' },
 { name: 'Energy', seed: 'A full day. A little room.', title: 'A day with more asks than space.', a: 'Several things are waiting', b: 'There is limited time left', possibility: 'Available room and waiting demands can stay distinct.', open: 'The scene says nothing about how much energy a person has.' },
 { name: 'Focus', seed: 'A message. An unfinished page.', title: 'Two things asking for one moment.', a: 'A new message arrived', b: 'A page is still unfinished', possibility: 'Attention can go to one thing without declaring the other unimportant.', open: 'Neither demand has to be ranked as the better one.' },
 { name: 'Relationships', seed: 'Their request. Your room.', title: 'An invitation is not an obligation.', a: 'Someone asked for help', b: 'The afternoon already has plans', possibility: 'A request and the room to meet it are two different things.', open: 'We do not know what either person feels or needs.' },
 { name: 'Growth', seed: 'A first reading. Another angle.', title: 'A quiet moment in a conversation.', a: 'Someone said very little', b: 'Their reason was not given', possibility: 'Several readings can sit beside the same scene.', open: 'No explanation is established by the silence.' },
 { name: 'Action', seed: 'A possible step. A genuine no.', title: 'An idea does not have to become a task.', a: 'One possible step is visible', b: 'Leaving it alone is also available', possibility: 'A chosen intention differs from an offered suggestion.', open: 'No commitment has been made in this fictional scene.' },
] as const;

export function CapacityScenes() {
 const [index, setIndex] = useState(0); const [angle, setAngle] = useState<'scene' | 'possibility' | 'open'>('scene');
 const { width } = useWindowDimensions(); const scene = scenes[index];
 return <View style={{ gap: 24 }}>
  <View style={S.intro}><Eyebrow>Six capacities · everyday relevance</Eyebrow><SectionTitle>Life rarely arrives in neat categories.</SectionTitle><Body>Choose a window into an ordinary moment.</Body></View>
  <View style={[S.capacitySpread, { flexDirection: width >= 1024 ? 'row' : 'column' }]}>
   <View role="group" accessibilityLabel="Everyday capacity scenes" style={S.capacityIndex}>{scenes.map((s, i) => <Pressable key={s.name} accessibilityRole="button" aria-pressed={i === index} onPress={() => { setIndex(i); setAngle('scene'); }} style={({ pressed }) => [S.capacity, (i === index || pressed) && S.capacitySelected]}><Text style={S.capacityName}>{s.name}</Text><Body style={S.seed}>{s.seed}</Body></Pressable>)}</View>
   <View style={S.capacityStage}><Eyebrow>Fictional scene · not an exercise catalogue</Eyebrow><PageTransition key={index}><View style={{ gap: 20 }}><Text style={S.sceneTitle}>{scene.title}</Text><ReflectiveFrame open={angle === 'open'} left={<><Eyebrow>One part</Eyebrow><Text style={S.sceneQuote}>{scene.a}</Text></>} right={<><Eyebrow>Alongside it</Eyebrow><Text style={S.sceneQuote}>{scene.b}</Text></>} />
   <View role="group" accessibilityLabel="Perspectives on the authored scene" style={X.row}>{([['scene', 'The scene'], ['possibility', 'A closer look'], ['open', 'Leave room']] as const).map(([a, label]) => <Action key={a} secondary selected={angle === a} onPress={() => setAngle(a)}>{label}</Action>)}</View><Body accessibilityLiveRegion="polite">{angle === 'possibility' ? scene.possibility : angle === 'open' ? scene.open : 'Two parts of a scene, held alongside each other.'}</Body></View></PageTransition></View>
  </View>
 </View>;
}

/** Read-only authored study: controls select explanatory layers, never feedback. */
export function MirrorStudy() {
 const [layer, setLayer] = useState<'said' | 'count' | 'reading' | 'open' | 'correction'>('said');
 const { width } = useWindowDimensions();
 const layers = { said: ['Selected response', '“Work” was selected in five fictional responses.', 'An offered option, not a description of a person.'], count: ['What was counted', 'Five fictional responses included work.', 'A count does not establish why work came up.'], reading: ['Possible reading', 'Something connected to work may be worth another look.', 'An authored example of tentative wording, not an engine result or a reading of you.'], open: ['Not established', 'Why work came up remains unknown.', 'Missing context stays missing. It does not become a story.'], correction: ['Authored correction example', '“Something important is missing.”', 'A fictional Partly correction: the reading would not be repeated unchanged. No feedback is being collected here.'] } as const;
 const current = layers[layer];
 return <View style={[S.study, { flexDirection: width >= 768 ? 'row' : 'column' }]}>
  <View style={S.studyIndex}><Eyebrow>Fictional study · no live feedback</Eyebrow><Text style={S.studyTitle}>A Mirror with edges.</Text><Body>Response, count, reading and uncertainty stay distinct.</Body><View role="group" accessibilityLabel="Read-only study layers" style={{ gap: 8 }}>{([['said', 'What was selected'], ['count', 'What was counted'], ['reading', 'A possible reading'], ['open', 'What is unknown'], ['correction', 'A correction']] as const).map(([value, label]) => <Action key={value} secondary selected={layer === value} onPress={() => setLayer(value)}>{label}</Action>)}</View></View>
  <View style={S.studyPlane}><View style={{ height: 180 }}><WindowStudy quiet height={180} separate={layer === 'open' || layer === 'correction'} perspective={layer === 'open' ? 'open' : 'other'} /></View><Eyebrow>{current[0]}</Eyebrow><Text accessibilityLiveRegion="polite" style={S.studyQuote}>{current[1]}</Text><Body>{current[2]}</Body><View style={S.annotation}><Body style={X.small}>Illustrated boundaries. These are not your responses or history.</Body></View></View>
 </View>;
}

const S = StyleSheet.create({
 frame: { gap: 16 }, planes: { gap: 12, alignItems: 'stretch' }, plane: { flex: 1, minWidth: 0, padding: 16, gap: 12 }, fixed: { borderLeftWidth: 2, borderColor: M.color.warmInk, backgroundColor: M.color.paper }, moving: { borderTopWidth: 1, borderColor: M.color.border, backgroundColor: M.color.raised },
 intro: { gap: 12, maxWidth: 660 }, capacitySpread: { gap: 24 }, capacityIndex: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, capacity: { width: '48%', minHeight: 108, padding: 16, borderTopWidth: 1, borderColor: M.color.border, gap: 8, justifyContent: 'center' }, capacitySelected: { backgroundColor: M.color.selected, borderColor: M.color.warmInk }, capacityName: { fontFamily: M.font.display, fontSize: 30, lineHeight: 36, color: M.color.ink }, seed: { fontSize: 13, lineHeight: 20, color:M.color.ink }, capacityStage: { flex: 1.3, padding: 24, backgroundColor: M.color.paper, gap: 20 }, sceneTitle: { fontFamily: M.font.display, fontSize: 36, lineHeight: 42, color: M.color.ink }, sceneQuote: { fontFamily: M.font.display, fontSize: 26, lineHeight: 32, color: M.color.ink },
 study: { gap: 24, paddingVertical: 32, borderTopWidth: 2, borderColor: M.color.warmInk }, studyIndex: { flex: 1, gap: 20 }, studyTitle: { fontFamily: M.font.display, fontSize: 48, lineHeight: 52, color: M.color.ink }, studyPlane: { flex: 1.2, gap: 20, padding: 24, backgroundColor: M.color.paper, borderLeftWidth: 1, borderColor: M.color.warmInk }, studyQuote: { fontFamily: M.font.display, fontSize: 34, lineHeight: 40, color: M.color.ink }, annotation: { borderTopWidth: 1, borderColor: M.color.border, paddingTop: 16 },
});

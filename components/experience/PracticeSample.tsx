import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Action, Body, Eyebrow, useReducedMotion } from '../inner-rep/v2/Foundation';
import { MIRAR as M } from '../../design-system/native';
import { WindowStudy } from './WindowStudy';
import { X, SectionTitle } from './ExperienceKit';
// Authored public demonstration, NOT an engine template, evidence, or personal history.
// No self-report, raw words, network, storage, analytics or runtime callback.
export const SAMPLE_FACT = 'The message has no reply yet.';
export const SAMPLE_READING = 'They don’t want to reply to me.';
export const SAMPLE_VIEWS = { original: { label: 'Keep the first reading', text: SAMPLE_READING, close: 'You kept the first reading in view, without turning it into a known fact.' }, other: { label: 'Consider another possibility', text: 'They may not have had a chance to reply.', close: 'You considered another possibility. Nothing in the scene established which reason was true.' }, open: { label: 'Leave the reason unknown', text: 'The reason is not known.', close: 'You left the reason open while keeping the observable part in view.' } } as const;
type Start = 'fact' | 'meaning' | 'unknown';
type Reading = keyof typeof SAMPLE_VIEWS;
const openings: Record<Start, {
    title: string;
    copy: string;
    result: string;
}> = { fact: { title: 'Keep what’s known in view.', copy: 'No reply yet is observable. The reason for it is a separate question.', result: 'You held the observation steady.' }, meaning: { title: 'A reading is not an observation.', copy: '“They don’t want to” supplies a reason the scene hasn’t given us. Keep it as a possible reading, not a fact.', result: 'You separated an observation from a possible meaning.' }, unknown: { title: 'We can separate what’s known from what isn’t.', copy: 'There is no reply yet. Why there is no reply remains unknown. You don’t have to settle the missing part.', result: 'You made room for an unanswered part.' } };
function FocusTitle({ children }: {
    children: string;
}) { const ref = useRef<Text>(null); useEffect(() => { if (Platform.OS === 'web') {
    const node = ref.current as unknown as HTMLElement;
    node?.setAttribute('tabindex', '-1');
    node?.focus({ preventScroll: true });
} }, [children]); return <Text ref={ref} accessibilityRole="header" aria-level={2} style={S.title}>{children}</Text>; }
export function PracticeSample({ onEnter }: {
    onEnter: () => void;
}) {
    const [start, setStart] = useState<Start | null>(null);
    const [reading, setReading] = useState<Reading | null>(null);
    const [left, setLeft] = useState(false);
    const { width } = useWindowDimensions();
    const reduced = useReducedMotion();
    const offset = useRef(new Animated.Value(0)).current;
    useEffect(() => { const next = reading === 'other' ? 12 : reading === 'open' ? -12 : 0; if (reduced) {
        offset.setValue(next);
        return;
    } const animation = Animated.timing(offset, { toValue: next, duration: M.motion.sheet, useNativeDriver: Platform.OS !== 'web' }); animation.start(); return () => animation.stop(); }, [reading, reduced, offset]);
    const reset = () => { setStart(null); setReading(null); setLeft(false); };
    return <View nativeID="practice-sample" style={S.sample}>
 <Eyebrow>Fictional scene · nothing saved</Eyebrow>
 {left ? <><FocusTitle>The exercise can stay unfinished.</FocusTitle><Body>You don’t need to make a choice or draw a conclusion.</Body><Action secondary onPress={reset}>Return to the exercise</Action></> : !start ? <>
 <FocusTitle>What is observable?</FocusTitle>
 <View style={S.scene}><View style={{ flex: 1, gap: 8 }}><Body style={{ color: M.color.ink }}>You sent a message. No reply has arrived.</Body></View><View style={{ width: 64 }}><WindowStudy quiet height={96}/></View></View>
 <View role="group" accessibilityLabel="Distinguish an observation from a reading" style={S.choices}>
 <Tile onPress={() => setStart('fact')}>{SAMPLE_FACT}</Tile><Tile onPress={() => setStart('meaning')}>{SAMPLE_READING}</Tile><Tile onPress={() => setStart('unknown')}>I don’t know</Tile>
 </View></> : <> <FocusTitle>{openings[start].title}</FocusTitle><Body>{openings[start].copy}</Body>
 <View role="group" nativeID="practice-window" style={[S.window, { flexDirection: width >= 1024 ? 'row' : 'column' }]} accessibilityLabel="Observation and possible meaning stay separate">
 <View style={S.fixed}><Eyebrow>What is observable</Eyebrow><Text style={S.fact}>{SAMPLE_FACT}</Text></View>
 <View style={{ width: width >= 1024 ? 140 : '100%', height: width >= 1024 ? 200 : 130 }}><WindowStudy separate={reading === 'other' || reading === 'open'} quiet perspective={reading ?? 'original'} height={width >= 1024 ? 200 : 130}/></View>
 <Animated.View style={[S.possible, { transform: [{ translateX: offset }] }]}><Eyebrow>{reading === 'open' ? 'What remains unknown' : 'A possible reading · not a fact'}</Eyebrow><Text accessibilityLiveRegion="polite" style={S.reading}>{SAMPLE_VIEWS[reading ?? 'original'].text}</Text></Animated.View>
 </View>
 <Body style={X.small}>Change what the window holds. The observation stays put.</Body>
 <View role="group" accessibilityLabel="Choose a view of the fictional scene" style={S.choices}>{(Object.keys(SAMPLE_VIEWS) as Reading[]).map(k => <Tile key={k} selected={reading === k} onPress={() => setReading(k)}>{SAMPLE_VIEWS[k].label}</Tile>)}</View>
 {reading && <View style={S.completed} accessibilityLiveRegion="polite"><SectionTitle>{openings[start].result}</SectionTitle><Body>{SAMPLE_VIEWS[reading].close}</Body><Body style={X.small}>You kept an observation separate from a possible meaning. This was not an assessment of you.</Body><View style={X.row}><Action onPress={onEnter}>Continue with Mirar</Action><Action secondary onPress={reset}>Try the exercise again</Action></View></View>}
 </>}
 {!left && <Action secondary onPress={() => setLeft(true)}>Leave the exercise</Action>}
 <Body style={S.privacy}>An authored perspective exercise. No visitor profile, inferred insight or remembered answer.</Body>
 </View>;
}
function Tile({ children, onPress, selected }: {
    children: string;
    onPress: () => void;
    selected?: boolean;
}) { return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} aria-pressed={selected} style={({ pressed }) => [S.tile, (selected || pressed) && S.selected]}><Text style={S.tileText}>{children}</Text>{selected && <Text style={S.selectedText}>In view</Text>}</Pressable>; }
const S = StyleSheet.create({ sample: { gap: 12, padding: 16, backgroundColor: M.color.paper, borderTopWidth: 2, borderTopColor: M.color.warmInk }, title: { fontFamily: M.font.display, fontSize: 32, lineHeight: 36, color: M.color.ink }, scene: { flexDirection: 'row', alignItems: 'center', gap: 16 }, choices: { gap: 8 }, tile: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: M.color.border, backgroundColor: M.color.raised, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, tileText: { fontFamily: M.font.body, fontSize: 16, lineHeight: 24, color: M.color.ink, flexShrink: 1 }, selected: { backgroundColor: M.color.selected, borderColor: M.color.warmInk }, selectedText: { fontFamily: M.font.body, fontSize: 12, lineHeight: 18, color: M.color.warmInk }, window: { gap: 16 }, fixed: { flex: 1, padding: 16, borderLeftWidth: 2, borderLeftColor: M.color.warmInk, gap: 12 }, possible: { flex: 1, padding: 16, borderLeftWidth: 1, borderLeftColor: M.color.border, gap: 12 }, fact: { fontFamily: M.font.display, fontSize: 28, lineHeight: 34, color: M.color.ink }, reading: { fontFamily: M.font.display, fontSize: 28, lineHeight: 34, color: M.color.ink }, completed: { gap: 16, borderLeftWidth: 2, borderLeftColor: M.color.warmInk, paddingLeft: 20 }, privacy: { fontSize: 12, lineHeight: 18 } });

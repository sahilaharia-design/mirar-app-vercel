import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MIRAR as M } from '../../../design-system/native';
import type { PAnswer } from '../../../lib/innerRep/pilots/types';
import type { PilotSession } from '../../../lib/innerRep/pilots/session';
import { boardPulls, emptyArrangement, normalizeArrangement, submitArrangement, type Arrangement, type BoardPull } from '../../../lib/innerRep/pilots/board';
import { Action, Body, Eyebrow, PageTransition, Prompt } from '../../inner-rep/v2/Foundation';
import { StepView } from '../../pilots/PilotViews';
import { ReflectiveFrame } from '../ApertureScenes';
import { WindowStudy } from '../WindowStudy';
import { X } from '../ExperienceKit';

/**
 * Aperture presentation of the REAL pilot sessions. Nothing here decides sequencing or validates a rule:
 *   • Look Again: the person's own camera sentence (component memory only) and the reading they named sit in Codex's
 *     ReflectiveFrame, the canonical window between a fixed plane and a revisable plane.
 *   • Attend: a spatial board of the person's own pulls, placed in view / at the edge / left open / set down. The board is only
 *     a way of answering the real place:/when: steps; the runtime validates every placement (lib/innerRep/pilots/board.ts).
 * Typed words are never stored; only a character count reaches the session.
 */
type Echo = { observation?: string; reading?: string };
const PLACES = [['attend_now', 'In view'], ['set_aside', 'At the edge'], ['leave_open', 'Left open'], ['let_be', 'Set down'], ['unknown', 'Not sure']] as const;
const WHEN = [['later_today', 'Later today'], ['another_day', 'Another day'], ['no_time_set', 'No time set']] as const;

export function LiveRunner({ session, title, onAnswer, onChanged, onBack, onLeave, onFinish, onSafety }: {
  session: PilotSession; title: string; onAnswer: (a: PAnswer) => Promise<void>; onChanged: () => Promise<void>; onBack: () => Promise<void>; onLeave: () => void; onFinish: () => void; onSafety: () => void;
}) {
  const [echo, setEcho] = useState<Echo>({});
  const step = session.step();
  const fired = useRef(false); useEffect(() => { if (!step && !fired.current) { fired.current = true; onFinish(); } }, [step, onFinish]);
  if (!step) return <Body>Saving what you chose…</Body>;
  const snap = session.snapshot();
  const wroteWords = snap.answers.some((a) => (a.stepId === 'observation' || a.stepId === 'observation_retry') && a.kind === 'words');
  const lookAgain = session.pilot === 'look_again';
  const showFrame = lookAgain && step.id !== 'situation' && step.id !== 'observation' && (echo.observation || echo.reading);
  const echoLost = lookAgain && wroteWords && !echo.observation && step.id !== 'situation' && step.id !== 'observation';
  const board = !lookAgain ? boardPulls(session) : null;
  const go = async (a: PAnswer) => {
    if (step.type === 'choice' && step.id === 'interpretation' && a.kind === 'option') setEcho((e) => ({ ...e, reading: step.options.find((o) => o.id === (a as { optionId: string }).optionId)?.label }));
    await onAnswer(a);
  };
  const canBack = 'allowBack' in step && step.allowBack && session.answerCount > 0;
  return <PageTransition>
    <View style={S.bar}><Eyebrow>{title} · optional extra practice · staging</Eyebrow><View style={X.row}>
      {canBack && <Action secondary onPress={() => { if (step.id === 'observation' || step.id === 'observation_retry') setEcho((e) => ({ ...e, observation: undefined })); void onBack(); }}>Back</Action>}
      <Action secondary onPress={onLeave}>Leave</Action></View></View>
    {showFrame && <View style={S.frame}><ReflectiveFrame open={step.id === 'alternatives' || step.id === 'reweigh'} separate={step.id === 'alternatives'}
      left={<><Eyebrow>What a camera would record</Eyebrow><Text style={S.quote}>{echo.observation ?? 'No observation was written.'}</Text></>}
      right={<><Eyebrow>{echo.reading ? 'The reading you named · not a fact' : 'No reading named yet'}</Eyebrow><Text accessibilityLiveRegion="polite" style={S.quote}>{echo.reading ?? 'Nothing is assumed.'}</Text></>}
      caption="These stay apart. Writing one down does not decide the other." /></View>}
    {echoLost && !showFrame && <Body style={X.small}>Your earlier words are not kept after a reload. They stay on screen only.</Body>}
    {board
      ? <Board key={board.map((b) => b.id).join()} pulls={board} onSubmit={(arr) => submitArrangement(session, arr)} onDone={() => void onChanged()} />
      : <StepView key={step.id} step={step} onAnswer={go} onWords={(text) => setEcho((e) => ({ ...e, observation: text }))} onSafety={() => { setEcho({}); onSafety(); }} />}
  </PageTransition>;
}

function Board({ pulls, onSubmit, onDone }: { pulls: BoardPull[]; onSubmit: (a: Arrangement) => { ok: true } | { ok: false; error: string }; onDone: () => void }) {
  const [arr, setArr] = useState<Arrangement>(() => emptyArrangement(pulls)); const [note, setNote] = useState(''); const [err, setErr] = useState('');
  const label = (id: string) => pulls.find((p) => p.id === id)?.label ?? id;
  const names = (d: string) => pulls.filter((p) => arr[p.id].disposition === d).map((p) => p.label);
  const place = (pull: string, disposition: Arrangement[string]['disposition']) => {
    const r = normalizeArrangement(arr, pull, { disposition, when: arr[pull].when }); setArr(r.arrangement); setErr('');
    setNote(r.moved ? `“${label(r.moved)}” moved to left open, because only one thing can be in view. You can place it anywhere.` : '');
  };
  const when = (pull: string, w: (typeof WHEN)[number][0]) => setArr(normalizeArrangement(arr, pull, { disposition: 'set_aside', when: w }).arrangement);
  const close = () => { const res = onSubmit(arr); if (!res.ok) { setErr(res.error); return; } onDone(); };
  const open = () => { const all = emptyArrangement(pulls); setArr(all); const res = onSubmit(all); if (res.ok) onDone(); };
  const col = (title: string, d: string, empty: string) => <View style={[S.col, d === 'attend_now' && S.colView]}><Eyebrow>{title}</Eyebrow><Text accessibilityLiveRegion="polite" style={d === 'attend_now' ? S.quote : S.edgeQuote}>{names(d).join(' · ') || empty}</Text></View>;
  return <View style={{ gap: 20 }}>
    <Prompt display style={{ marginBottom: 0 }}>Where does each one go?</Prompt>
    <Body style={X.lede}>Give each thing one place. One can be in view. Setting something down, or leaving it open, are equal choices.</Body>
    <View nativeID="attention-field" style={S.field}>
      <View style={S.fieldTop}><View style={S.windowCell}><WindowStudy quiet height={80} separate={names('attend_now').length === 0} /></View>{col('In view · not a commitment', 'attend_now', 'Nothing singled out yet.')}</View>
      <View style={S.fieldRow}>{col('At the edge', 'set_aside', 'Nothing set aside.')}{col('Left open', 'leave_open', 'Nothing left open.')}{col('Set down · nothing from me', 'let_be', 'Nothing set down.')}</View>
    </View>
    {!!note && <Body accessibilityLiveRegion="polite" style={X.small}>{note}</Body>}
    <View role="group" accessibilityLabel="Place each thing" style={{ gap: 20 }}>{pulls.map((p) => <View key={p.id} style={S.demand}>
      <Text style={S.demandName}>{p.label}</Text>
      <View role="group" accessibilityLabel={`Place: ${p.label}`} style={X.row}>{PLACES.map(([d, text]) => <Pressable key={d} accessibilityRole="button" accessibilityLabel={`${text}: ${p.label}`} aria-pressed={arr[p.id].disposition === d} onPress={() => place(p.id, d)} style={({ pressed }) => [S.placement, (pressed || arr[p.id].disposition === d) && S.placementOn]}><Text style={S.placementText}>{text}</Text></Pressable>)}</View>
      {arr[p.id].disposition === 'set_aside' && <View role="group" accessibilityLabel={`When might ${p.label} come back? Mirar will not remind you`} style={{ gap: 8 }}><Body style={X.small}>When might it come back to you? Mirar will not remind you.</Body><View style={X.row}>{WHEN.map(([w, text]) => <Pressable key={w} accessibilityRole="button" aria-pressed={arr[p.id].when === w} onPress={() => when(p.id, w)} style={({ pressed }) => [S.placement, (pressed || arr[p.id].when === w) && S.placementOn]}><Text style={S.placementText}>{text}</Text></Pressable>)}</View></View>}
    </View>)}</View>
    {!!err && <Body style={{ color: M.color.error }}>{err}</Body>}
    <View style={X.row}><Action onPress={close}>Close this arrangement</Action><Action secondary onPress={open}>Leave everything open</Action></View>
  </View>;
}

const S = StyleSheet.create({
  bar: { gap: M.space.md, marginBottom: M.space.xl }, frame: { marginBottom: M.space.xl },
  quote: { fontFamily: M.font.display, fontSize: 30, lineHeight: 36, color: M.color.ink }, edgeQuote: { fontFamily: M.font.display, fontSize: 24, lineHeight: 30, color: M.color.ink },
  field: { gap: 16, backgroundColor: M.color.paper, padding: 24 }, fieldTop: { flexDirection: 'row', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }, windowCell: { width: 80, height: 80 },
  fieldRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' }, col: { flexGrow: 1, flexBasis: 200, gap: 8, padding: 16, backgroundColor: M.color.surface }, colView: { flex: 1, borderLeftWidth: 2, borderColor: M.color.warmInk, backgroundColor: M.color.paper },
  demand: { gap: 12, borderTopWidth: 1, borderColor: M.color.border, paddingTop: 16 }, demandName: { fontFamily: M.font.display, fontSize: 26, lineHeight: 32, color: M.color.ink },
  placement: { minHeight: 48, minWidth: 44, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: M.color.border, justifyContent: 'center', alignItems: 'center' }, placementOn: { backgroundColor: M.color.selected, borderColor: M.color.warmInk }, placementText: { fontFamily: M.font.body, fontSize: 14, lineHeight: 22, color: M.color.ink },
});

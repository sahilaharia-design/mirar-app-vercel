import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { MIRAR as M } from '../../design-system/native';
import { containsCrisisLanguage } from '../../lib/innerRep/safety';
import type { PAnswer, PStep, RepValue } from '../../lib/innerRep/pilots/types';
import type { PilotSession } from '../../lib/innerRep/pilots/session';
import type { PilotMirror, PilotReceipt } from '../../lib/innerRep/pilots/read';
import { Action, Body, Eyebrow, PageTransition, Prompt, SelectionSurface } from '../inner-rep/v2/Foundation';

// Thin renderer for the pilot step contract. It decides nothing: the session emits the step, this renders it and returns a
// PAnswer. Typed words exist only in this component's memory (a ref and local state), are passed only to the existing crisis-language
// check, and are cleared on continue, skip, leave, back and unmount. Only a character count reaches the session.

type Echo = { observation?: string; reading?: string };

export function PilotRunner({ session, title, onAnswer, onBack, onLeave, onFinish, onSafety }: {
  session: PilotSession; title: string;
  onAnswer: (a: PAnswer) => Promise<void>; onBack: () => Promise<void>; onLeave: () => void; onFinish: () => void; onSafety: () => void;
}) {
  const [echo, setEcho] = useState<Echo>({});
  const step = session.step();
  if (!step) { return <Done onFinish={onFinish} />; }
  const answeredWords = session.snapshot().answers.some((a) => (a.stepId === 'observation' || a.stepId === 'observation_retry') && a.kind === 'words');
  const needsEcho = session.pilot === 'look_again' && step.id !== 'situation' && step.id !== 'observation';
  const echoLost = needsEcho && answeredWords && !echo.observation;
  const go = async (a: PAnswer) => {
    if (step.type === 'choice' && step.id === 'interpretation' && a.kind === 'option') setEcho((e) => ({ ...e, reading: step.options.find((o) => o.id === (a as { optionId: string }).optionId)?.label }));
    await onAnswer(a);
  };
  const canBack = 'allowBack' in step && step.allowBack && session.answerCount > 0;
  return <PageTransition>
    <View style={S.bar}><Eyebrow>{title} · optional extra practice · preview</Eyebrow>
      <View style={S.barActions}>{canBack && <Action secondary onPress={() => { setEcho((e) => (step.id === 'observation' || step.id === 'observation_retry' ? { ...e, observation: undefined } : e)); void onBack(); }}>Back</Action>}<Action secondary onPress={onLeave}>Leave</Action></View></View>
    {needsEcho && (echo.observation || echo.reading) && <View style={S.split} accessibilityLabel="Your observation and your reading, kept apart">
      {echo.observation && <View style={S.col}><Eyebrow>What a camera would record</Eyebrow><Body style={S.quote}>{echo.observation}</Body></View>}
      {echo.reading && <View style={[S.col, S.colAlt]}><Eyebrow>The reading you named</Eyebrow><Body style={S.quote}>{echo.reading}</Body></View>}
    </View>}
    {echoLost && <Body style={S.note}>Your earlier words are not kept after a reload. They stay on screen only.</Body>}
    <StepView key={step.id} step={step} onAnswer={go} onWords={(text, retry) => { setEcho((e) => ({ ...e, observation: text })); void retry; }} onSafety={() => { setEcho({}); onSafety(); }} />
  </PageTransition>;
}

function StepView({ step, onAnswer, onWords, onSafety }: { step: PStep; onAnswer: (a: PAnswer) => Promise<void>; onWords: (text: string, retry: boolean) => void; onSafety: () => void }) {
  const [sel, setSel] = useState<string[]>([]); const [text, setText] = useState(''); const live = useRef('');
  const unknown = (label = 'I don’t know') => <View style={S.gap}><SelectionSurface onPress={() => void onAnswer({ stepId: step.id, kind: 'unknown' })}>{label}</SelectionSurface></View>;
  if (step.type === 'choice') return <View>
    <Prompt compact>{step.prompt}</Prompt>
    <View role="group" accessibilityLabel={step.prompt}>{step.options.map((o) => <View key={o.id}>
      <SelectionSurface disabled={!!o.disabled} onPress={() => void onAnswer({ stepId: step.id, kind: 'option', optionId: o.id })}>{o.label}</SelectionSurface>
      {!!o.disabled && <Body style={S.reason}>{o.disabled}</Body>}</View>)}</View>
    {step.allowUnknown && unknown()}
  </View>;
  if (step.type === 'multi') return <View>
    <Prompt compact>{step.prompt}</Prompt>
    <View role="group" accessibilityLabel={step.prompt}>{step.options.map((o) => <SelectionSurface key={o.id} selected={sel.includes(o.id)} disabled={!sel.includes(o.id) && sel.length >= step.max} onPress={() => setSel((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))}>{o.label}</SelectionSurface>)}</View>
    <Body style={S.hint}>{sel.length ? `${sel.length} chosen` : 'Choose any, or use the option below'}</Body>
    <View style={S.actions}><Action disabled={!sel.length} onPress={() => void onAnswer({ stepId: step.id, kind: 'options', optionIds: sel })}>Continue</Action><Action secondary onPress={() => void onAnswer({ stepId: step.id, kind: 'options', optionIds: [] })}>{step.noneLabel}</Action></View>
    {step.allowUnknown && unknown('Hard to tell')}
  </View>;
  if (step.type === 'words') {
    const change = (v: string) => { live.current = v; setText(v); };
    const clear = () => { live.current = ''; setText(''); };
    const next = () => { const t = live.current.trim(); if (containsCrisisLanguage(t)) { clear(); onSafety(); return; } onWords(t, step.id === 'observation_retry'); clear(); void onAnswer({ stepId: step.id, kind: 'words', chars: Math.min(Math.max(t.length, 1), step.maxChars) }); };
    return <View>
      <Prompt compact>{step.prompt}</Prompt>
      <TextInput multiline value={text} onChangeText={change} maxLength={step.maxChars} autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" textContentType="none" accessibilityLabel={step.prompt} style={S.input} />
      <Body style={S.hint}>Stays on this screen only. Not saved, not sent anywhere.</Body>
      <View style={S.actions}><Action disabled={!text.trim()} onPress={next}>Continue</Action><Action secondary onPress={() => { clear(); void onAnswer({ stepId: step.id, kind: 'skip' }); }}>{step.id === 'observation_retry' ? 'Keep it as it is' : 'Skip'}</Action></View>
    </View>;
  }
  return <View style={S.hold}><Prompt compact>{step.prompt}</Prompt><Body>Stay with it for as long as you like. Nothing is counting.</Body><View style={S.actions}><Action onPress={() => void onAnswer({ stepId: step.id, kind: 'hold_end' })}>{step.endLabel}</Action></View></View>;
}

function Done({ onFinish }: { onFinish: () => void }) {
  const fired = useRef(false); React.useEffect(() => { if (!fired.current) { fired.current = true; onFinish(); } }, [onFinish]);
  return <Body>Saving what you chose…</Body>;
}

const LIST = ({ items }: { items: string[] }) => <View style={S.list}>{items.map((x, i) => <Body key={i} style={S.item}>{x}</Body>)}</View>;
export function ValuePanel({ receipt }: { receipt: PilotReceipt }) {
  const v: RepValue = receipt.value;
  return <PageTransition>
    <Eyebrow>{receipt.title} · {receipt.status === 'left' ? 'You left partway' : 'Done'} · {receipt.date}</Eyebrow>
    <Prompt compact>{receipt.status === 'left' ? 'Here is what you did before leaving.' : 'Here is what you did.'}</Prompt>
    <View style={S.section}><Eyebrow>What you practised</Eyebrow><LIST items={v.practised} /></View>
    <View style={S.section}><Eyebrow>Useful before you go</Eyebrow><Body style={S.item}>{v.usefulNow}</Body></View>
    <View style={S.section}><Eyebrow>What this established, in your own choices</Eyebrow><LIST items={v.established.length ? v.established : ['Nothing yet. You left before choosing.']} /></View>
    <View style={S.section}><Eyebrow>What remains unknown</Eyebrow><LIST items={v.unknown} /></View>
    <View style={S.section}><Eyebrow>Kept on this device</Eyebrow><LIST items={v.carriedForward} /><Eyebrow>Not kept</Eyebrow><LIST items={v.notCarried} /></View>
  </PageTransition>;
}

export function MirrorPanel({ mirror }: { mirror: PilotMirror }) {
  return <View style={S.section}>
    <Eyebrow>Pilot Mirror · {mirror.state}</Eyebrow>
    {mirror.state === 'empty' && <Body>Nothing practised yet. There is nothing to show, and nothing is assumed.</Body>}
    {mirror.statements.map((s) => <View key={s.id} style={S.stmt}><Eyebrow>{s.section} · {s.source === 'user_said' ? 'you said' : s.source === 'observed' ? 'counted from your choices' : 'not known'}{s.date ? ` · ${s.date}` : ''}</Eyebrow><Body style={S.item}>{s.text}</Body><Body style={S.hint}>From {s.trace.pilotRecordIds.length ? `${s.trace.pilotRecordIds.length} stored ${s.trace.pilotRecordIds.length === 1 ? 'record' : 'records'}` : 'no stored records'} · exact</Body></View>)}
    <Body style={S.hint}>Kept on this device for {mirror.retention.days} days (up to {mirror.retention.maxRecords} records). Not synced.</Body>
    <Eyebrow>Not active in this preview</Eyebrow><LIST items={mirror.inactive} />
  </View>;
}

const S = StyleSheet.create({
  bar: { gap: M.space.md, marginBottom: M.space.xl }, barActions: { flexDirection: 'row', gap: M.space.md, flexWrap: 'wrap' },
  split: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.base, marginBottom: M.space.xl }, col: { flexGrow: 1, flexBasis: 240, borderLeftWidth: 2, borderLeftColor: M.color.warmInk, paddingLeft: M.space.base, gap: M.space.sm }, colAlt: { borderLeftColor: M.color.border },
  quote: { fontFamily: M.font.display, fontSize: 24, lineHeight: 30, color: M.color.ink }, note: { marginBottom: M.space.lg, fontSize: 14 },
  gap: { marginTop: M.space.lg }, reason: { fontSize: 14, lineHeight: 22, paddingHorizontal: M.space.base, paddingBottom: M.space.md }, hint: { marginTop: M.space.md, fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.md, marginTop: M.space.xl },
  input: { fontFamily: M.font.body, fontSize: 18, lineHeight: 28, minHeight: 112, padding: M.space.base, backgroundColor: M.color.paper, color: M.color.ink, borderBottomWidth: 1, borderColor: M.color.warmInk, borderRadius: M.radius.control, textAlignVertical: 'top' },
  hold: { paddingVertical: M.space.large, gap: M.space.lg }, section: { marginTop: M.space.xl, gap: M.space.md }, list: { gap: M.space.sm }, item: { color: M.color.ink, fontSize: 17, lineHeight: 26 }, stmt: { borderTopWidth: 1, borderTopColor: M.color.border, paddingTop: M.space.md, gap: M.space.xs },
});

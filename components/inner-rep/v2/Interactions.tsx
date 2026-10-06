import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import type { Step, StepAnswer } from '../../../lib/innerRep/v2/contracts';
import { DOMAIN_CHIP_LABEL } from '../../../lib/innerRep/v2/contracts';
import { containsCrisisLanguage } from '../../../lib/innerRep/safety';
import { MIRAR as M } from '../../../design-system/native';
import { Action, Body, Prompt, SelectionSurface } from './Foundation';

type Answer = (answer: StepAnswer) => void;
export function ChoiceInteraction({ step, answer }: { step: Extract<Step, { type: 'choice' }>; answer: Answer }) {
 const { width } = useWindowDimensions();
 return <View>
  <Prompt>{step.prompt}</Prompt>
  <View role="group" accessibilityLabel={step.prompt} style={{ flexDirection: step.layout === 'compare' && width >= 768 ? 'row' : 'column', gap: M.space.base }}>
   {step.options.map(option => <SelectionSurface key={option.id} compare={step.layout === 'compare'} onPress={() => answer({ stepId: step.id, kind: 'option', optionId: option.id })}>{option.label}</SelectionSurface>)}
  </View>
  {step.allowUnknown && <View style={styles.unknown}><SelectionSurface onPress={() => answer({ stepId: step.id, kind: 'unknown' })}>I don't know</SelectionSurface></View>}
 </View>;
}
export function WordsInteraction({ step, answer, onSafety }: { step: Extract<Step, { type: 'words' }>; answer: Answer; onSafety: (answer: StepAnswer) => void }) {
 const [text, setText] = useState(''); const liveText = useRef('');
 const change = (value: string) => { liveText.current = value; setText(value); };
 const clear = () => { liveText.current = ''; setText(''); };
 const next = () => {
  // Only the existing safety detector receives text. No callbacks receive it.
  const safety = containsCrisisLanguage(liveText.current); clear();
  if (safety) onSafety({ stepId: step.id, kind: 'skip' });
  else answer({ stepId: step.id, kind: 'words' });
 };
 return <View>
  <Prompt>{step.prompt}</Prompt>
  <TextInput multiline value={text} onChangeText={change} maxLength={step.maxChars} autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" textContentType="none" accessibilityLabel={step.prompt} aria-describedby="words-privacy" style={styles.input} />
  <Body nativeID="words-privacy" style={styles.hint}>Optional. Not saved in this version.</Body>
  <View style={styles.actions}><Action disabled={!text.trim()} onPress={next}>Continue</Action><Action secondary onPress={() => { clear(); answer({ stepId: step.id, kind: 'skip' }); }}>Skip</Action></View>
 </View>;
}
export function ContextInteraction({ step, answer }: { step: Extract<Step, { type: 'domain_chips' }>; answer: Answer }) {
 return <View><Prompt>{step.prompt}</Prompt><View style={styles.wrap}>{step.domains.map(domain => <Action secondary key={domain} onPress={() => answer({ stepId: step.id, kind: 'domain', domain })}>{DOMAIN_CHIP_LABEL[domain]}</Action>)}</View><View style={styles.actions}><Action secondary onPress={() => answer({ stepId: step.id, kind: 'skip' })}>Skip</Action></View></View>;
}
export function CheckInOffer({ step, answer }: { step: Extract<Step, { type: 'yes_no' }>; answer: Answer }) {
 return <View><Prompt>{step.prompt}</Prompt><View style={styles.wrap}>{(['yes','no'] as const).map(kind => <Action secondary key={kind} onPress={() => answer({ stepId: step.id, kind })}>{kind === 'yes' ? 'Yes' : 'No'}</Action>)}</View><View style={styles.actions}><Action secondary onPress={() => answer({ stepId: step.id, kind: 'skip' })}>Skip</Action></View></View>;
}
const timeframeLabels = { today: 'Today', tomorrow: 'Tomorrow', this_week: 'This week', pick_date: 'Choose a date', none: 'No timeframe' };
// Civil-day arithmetic avoids daylight-saving errors; no engine due-date rules here.
export function dateOffset(value: string, now = new Date()): number | null {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
 const [year,month,day] = value.split('-').map(Number); const chosen = new Date(Date.UTC(year,month-1,day));
 if (chosen.getUTCFullYear() !== year || chosen.getUTCMonth() !== month-1 || chosen.getUTCDate() !== day) return null;
 return (chosen.getTime() - Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())) / 86400000;
}
export function TimeframeInteraction({ step, answer }: { step: Extract<Step, { type: 'timeframe' }>; answer: Answer }) {
 const [picking, setPicking] = useState(false); const [date, setDate] = useState(''); const inDays = dateOffset(date);
 return <View><Prompt>{step.prompt}</Prompt><View style={styles.wrap}>{step.options.map(value => <Action secondary selected={value === 'pick_date' && picking ? true : undefined} key={value} onPress={() => value === 'pick_date' ? setPicking(true) : answer({ stepId: step.id, kind: 'timeframe', timeframe: value })}>{timeframeLabels[value]}</Action>)}</View>
  {picking && <View style={styles.date}>
   <Body>Choose a date</Body>
   {Platform.OS === 'web' ? React.createElement('input', { type: 'date', 'aria-label': 'Choose a date', value: date, onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDate(event.target.value), style: { minHeight: 48, maxWidth: '100%', border: '1px solid '+M.color.border, borderRadius: M.radius.control, padding: 12, background: M.color.paper, color: M.color.ink, font: 'inherit' } }) : <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" accessibilityLabel="Choose a date, YYYY-MM-DD" autoCorrect={false} style={styles.input} />}
   <Action disabled={inDays === null} onPress={() => { if (inDays !== null) answer({ stepId: step.id, kind: 'timeframe', timeframe: 'specific_date', inDays }); }}>Use this date</Action>
  </View>}
  <View style={styles.actions}><Action secondary onPress={() => answer({ stepId: step.id, kind: 'skip' })}>Skip</Action></View>
 </View>;
}
const styles = StyleSheet.create({
 wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.md }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.md, marginTop: M.space.xl },
 unknown: { marginTop: M.space.lg }, input: { fontFamily: M.font.body, fontSize: 18, lineHeight: 28, minHeight: 132, padding: M.space.base, backgroundColor: M.color.paper, color: M.color.ink, borderBottomWidth: 1, borderColor: M.color.warmInk, borderRadius: M.radius.control, textAlignVertical: 'top' },
 hint: { marginTop: M.space.md, fontSize: 14, lineHeight: 22 }, date: { marginTop: M.space.lg, gap: M.space.md },
});

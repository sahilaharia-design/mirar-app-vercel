import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import type { CorrectionReason } from '../../../lib/innerRep/v2/types';
import { CORRECTION_PROMPT, CORRECTION_REASONS } from '../../../lib/innerRep/v2/contracts';
import { containsCrisisLanguage } from '../../../lib/innerRep/safety';
import { MIRAR as M } from '../../../design-system/native';
import { Action, Body, Eyebrow, Prompt, SelectionSurface } from './Foundation';

export type InsightFeedback = 'accurate' | 'partly' | 'no' | 'unsure';
/** Presentation shape from V2_CONTRACTS §5. Feedback is a callback, never a default selection. */
export interface ShownInsight {
 id: number; tier: 'supported' | 'tentative' | 'hedged'; text: string;
 evidence: { independentN: number; promptedN: number; introducedN: number };
}
export function HonestMirror({ insight, onFeedback, onCorrection, onSafety }: { insight: ShownInsight; onFeedback: (feedback: InsightFeedback) => Promise<void>; onCorrection?: (reason: CorrectionReason) => Promise<void>; onSafety?: () => void }) {
 const [given, setGiven] = useState<InsightFeedback | null>(null); const [pending, setPending] = useState(false);
 const [evidence, setEvidence] = useState(false); const [error, setError] = useState(false); const [corrected, setCorrected] = useState(false);
 const [correcting, setCorrecting] = useState(false);
 // structured correction. Free text, if offered, lives only in this field: it is safety-checked, cleared, and never passed on.
 const [pendingReason, setPendingReason] = useState<CorrectionReason | null>(null); const [note, setNote] = useState('');
 const give = async (value: InsightFeedback) => { if (pending) return; setPending(true); setError(false); try { await onFeedback(value); setGiven(value); } catch { setError(true); } finally { setPending(false); } };
 const send = async (reason: CorrectionReason) => { if (!onCorrection) return; setPending(true); setError(false); try { await onCorrection(reason); setCorrected(true); setPendingReason(null); } catch { setError(true); } finally { setPending(false); } };
 const finishNote = async (use: boolean) => { const crisis = use && containsCrisisLanguage(note); setNote(''); if (crisis) { setPendingReason(null); onSafety?.(); return; } if (pendingReason) await send(pendingReason); };
 return <View style={styles.mirror}>
  <Eyebrow>{insight.tier === 'hedged' ? 'Something to consider' : 'Worth noticing'}</Eyebrow>
  <Prompt label="mirror-prompt">{insight.text}</Prompt>
  <Action secondary expanded={evidence} onPress={() => setEvidence(!evidence)}>{evidence ? 'Hide the context' : 'Why am I seeing this?'}</Action>
  {evidence && <View style={styles.evidence}><Body>{insight.evidence.independentN} independent observations</Body><Body>{insight.evidence.promptedN} chosen from offered options</Body><Body>{insight.evidence.introducedN} raised by you</Body></View>}
  <View style={styles.feedback}>
   <Body>{given ? 'Noted.' : 'Does this feel accurate?'}</Body>
   {!given && <View style={styles.wrap}>{([['accurate','Accurate'],['partly','Partly'],['no','No'],['unsure','Not sure']] as const).map(([value,label]) => <Action key={value} secondary disabled={pending} onPress={() => void give(value)}>{label}</Action>)}</View>}
   {error && <Body accessibilityRole="alert">Couldn't record that. Please try again.</Body>}
   {given === 'partly' && onCorrection && !corrected && <View style={styles.feedback}>
    {!correcting && <Action secondary expanded={false} onPress={() => setCorrecting(true)}>{CORRECTION_PROMPT}</Action>}
    {correcting && !pendingReason && <View>
     <Prompt compact reveal label="correction-prompt">{CORRECTION_PROMPT}</Prompt>
     <View role="group" accessibilityLabel={CORRECTION_PROMPT}>{CORRECTION_REASONS.map(r => <SelectionSurface key={r.id} disabled={pending} onPress={() => (r.words ? setPendingReason(r.id) : void send(r.id))}>{r.label}</SelectionSurface>)}</View>
     <View style={styles.skip}><Action secondary onPress={() => setCorrecting(false)}>Skip</Action></View>
    </View>}
    {correcting && pendingReason && <View style={styles.note}>
     <Prompt compact reveal label="correction-note-prompt">{CORRECTION_REASONS.find(r => r.id === pendingReason)!.label}</Prompt>
     <TextInput multiline value={note} onChangeText={setNote} maxLength={80} autoComplete="off" autoCorrect={false} spellCheck={false} importantForAutofill="no" textContentType="none" accessibilityLabel="Tell Mirar more (optional)" aria-describedby="correction-privacy" style={styles.input} />
     <Body nativeID="correction-privacy" style={styles.hint}>Optional. Not saved in this version.</Body>
     <View style={styles.wrap}><Action secondary disabled={pending} onPress={() => void finishNote(true)}>Continue</Action><Action secondary disabled={pending} onPress={() => void finishNote(false)}>Skip</Action></View>
    </View>}
   </View>}
  </View>
 </View>;
}
const styles = StyleSheet.create({ mirror: { gap: M.space.lg, paddingTop: M.space.xl, borderTopWidth: 1, borderTopColor: M.color.warmInk }, feedback: { gap: M.space.base, marginTop: M.space.lg }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.md }, evidence: { gap: M.space.sm },
 input: { fontFamily: M.font.body, fontSize: 18, lineHeight: 28, minHeight: 96, padding: M.space.base, backgroundColor: M.color.paper, color: M.color.ink, borderBottomWidth: 1, borderColor: M.color.warmInk, borderRadius: M.radius.control, textAlignVertical: 'top' },
 hint: { fontSize: 14, lineHeight: 22 }, skip: { marginTop: M.space.lg }, note: { gap: M.space.base } });

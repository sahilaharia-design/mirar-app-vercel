import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Domain } from '../../../lib/innerRep/v2/types';
import { DOMAIN_CHIP_LABEL } from '../../../lib/innerRep/v2/contracts';
import { MIRAR as M } from '../../../design-system/native';
import { Action, Body, Eyebrow, Prompt } from './Foundation';

export type InsightFeedback = 'accurate' | 'partly' | 'no' | 'unsure';
/** Presentation shape from V2_CONTRACTS §5. Feedback is a callback, never a default selection. */
export interface ShownInsight {
 id: number; tier: 'supported' | 'tentative' | 'hedged'; text: string;
 evidence: { independentN: number; promptedN: number; introducedN: number };
}
export function HonestMirror({ insight, onFeedback, onCorrection }: { insight: ShownInsight; onFeedback: (feedback: InsightFeedback) => Promise<void>; onCorrection?: (domain: Domain) => Promise<void> }) {
 const [given, setGiven] = useState<InsightFeedback | null>(null); const [pending, setPending] = useState(false);
 const [evidence, setEvidence] = useState(false); const [error, setError] = useState(false); const [corrected, setCorrected] = useState(false);
 const [correcting, setCorrecting] = useState(false);
 const give = async (value: InsightFeedback) => { if (pending) return; setPending(true); setError(false); try { await onFeedback(value); setGiven(value); } catch { setError(true); } finally { setPending(false); } };
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
    <Action secondary expanded={correcting} onPress={() => setCorrecting(!correcting)}>What's off?</Action>
    {correcting && <View style={styles.wrap}>{(['work','partner','family','friends','self','body_health','money','time','technology','other'] as Domain[]).map(domain => <Action key={domain} secondary disabled={pending} onPress={async () => { setPending(true); setError(false); try { await onCorrection(domain); setCorrected(true); } catch { setError(true); } finally { setPending(false); } }}>{DOMAIN_CHIP_LABEL[domain]}</Action>)}<Action secondary onPress={() => setCorrecting(false)}>Skip</Action></View>}
   </View>}
  </View>
 </View>;
}
const styles = StyleSheet.create({ mirror: { gap: M.space.lg, paddingTop: M.space.xl, borderTopWidth: 1, borderTopColor: M.color.warmInk }, feedback: { gap: M.space.base, marginTop: M.space.lg }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.md }, evidence: { gap: M.space.sm } });

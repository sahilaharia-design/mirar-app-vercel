import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, useWindowDimensions } from 'react-native';
import type { FlowContext, RepPayload, StepAnswer } from '../../../lib/innerRep/v2/contracts';
import { MIRAR as M } from '../../../design-system/native';
import { Action, Body, BrandAsset, Eyebrow, PageTransition, Prompt, VisualFoundation } from './Foundation';
import { HonestMirror, type ShownInsight, type InsightFeedback } from './HonestMirror';
import { V2RepFlow } from './RepFlow';
import { SAFETY_RESOURCES } from '../../../lib/innerRep/safety';
import type { CorrectionReason } from '../../../lib/innerRep/v2/types';

export interface Completion { closing?: string; insight?: ShownInsight }
export interface DailyExperienceProps {
 today: { kind: 'rep'; payload: RepPayload; context: FlowContext } | ({ kind: 'done' } & Completion);
 greeting: string; continuityCue?: string; practiceDays?: number;
 draft?: StepAnswer[];
 onProgress?: (answers: StepAnswer[]) => void;
 onDismiss?: () => void;
 onComplete: (answers: StepAnswer[], durationMs: number) => Promise<Completion>;
 onSafety: (answers: StepAnswer[]) => void;
 onFeedback: (insightId: number, feedback: InsightFeedback) => Promise<void>;
 onCorrection?: (insightId: number, reason: CorrectionReason) => Promise<void>;
}
/** Production supplies payload/context and callbacks. This component owns presentation, not persistence. */
export function DailyInnerRep(props: DailyExperienceProps) {
 return <VisualFoundation><Experience {...props} /></VisualFoundation>;
}
function Experience({ today, greeting, continuityCue, practiceDays, draft = [], onProgress, onDismiss, onComplete, onSafety, onFeedback, onCorrection }: DailyExperienceProps) {
 const [stage, setStage] = useState<'today' | 'rep' | 'completed' | 'safety'>('today');
 const [answers, setAnswers] = useState<StepAnswer[]>(draft); const [completion, setCompletion] = useState<Completion | null>(null);
 const { width } = useWindowDimensions(); const complete = completion ?? (today.kind === 'done' ? today : null);
 const dismiss = () => { setStage('today'); onDismiss?.(); };
 const progress = (value: StepAnswer[]) => { setAnswers(value); onProgress?.(value); };
 const insight = complete?.insight;
 return <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingHorizontal: width < 768 ? M.space.lg : M.space.hero }]} keyboardShouldPersistTaps="handled">
  <View style={styles.header}><BrandAsset />{stage !== 'today' && <Action secondary onPress={dismiss}>Today</Action>}</View>
  <View style={[styles.composition, { maxWidth: width >= 1024 ? 920 : 720 }]}>
   {stage === 'rep' && today.kind === 'rep' ? <>
    <View style={styles.context}><Eyebrow>Today</Eyebrow><Body>{today.payload.capacityLabel}</Body></View>
    <V2RepFlow key={today.payload.instanceId} context={today.context} initialAnswers={answers} onProgress={progress} onSafety={value => { setAnswers([]); onSafety(value); setStage('safety'); }} onComplete={async (value,duration) => { const result = await onComplete(value,duration); setCompletion(result); setAnswers([]); setStage('completed'); }} />
   </> : stage === 'safety' ? <PageTransition>
    <Prompt>{SAFETY_RESOURCES.headline}</Prompt><Body>{SAFETY_RESOURCES.body}</Body>
    <View style={styles.safety}>{SAFETY_RESOURCES.lines.map(line => <View key={line.label}><Body>{line.label}</Body><Body>{line.value}</Body></View>)}</View>
    <Body>{SAFETY_RESOURCES.note}</Body><View style={styles.bottom}><Action onPress={dismiss}>Back to Today</Action></View>
   </PageTransition> : complete ? <PageTransition>
    <Eyebrow>Today</Eyebrow><View style={styles.title}><Prompt>{stage === 'completed' && complete.closing ? complete.closing : 'Done for today.'}</Prompt></View>
    {insight && <HonestMirror key={insight.id} insight={insight} onFeedback={value => onFeedback(insight.id,value)} onCorrection={onCorrection ? reason => onCorrection(insight.id,reason) : undefined} onSafety={() => { setAnswers([]); onSafety([]); setStage('safety'); }} />}
    {stage === 'completed' && <View style={styles.bottom}><Action secondary onPress={() => setStage('today')}>Return to Today</Action></View>}
   </PageTransition> : today.kind === 'rep' ? <PageTransition>
    <Eyebrow>Today</Eyebrow><View style={styles.title}><Prompt display>{greeting}</Prompt><Body style={styles.invitation}>Your inner rep for today.</Body></View>
    <View style={styles.details}><Body>{today.payload.capacityLabel}</Body><Body>{today.payload.estimatedSeconds} seconds</Body></View>
    <Action onPress={() => setStage('rep')}>{answers.length ? 'Resume' : 'Begin'}</Action>
    {continuityCue && <Body style={styles.bottom}>{continuityCue}</Body>}
    {!!practiceDays && <Body style={styles.practice}>{practiceDays} {practiceDays === 1 ? 'day' : 'days'} of practice this month</Body>}
   </PageTransition> : null}
  </View>
 </ScrollView>;
}
const styles = StyleSheet.create({
 page: { flex: 1, backgroundColor: M.color.surface }, content: { flexGrow: 1, paddingTop: M.space.lg, paddingBottom: M.space.large },
 header: { width: '100%', maxWidth: 1120, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
 composition: { width: '100%', alignSelf: 'center', paddingTop: M.space.hero, paddingBottom: M.space.lg },
 context: { marginBottom: M.space.xl, gap: M.space.sm }, title: { marginTop: M.space.xl }, invitation: { fontSize: 20, lineHeight: 30, marginBottom: M.space.xl },
 details: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.lg, marginBottom: M.space.xl }, bottom: { marginTop: M.space.xl }, practice: { marginTop: M.space.base, fontSize: 14 }, safety: { marginVertical: M.space.lg, gap: M.space.base },
});

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { nextStep, type FlowContext, type StepAnswer } from '../../../lib/innerRep/v2/contracts';
import { ChoiceInteraction, WordsInteraction, ContextInteraction, CheckInOffer, TimeframeInteraction } from './Interactions';
import { Action, Body, PageTransition } from './Foundation';

export interface RepFlowProps {
 context: FlowContext;
 initialAnswers?: StepAnswer[];
 onProgress?: (answers: StepAnswer[]) => void;
 onComplete: (answers: StepAnswer[], durationMs: number) => Promise<void>;
 onSafety: (answers: StepAnswer[]) => void;
}
/** Only nextStep decides sequencing. Neither raw text nor inferred data leaves this renderer. */
export function V2RepFlow({ context, initialAnswers = [], onProgress, onComplete, onSafety }: RepFlowProps) {
 const [answers, setAnswers] = useState(initialAnswers);
 const [error, setError] = useState(false); const [submitting, setSubmitting] = useState(false);
 const started = useRef(Date.now()); const busy = useRef(false); const answersRef = useRef(initialAnswers);
 const step = nextStep(context, answers);
 const submit = async (completeAnswers: StepAnswer[]) => {
  setSubmitting(true); setError(false);
  try { await onComplete(completeAnswers, Date.now()-started.current); }
  catch { setError(true); busy.current = false; }
  finally { setSubmitting(false); }
 };
 const answer = (value: StepAnswer) => {
  if (busy.current || answersRef.current.some(item => item.stepId === value.stepId)) return;
  const next = [...answersRef.current, value]; answersRef.current = next;
  setAnswers(next); onProgress?.(next);
  if (!nextStep(context,next)) { busy.current = true; void submit(next); }
 };
 if (!step) return <View accessibilityLiveRegion="polite">
  {submitting ? <Body>Finishing…</Body> : error ? <><Body>Couldn't finish this rep. Please try again.</Body><Action onPress={() => { if (!busy.current) { busy.current = true; void submit(answersRef.current); } }}>Try again</Action></> : <Action onPress={() => { if (!busy.current) { busy.current = true; void submit(answersRef.current); } }}>Finish</Action>}
 </View>;
 const shared = { answer };
 let content: React.ReactNode;
 switch (step.type) {
  case 'choice': content = <ChoiceInteraction step={step} {...shared} />; break;
  case 'words': content = <WordsInteraction step={step} {...shared} onSafety={value => { busy.current = true; onSafety([...answersRef.current,value]); }} />; break;
  case 'domain_chips': content = <ContextInteraction step={step} {...shared} />; break;
  case 'timeframe': content = <TimeframeInteraction step={step} {...shared} />; break;
  case 'yes_no': content = <CheckInOffer step={step} {...shared} />; break;
  case 'orientation_chips': return <Body>This rep is unavailable. Please return to Today.</Body>; // Disabled by the frozen MVP; never collect it.
 }
 return <PageTransition key={step.id}>{content}</PageTransition>;
}

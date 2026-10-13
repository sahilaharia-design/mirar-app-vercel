import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { chosenOption, nextStep, type FlowContext, type StepAnswer, TIMEFRAME_LABEL } from '../../lib/innerRep/v2/contracts';
import type { Receipt, ReceiptStep } from '../../lib/innerRep/runtime/receipt';
import { Body, Eyebrow } from '../inner-rep/v2/Foundation';
import { X, SectionTitle } from './ExperienceKit';
import { WindowBoundary } from './WindowStudy';
import { MIRAR as M } from '../../design-system/native';
export function IntegrationMoment({ receipt, context, answers }: {
    receipt?: Receipt | null;
    context?: FlowContext;
    answers?: StepAnswer[];
}) {
    // Immediate-session fallback uses the public step machine, not stored state. Reloaded sessions require Claude's receipt().
    const selected = context && answers ? chosenOption(context, answers) : null;
    const steps: ReceiptStep[] = receipt?.steps ?? (context && answers ? (() => { const out: ReceiptStep[] = []; const prior: StepAnswer[] = []; for (const a of answers) {
        const step = nextStep(context, prior);
        if (step?.type === 'choice') {
            const o = a.kind === 'option' ? step.options.find(o => o.id === a.optionId) : null;
            if (o)
                out.push({ prompt: step.prompt, choice: { kind: 'option', label: o.label, absent: false, createsCommitment: false } });
            else if (a.kind === 'unknown')
                out.push({ prompt: step.prompt, choice: { kind: 'unknown' } });
        }
        prior.push(a);
    } return out; })() : []);
    const unknown = steps.some(s => s.choice.kind === 'unknown');
    const commitment = receipt?.commitment;
    // absence is read from the runtime receipt when present (so it also holds after a reload), else from the immediate session
    const first = steps[0]?.choice;
    const permission = (first?.kind === 'option' && first.absent) || (!!selected && selected !== 'unknown' && selected.polarity === 'absent');
    const {width}=useWindowDimensions();
    const title = unknown ? 'Room for not knowing.' : commitment ? 'Something you chose to carry.' : permission ? 'You can leave it here.' : steps.length > 1 ? 'Both responses, in context.' : steps.length ? 'This session, in view.' : 'The practice can end here.';
    return <View style={[X.rule, X.space]}><WindowBoundary /><Eyebrow>Take it into life</Eyebrow><SectionTitle>{title}</SectionTitle>
 <View style={[S.spread,{flexDirection:width>=768&&steps.length>1?'row':'column'}]}>{steps.map((s, i) => <View key={i} style={S.response}><Eyebrow>The offered question</Eyebrow><Body>{s.prompt}</Body><Eyebrow>Your selected response</Eyebrow><Text style={X.quote}>{s.choice.kind === 'unknown' ? 'I don’t know' : s.choice.label}</Text><Body style={X.small}>{s.choice.kind === 'domain' ? 'Context you selected' : 'Your response to the offered question'}</Body></View>)}</View>
 {commitment && <View style={X.receipt}><Eyebrow>Your chosen intention</Eyebrow><Text style={X.quote}>{commitment.label}</Text><Body>{commitment.timeframe === 'specific_date' ? commitment.date : TIMEFRAME_LABEL[commitment.timeframe]}</Body></View>}
 <Body>{unknown ? 'Not knowing is a complete answer. Nothing more is asked of you.' : commitment ? 'The intention is yours. Its outcome is yours to name.' : permission ? 'There is no need to turn this into another task.' : steps.length > 1 ? 'These are the responses you chose, side by side. One does not explain the other.' : steps.length ? 'The offered question and selected response stay together. No further conclusion is added.' : 'Done for today. There is nothing else to complete here.'}</Body>
 </View>;
}

const S=StyleSheet.create({spread:{gap:20},response:{flex:1,gap:12,padding:20,backgroundColor:M.color.paper,borderLeftWidth:2,borderColor:M.color.warmInk}});

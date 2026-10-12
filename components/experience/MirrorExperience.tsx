import React, { useState } from 'react';
import { View, Text } from 'react-native';
import type { CommitmentContext } from '../../lib/innerRep/v2/contracts';
import type { MirrorModel, MirrorStatement } from '../../lib/innerRep/runtime/mirror-contract';
import { Body, Eyebrow, Prompt, Action } from '../inner-rep/v2/Foundation';
import { ExperiencePage, Chapter, X, PrivacyTruth } from './ExperienceKit';
import { WindowStudy, WindowBoundary } from './WindowStudy';
export type MirrorExercised = {
    label: string;
    reps: number;
    lastDate: string;
}[];
export type MirrorCarrying = {
    label: string;
    dueDate?: string;
}[];
const sourceLabel = { user_said: 'Your selected response', observed: 'A fact about practice', inferred: 'A possible reading', unknown: 'What remains open' } as const;
/** No eligibility computation in the UI. `readingHistory="approved"` is passed by the app route now that the runtime read model enforces current eligibility (Partly never reproduced unchanged; rejected/stale readings withheld; tested). */
export function MirrorExperience({ practiceDays = 0, commitment, exercised = [], carrying = [], model, readingHistory = 'unavailable', onToday }: {
    practiceDays?: number;
    commitment?: CommitmentContext;
    exercised?: MirrorExercised;
    carrying?: MirrorCarrying;
    model?: MirrorModel;
    readingHistory?: 'unavailable' | 'approved';
    onToday: () => void;
}) {
    const [ledger, setLedger] = useState(false);
    const [apart, setApart] = useState(false);
    const facts = model?.sections.practised ?? [];
    const carried = model?.sections.carrying ?? [];
    const said = model?.sections.said ?? [];
    const readings = readingHistory === 'approved' && model ? [...model.sections.come_up, ...model.sections.readings, ...model.sections.shifted, ...model.sections.unknown] : [];
    return <ExperiencePage><View style={X.space}><Eyebrow>The Mirror</Eyebrow><Prompt display>{practiceDays || facts.length ? 'What is here. What stays open.' : 'A beginning, without a verdict.'}</Prompt><View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}><View style={{ flex: 1 }}><Body style={X.lede}>{practiceDays || facts.length ? 'A view of actual practice and things you chose to carry. Facts stay distinct from readings.' : 'You do not need a profile of yourself before you begin. A small practice is enough.'}</Body></View><View style={{ width: 96 }}><WindowStudy quiet/></View></View><Action onPress={onToday}>Go to Today</Action></View>
 {(facts.length > 0 || exercised.length > 0 || practiceDays > 0) && <Chapter label="Practice, not ability" title="What you’ve been exercising."><WindowBoundary />{practiceDays > 0 && <Body>{practiceDays} {practiceDays === 1 ? 'day' : 'days'} of practice this month. The days need not be consecutive.</Body>}{facts.map(s => <Statement key={s.id} value={s}/>)}{!model && exercised.map((c, i) => <View key={i} style={X.receipt}><Text style={X.quote}>{c.label}</Text><Body>{c.reps} {c.reps === 1 ? 'rep' : 'reps'} · last on {c.lastDate}</Body></View>)}<Body style={X.small}>These describe practice completed, not emotional-fitness levels.</Body></Chapter>}
 {(carried.length > 0 || carrying.length > 0 || commitment) && <Chapter label="Your intentions" title="Something you chose to carry.">{carried.map(s => <Statement key={s.id} value={s}/>)}{!model && (carrying.length ? carrying : commitment ? [{ label: commitment.label }] : []).map((c, i) => <View key={i} style={X.receipt}><Text style={X.quote}>{c.label}</Text>{'dueDate' in c && c.dueDate && <Body>Around {c.dueDate}</Body>}</View>)}<Body>Its outcome belongs to you. A follow-up, when supplied in Today, lets you name it.</Body></Chapter>}
 {said.length > 0 && <Chapter label="Response provenance" title="Your choices, in context."><Action secondary expanded={ledger} onPress={() => setLedger(!ledger)}>{ledger ? 'Close your responses' : 'Read your selected responses'}</Action>{ledger && <View style={X.space}>{said.map(s => <Statement key={s.id} value={s}/>)}</View>}<Body style={X.small}>These are responses to offered questions. They are not explanations of who you are.</Body></Chapter>}
 {readings.length > 0 ? <Chapter label="A separate reading surface" title="A reflection stays revisable."><Action secondary selected={apart} onPress={() => setApart(!apart)}>{apart ? 'Read alongside' : 'Read separately'}</Action><View style={{ gap: apart ? 48 : 24 }}>{readings.map(s => <Statement key={s.id} value={s}/>)}</View></Chapter> : <Chapter label="Room for uncertainty" title="There need not be a reading."><Body>When evidence supports a reflection, it appears after your Inner Rep in Today. You can question it there.</Body>{readingHistory === 'unavailable' && <Body style={X.small}>Historical interpretations are not available in this release. Your practice facts and chosen intentions can still be useful.</Body>}</Chapter>}
 <PrivacyTruth />
 </ExperiencePage>;
}
function Statement({ value }: {
    value: MirrorStatement;
}) { return <View style={X.receipt}><Eyebrow>{value.facts.kind === 'reading_history' ? 'Your say on a reading' : sourceLabel[value.source]}</Eyebrow><Text style={X.quote}>{value.text}</Text>{value.date && <Body style={X.small}>{value.date}</Body>}</View>; }

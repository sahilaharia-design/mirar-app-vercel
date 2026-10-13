import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Action, Body, Eyebrow, Prompt } from '../inner-rep/v2/Foundation';
import { MIRAR as M } from '../../design-system/native';
import { ExperiencePage, Chapter, X } from './ExperienceKit';
import { WindowBoundary } from './WindowStudy';
import { PracticeSample } from './PracticeSample';
const capacities = [['Direction', 'Does this choice still belong to you?'], ['Energy', 'What asks for recovery?'], ['Focus', 'What has your attention?'], ['Relationships', 'What is yours to carry?'], ['Growth', 'Is there another way to see it?'], ['Action', 'What would you choose to do — or leave alone?']] as const;
export function DiscoverExperience({ onEnter, onPrivacy, legalLinks }: {
    onEnter: () => void;
    onPrivacy: () => void;
    legalLinks?: React.ReactNode;
}) {
    const { width } = useWindowDimensions();
    const [capacity, setCapacity] = useState(2);
    const [study, setStudy] = useState(false);
    return <ExperiencePage publicPage action={<Action secondary onPress={onEnter}>Enter Mirar</Action>}>
 <View style={[S.hero, { flexDirection: width >= 1024 ? 'row' : 'column' }]}><View style={S.intro}><Eyebrow>Daily emotional fitness</Eyebrow><Prompt display style={{ marginBottom: 0 }}>Look within. Look again.</Prompt><Body style={X.lede}>Try keeping a fact separate from a possible meaning.</Body></View><View style={S.art}><PracticeSample onEnter={onEnter}/></View></View>
 <Chapter label="Why inner maintenance matters" title="Make room before you rush past yourself."><View style={[S.explain, { flexDirection: width >= 768 ? 'row' : 'column' }]}><View style={S.explainText}><Body style={X.lede}>You practise looking after your body, your time and your work. Your inner life deserves attention, too.</Body><Body>Some days, the useful thing is a clearer choice. Other days, it is recognising what can remain unresolved. Every session need not become an action or an insight.</Body></View><View style={S.explainText}><WindowBoundary /><Text style={X.quote}>A question can open a window. Your answer does not have to close it.</Text><Body>No score. No streak. No ideal self to perform.</Body></View></View></Chapter>
 <Chapter label="Six capacities · no levels" title="Different ways of meeting your life."><View style={[S.explain, { flexDirection: width >= 768 ? 'row' : 'column' }]}><View style={S.names}>{capacities.map(([name], i) => <Action key={name} secondary selected={capacity === i} onPress={() => setCapacity(i)}>{name}</Action>)}</View><View style={S.capacity} accessibilityLiveRegion="polite"><Eyebrow>{capacities[capacity][0]}</Eyebrow><Text style={X.quote}>{capacities[capacity][1]}</Text><Body>One area of practice. Not a measure of your ability.</Body></View></View></Chapter>
 <Chapter label="The Honest Mirror" title="A possible reading. Your say stays yours."><Body style={X.lede}>When responses support a reflection, Mirar shows its evidence. You can agree, qualify it, disagree, or remain unsure.</Body><View style={X.row}><Action secondary expanded={study} onPress={() => setStudy(!study)}>{study ? 'Close fictional study' : 'See a fictional study'}</Action></View>{study && <View style={S.study}><Eyebrow>Fictional study · not your responses · no live feedback</Eyebrow><WindowBoundary /><Text style={X.quote}>“Work” was selected in five fictional responses.</Text><Body>A reading might notice that recurrence. It cannot tell why work came up, what it means, or who the person is.</Body><Body>The real choices are Accurate / Partly / No / Not sure. This study does not collect feedback or build personal history.</Body></View>}</Chapter>
 <Chapter label="As you return" title="A practice that stays open."><Body style={X.lede}>The Mirror can hold facts about practice and things you chose to carry. Reflections appear only when evidence supports them.</Body><Body>No day unlocks a revelation. A quiet Mirror is a legitimate beginning.</Body><WindowBoundary /><Body>In the current beta, structured practice stays on your device and is cleared on sign-out. Optional words are not saved. The account uses email for sign-in.</Body><View style={X.row}><Action secondary onPress={onPrivacy}>Read privacy information</Action></View></Chapter>
 <Chapter label="Begin" title="A little practice. Then back to life."><View style={X.row}><Action onPress={onEnter}>Enter Mirar</Action></View><Body>Mirar is not therapy or a diagnosis. There is no need to write a personal story.</Body></Chapter>
 <View style={[X.rule, X.space]}><Eyebrow>Mirar · mirar.life</Eyebrow>{legalLinks ?? <Action secondary onPress={onPrivacy}>Privacy information</Action>}<Body style={X.small}>Your response remains yours. A reading stays revisable.</Body></View>
 </ExperiencePage>;
}
const S = StyleSheet.create({ hero: { gap: 24, paddingBottom: 64 }, intro: { flex: 1, gap: 16 }, art: { flex: 1, minWidth: 0 }, caption: { fontSize: 14, lineHeight: 22, marginTop: 16 }, sample: { maxWidth: 880, gap: 24 }, explain: { gap: 40 }, explainText: { flex: 1, gap: 24 }, names: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, capacity: { flex: 1, gap: 24, borderLeftWidth: 1, borderLeftColor: M.color.warmInk, paddingLeft: 24 }, study: { gap: 24, padding: 24, backgroundColor: M.color.paper, borderLeftWidth: 2, borderLeftColor: M.color.warmInk } });

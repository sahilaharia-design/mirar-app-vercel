import React from 'react';
import {View,Text} from 'react-native';
import type {CommitmentContext} from '../../lib/innerRep/v2/contracts';
import {Body,Eyebrow,Prompt,Action} from '../inner-rep/v2/Foundation';
import {ExperiencePage,Chapter,X,PrivacyTruth} from './ExperienceKit';
export function MirrorExperience({practiceDays=0,commitment,onToday}:{practiceDays?:number;commitment?:CommitmentContext;onToday:()=>void}){
 return <ExperiencePage><View style={X.space}><Eyebrow>The Mirror</Eyebrow><Prompt display>A clearer view, without a label.</Prompt><Body style={X.lede}>{practiceDays?'A practice is taking shape. What becomes visible here should stay grounded in what you actually chose.':'This begins quietly. You do not need a profile of yourself before you begin.'}</Body></View>
 <Chapter label="What you’ve been exercising" title={practiceDays?'You’ve been making room.':'One moment is enough to begin.'}>
 {practiceDays>0&&<View style={X.receipt}><Text style={X.quote}>{practiceDays} {practiceDays===1?'day':'days'} of practice this month</Text><Body style={X.small}>A fact about practice, not a measure of your emotional fitness. The days do not need to be consecutive.</Body></View>}
 <Body>A view of the capacities you’ve practised is still being built. For now, the practice lives in your daily Inner Reps.</Body>
 </Chapter>
 <Chapter label="What Mirar is beginning to notice" title="Evidence comes before interpretation."><Body>A reflection, when the evidence supports one, appears after your Inner Rep in Today. You can agree, qualify it, disagree or remain unsure.</Body><Body style={X.small}>Past reflections aren’t available here yet. Today is where you can meet and correct a reflection.</Body><Action secondary onPress={onToday}>Go to Today</Action></Chapter>
 <Chapter label="What you’re carrying" title={commitment?'Something you chose.':'Room for an intentional next step.'}>{commitment?<View style={X.receipt}><Eyebrow>Something you chose to carry</Eyebrow><Text style={X.quote}>{commitment.label}</Text><Body>This is the commitment in today’s check-in. Its outcome is yours to name.</Body></View>:<Body>When today’s rep checks in on something you chose, it can appear here. This beta doesn’t show a full commitment history yet.</Body>}</Chapter>
 <Chapter label="What has been present · what may have shifted" title="Not enough to show here yet."><Body>There is nothing to reflect back here yet. This part of the Mirror is still being built: a view that separates your choices from Mirar’s interpretations, and keeps uncertainty visible.</Body><Body style={X.small}>The daily practice works while this part of the mirror is being built.</Body></Chapter><PrivacyTruth/>
 </ExperiencePage>;
}

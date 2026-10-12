import React from 'react';
import { View } from 'react-native';
import { Action, Body, Eyebrow, Prompt } from '../inner-rep/v2/Foundation';
import { ExperiencePage, PrivacyTruth, X } from './ExperienceKit';
import { WindowStudy } from './WindowStudy';
export function PracticeIntroduction({ onBegin }: {
    onBegin: () => void;
}) {
    return <ExperiencePage><View style={[X.narrow, X.space]}><Eyebrow>A first opening</Eyebrow><Prompt display>Start with what is here.</Prompt><WindowStudy quiet/><Body style={X.lede}>A small question. Your own response. Room to leave it open.</Body><Body>Take the first Inner Rep at your own pace. You can choose “I don’t know”, skip optional steps or leave whenever you want.</Body><View style={X.row}><Action onPress={onBegin}>Meet today’s Inner Rep</Action><Action secondary onPress={onBegin}>Go straight to Today</Action></View><PrivacyTruth /><Body style={X.small}>This introduction asks nothing about you. Mirar is a practice, not therapy or a diagnosis.</Body></View></ExperiencePage>;
}

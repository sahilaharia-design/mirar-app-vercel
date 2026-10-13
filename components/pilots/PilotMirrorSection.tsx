import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { usePilotStore } from '../../stores/pilot-store';
import { buildPilotMirror } from '../../lib/innerRep/pilots/read';
import { Action, Body, Eyebrow } from '../inner-rep/v2/Foundation';
import { X, SectionTitle } from '../experience/ExperienceKit';
import { MirrorPanel } from './PilotViews';

/**
 * Extra-practice evidence, SOURCE-SEPARATED from the engine Mirror. It reads only the pilot store (device-local pilot records)
 * and is never merged into runtime.mirror(), engine evidence, readings or eligibility. Mounted by app/(tabs)/mirror.tsx only
 * when EXPO_PUBLIC_PILOTS=1 (staging).
 */
export default function PilotMirrorSection() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const st = usePilotStore(); void st.tick;
  useEffect(() => { if (userId) void st.load(userId); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const records = st.records(); const today = st.today();
  const mirror = useMemo(() => buildPilotMirror(records, today), [records, today, st.tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return <View style={[X.rule, X.space]} accessibilityLabel="Extra practice, kept separate from the Mirror above">
    <Eyebrow>Extra practice · staging · a separate source</Eyebrow>
    <SectionTitle>Kept apart from the Mirror above.</SectionTitle>
    <Body>These come from the optional exercises (Look Again, Attend). They are not combined with the Mirror’s evidence, are not used to form any reading, and do not change when a reading can appear. Each line says where it came from.</Body>
    <MirrorPanel mirror={mirror} />
    <View style={X.row}><Action secondary onPress={() => router.push('/pilots')}>Open extra practice</Action></View>
  </View>;
}

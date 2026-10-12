import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth-store';
import { V2_KEY_PREFIX } from '../../lib/innerRep/runtime/v2-runtime';

/**
 * REVIEW STATES. Development and staging only.
 * Loads a realistic persisted v2 state for the signed-in user (built by simulating a synthetic user through the real
 * runtime adapter), so a reviewer can reach advanced states quickly. It overwrites this device's v2 state for the user.
 *
 * Gate: this route is reachable only when __DEV__ or EXPO_PUBLIC_REVIEW_STATES === '1' (see app/(dev)/_layout.tsx).
 * EXPO_PUBLIC_REVIEW_STATES must never be set in the Production environment. The builder is required behind the same
 * constant condition, so a production bundle does not contain it.
 */
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_REVIEW_STATES === '1';
const builder: typeof import('../../scripts/runtime/review-builder') | null = ENABLED ? require('../../scripts/runtime/review-builder') : null;

const STATES: { key: string; want: string | null; label: string; note: string }[] = [
  { key: 'fresh', want: null, label: 'Fresh user', note: 'Clears this device’s v2 state. Today shows the first invitation.' },
  { key: 'returning', want: 'fresh_choice', label: 'Returning user · normal rep', note: 'Several earlier days; today serves a choice rep.' },
  { key: 'compare', want: 'compare', label: 'Compare rep', note: 'Paired-statement response.' },
  { key: 'words', want: 'words', label: 'Optional words rep', note: 'Free text offered. Not saved.' },
  { key: 'followup', want: 'followup', label: 'Follow-up rep', note: 'A rep with a follow-up step.' },
  { key: 'insight', want: 'insight', label: 'Honest Mirror (Accurate / Partly / No / Not sure)', note: 'Complete the rep; a reflection is offered. Choose each feedback value on different runs.' },
  { key: 'timeframe', want: 'timeframe', label: 'Commitment creation', note: 'Complete the rep; you are asked for a timeframe.' },
  { key: 'commitment_check', want: 'commitment_check', label: 'Commitment follow-up', note: 'Today asks how a commitment you chose is going.' },
  { key: 'mirror', want: 'insight', label: 'The Mirror · accumulated practice', note: 'Many completed days. Open The Mirror.' },
];

export default function ReviewStates() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = async (s: (typeof STATES)[number]) => {
    if (!userId || !builder) return;
    setBusy(s.key); setMsg('');
    try {
      const k = `${V2_KEY_PREFIX}:${userId}`;
      if (s.want === null) await AsyncStorage.removeItem(k);
      else {
        const w = builder.WANTS.find((x) => x.name === s.want)!;
        const r = await builder.build(w);
        if (!r) { setMsg('Could not build this state.'); setBusy(null); return; }
        const o = JSON.parse(r.blob); o.state.instances.forEach((i: { trace?: unknown }) => { delete i.trace; });
        await AsyncStorage.setItem(k, JSON.stringify(o));
      }
      if (Platform.OS === 'web') window.location.assign('/');
      else setMsg('Loaded. Reopen the app.');
    } catch { setMsg('Could not load this state.'); }
    setBusy(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F0EA' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        <Text accessibilityRole="header" style={{ fontSize: 28, color: '#2A2A30' }}>Review states</Text>
        <Text style={{ fontSize: 15, color: '#4A4A52' }}>Staging only. Replaces this device’s Inner Rep state for the signed-in user.</Text>
        {!userId && <Text style={{ fontSize: 15, color: '#8A3B2E' }}>Sign in first.</Text>}
        {STATES.map((s) => (
          <Pressable key={s.key} accessibilityRole="button" disabled={!userId || !!busy} onPress={() => void load(s)}
            style={{ minHeight: 56, padding: 14, borderWidth: 1, borderColor: '#CFC8BE', borderRadius: 12, backgroundColor: '#FBF9F5' }}>
            <Text style={{ fontSize: 16, color: '#2A2A30' }}>{busy === s.key ? 'Building…' : s.label}</Text>
            <Text style={{ fontSize: 14, color: '#4A4A52' }}>{s.note}</Text>
          </Pressable>
        ))}
        {!!msg && <Text accessibilityRole="alert" style={{ fontSize: 15, color: '#2A2A30' }}>{msg}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { usePilotStore } from '../../stores/pilot-store';
import { MIRAR as M } from '../../design-system/native';
import { Action, Body, BrandAsset, Eyebrow, Prompt, VisualFoundation } from '../inner-rep/v2/Foundation';
import { MirrorPanel, PilotRunner, ValuePanel } from './PilotViews';
import { buildPilotMirror, pilotOffers, pilotReceipt, type PilotReceipt } from '../../lib/innerRep/pilots/read';
import { PILOT_TITLES } from '../../lib/innerRep/pilots/session';
import type { PilotId } from '../../lib/innerRep/pilots/types';
import { SAFETY_RESOURCES } from '../../lib/innerRep/safety';

// OPTIONAL EXTRA PRACTICE (pilots) screen. Mounted only by app/pilots.tsx when EXPO_PUBLIC_PILOTS=1 (staging). That variable must never be set in
// the Production environment. Pilots never change the engine's Today rep, evidence or Mirror; they have their own device-local
// records and their own Mirror panel. Fixture data is loaded only on explicit request and is labelled.
const fixtures: typeof import('../../scripts/runtime/pilot-fixtures') | null = process.env.EXPO_PUBLIC_PILOTS === '1' ? require('../../scripts/runtime/pilot-fixtures') : null;

type Mode = 'hub' | 'run' | 'closing' | 'safety';
export default function PilotsScreen() {
  return <VisualFoundation><Pilots /></VisualFoundation>;
}

function Pilots() {
  const { width } = useWindowDimensions();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const st = usePilotStore(); void st.tick;
  const [mode, setMode] = useState<Mode>('hub'); const [receipt, setReceipt] = useState<PilotReceipt | null>(null); const [fx, setFx] = useState(false);
  useEffect(() => { if (userId) void st.load(userId); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const session = st.session(); const today = st.today(); const records = st.records();
  const mirror = useMemo(() => buildPilotMirror(records, today), [records, today, st.tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const offers = pilotOffers(records, today, st.resumable()?.pilot ?? null);
  const finish = useCallback(async () => { const r = await st.close('finish'); setReceipt(r ? pilotReceipt(r) : null); setMode(r ? 'closing' : 'hub'); }, [st]);
  const leave = async () => { const r = await st.close('leave'); setReceipt(r ? pilotReceipt(r) : null); setMode(r ? 'closing' : 'hub'); };
  const begin = (p: PilotId) => { if (st.resumable()?.pilot !== p) st.start(p); setMode('run'); };
  const pad = width < 768 ? M.space.lg : M.space.hero;
  const loadFixtures = async () => { if (!fixtures) return; await st.replaceRecords(fixtures.buildFixtures(today)); setFx(true); };

  return <SafeAreaView style={S.page} edges={['top', 'bottom']}><ScrollView contentContainerStyle={[S.content, { paddingHorizontal: pad }]} keyboardShouldPersistTaps="handled">
    <View style={S.header}><BrandAsset /><Action secondary onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>Back to Today</Action></View>
    <View style={S.col}>
      {mode === 'run' && session ? <PilotRunner session={session} title={PILOT_TITLES[session.pilot]} onAnswer={st.answer} onBack={st.back} onLeave={() => void leave()} onFinish={() => void finish()}
          onSafety={() => { void (async () => { await st.answer({ stepId: session.step()?.id ?? 'observation', kind: 'safety' }); await st.discard(); setMode('safety'); })(); }} />
        : mode === 'safety' ? <View style={S.gap}><Prompt compact>{SAFETY_RESOURCES.headline}</Prompt><Body>{SAFETY_RESOURCES.body}</Body>{SAFETY_RESOURCES.lines.map((l) => <View key={l.label}><Body>{l.label}</Body><Body>{l.value}</Body></View>)}<Body>{SAFETY_RESOURCES.note}</Body><Action onPress={() => setMode('hub')}>Back</Action></View>
        : mode === 'closing' && receipt ? <View><ValuePanel receipt={receipt} /><View style={S.actions}><Action onPress={() => { setMode('hub'); }}>Back to practice</Action></View></View>
        : <View style={S.gap}>
          <Eyebrow>Optional extra practice · preview</Eyebrow>
          <Prompt display>Two more ways to practise.</Prompt>
          <Body>Your Today rep is separate and unchanged. These are optional. You can leave any time, and “I don’t know” is always a complete answer. Anything you type stays on screen only.</Body>
          {offers.map((o) => <View key={o.pilot} style={S.offer}><Prompt compact>{o.title}</Prompt><Body>{o.line}</Body>{o.carried > 0 && <Body style={S.small}>{o.carried === 1 ? 'One thing' : `${o.carried} things`} you set aside earlier can be offered back once. You can say “not right now”.</Body>}<View style={S.actions}><Action onPress={() => begin(o.pilot)}>{o.resume ? 'Resume' : 'Begin'}</Action></View></View>)}
          <MirrorPanel mirror={mirror} />
          <View style={S.fixture}>
            <Eyebrow>Review tools · staging only</Eyebrow>
            {fx && <Body style={S.fixtureNote}>FIXTURE DATA: these records were generated for review. They are not your practice.</Body>}
            <View style={S.actions}>{fixtures && <Action secondary onPress={() => void loadFixtures()}>Load fixture history</Action>}<Action secondary onPress={() => { void st.clearAll(); setFx(false); }}>Clear pilot data</Action></View>
            {Platform.OS === 'web' && <Body style={S.small}>Pilot data is kept in this browser only and is cleared when you sign out.</Body>}
          </View>
        </View>}
    </View>
  </ScrollView></SafeAreaView>;
}

const S = StyleSheet.create({
  page: { flex: 1, backgroundColor: M.color.surface }, content: { flexGrow: 1, paddingTop: M.space.lg, paddingBottom: M.space.large },
  header: { width: '100%', maxWidth: 1120, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
  col: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: M.space.large }, gap: { gap: M.space.lg }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: M.space.md, marginTop: M.space.lg },
  offer: { borderTopWidth: 1, borderTopColor: M.color.border, paddingTop: M.space.lg, gap: M.space.sm }, small: { fontSize: 14, lineHeight: 22 },
  fixture: { borderTopWidth: 1, borderTopColor: M.color.border, paddingTop: M.space.lg, gap: M.space.sm }, fixtureNote: { color: M.color.error, fontSize: 14 },
});

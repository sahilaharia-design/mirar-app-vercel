// LOCAL ONLY: simulated authentication, REAL public runtime, memory-only storage. No production adapter imports this.
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DiscoverExperience } from '../components/experience/DiscoverExperience';
import { EntryExperience } from '../components/experience/EntryExperience';
import { PracticeIntroduction } from '../components/experience/PracticeIntroduction';
import { MirrorExperience } from '../components/experience/MirrorExperience';
import { MeExperience } from '../components/experience/MeExperience';
import { PrivacyExperience } from '../components/experience/PrivacyExperience';
import { DailyInnerRep } from '../components/inner-rep/v2/DailyExperience';
import { Action, Body, VisualFoundation } from '../components/inner-rep/v2/Foundation';
import { createRuntime, type KV, type TodayView } from '../lib/innerRep/runtime/v2-runtime';
import type { Receipt } from '../lib/innerRep/runtime/receipt';
import type { MirrorModel } from '../lib/innerRep/runtime/mirror-contract';
import scenarios from './aperture-scenarios.json';
const entries = new Map<string, string>();
const memory: KV = { getItem: async (k) => entries.get(k) ?? null, setItem: async (k, v) => { entries.set(k, v); }, removeItem: async (k) => { entries.delete(k); }, getAllKeys: async () => [...entries.keys()] };
const runtime = createRuntime({ storage: memory });
const uid = 'mock-user-0000-0000-000000000001';
export function ExperienceReview() {
    const params = new URLSearchParams(location.search);
    const [stage, setStage] = useState(params.get('experience') ?? 'discover');
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [today, setToday] = useState<TodayView | null>(null);
    const [days, setDays] = useState(0);
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [model, setModel] = useState<MirrorModel | undefined>();
    const [error, setError] = useState(false);
    const refresh = () => { setToday(runtime.today()); setDays(runtime.practiceDaysThisMonth()); setReceipt(runtime.receipt()); setModel(runtime.mirror()); };
    useEffect(() => { let live = true; const name = params.get('scenario'); const scenario = (scenarios as Record<string, {
        blob: string;
    } | null>)[name ?? '']; entries.clear(); if (scenario)
        entries.set('mirar_inner_rep_v2:' + uid, scenario.blob); void runtime.init(uid).then(() => { if (live)
        refresh(); }, () => { if (live)
        setError(true); }); return () => { live = false; }; }, []);
    const navigate = (next: string) => { setStage(next); };
    const content = stage === 'discover' ? <DiscoverExperience onEnter={() => navigate('entry')} onPrivacy={() => navigate('privacy')}/> : stage === 'entry' ? <View style={{ flex: 1 }}><EntryExperience email={email} onEmail={setEmail} onSubmit={() => setSent(true)} onBack={() => navigate('discover')} onRetry={() => setSent(false)} loading={false} sent={sent} error={params.has('error') ? 'Review fixture: expired sign-in link. Please request another.' : null}/>{sent && <VisualFoundation><Action onPress={() => navigate('intro')}>Local review: continue to introduction</Action></VisualFoundation>}</View> : stage === 'intro' ? <PracticeIntroduction onBegin={() => navigate('today')}/> : stage === 'mirror' ? <MirrorExperience model={model} practiceDays={days} onToday={() => navigate('today')}/> : stage === 'me' ? <MeExperience email="synthetic-review@example.test" onIntroduction={() => navigate('intro')} onPrivacy={() => navigate('privacy')} onSupport={() => navigate('privacy')} onSignOut={() => { entries.clear(); location.assign('?experience=discover'); }}/> : stage === 'privacy' ? <PrivacyExperience onBack={() => navigate('discover')}/> : error ? <VisualFoundation><Body role="alert">Review could not load.</Body><Action onPress={() => location.reload()}>Retry</Action></VisualFoundation> : today ? <View role="main" style={{ flex: 1 }}><DailyInnerRep today={today} receipt={receipt} greeting="A moment for yourself." practiceDays={days} draft={today.kind === 'rep' ? today.draft : undefined} onProgress={a => { void runtime.progress(a); }} onComplete={async (a, d) => { const c = await runtime.complete(a, d); refresh(); return c; }} onSafety={() => { void runtime.discardForSafety().then(refresh); }} onFeedback={async (id, f) => { await runtime.feedback(id, f); setModel(runtime.mirror()); }} onCorrection={async (id, r) => { await runtime.correction(id, r); setModel(runtime.mirror()); }}/></View> : <VisualFoundation><Body role="status">Getting today ready…</Body></VisualFoundation>;
    return <SafeAreaProvider><View style={{ flex: 1 }}><VisualFoundation><View role="navigation" accessibilityLabel="Local review navigation" style={{ padding: 12, backgroundColor: '#FAF7F2', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}><Body style={{ fontSize: 12 }}>Local review · fictional scenarios · simulated sign-in · memory-only practice</Body>{['discover', 'today', 'mirror', 'me'].map(s => <Action secondary key={s} onPress={() => navigate(s)}>{s[0].toUpperCase() + s.slice(1)}</Action>)}<Action secondary onPress={() => { void runtime.init(uid).then(() => { refresh(); setStage('today'); }); }}>Reload runtime view</Action></View></VisualFoundation>{content}</View></SafeAreaProvider>;
}

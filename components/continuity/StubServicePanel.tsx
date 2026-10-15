import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../../stores/auth-store';
import { getStubService, useContinuityStore } from '../../stores/continuity-store';
import { ENGINE_VERSION } from '../../lib/innerRep/v2/config';
import { phantomDay } from '../../lib/innerRep/backup/phantom';
import type { SimulatedMode } from '../../lib/innerRep/backup/stub-service';
import { Action, Body, Eyebrow } from '../inner-rep/v2/Foundation';
import { X } from '../experience/ExperienceKit';

// REVIEW ONLY (EXPO_PUBLIC_REVIEW_STATES=1 and EXPO_PUBLIC_HISTORY_SYNC=1). Every control here SIMULATES a service outcome in memory. There is no network, no
// Supabase and no real data; reloading the page resets it. It never ships in a user-facing build and its banner never goes away.
const MODES: SimulatedMode[] = ['normal', 'offline', 'unavailable', 'service_error', 'slow'];
export function StubServicePanel() {
  const uid = useAuthStore((s) => s.session?.user?.id); const controller = useContinuityStore((s) => s.controller);
  const stub = getStubService(); const [, bump] = useState(0); const [msg, setMsg] = useState('');
  if (!uid || !controller) return null;
  const act = async (label: string, f: () => void | Promise<void>) => { await f(); setMsg(label); bump((n) => n + 1); };
  return <View style={[X.rule, X.space]} accessibilityLabel="Simulated service controls, review only">
    <Eyebrow>SIMULATED SERVICE · review only · no network · reload resets</Eyebrow>
    <Body style={X.small}>Current simulated behaviour: {stub.mode}{stub.failNext ? ` · next ${stub.failNext} request(s) fail` : ''}{stub.staleOnce ? ' · next write reports a stale history' : ''}. Account copy on the stub: {stub.core(uid).events.length} event(s).</Body>
    <View style={X.row}>{MODES.map((m) => <Action key={m} secondary selected={stub.mode === m} onPress={() => void act(`mode: ${m}`, () => { stub.mode = m; })}>{m}</Action>)}</View>
    <View style={X.row}>
      <Action secondary onPress={() => void act('next request will fail', () => { stub.failNext = 1; })}>Fail the next request</Action>
      <Action secondary onPress={() => void act('next write will report stale', () => { stub.staleOnce = true; })}>Next write reports stale history</Action>
      <Action secondary onPress={() => void act('another device deleted the account copy', () => stub.simulateCopyDeletedElsewhere(uid))}>Another device deletes the account copy</Action>
      <Action secondary onPress={() => void act('another device completed today', async () => { const ev = await phantomDay(uid, ENGINE_VERSION, stub.core(uid).events, new Date()); stub.simulateOtherDeviceWrites(uid, ev); })}>Another device completed today’s practice</Action>
      <Action secondary onPress={() => void act('account reset with new history', async () => { const ev = await phantomDay(uid, ENGINE_VERSION, [], new Date(Date.now() - 86400000)); stub.simulateAccountReset(uid, ev); })}>Account reset elsewhere with new history</Action>
      <Action secondary onPress={() => void act('checking the account copy', () => controller.refresh())}>Check for an account copy</Action>
    </View>
    {!!msg && <Body accessibilityLiveRegion="polite" style={X.small}>Simulated: {msg}</Body>}
  </View>;
}

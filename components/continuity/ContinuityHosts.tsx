import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useContinuityStore } from '../../stores/continuity-store';
import { useInnerRepV2Store } from '../../stores/inner-rep-v2-store';
import { BackupInvitation, ContinuitySettings, ContinuityStatus, continuityPrivacy } from './ContinuityExperience';
import type { ContinuityPort, ContinuityIntent } from './contract';
import type { AnyIntent } from '../../lib/innerRep/backup/continuity';
import { ExperiencePage, X } from '../experience/ExperienceKit';
import { Body } from '../inner-rep/v2/Foundation';
import { StubServicePanel } from './StubServicePanel';

// Mounted only behind EXPO_PUBLIC_HISTORY_SYNC=1 (staging). Codex's presentation, driven by the real ContinuityController; the service is a STUB (no network).
// One authoritative host feeds all three slots and their privacy notices together (Codex handoff: never mount a backup-enabled status beside the old device-only disclosure).
function useContinuity() {
  const userId = useAuthStore((s) => s.session?.user?.id); const signOut = useAuthStore((s) => s.signOut);
  const controller = useContinuityStore((s) => s.controller); const snapshot = useContinuityStore((s) => s.snapshot);
  useEffect(() => { if (userId) void useContinuityStore.getState().start(userId, signOut); }, [userId, signOut]);
  const port = useMemo<ContinuityPort | null>(() => (controller && snapshot ? { snapshot, request: (i: ContinuityIntent) => { void controller.request(i as AnyIntent); } } : null), [controller, snapshot]);
  return { port, controller, snapshot };
}
const manage = () => router.push('/continuity');

/** Replaces the old device-only privacy sentence on every surface (Today, Mirror, Me) with the state-aware one. */
export function useContinuityNotice(): string | undefined { const { snapshot } = useContinuity(); return snapshot ? continuityPrivacy(snapshot) : undefined; }

/** Today: compact status below the practice, and the optional invitation after a completed practice (never during practice, never re-asked after "Not now" for 30 days). */
export function ContinuityTodayHost() {
  const { port, controller } = useContinuity(); const completed = useInnerRepV2Store((s) => s.practiceDays);
  if (!port || !controller) return null;
  const today = new Date(); const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const invite = controller.invitationEligible(completed, iso);
  return <View>{invite && <BackupInvitation onOpen={manage} onDismiss={() => void controller.dismissInvitation()} />}<ContinuityStatus port={port} onManage={manage} /></View>;
}
export function ContinuityMirrorHost() { const { port } = useContinuity(); return port ? <ContinuityStatus port={port} onManage={manage} /> : null; }
/** Me: the history controls replace the old local-only sign-out area (sign-out lives inside the history screen, where its consequences are stated). */
export function ContinuityMeHost() { const { port } = useContinuity(); return port ? <ContinuityStatus port={port} onManage={manage} /> : null; }

/** The full history/settings screen (route /continuity). */
export default function ContinuityScreen() {
  const { port, controller } = useContinuity();
  useEffect(() => { if (controller && controller.snap.phase === 'device' && !controller.snap.enabled) void controller.refresh(); }, [controller]);       // opening this screen is the explicit act that allows ONE read of the account
  if (!port) return <ExperiencePage><View style={X.space}><Body>Opening practice history…</Body></View></ExperiencePage>;
  return <>
    <ContinuitySettings port={port} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
    {process.env.EXPO_PUBLIC_REVIEW_STATES === '1' ? <StubServicePanel /> : null}
  </>;
}

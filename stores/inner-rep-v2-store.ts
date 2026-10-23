import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepAnswer } from '../lib/innerRep/v2/contracts';
import { CorrectionReason } from '../lib/innerRep/v2/types';
import { CompletionView, InsightFeedbackValue, KV, TodayView, clearV2Keys, createRuntime } from '../lib/innerRep/runtime/v2-runtime';
import type { MirrorModel } from '../lib/innerRep/runtime/mirror-contract';
import type { Receipt } from '../lib/innerRep/runtime/receipt';
import { clearPilotKeys } from '../lib/innerRep/pilots/keys';
import { newServedGuard, recordServed, resetServedGuard } from '../lib/innerRep/runtime/serve';

// Thin reactive wrapper around the v2 runtime adapter. All behaviour lives in lib/innerRep/runtime/v2-runtime.ts, which
// delegates every decision to the frozen engine. DEV PERSISTENCE: structured state in AsyncStorage (browser localStorage on
// web), per user, device-local. There is no Supabase table for v2 (no migration has been approved or applied).
const EMPTY_MIRROR: MirrorModel = { version: 1, engineVersion: 'v2.0.1-correction-fix', state: 'empty', retained: { instances: 0, from: null, mayBeTruncated: false }, statements: [], sections: { said: [], practised: [], come_up: [], carrying: [], readings: [], shifted: [], unknown: [] } };
const baseRuntime = createRuntime({ storage: AsyncStorage as unknown as KV });
// Continuity (opt-in backup) prototype, DEFAULT OFF. With EXPO_PUBLIC_HISTORY_SYNC=1 the runtime is wrapped by the event recorder, which journals structured
// events on this device only (the journal is never sent anywhere unless the person opts in). The direct env comparison is inlined at build time, so a build
// without the flag contains none of the continuity code (preflight scans for it). EXPO_PUBLIC_HISTORY_SYNC must never be set in the Production environment.
const runtime: ReturnType<typeof createRuntime> = process.env.EXPO_PUBLIC_HISTORY_SYNC === '1' ? (require('../lib/innerRep/backup/hook') as typeof import('../lib/innerRep/backup/hook')).attachRecorder(baseRuntime) : baseRuntime;

// S1a persist-on-serve guard (in memory; see lib/innerRep/runtime/serve.ts). Reset on sign-out and device reset.
const served = newServedGuard();
const dayKeyNow = () => new Date().toDateString();

interface State {
  status: 'idle' | 'loading' | 'ready' | 'error';
  userId: string | null;
  /** calendar day this view belongs to; the presentation remounts only when the day changes */
  dayKey: string;
  today: TodayView | null;
  practiceDays: number;
  /** typed Mirror read model (mirror-contract.ts); the only source the Mirror UI may use */
  mirror: MirrorModel;
  /** today's exact response from stored structured state; survives reload. null until a rep is completed today */
  receipt: Receipt | null;
  load: (userId: string) => Promise<void>;
  progress: (answers: StepAnswer[]) => void;
  complete: (answers: StepAnswer[], durationMs: number) => Promise<CompletionView>;
  discardForSafety: () => Promise<void>;
  feedback: (insightId: number, value: InsightFeedbackValue) => Promise<void>;
  correction: (insightId: number, reason: CorrectionReason) => Promise<void>;
}

export const useInnerRepV2Store = create<State>((set, get) => ({
  status: 'idle', userId: null, dayKey: '', today: null, practiceDays: 0, mirror: EMPTY_MIRROR, receipt: null,
  load: async (userId) => {
    // another user on this device must never inherit this one's in-memory state
    if (get().userId && get().userId !== userId) set({ today: null, practiceDays: 0, mirror: EMPTY_MIRROR, receipt: null });
    set({ status: get().today ? 'ready' : 'loading', userId });
    if (process.env.EXPO_PUBLIC_ENTITLEMENT === '1') void (require('./entitlement-store') as typeof import('./entitlement-store')).useEntitlementStore.getState().sync(userId);
    try { await runtime.init(userId); const today = runtime.today(); await recordServed(runtime, today, served, { userId, dayKey: dayKeyNow() }); set({ today, practiceDays: runtime.practiceDaysThisMonth(), mirror: runtime.mirror(), receipt: runtime.receipt(), status: 'ready', dayKey: dayKeyNow() }); }
    catch { set({ status: 'error' }); }
  },
  progress: (answers) => { void runtime.progress(answers); },
  complete: async (answers, durationMs) => {
    const result = await runtime.complete(answers, durationMs);
    if (process.env.EXPO_PUBLIC_ENTITLEMENT === '1') await (require('./entitlement-store') as typeof import('./entitlement-store')).useEntitlementStore.getState().engineRepCompleted().catch(() => {});   // the only trial trigger; a failure never blocks the person's closing
    set({ today: { kind: 'done', ...result }, practiceDays: runtime.practiceDaysThisMonth(), mirror: runtime.mirror(), receipt: runtime.receipt() });
    return result;
  },
  discardForSafety: async () => { await runtime.discardForSafety(); served.safetyDay = dayKeyNow(); set({ today: runtime.today() }); },   // S1a: nothing is persisted for the rest of this day
  feedback: async (insightId, value) => { await runtime.feedback(insightId, value); set({ mirror: runtime.mirror() }); },
  correction: async (insightId, reason) => { await runtime.correction(insightId, reason); set({ mirror: runtime.mirror() }); },
}));

/** Sign-out: remove every v2 key on this device and drop in-memory state. */
export async function clearInnerRepV2Data() {
  if (process.env.EXPO_PUBLIC_ENTITLEMENT === '1') await (require('./entitlement-store') as typeof import('./entitlement-store')).useEntitlementStore.getState().signOut().catch(() => {});
  await clearV2Keys(AsyncStorage as unknown as KV);
  await clearPilotKeys(AsyncStorage as unknown as KV);
  // in-memory pilot state too (staging only; the direct env comparison is inlined, so Production bundles contain no pilot store)
  if (process.env.EXPO_PUBLIC_PILOTS === '1') (require('./pilot-store') as typeof import('./pilot-store')).resetPilotMemory();
  if (process.env.EXPO_PUBLIC_HISTORY_SYNC === '1') {   // continuity: stop recording for this account, clear its device-local continuity state, drop the controller
    (require('../lib/innerRep/backup/hook') as typeof import('../lib/innerRep/backup/hook')).historyBus.detach();
    await (require('../lib/innerRep/backup/keys') as typeof import('../lib/innerRep/backup/keys')).clearHistoryKeys(AsyncStorage as unknown as KV);
    (require('./continuity-store') as typeof import('./continuity-store')).stopContinuity();
  }
  resetServedGuard(served);
  useInnerRepV2Store.setState({ status: 'idle', userId: null, dayKey: '', today: null, practiceDays: 0, mirror: EMPTY_MIRROR, receipt: null });
}

/** Clears THIS DEVICE's practice for the signed-in account (engine state, device-only pilots) and reloads a fresh Today. Never touches an account copy and never signs out. */
export async function resetDevicePractice(userId: string) {
  await clearV2Keys(AsyncStorage as unknown as KV);
  await clearPilotKeys(AsyncStorage as unknown as KV);
  if (process.env.EXPO_PUBLIC_PILOTS === '1') (require('./pilot-store') as typeof import('./pilot-store')).resetPilotMemory();
  resetServedGuard(served);
  useInnerRepV2Store.setState({ status: 'idle', today: null, practiceDays: 0, mirror: EMPTY_MIRROR, receipt: null });
  await useInnerRepV2Store.getState().load(userId);
}

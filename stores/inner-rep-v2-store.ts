import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepAnswer } from '../lib/innerRep/v2/contracts';
import { CorrectionReason } from '../lib/innerRep/v2/types';
import { CompletionView, InsightFeedbackValue, KV, TodayView, clearV2Keys, createRuntime } from '../lib/innerRep/runtime/v2-runtime';
import type { MirrorModel } from '../lib/innerRep/runtime/mirror-contract';
import type { Receipt } from '../lib/innerRep/runtime/receipt';
import { clearPilotKeys } from '../lib/innerRep/pilots/keys';

// Thin reactive wrapper around the v2 runtime adapter. All behaviour lives in lib/innerRep/runtime/v2-runtime.ts, which
// delegates every decision to the frozen engine. DEV PERSISTENCE: structured state in AsyncStorage (browser localStorage on
// web), per user, device-local. There is no Supabase table for v2 (no migration has been approved or applied).
const EMPTY_MIRROR: MirrorModel = { version: 1, engineVersion: 'v2.0.1-correction-fix', state: 'empty', retained: { instances: 0, from: null, mayBeTruncated: false }, statements: [], sections: { said: [], practised: [], come_up: [], carrying: [], readings: [], shifted: [], unknown: [] } };
const runtime = createRuntime({ storage: AsyncStorage as unknown as KV });

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
    try { await runtime.init(userId); set({ today: runtime.today(), practiceDays: runtime.practiceDaysThisMonth(), mirror: runtime.mirror(), receipt: runtime.receipt(), status: 'ready', dayKey: new Date().toDateString() }); }
    catch { set({ status: 'error' }); }
  },
  progress: (answers) => { void runtime.progress(answers); },
  complete: async (answers, durationMs) => {
    const result = await runtime.complete(answers, durationMs);
    set({ today: { kind: 'done', ...result }, practiceDays: runtime.practiceDaysThisMonth(), mirror: runtime.mirror(), receipt: runtime.receipt() });
    return result;
  },
  discardForSafety: async () => { await runtime.discardForSafety(); set({ today: runtime.today() }); },
  feedback: async (insightId, value) => { await runtime.feedback(insightId, value); set({ mirror: runtime.mirror() }); },
  correction: async (insightId, reason) => { await runtime.correction(insightId, reason); set({ mirror: runtime.mirror() }); },
}));

/** Sign-out: remove every v2 key on this device and drop in-memory state. */
export async function clearInnerRepV2Data() {
  await clearV2Keys(AsyncStorage as unknown as KV);
  await clearPilotKeys(AsyncStorage as unknown as KV);
  useInnerRepV2Store.setState({ status: 'idle', userId: null, dayKey: '', today: null, practiceDays: 0, mirror: EMPTY_MIRROR, receipt: null });
}

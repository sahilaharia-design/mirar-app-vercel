import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KV } from '../lib/innerRep/runtime/v2-runtime';
import { PilotStore } from '../lib/innerRep/pilots/store';
import { clearPilotKeys } from '../lib/innerRep/pilots/keys';
import type { PAnswer, PilotId, PilotRecord } from '../lib/innerRep/pilots/types';
import type { PilotSession } from '../lib/innerRep/pilots/session';

// Thin reactive wrapper over lib/innerRep/pilots/store.ts. Pilots are an optional extra practice behind
// EXPO_PUBLIC_PILOTS=1 (staging only). Device-local; cleared on sign-out together with the v2 engine data.
const core = new PilotStore({ storage: AsyncStorage as unknown as KV });

interface State {
  userId: string | null; ready: boolean; tick: number;
  load: (userId: string) => Promise<void>;
  session: () => PilotSession | null;
  records: () => PilotRecord[];
  resumable: () => { pilot: PilotId } | null;
  today: () => string;
  start: (p: PilotId) => PilotSession;
  answer: (a: PAnswer) => Promise<void>;
  /** persist the draft and re-render after something other than answer()/back() changed the session (the Attend board replay) */
  changed: () => Promise<void>;
  back: () => Promise<void>;
  close: (how: 'finish' | 'leave') => Promise<PilotRecord | null>;
  discard: () => Promise<void>;
  replaceRecords: (r: PilotRecord[]) => Promise<void>;
  clearAll: () => Promise<void>;
}
export const usePilotStore = create<State>((set, get) => {
  const bump = () => set({ tick: get().tick + 1 });
  return {
    userId: null, ready: false, tick: 0,
    load: async (userId) => { await core.init(userId); set({ userId, ready: true, tick: get().tick + 1 }); },
    session: () => core.session(), records: () => core.records(), resumable: () => core.resumable(), today: () => core.context().today,
    start: (p) => { const s = core.start(p); bump(); return s; },
    answer: async (a) => { const s = core.session(); if (!s) return; s.answer(a); await core.saveDraft(); bump(); },
    changed: async () => { await core.saveDraft(); bump(); },
    back: async () => { const s = core.session(); if (s && s.back()) { await core.saveDraft(); bump(); } },
    close: async (how) => { const r = await core.close(how); bump(); return r; },
    discard: async () => { await core.discard(); bump(); },
    replaceRecords: async (r) => { await core.replaceRecords(r); bump(); },
    clearAll: async () => { await core.clearAll(); bump(); },
  };
});

/** Sign-out: remove every pilot key on this device and drop in-memory state. */
export async function clearPilotData() {
  await clearPilotKeys(AsyncStorage as unknown as KV);
  usePilotStore.setState({ userId: null, ready: false });
}

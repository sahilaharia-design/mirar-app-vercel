import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Access, EntitlementClient, EntKV, EntServerPort, Reply } from '../lib/entitlement/client';
import { createRpcPort } from '../lib/entitlement/rpc-port';

// Reactive wrapper over the entitlement client (contract: docs/product/TRIAL_ENTITLEMENT_CONTRACT.md). DEFAULT OFF.
// With EXPO_PUBLIC_ENTITLEMENT unset this store is inert: access is always allowed and nothing calls the server, so a build without the flag behaves as
// today. The flag must not be set until the entitlement SQL exists on the project the build talks to (E2) and the presentation (L5) exists.
// The store never blocks viewing history, export or deletion; it only reports whether NEW member practice is allowed.
const ON = () => process.env.EXPO_PUBLIC_ENTITLEMENT === '1';
const kv: EntKV = {
  get: (k) => AsyncStorage.getItem(k),
  set: (k, v) => AsyncStorage.setItem(k, v),
  del: (k) => AsyncStorage.removeItem(k),
};
const OPEN: Access = { memberReps: true, viewHistory: true, exportFile: true, deleteAccount: true, reason: 'ok_trial', clockAnomaly: false, endsAt: null };

let port: EntServerPort | null = null;
let client: EntitlementClient | null = null;
let deviceNow: () => number = () => Date.now();
/** Test hook: inject the server port and the device clock. Production code never calls this. */
export function __setEntitlementDeps(d: { port: EntServerPort; now?: () => number; kv?: EntKV }) { port = d.port; deviceNow = d.now ?? (() => Date.now()); client = new EntitlementClient({ kv: d.kv ?? kv, device: deviceNow, server: d.port }); }
function ensure(): EntitlementClient | null {
  if (!ON()) return null;
  if (!client) {
    if (!port) { const { supabase } = require('../lib/supabase') as typeof import('../lib/supabase'); port = createRpcPort(async (fn) => (await supabase.rpc(fn)) as never); }
    client = new EntitlementClient({ kv, device: deviceNow, server: port });
  }
  return client;
}

interface State {
  userId: string | null; access: Access; lastReply: Reply | null; tick: number;
  /** launch, sign-in, foreground after a day, or "check my membership" */
  sync: (userId: string) => Promise<void>;
  /** recompute access from the cache and clocks (cheap; call before offering a NEW member practice) */
  refresh: (opts?: { repInProgress?: boolean }) => Promise<Access>;
  /** the engine's Daily Inner Rep was completed successfully (the ONLY event that can start the trial) */
  engineRepCompleted: () => Promise<void>;
  /** a pilot session finished with status 'completed'. A member practice, never a trial start */
  pilotCompleted: () => Promise<void>;
  signOut: () => Promise<void>;
}
export const useEntitlementStore = create<State>((set, get) => ({
  userId: null, access: OPEN, lastReply: null, tick: 0,
  sync: async (userId) => {
    const c = ensure(); if (!c) return;
    if (get().userId && get().userId !== userId) set({ access: OPEN, lastReply: null });          // another account must never inherit this one's answer
    set({ userId });
    const r = await c.sync(userId); set({ lastReply: r, access: await c.access(userId), tick: get().tick + 1 });
  },
  refresh: async (opts) => { const c = ensure(); const u = get().userId; if (!c || !u) return get().access; const a = await c.access(u, opts); set({ access: a, tick: get().tick + 1 }); return a; },
  engineRepCompleted: async () => {
    const c = ensure(); const u = get().userId; if (!c || !u) return;
    const r = await c.recordFirstRepCompleted(u); if (r === 'not_first') await c.recordRepCompleted(u);
    set({ access: await c.access(u), tick: get().tick + 1 });
  },
  pilotCompleted: async () => { const c = ensure(); const u = get().userId; if (!c || !u) return; await c.recordRepCompleted(u); set({ access: await c.access(u), tick: get().tick + 1 }); },
  signOut: async () => { const c = ensure(); const u = get().userId; if (c && u) await c.signOut(u); set({ userId: null, access: OPEN, lastReply: null, tick: get().tick + 1 }); },
}));

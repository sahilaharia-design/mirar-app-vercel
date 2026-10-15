import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ENGINE_VERSION } from '../lib/innerRep/v2/config';
import { createRuntime, KV, V2_KEY_PREFIX } from '../lib/innerRep/runtime/v2-runtime';
import { ContinuityController, ContinuitySnapshotX } from '../lib/innerRep/backup/continuity';
import { historyBus } from '../lib/innerRep/backup/hook';
import { MemKV } from '../lib/innerRep/backup/replay';
import { StubService } from '../lib/innerRep/backup/stub-service';
import type { FileSaver } from '../lib/innerRep/backup/export';
import { resetDevicePractice, useInnerRepV2Store } from './inner-rep-v2-store';

// Mounted ONLY behind EXPO_PUBLIC_HISTORY_SYNC=1 (staging). G3 is LOCAL-ONLY: the service is a STUB held in memory (reload resets it); there is no network
// code in this file or anywhere on this path. Explicit simulated outcomes are chosen in the review panel (components/continuity/StubServicePanel.tsx).
const stub = new StubService({ engine: ENGINE_VERSION });
export const getStubService = () => stub;

/** A saver that CONFIRMS the write (File System Access API where it exists). A plain browser download cannot confirm, so it does not count: where this is null, export is unavailable. */
const confirmingSaver: FileSaver | null = Platform.OS === 'web' && typeof window !== 'undefined' && typeof (window as any).showSaveFilePicker === 'function'
  ? async (text, name) => { try { const h = await (window as any).showSaveFilePicker({ suggestedName: name, types: [{ description: 'Mirar practice', accept: { 'application/json': ['.json'] } }] }); const w = await h.createWritable(); await w.write(text); await w.close(); return true; } catch { return false; } }
  : null;
const EXPORT_ENABLED = process.env.EXPO_PUBLIC_HISTORY_EXPORT === '1';      // default off: export/import is approved as a feature, pending safe-handling review and usability testing

interface S { uid: string | null; controller: ContinuityController | null; snapshot: ContinuitySnapshotX | null; start: (uid: string, signOut: () => Promise<void>) => Promise<void> }
let unsubscribe: (() => void) | null = null; let starting: Promise<void> | null = null;
export const useContinuityStore = create<S>((set, get) => ({
  uid: null, controller: null, snapshot: null,
  start: async (uid, signOut) => {
    if (get().uid === uid && get().controller) return; if (starting) return starting;
    starting = (async () => {
      stopContinuity();
      const controller = new ContinuityController({
        uid, engine: ENGINE_VERSION, port: stub.port(uid), kv: AsyncStorage as unknown as KV, now: () => new Date(),
        exportEnabled: EXPORT_ENABLED, saveFile: confirmingSaver,
        makeRuntime: () => { const clock = { d: new Date() }; const kv = new MemKV(); return { rt: createRuntime({ storage: kv, now: () => clock.d }), clock, kv }; },
        applyRebuilt: async (b) => { const key = `${V2_KEY_PREFIX}:${uid}`; const blob = b.kv?.m.get(key); if (blob) await AsyncStorage.setItem(key, blob); else await AsyncStorage.removeItem(key); await useInnerRepV2Store.getState().load(uid); historyBus.reseed(get().controller?.client.journal() ?? []); },
        clearDeviceState: async () => { await resetDevicePractice(uid); historyBus.reseed([]); },
        signOut,
      });
      await controller.load(); unsubscribe = controller.subscribe((snapshot) => set({ snapshot }));
      historyBus.attach((e) => void controller.onEvent(e), controller.client.journal());
      set({ uid, controller, snapshot: controller.snap });
    })().finally(() => { starting = null; });
    return starting;
  },
}));
/** Sign-out or account change: the controller is disposed and nothing is written back. */
export function stopContinuity() { unsubscribe?.(); unsubscribe = null; const c = useContinuityStore.getState().controller; c?.dispose(); useContinuityStore.setState({ uid: null, controller: null, snapshot: null }); }

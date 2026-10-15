import type { V2Runtime } from '../runtime/v2-runtime';
import { ENGINE_VERSION } from '../v2/config';
import type { BackupEvent } from './events';
import { Recorded, recordRuntime } from './recorder';

// The bridge between the engine runtime (stores/inner-rep-v2-store.ts) and the continuity controller. Both are imported only behind the
// build flag EXPO_PUBLIC_HISTORY_SYNC=1 (a direct env comparison, so a build without it contains none of this).
type Sink = (e: BackupEvent) => void;
let sink: Sink | null = null; let queue: BackupEvent[] = []; let rec: Recorded | null = null;
export const historyBus = {
  emit(e: BackupEvent) { if (sink) sink(e); else queue.push(e); },
  /** Attach the controller for the signed-in account. Events recorded before it was ready are delivered now, in order. */
  attach(s: Sink, journal: BackupEvent[]) { rec?.attach(journal); sink = s; const q = queue; queue = []; q.forEach(s); },
  /** After this device's history was cleared or rebuilt: forget what the recorder remembered. */
  reseed(journal: BackupEvent[]) { rec?.attach(journal); },
  /** Sign-out or account change: nothing from the previous account may reach the next. */
  detach() { sink = null; queue = []; rec?.attach([]); },
};
export function attachRecorder(rt: V2Runtime): V2Runtime { rec = recordRuntime(rt, { engine: ENGINE_VERSION, now: () => new Date(), onEvent: historyBus.emit }); return rec; }

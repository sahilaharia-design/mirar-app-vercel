import { nextStep, StepAnswer } from '../v2/contracts';
import { createRuntime } from '../runtime/v2-runtime';
import { BackupEvent } from './events';
import { localIso, recordRuntime } from './recorder';
import { MemKV, replayInto } from './replay';

// A scripted "other device", for EXPLICIT simulated service outcomes (review builds and tests only). It uses the real engine runtime: it replays the
// account's current history, then completes one practice on the given day by choosing the first offered option at every step. The events it returns
// are exactly what a real second device would have recorded. Nothing here touches a network.
export async function phantomDay(uid: string, engine: string, accountEvents: BackupEvent[], day: Date): Promise<BackupEvent[]> {
  const clock = { d: new Date(day) }; const base = createRuntime({ storage: new MemKV(), now: () => clock.d });
  await replayInto(base, clock, uid, accountEvents, engine);
  const out: BackupEvent[] = []; clock.d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);
  const rt = recordRuntime(base, { engine, now: () => clock.d, onEvent: (e) => out.push(e) });
  await rt.init(uid); const t = rt.today(); if (t.kind !== 'rep') return out;
  const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(t.context, a); if (!st) break;
    if (st.type === 'choice') a.push({ stepId: st.id, kind: 'option', optionId: st.options[0].id }); else if (st.type === 'timeframe') a.push({ stepId: st.id, kind: 'timeframe', timeframe: 'none' }); else if (st.type === 'domain_chips') a.push({ stepId: st.id, kind: 'domain', domain: st.domains[0] }); else if (st.type === 'yes_no') a.push({ stepId: st.id, kind: 'no' }); else a.push({ stepId: st.id, kind: 'skip' }); }
  await rt.complete(a); void localIso; return out;
}

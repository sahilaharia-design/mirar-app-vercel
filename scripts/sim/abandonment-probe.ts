// READ-ONLY DIAGNOSTIC for docs/product/MIRAR_VALUE_REALIGNMENT_SPEC.md (problem: "a question left unanswered is served again").
// Drives the unchanged runtime. Scenario A = what the app does today (the served rep is not persisted until an answer or progress call).
// Scenario B = the same person, but the host calls the EXISTING runtime method `progress([])` right after `today()` serves a rep.
// Nothing here changes the engine or the runtime. Run: npx tsx scripts/sim/abandonment-probe.ts
import { createRuntime } from '../../lib/innerRep/runtime/v2-runtime';
import { MemKV } from '../../lib/innerRep/backup/replay';

async function run(label: string, persistOnServe: boolean) {
  const kv = new MemKV(); let clock = new Date(2026, 9, 19, 15); const rt = createRuntime({ storage: kv, now: () => clock }); const uid = 'first14-avoider-1';
  const day = (d: number) => new Date(2026, 9, 18 + d, 15); const served: string[] = [];
  clock = day(1); await rt.init(uid); rt.today(); await rt.complete([{ stepId: 'primary', kind: 'unknown' }]);        // day 1: the person answers "I don't know"
  for (const d of [2, 3, 4]) {
    clock = day(d); await rt.init(uid); const td: any = rt.today(); if (td.kind !== 'rep') break;
    if (persistOnServe) await rt.progress([]);                                                                      // B only: record that the rep was served
    served.push(`${td.payload.templateId}`);                                                                        // the person reads it and leaves, every day
  }
  clock = day(5); await rt.init(uid); const st = rt._state();
  console.log(`${label}\n  served on days 2,3,4: ${served.join(' → ')}\n  engine's record of instances: ${st.instances.map((i: any) => `${i.templateId}:${i.completed ? 'done' : i.skippedAll ? 'skipped' : 'open'}`).join(', ')}\n`);
}
(async () => { await run('A · today (served rep not persisted)', false); await run('B · host persists the served rep with the existing progress([]) call', true); })();

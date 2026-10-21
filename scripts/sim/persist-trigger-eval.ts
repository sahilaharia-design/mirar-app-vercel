// READ-ONLY EVALUATION (docs/product/MIRAR_REALIGNMENT_RECONCILIATION.md): when should the host record that a rep was shown?
//   N  today's behaviour: nothing is recorded until the person answers a step
//   S  persist-on-serve: the host calls the EXISTING runtime.progress([]) as soon as Today shows the rep
//   B  persist-on-Begin: the host calls progress([]) when the person taps Begin
// Drives the unchanged runtime and the unchanged backup recorder/replay. The same simulated person behaves identically under N, S and B
// (their intentions are drawn once per seed), so differences are caused by the trigger alone. Nothing here changes the engine, the runtime,
// the recorder, the replay code, the app or any branch. Run: npx tsx scripts/sim/persist-trigger-eval.ts
import { createRuntime } from '../../lib/innerRep/runtime/v2-runtime';
import { MemKV, replayFresh } from '../../lib/innerRep/backup/replay';
import { recordRuntime } from '../../lib/innerRep/backup/recorder';
import { BackupEvent } from '../../lib/innerRep/backup/events';
import { ENGINE_VERSION } from '../../lib/innerRep/v2/config';
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { rng } from './rng';

type Trigger = 'N' | 'S' | 'B';
type Action = 'read' | 'begin' | 'complete' | 'glance_return';
type Pattern = { id: string; blurb: string; mix: [Action, number][] };
const PATTERNS: Pattern[] = [
  { id: 'reader', blurb: 'Avoider-like: reads the question on Today and usually leaves without tapping Begin', mix: [['read', 0.6], ['begin', 0.15], ['complete', 0.25]] },
  { id: 'glancer', blurb: 'Opens Today in the morning, sometimes comes back and does it in the evening', mix: [['glance_return', 0.5], ['read', 0.4], ['complete', 0.1]] },
  { id: 'starter', blurb: 'Taps Begin, sometimes stops before answering anything', mix: [['begin', 0.4], ['complete', 0.6]] },
  { id: 'steady', blurb: 'Control: completes every day', mix: [['complete', 1]] },
];
const base = new Date(2026, 9, 19, 15); const dayAt = (d: number, h = 15) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + d - 1, h);
const settled = (s: any) => ({ ...s, seq: undefined, day: undefined, instances: s.instances.map((i: any) => ({ ...i, trace: undefined })).filter((i: any) => i.completed || i.skippedAll) });

/** replay with the one extra step the persist-on-serve and persist-on-Begin triggers need (a LOCAL copy; lib/innerRep/backup/replay.ts is not modified) */
async function replayPatched(uid: string, events: BackupEvent[]) {
  const clock = { d: new Date() }; const rt = createRuntime({ storage: new MemKV(), now: () => clock.d }); await rt.init(uid);
  const at = (iso: string, h = 15) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, h); };
  for (const e of events) {
    clock.d = at(e.day); const t = rt.today();
    if (e.kind === 'rep_completed') { if (t.kind !== 'rep' || t.payload.templateId !== e.template) throw new Error('drift: ' + e.day); await rt.complete(e.answers.map((w: any) => w.k === 'option' ? { stepId: w.s, kind: 'option', optionId: w.o } : w.k === 'domain' ? { stepId: w.s, kind: 'domain', domain: w.d } : w.k === 'timeframe' ? { stepId: w.s, kind: 'timeframe', timeframe: w.tf } : { stepId: w.s, kind: w.k })); }
    else if (e.kind === 'rep_abandoned') { if (t.kind !== 'rep' || t.payload.templateId !== e.template) throw new Error('drift: ' + e.day); await rt.progress([]); clock.d = at(e.day, 23); clock.d = new Date(clock.d.getTime() + 3600_000 * 2); await rt.init(uid); }
  }
  return rt;
}

async function runOne(trigger: Trigger, pattern: Pattern, seed: number) {
  const uid = `persist-${pattern.id}-${seed}`; const kv = new MemKV(); let clock = dayAt(1); const events: BackupEvent[] = [];
  const raw = createRuntime({ storage: kv, now: () => clock }); const rt = recordRuntime(raw, { engine: ENGINE_VERSION, now: () => clock, onEvent: (e) => events.push(e) });
  const r = rng(seed * 104729 + pattern.id.length); const acts: Action[] = []; const unk: boolean[] = [];
  for (let d = 0; d < 14; d++) { let x = r(), a: Action = pattern.mix[0][0]; for (const [act, p] of pattern.mix) { if (x < p) { a = act; break; } x -= p; } acts.push(a); unk.push(r() < 0.25); }
  const served: string[] = []; let repeats = 0;
  const answerAll = async (td: any, d: number) => { const ans: StepAnswer[] = []; for (let g = 0; g < 8; g++) { const st = nextStep(td.context, ans); if (!st) break; const a: StepAnswer = st.type === 'choice' ? (unk[d] ? { stepId: st.id, kind: 'unknown' } : { stepId: st.id, kind: 'option', optionId: st.options[0].id }) : st.type === 'timeframe' ? { stepId: st.id, kind: 'timeframe', timeframe: 'none' } : st.type === 'yes_no' ? { stepId: st.id, kind: 'no' } : { stepId: st.id, kind: 'skip' }; ans.push(a); await rt.progress(ans); if (a.kind === 'unknown') break; } await rt.complete(ans); };
  for (let d = 0; d < 14; d++) {
    clock = dayAt(d + 1, 9); await rt.init(uid); let td: any = rt.today(); if (td.kind !== 'rep') continue;
    if (trigger === 'S') await rt.progress([]);
    served.push(td.payload.templateId); if (served.length > 1 && served[served.length - 1] === served[served.length - 2]) repeats++;
    const a = acts[d];
    if (a === 'read') continue;
    if (a === 'glance_return') { clock = dayAt(d + 1, 20); await rt.init(uid); td = rt.today(); }       // the app is reopened later the same day (state is reloaded from storage)
    if (trigger === 'B') await rt.progress([]);
    if (a === 'begin') continue;
    await answerAll(td, d);
  }
  clock = dayAt(15, 9); await rt.init(uid);                                                            // the next opening flushes the last unfinished rep
  const st = rt._state(); const inst = st.instances;
  const skipped = inst.filter((i) => i.skippedAll && !i.completed).length, done = inst.filter((i) => i.completed).length;
  const eases = inst.filter((i) => (i.trace?.constraints ?? []).some((c: any) => c.name === 'ease' || c.name === 'simplify')).length;
  let replay = 'ok';
  try { const rp = await replayPatched(uid, events); if (JSON.stringify(settled(rp._state())) !== JSON.stringify(settled(st))) replay = 'state differs'; } catch (e) { replay = String((e as Error).message).slice(0, 50); }
  let replayAsShipped = 'ok';
  try { const rp = await replayFresh(uid, events, ENGINE_VERSION); if (JSON.stringify(settled(rp.rt._state())) !== JSON.stringify(settled(st))) replayAsShipped = 'state differs'; } catch (e) { replayAsShipped = String((e as Error).message).slice(0, 50); }
  return { repeats, skipped, done, eases, distinct: new Set(served).size, served: served.length, abandonEvents: events.filter((e) => e.kind === 'rep_abandoned').length, replay, replayAsShipped };
}

(async () => {
  const SEEDS = 40; const out: string[] = [];
  const P = (s = '') => out.push(s);
  P('# Persist-on-serve versus persist-on-Begin (generated, read-only)'); P();
  P(`Generated by \`scripts/sim/persist-trigger-eval.ts\`. ${SEEDS} simulated people per pattern over 14 days; the same person behaves identically under every trigger. Metrics are means per person unless stated. "Replay as shipped" runs the current \`replayFresh\`; "replay with persist step" runs a local copy that also calls \`progress([])\` when it replays an abandoned rep (the shipped replay is not modified).`); P();
  P('| Pattern | Trigger | Days served | Same exercise two days running | Reps the engine knows were left | Reps completed | Days in ease/simplify mode | Distinct exercises | `rep_abandoned` events | Replay as shipped matches | Replay with persist step matches |'); P('|---|---|---|---|---|---|---|---|---|---|---|');
  const sum: any = {};
  for (const pat of PATTERNS) for (const t of ['N', 'S', 'B'] as Trigger[]) {
    const rows: Awaited<ReturnType<typeof runOne>>[] = []; for (let s = 1; s <= SEEDS; s++) rows.push(await runOne(t, pat, s));
    const m = (k: string) => (rows.reduce((a: number, x: any) => a + x[k], 0) / SEEDS).toFixed(1);
    const ok = (k: string) => `${rows.filter((x: any) => x[k] === 'ok').length}/${SEEDS}`;
    P(`| ${pat.id} | ${t} | ${m('served')} | ${m('repeats')} | ${m('skipped')} | ${m('done')} | ${m('eases')} | ${m('distinct')} | ${m('abandonEvents')} | ${ok('replayAsShipped')} | ${ok('replay')} |`);
    sum[`${pat.id}/${t}`] = rows;
  }
  P(); P('Patterns: ' + PATTERNS.map((p) => `**${p.id}**: ${p.blurb}`).join('; ') + '.');
  const fs = require('fs'); fs.writeFileSync('docs/sim/persist-trigger-eval.md', out.join('\n') + '\n'); console.log(out.join('\n'));
})();

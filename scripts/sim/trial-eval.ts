// READ-ONLY EVALUATION: 7-day versus 14-day trial windows against the frozen v2 engine and the Mirror read model.
// Imports the engine and simulator as they are; changes no threshold, rule or file of the engine. Rest is OFF, as in the app.
// Synthetic profiles are inventions of the simulator: results describe the engine's behaviour on them, never real people.
// Run: npx tsx scripts/sim/trial-eval.ts   (writes docs/sim/trial-evaluation.md)
import { writeFileSync } from 'fs';
import { V2 } from '../../lib/innerRep/v2/config';
import { computeEvidence } from '../../lib/innerRep/v2/evidence';
import { buildMirror } from '../../lib/innerRep/runtime/mirror-contract';
import { Profile, PROFILES } from './profiles';
import { runProfile, RunResult } from './runner';

const SEEDS = 20;
const byId = (id: string) => PROFILES.find((p) => p.id === id)!;
const daily = () => true;
const EXTRA: Profile[] = [
  { id: 'engaged_explorer', name: 'Highly engaged, taps and confirms everything', days: 30, seed: 41, blurb: 'Daily, taps chips, confirms threads, a real work-and-self theme.', engage: daily,
    latent: () => ({ domains: { work: 0.7, self: 0.6 }, burden: 0.4, orientation: 'future' }), traits: { tapProb: 0.95, threadYes: 0.9, skipRate: 0.05, unknownRate: 0.02, orientTap: 0.9 } },
  { id: 'disengaging', name: 'Disengaging (daily for 6 days, then thinning, then gone at day 12)', days: 30, seed: 42, blurb: 'Starts keen, drifts away.', engage: (d) => (d < 6 ? true : d < 12 ? d % 3 === 0 : false),
    latent: () => ({ domains: { work: 0.6 }, burden: 0.4 }) },
];
const COHORT: { p: Profile; group: string }[] = [
  { p: byId('stable'), group: 'stable' },
  { p: byId('work_stress'), group: 'stressed' },
  { p: byId('high_burden'), group: 'stressed' },
  { p: byId('relationship_conflict'), group: 'stressed' },
  { p: byId('dont_know'), group: 'uncertain' },
  { p: byId('introspective_inactive'), group: 'uncertain' },
  { p: byId('disagrees'), group: 'uncertain' },
  { p: byId('every_2_3_days'), group: 'irregular' },
  { p: byId('absence_week'), group: 'irregular' },
  { p: byId('committer'), group: 'engaged' },
  { p: EXTRA[0], group: 'engaged' },
  { p: EXTRA[1], group: 'disengaging' },
];

const firstEngaged = (p: Profile) => { for (let d = 0; d < 20; d++) if (p.engage(d, () => 0.5)) return d; return 0; };
const med = (a: number[]) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f = (n: number, d = 1) => (Number.isNaN(n) ? 'n/a' : n.toFixed(d));

interface Cell {
  reps: number; templates: number; capacities: number; domains: number;
  mirrorImmediate: number; sections: Record<string, number>; mirrorState: string;
  eligibleByEnd: boolean; firstEligible: number | null; insights: number; firstInsight: number | null; refusalsAtEnd: number;
  eligibleNotDelivered: boolean; kinds: string[]; blocked: string[]; nearMiss: string[]; evidenceObjects: boolean; layers: Record<string, number>; followUpReps: number;
}
/** window = trial days counted from the person's first completed rep (day 0 = first engaged day). `lost` = days between signup and first rep (signup-based trial). */
function cell(p: Profile, seed: number, window: number, lost = 0): Cell {
  const s0 = firstEngaged(p);
  const days = s0 + Math.max(0, window - lost);                       // the engine's own timeline
  const r: RunResult = runProfile({ ...p, seed, days }, {}, false);
  const done = r.state.instances.filter((i) => i.completed && !i.skippedAll);
  const end = Math.max(0, days - 1);
  const mirror = buildMirror(r.state, end);
  const sections: Record<string, number> = {};
  for (const [k, v] of Object.entries(mirror.sections)) sections[k] = v.length;
  const immediate = Object.entries(sections).filter(([k]) => k !== 'readings').reduce((a, [, v]) => a + v, 0);
  // Eligibility is the ENGINE's own verdict per day (chooseInsight decisions): an active, insight-capable reading is 'shown' or 'eligible_not_shown'.
  const eligNote = (n: string) => /: (shown|eligible_not_shown) \(/.test(n);
  let firstEligible: number | null = null; for (const l of r.logs) if (l.insightNotes.some(eligNote)) { firstEligible = l.day - s0; break; }
  const blocked: string[] = []; for (const l of r.logs) for (const n of l.insightNotes) { const m = /: eligible_not_shown \((.*)\)$/.exec(n); if (m) blocked.push(m[1].replace(/\d+d ago \(cooldown \d+d\)/, 'cooldown').replace(/weekly cap \d+/, 'weekly cap')); }
  const lastEng = [...r.logs].reverse().find((l) => l.engaged && l.refusals.length); const nearMiss = (lastEng?.refusals ?? []).map((x: any) => String(x.reason ?? x.kind ?? 'refusal'));
  const evidenceObjects = r.logs.some((l) => l.newEvidence.length > 0);
  let firstInsight: number | null = null; for (const l of r.logs) if (l.insight) { firstInsight = l.day - s0; break; }
  const layers: Record<string, number> = {}; done.forEach((i) => (layers[i.layer] = (layers[i.layer] ?? 0) + 1));
  const followUpReps = done.filter((i) => ['thread_check', 'event_check', 'resolution_check', 'commitment_due', 'commitment_check'].includes(String(i.intent))).length;
  const ev = computeEvidence(r.state, end, V2);
  const eligible = firstEligible !== null;
  return {
    reps: done.length, templates: new Set(done.map((i) => i.templateId)).size, capacities: new Set(done.map((i) => i.capacity)).size,
    domains: new Set(r.state.observations.map((o: any) => o.domain).filter(Boolean)).size,
    mirrorImmediate: immediate, sections, mirrorState: mirror.state,
    eligibleByEnd: eligible, firstEligible, insights: r.state.insights.length, firstInsight, refusalsAtEnd: ev.refusals.length,
    eligibleNotDelivered: eligible && r.state.insights.length === 0, kinds: r.state.insights.map((i) => i.kind), blocked, nearMiss, evidenceObjects, layers, followUpReps,
  };
}

const out: string[] = [];
const P = (s = '') => out.push(s);
P('# Trial-length evaluation: 7 versus 14 days against the frozen engine (generated, read-only)');
P();
P('Generated by `scripts/sim/trial-eval.ts`. Engine version, thresholds and evidence rules are untouched (`V2` imported as is; Mirror rest rule OFF as in the app). Profiles are synthetic and defined in `scripts/sim/profiles.ts` plus two added in the script (`engaged_explorer`, `disengaging`). **Nothing here describes real people.** 20 seeds per profile; seeds change the engine tie-breaks and the simulated answers.');
P();

const WINDOWS = [3, 5, 7, 10, 14, 21, 28];
// ── Table 1: per profile, 7 vs 14, start at first completed rep
P('## 1. Trial starting at the first completed rep (medians across 20 seeds)');
P();
P('| Profile (group) | Window | Reps | Distinct exercises | Capacities | Immediate Mirror statements (no reading) | Eligible by end | First eligible (trial day) | Insights shown | First insight (trial day) | Runs with ≥1 insight | Runs eligible but nothing shown |');
P('|---|---|---|---|---|---|---|---|---|---|---|---|');
const agg: Record<string, Record<number, Cell[]>> = {};
for (const { p, group } of COHORT) {
  agg[p.id] = {};
  for (const w of WINDOWS) {
    const cells = Array.from({ length: SEEDS }, (_, k) => cell(p, p.seed + k * 1000, w));
    agg[p.id][w] = cells;
    if (w !== 7 && w !== 14) continue;
    const ins = cells.filter((c) => c.insights > 0);
    P(`| ${p.name} (${group}) | ${w} | ${f(med(cells.map((c) => c.reps)), 0)} | ${f(med(cells.map((c) => c.templates)), 0)} | ${f(med(cells.map((c) => c.capacities)), 0)} | ${f(med(cells.map((c) => c.mirrorImmediate)), 0)} | ${Math.round((100 * cells.filter((c) => c.eligibleByEnd).length) / SEEDS)}% | ${f(med(cells.map((c) => c.firstEligible ?? NaN).filter((x) => !Number.isNaN(x))), 0)} | ${f(med(cells.map((c) => c.insights)), 0)} | ${ins.length ? f(med(ins.map((c) => c.firstInsight as number)), 0) : 'none'} | ${Math.round((100 * ins.length) / SEEDS)}% | ${Math.round((100 * cells.filter((c) => c.eligibleNotDelivered).length) / SEEDS)}% |`);
  }
}
P();
P('"Trial day" counts the first completed-rep day as day 1 when read as `value + 1`; the table gives the zero-based offset from the first engaged day (0 = the first rep itself).');
P();

// ── Table 2: all windows, cohort totals
P('## 2. Cohort summary by window length (all profiles, all seeds; start at first rep)');
P();
P('| Window | Mean reps | Mean distinct exercises | Mean immediate Mirror statements | Runs with ≥1 eligible evidence | Runs with ≥1 insight shown | Median first insight (offset) among those | Runs with zero insight |');
P('|---|---|---|---|---|---|---|---|');
for (const w of WINDOWS) {
  const all = COHORT.flatMap(({ p }) => agg[p.id][w]);
  const ins = all.filter((c) => c.insights > 0);
  P(`| ${w} days | ${f(mean(all.map((c) => c.reps)))} | ${f(mean(all.map((c) => c.templates)))} | ${f(mean(all.map((c) => c.mirrorImmediate)))} | ${Math.round((100 * all.filter((c) => c.eligibleByEnd).length) / all.length)}% | ${Math.round((100 * ins.length) / all.length)}% | ${f(med(ins.map((c) => c.firstInsight as number)), 0)} | ${Math.round((100 * (all.length - ins.length)) / all.length)}% |`);
}
P();

// ── Table 3: by group, 7 vs 14
P('## 3. By behaviour group: share of runs that received at least one evidence-bound insight');
P();
P('| Group | 7 days | 14 days | Mean reps (7) | Mean reps (14) |');
P('|---|---|---|---|---|');
for (const g of ['stable', 'stressed', 'uncertain', 'irregular', 'engaged', 'disengaging']) {
  const ids = COHORT.filter((c) => c.group === g).map((c) => c.p.id);
  const a7 = ids.flatMap((id) => agg[id][7]), a14 = ids.flatMap((id) => agg[id][14]);
  const pc = (a: Cell[]) => Math.round((100 * a.filter((c) => c.insights > 0).length) / a.length);
  P(`| ${g} | ${pc(a7)}% | ${pc(a14)}% | ${f(mean(a7.map((c) => c.reps)))} | ${f(mean(a14.map((c) => c.reps)))} |`);
}
P();

// ── Table 4: eligibility vs delivery, kinds
P('## 4. Evidence eligibility versus actual delivery (all profiles, all seeds)');
P();
P('| Window | Runs where evidence became eligible | …and an insight was actually shown | Eligible but nothing shown | Insight kinds shown (count) |');
P('|---|---|---|---|---|');
for (const w of [7, 14]) {
  const all = COHORT.flatMap(({ p }) => agg[p.id][w]);
  const el = all.filter((c) => c.eligibleByEnd), shown = el.filter((c) => c.insights > 0);
  const kinds: Record<string, number> = {}; all.forEach((c) => c.kinds.forEach((k) => (kinds[k] = (kinds[k] ?? 0) + 1)));
  P(`| ${w} days | ${el.length}/${all.length} | ${shown.length} | ${el.length - shown.length} | ${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'} |`);
}
P();
P('Eligibility is the engine\'s own per-day verdict (`chooseInsight`: an active, insight-capable reading is `shown` or `eligible_not_shown`); anything else (building, below threshold, or evidence that only drives continuity) is `not_eligible`. Delivery is the engine\'s separate choice (`chooseInsight`: cooldowns, a cap per 7 days, tentative mode, feedback suppression, and the rep having been completed with a non-unknown primary answer). The two are never merged or tuned here.');
P();

// ── Table 5: signup-based trial with delayed first rep
P('## 5. Trial starting at signup, with the first rep delayed by k days (profile timeline starts at the first rep)');
P();
P('Reps and insights available inside the window when the first completed rep happens k days after signup.');
P();
P('| Window | k=0 reps / % with insight | k=1 | k=2 | k=3 | k=5 |');
P('|---|---|---|---|---|---|');
for (const w of [7, 14]) {
  const row = [0, 1, 2, 3, 5].map((k) => {
    const all = COHORT.flatMap(({ p }) => Array.from({ length: SEEDS }, (_, s) => cell(p, p.seed + s * 1000, w, k)));
    return `${f(mean(all.map((c) => c.reps)))} / ${Math.round((100 * all.filter((c) => c.insights > 0).length) / all.length)}%`;
  });
  P(`| ${w} days | ${row.join(' | ')} |`);
}
P();

// ── Table 6: what a person without an insight still has (engaged, no insight runs)
P('## 6. Runs with no insight: what the Mirror still contains');
P();
P('| Window | Runs with no insight | Of those, mean reps | mean "said" statements | mean "practised" | mean "come_up" | mean "carrying" (commitments) | mean "unknown" | Mirror state empty / sparse / populated |');
P('|---|---|---|---|---|---|---|---|---|');
for (const w of [7, 14]) {
  const none = COHORT.flatMap(({ p }) => agg[p.id][w]).filter((c) => c.insights === 0 && c.reps > 0);
  const sec = (k: string) => f(mean(none.map((c) => c.sections[k] ?? 0)));
  const st = (k: string) => none.filter((c) => c.mirrorState === k).length;
  P(`| ${w} days | ${none.length} | ${f(mean(none.map((c) => c.reps)))} | ${sec('said')} | ${sec('practised')} | ${sec('come_up')} | ${sec('carrying')} | ${sec('unknown')} | ${st('empty')} / ${st('sparse')} / ${st('populated')} |`);
}
P();

// ── Sample first-insight kinds per profile at 14 days
P('## 7. When each profile\'s first insight arrives (offset from the first rep; share of 20 seeds)');
P();
P('| Profile | by day 3 | by day 5 | by day 7 | by day 10 | by day 14 | by day 21 | by day 28 |');
P('|---|---|---|---|---|---|---|---|');
for (const { p } of COHORT) {
  const cells = WINDOWS.map((w) => `${Math.round((100 * agg[p.id][w].filter((c) => c.insights > 0).length) / SEEDS)}%`);
  P(`| ${p.name} | ${cells.join(' | ')} |`);
}

P();
P('## 8. Why nothing was shown (engine reasons, counted over runs with no insight)');
P();
P('| Window | Runs with no insight | Engine reasons for an eligible reading not being shown (runs affected) | Most common near-miss reasons on the last active day (runs affected) |');
P('|---|---|---|---|');
for (const w of [7, 14]) {
  const none = COHORT.flatMap(({ p }) => agg[p.id][w]).filter((c) => c.insights === 0);
  const count = (get: (c: Cell) => string[]) => { const m: Record<string, number> = {}; none.forEach((c) => new Set(get(c)).forEach((r) => (m[r] = (m[r] ?? 0) + 1))); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} (${v})`).join('; ') || 'none'; };
  P(`| ${w} days | ${none.length} | ${count((c) => c.blocked)} | ${count((c) => c.nearMiss.map((x) => x.replace(/\d+/g, 'N')))} |`);
}

P();
P('## 9. What the practice itself contains inside each window (mean per run)');
P();
P('| Window | Completed reps | Training reps | Context reps (asking about something you raised) | Continuity reps (follow-ups on threads, events, commitments) | Reps that were a follow-up on something you named earlier |');
P('|---|---|---|---|---|---|');
for (const w of [3, 5, 7, 10, 14, 21]) {
  const all = COHORT.flatMap(({ p }) => agg[p.id][w]);
  const L = (k: string) => f(mean(all.map((c) => c.layers[k] ?? 0)));
  P(`| ${w} days | ${f(mean(all.map((c) => c.reps)))} | ${L('training')} | ${L('context')} | ${L('continuity')} | ${f(mean(all.map((c) => c.followUpReps)))} |`);
}
writeFileSync('docs/sim/trial-evaluation.md', out.join('\n') + '\n');
console.log(out.join('\n'));

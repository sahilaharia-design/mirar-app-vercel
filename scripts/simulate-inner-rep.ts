// Scenario simulator for the Inner Rep engine (dev tool, not shipped in the app).
// Run: npx tsx scripts/simulate-inner-rep.ts [scenarioNumber]
import { decideToday } from '../lib/innerRep/engine';
import { buildInsight, continuityCue } from '../lib/innerRep/evidence';
import { CATALOG_BY_ID } from '../lib/innerRep/catalog';
import { Exercise, RepAnswer, RepRecord } from '../lib/innerRep/types';

type Ans = RepAnswer & { feedback?: 'accurate' | 'partly' | 'no' | 'unsure' };
type Policy = (ex: Exercise, day: number) => Ans;
interface Scenario { name: string; days: number; active?: (d: number) => boolean; policy: Policy }

const byTag = (ex: Exercise, key: string, tag: string) => [...(ex.options ?? []), ...(ex.statements ?? [])].find((o) => o.key === key && o.tag === tag)?.id;
const first = (ex: Exercise) => (ex.options ?? ex.statements ?? [])[0]?.id;
const calm = (ex: Exercise): Ans => {
  const opts = [...(ex.options ?? []), ...(ex.statements ?? [])].filter((o) => !o.burden);
  const pick = opts[0] ?? (ex.options ?? ex.statements ?? [])[0];
  if (ex.interaction_type === 'words') return { words: 'my sister', unknown: false };
  return { primary: pick?.id, followUp: ex.follow_up?.options[0]?.id, unknown: false };
};
const burdened = (ex: Exercise): Ans => {
  const opts = [...(ex.options ?? []), ...(ex.statements ?? [])].filter((o) => o.burden);
  const pick = opts[0];
  if (!pick) return calm(ex);
  return { primary: pick.id, followUp: ex.follow_up?.options[0]?.id, unknown: false };
};
const unknown: Ans = { unknown: true };

const S: Scenario[] = [
  { name: '1. Generally stable', days: 14, policy: (ex) => calm(ex) },
  { name: '2. Repeated work stress', days: 14, policy: (ex) => {
      if (ex.id === 'en_drain_restore') return { primary: 'work', followUp: 'no', unknown: false };
      if (ex.id === 'foc_attention') return { primary: 'work', followUp: 'avoiding', unknown: false };
      if (ex.id === 'foc_loops') return { primary: 'many', unknown: false };
      return calm(ex); } },
  { name: '3. Relationship conflict (days 3-8)', days: 14, policy: (ex, d) => {
      if (d >= 3 && d <= 8) { if (ex.capacity === 'relationships') return burdened(ex); if (ex.id === 'en_drain_restore') return { primary: 'people', followUp: 'no', unknown: false }; if (ex.id === 'foc_attention') return { primary: 'person', followUp: 'avoiding', unknown: false }; }
      return calm(ex); } },
  { name: '4. Introspective, rarely acts', days: 21, policy: (ex) => {
      if (ex.id === 'act_followthrough') return { primary: 'yes', followUp: 'unclear', unknown: false };
      if (ex.id === 'act_tiny') return { primary: 'rest', unknown: false };
      if (ex.id === 'dir_know_vs_act') return { primary: 'already_know', unknown: false };
      return calm(ex); } },
  { name: '5. Action-oriented, avoids reflection', days: 14, policy: (ex) => {
      if (ex.interaction_type === 'words' || ex.interaction_type === 'choice_then_reflection') return { primary: first(ex), unknown: false };
      if (ex.reflection_oriented && ex.capacity === 'direction') return unknown;
      return calm(ex); } },
  { name: '6. Irregular (days 1,2,6,13,14,24)', days: 24, active: (d) => [1, 2, 6, 13, 14, 24].includes(d), policy: (ex) => calm(ex) },
  { name: '7. Always "I don\'t know"', days: 14, policy: () => unknown },
  { name: '8. One major event, no repeated pattern', days: 14, policy: (ex, d) => (d === 4 ? burdened(ex) : calm(ex)) },
  { name: '9. Disagrees with Mirar', days: 21, policy: (ex) => {
      if (ex.id === 'en_drain_restore') return { primary: 'work', followUp: 'no', unknown: false, feedback: 'no' };
      if (ex.id === 'foc_attention') return { primary: 'work', unknown: false, feedback: 'no' };
      return { ...calm(ex), feedback: 'no' }; } },
  { name: '10. Apparent pattern later reverses (work stress days 1-10, then gone)', days: 24, policy: (ex, d) => {
      if (d <= 10) { if (ex.id === 'en_drain_restore') return { primary: 'work', followUp: 'no', unknown: false }; if (ex.id === 'foc_attention') return { primary: 'work', followUp: 'avoiding', unknown: false }; }
      if (ex.id === 'en_drain_restore') return { primary: 'nothing', followUp: 'yes', unknown: false };
      if (ex.id === 'foc_attention') return { primary: 'nothing', unknown: false };
      return calm(ex); } },
];

const only = process.argv[2] ? Number(process.argv[2]) : null;
const start = new Date('2026-10-01T09:00:00');
for (const sc of S) {
  if (only && !sc.name.startsWith(only + '.')) continue;
  console.log(`\n### ${sc.name}`);
  console.log('| Day | Served | Why (top terms) | Answer | Mirar says |');
  console.log('|---|---|---|---|---|');
  let hist: RepRecord[] = [];
  const caps: string[] = []; const ids: string[] = []; let insights = 0, patterns = 0;
  for (let d = 1; d <= sc.days; d++) {
    if (sc.active && !sc.active(d)) continue;
    const now = new Date(start.getTime() + (d - 1) * 86400000);
    const dec = decideToday(hist, now);
    if (dec.kind === 'rest') { console.log(`| ${d} | (rest) | ${dec.reasons.join('; ')} | | |`); continue; }
    const ex = dec.exercise;
    const ans = sc.policy(ex, d);
    const { feedback, ...answer } = ans;
    const rec: RepRecord = { exerciseId: ex.id, capacity: ex.capacity, subCapacity: ex.sub_capacity, interactionType: ex.interaction_type, intensity: ex.intensity, answer, completedAt: now.toISOString(), insightFeedback: feedback ?? null };
    const ins = buildInsight([rec, ...hist], now);
    rec.insight = ins;
    const cue = continuityCue(hist, now);
    hist = [rec, ...hist];
    caps.push(ex.capacity); ids.push(ex.id);
    if (ins) { insights++; if (ins.kind === 'pattern') patterns++; }
    const a = answer.unknown ? "I don't know" : [answer.primary, answer.followUp, answer.words && '"' + answer.words + '"'].filter(Boolean).join(' → ');
    const why = `${dec.kind}: ${dec.reasons.slice(0, 3).join(', ') || 'tie-break'}`;
    console.log(`| ${d} | ${ex.id} | ${why} | ${a} | ${ins ? `[${ins.kind}] ${ins.text}` : (cue ? `(cue) ${cue}` : '—')} |`);
  }
  const uniq = new Set(ids).size;
  const sameCapRuns = caps.reduce((n, c, i) => n + (i && caps[i - 1] === c ? 1 : 0), 0);
  console.log(`\nreps ${ids.length} · distinct reps ${uniq} · same-capacity-consecutive ${sameCapRuns} · insights ${insights} (patterns ${patterns})`);
}

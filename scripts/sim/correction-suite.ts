// Post-freeze contract fix (v2.0.1): structured correction after "Partly", commitment context, date contract, optional capacity label.
// Run: npx tsx scripts/sim/correction-suite.ts   (the frozen 85-check suite is unmodified and run separately)
import * as fs from 'fs';
import * as path from 'path';
import { V2 } from '../../lib/innerRep/v2/config';
import { CORRECTION_REASONS, nextStep } from '../../lib/innerRep/v2/contracts';
import { computeEvidence } from '../../lib/innerRep/v2/evidence';
import { applyCorrection, applyFeedback, chooseInsight } from '../../lib/innerRep/v2/insights';
import { applyRep, createState, flowContext } from '../../lib/innerRep/v2/state';
import { TEMPLATE_BY_ID } from '../../lib/innerRep/v2/templates';
import { CorrectionReason, Domain, Instance, Observation, State } from '../../lib/innerRep/v2/types';

const rows: { name: string; pass: boolean; detail: string }[] = [];
const test = (name: string, fn: () => string) => { try { const detail = fn(); rows.push({ name, pass: true, detail }); } catch (e: any) { rows.push({ name, pass: false, detail: e?.message ?? String(e) }); } };
const assert = (c: unknown, m: string) => { if (!c) throw new Error(m); };

function inst(s: State, day: number, templateId: string, o: Partial<Instance> = {}): Instance { const t = TEMPLATE_BY_ID[templateId]; const i: Instance = { id: ++s.seq.inst, day, templateId, frame: 'base', capacity: t.capacity, mechanism: t.mechanism, intensity: t.intensity, layer: 'training', intent: 'training', trace: {} as any, completed: true, unknownPrimary: false, burden: false, skippedAll: false, ...o }; s.instances.push(i); return i; }
function ob(s: State, day: number, templateId: string, o: Partial<Observation> = {}): Observation { const i = inst(s, day, templateId); const t = TEMPLATE_BY_ID[templateId]; const x: Observation = { id: ++s.seq.obs, day, instanceId: i.id, templateId, capacity: t.capacity, mechanism: t.mechanism, step: 'primary', polarity: 'present', burden: false, unknown: false, domainRole: 'issue', offeredDomains: [], closedSet: false, isLens: false, ...o }; s.observations.push(x); return x; }
const prompted = (s: State, day: number, tpl: string, d: Domain) => ob(s, day, tpl, { domain: d, domainOrigin: 'prompted_choice', domainSource: 'option', offeredDomains: ['work', 'partner', 'family', 'friends', 'money', 'body_health', 'self'], closedSet: true });
const introduced = (s: State, day: number, d: Domain) => ob(s, day, 'probe_anchor', { domain: d, domainOrigin: 'user_introduced', domainSource: 'option', offeredDomains: ['work', 'partner', 'family', 'friends', 'money', 'body_health', 'self', 'time', 'technology', 'other'] });
/** a user with a supported "Work" repeated-signal insight already shown on day 6 */
function shown(): { s: State; id: number; text: string } {
  const s = createState(); prompted(s, 1, 'foc_attention', 'work'); prompted(s, 3, 'en_drain', 'work'); introduced(s, 5, 'work');
  const r = computeEvidence(s, 6); const { shown: sh } = chooseInsight(s, r.evidence, 6, false); const rec = { ...sh!, id: ++s.seq.insight, day: 6 }; s.insights.push(rec); return { s, id: rec.id, text: rec.text };
}
const work = (s: State, day: number) => { const r = computeEvidence(s, day); return { ev: r.evidence.find((e) => e.key === 'repeated_signal:work'), r }; };
const addNew = (s: State, days: number[]) => days.forEach((d, k) => (k % 2 ? prompted(s, d, 'foc_attention', 'work') : introduced(s, d, 'work')));
// wording checks isolate the evidence rules from the (separately tested) cooldown
const NOCD = { ...V2, insight: { ...V2.insight, cooldownDaysSameKey: 0 }, feedback: { ...V2.feedback, partlyCooldownMultiplier: 1 } };
const next = (s: State, day: number) => chooseInsight(s, computeEvidence(s, day).evidence, day, false, NOCD).shown;

test('ACCURATE: no correction step, no memory, nothing weakened', () => {
  const { s, id } = shown(); applyFeedback(s, id, 'accurate', 7);
  const mem = Object.values(s.feedbackMem); assert(mem.every((m) => m.noDay === undefined && m.partlyDay === undefined && m.unsureDay === undefined), 'accurate must leave no weakening flags');
  const { ev } = work(s, 8); assert(ev && ev.status === 'active' && ev.support === 'supported', `support ${ev?.support}/${ev?.status}`); assert(s.insights[0].correction === undefined, 'no correction');
  return 'evidence stays active + supported; correction not applicable';
});
test('PARTLY (no reason): withheld until 1 new independent observation, then hedged and never "supported"', () => {
  const { s, id, text } = shown(); applyFeedback(s, id, 'partly', 7);
  let r = work(s, 8); assert(r.ev?.status === 'withheld', 'must be withheld right after Partly'); assert(!next(s, 9), 'nothing may resurface without new evidence');
  addNew(s, [10]); r = work(s, 11); assert(r.ev?.status === 'active' && r.ev.support === 'tentative', `after 1 new: ${r.ev?.status}/${r.ev?.support}`);
  addNew(s, [12, 14]); const sh = next(s, 15); assert(sh && sh.tier === 'hedged' && sh.text !== text && /partly right/.test(sh.text), `${sh?.tier}: ${sh?.text}`);
  return `resurfaces only after new evidence: [${sh!.tier}] ${sh!.text}`;
});
test('PARTLY does not reject: the domain is NOT put to rest (unlike No)', () => {
  const a = shown(); applyFeedback(a.s, a.id, 'partly', 7); const b = shown(); applyFeedback(b.s, b.id, 'no', 7);
  assert(!a.s.domainState.work?.restUntilDay, 'Partly must not rest the domain'); assert((b.s.domainState.work?.restUntilDay ?? 0) >= 7 + V2.feedback.suppressDaysNo, 'No still rests it');
  return `after Partly: no rest; after No: rest until day ${b.s.domainState.work!.restUntilDay}`;
});
const REASON_CASES: { reason: CorrectionReason; need: number; tail: RegExp }[] = [
  { reason: 'situation_right_meaning_off', need: 1, tail: /only the count/ },
  { reason: 'importance_overstated', need: 2, tail: /more important than it is/ },
  { reason: 'something_missing', need: 1, tail: /only part of the picture/ },
  { reason: 'something_else', need: 1, tail: /only partly right/ },
  { reason: 'prefer_not_to_say', need: 1, tail: /only partly right/ },
];
for (const c of REASON_CASES) test(`PARTLY + ${c.reason}: needs ${c.need} new independent observation(s); hedged wording names the qualification`, () => {
  const { s, id, text } = shown(); applyFeedback(s, id, 'partly', 7); applyCorrection(s, id, c.reason, 7);
  assert(s.insights[0].correction?.reason === c.reason, 'reason stored on the insight'); assert(Object.values(s.feedbackMem).every((m) => m.partlyReason === c.reason), 'reason stored in feedback memory');
  const days = [10, 12, 14]; for (let k = 0; k < c.need - 1; k++) addNew(s, [days[k]]);
  if (c.need > 1) assert(work(s, 13).ev?.status === 'withheld', 'still withheld one short');
  addNew(s, [days[c.need - 1]]); const e = work(s, 15).ev!; assert(e.status === 'active' && e.support === 'tentative', `${e.status}/${e.support}`);
  for (let k = c.need; k < 3; k++) addNew(s, [days[k]]);
  const sh = next(s, 16); assert(sh && sh.tier === 'hedged' && sh.text !== text && c.tail.test(sh.text), `${sh?.tier}: ${sh?.text}`); return sh!.text;
});
test('PARTLY + changed_since: the evidence window restarts; old observations no longer count; normal thresholds on new ones', () => {
  const { s, id } = shown(); applyFeedback(s, id, 'partly', 7); applyCorrection(s, id, 'changed_since', 7);
  addNew(s, [10, 12]); let e = work(s, 13).ev; assert(!e, '2 new observations are not enough (needs 3): the old ones do not count');
  addNew(s, [14]); e = work(s, 15).ev!; assert(e.independentN === 3 && e.support === 'tentative', `n=${e.independentN} support=${e.support}`);
  const sh = next(s, 16); assert(sh && sh.tier === 'hedged' && /since you said things had changed/.test(sh.text) && /3 times/.test(sh.text), sh?.text ?? 'none'); return sh!.text;
});
test('NO is stronger than PARTLY: withheld until 2 new, domain rests, tentative only', () => {
  const p = shown(); applyFeedback(p.s, p.id, 'partly', 7); addNew(p.s, [10]); const pe = work(p.s, 11).ev!;
  const n = shown(); applyFeedback(n.s, n.id, 'no', 7); addNew(n.s, [10]); const ne = work(n.s, 11).ev!;
  assert(pe.status === 'active' && ne.status === 'withheld', `after 1 new observation: partly ${pe.status}, no ${ne.status}`); return `after 1 new observation: Partly → ${pe.status}; No → ${ne.status}`;
});
test('NOT SURE neither strengthens nor rejects: waits 7 days, then the evidence is exactly as before (still supported)', () => {
  const { s, id } = shown(); applyFeedback(s, id, 'unsure', 7); const before = work(s, 8).ev!; const after = work(s, 7 + V2.feedback.suppressDaysUnsure + 1).ev!;
  assert(before.status === 'withheld', 'waits'); assert(after.status === 'active' && after.support === 'supported', `${after.status}/${after.support}`); assert(!s.domainState.work?.restUntilDay, 'no rest'); return 'withheld for 7 days only; support unchanged afterwards; no domain rest';
});
test('a correction is feedback about Mirar\'s reading: it creates no observation, no evidence, and no statement about the person', () => {
  const { s, id } = shown(); const obsBefore = s.observations.length; const kindsBefore = computeEvidence(s, 8).evidence.map((e) => e.kind).sort().join();
  applyFeedback(s, id, 'partly', 7); applyCorrection(s, id, 'importance_overstated', 7);
  assert(s.observations.length === obsBefore, 'no observation created'); const kindsAfter = computeEvidence(s, 8).evidence.map((e) => e.kind).sort().join(); assert(kindsAfter === kindsBefore, 'no new evidence kind');
  const texts: string[] = []; for (const r of CORRECTION_REASONS) { const t = shown(); applyFeedback(t.s, t.id, 'partly', 7); applyCorrection(t.s, t.id, r.id, 7); addNew(t.s, [10, 12, 14]); const sh = next(t.s, 16); if (sh) texts.push(sh.text); }
  const banned = /denial|resist|defensive|deflect|avoid|conflicted|ambivalen|pathology|unwilling|won't admit/i; assert(texts.every((x) => !banned.test(x)), 'banned wording: ' + texts.find((x) => banned.test(x))); return `${texts.length} qualified insights across all reasons; none implies denial/resistance/avoidance/ambivalence`;
});
test('feedback on one kind of claim about a domain is never shadowed by "Accurate" on another (regression found by the sweep)', () => {
  const { s, id } = shown(); applyFeedback(s, id, 'accurate', 7); // leaves an (empty) entry for repeated_signal:work
  const rec = { id: ++s.seq.insight, day: 8, evidenceKey: 'cross_capacity_convergence:work', kind: 'cross_capacity_convergence' as const, tier: 'supported' as const, text: 'x', snapshot: { independentN: 3, introducedN: 1, promptedN: 2 } }; s.insights.push(rec);
  applyFeedback(s, rec.id, 'partly', 8); applyCorrection(s, rec.id, 'something_missing', 8);
  const e = work(s, 9).ev!; assert(e.status === 'withheld', `the Partly given on the convergence claim must also qualify the repeated-signal claim: ${e.status}`);
  const sh = next(s, 9); assert(!sh, 'nothing may be shown'); return 'domain-level feedback merged with claim-level feedback';
});
test('a correction only follows Partly, once', () => {
  const { s, id } = shown(); applyCorrection(s, id, 'something_else', 7); assert(!s.insights[0].correction, 'ignored before Partly'); applyFeedback(s, id, 'accurate', 7); applyCorrection(s, id, 'something_else', 7); assert(!s.insights[0].correction, 'ignored after Accurate');
  const t = shown(); applyFeedback(t.s, t.id, 'partly', 7); applyCorrection(t.s, t.id, 'something_missing', 7); applyCorrection(t.s, t.id, 'changed_since', 8); assert(t.s.insights[0].correction!.reason === 'something_missing', 'first reason stands'); return 'ok';
});
test('same interpretation is never resurfaced unchanged after Partly; cooldown doubles', () => {
  const { s, id, text } = shown(); applyFeedback(s, id, 'partly', 7); addNew(s, [10]); const e = work(s, 11).ev!;
  const dec = chooseInsight(s, [e], 11, false); assert(!dec.shown, `must be inside the doubled cooldown (${V2.insight.cooldownDaysSameKey * V2.feedback.partlyCooldownMultiplier}d)`);
  const later = chooseInsight(s, [e], 6 + V2.insight.cooldownDaysSameKey * V2.feedback.partlyCooldownMultiplier + 1, false).shown; assert(later && later.text !== text, 'after the cooldown only the qualified wording'); return 'blocked inside 28 days; afterwards only qualified wording';
});
test('contract: a commitment check names the commitment (label + timeframe, no ids) and the prompt says which one', () => {
  const s = createState(); s.commitments.push({ id: 7, kind: 'start', timeframe: 'tomorrow', createdDay: 0, dueDay: 1, status: 'open', statusSource: 'user', asks: 0, noneRevisits: 0, label: 'Five minutes outside', events: [] });
  const ctx = flowContext(s, 2, 'cont_commitment', 'commitment_check', undefined, V2, 0, 7); const st = nextStep(ctx, [])!;
  assert(st.type === 'choice' && st.context?.commitment?.label === 'Five minutes outside', 'context present'); assert(st.type === 'choice' && /Five minutes outside/.test(st.prompt), 'prompt names it');
  assert(!/"id"|\b7\b/.test(JSON.stringify((st as any).context)), 'no internal id'); const c = (st as any).context.commitment; assert(c.timeframe === 'tomorrow' && c.dueInDays === -1, JSON.stringify(c));
  const s2 = createState(); s2.commitments.push({ id: 1, kind: 'reach_out', timeframe: 'none', createdDay: 0, status: 'open', statusSource: 'user', asks: 0, noneRevisits: 0, events: [] });
  const st2 = nextStep(flowContext(s2, 20, 'cont_commitment', 'commitment_check', undefined, V2, 0, 1), [])!; assert(st2.type === 'choice' && /Reach out to someone/.test(st2.prompt) && st2.context!.commitment!.dueInDays === undefined, 'older commitment without a label falls back to its kind; no deadline → no dueInDays');
  return JSON.stringify(c) + ' — ' + (st as any).prompt;
});
test('commitments created by a rep carry the authored label (not user text)', () => {
  const s = createState(); const i = inst(s, 1, 'act_tiny', { completed: false });
  applyRep(s, i, flowContext(s, 1, 'act_tiny', 'base', undefined), [{ stepId: 'primary', kind: 'option', optionId: 'outside' }, { stepId: 'timeframe', kind: 'timeframe', timeframe: 'tomorrow' }]);
  assert(s.commitments[0]?.label === 'Five minutes outside', s.commitments[0]?.label ?? 'none'); return s.commitments[0].label!;
});
console.log(rows.map((r) => `${r.pass ? 'PASS' : 'FAIL'} ${r.name}\n     ${r.detail}`).join('\n'));
const fails = rows.filter((r) => !r.pass).length; console.log(`\n${rows.length - fails}/${rows.length} pass`);
fs.writeFileSync(path.join(__dirname, '../../docs/V2_CORRECTION_TESTS.md'), ['# v2.0.1 correction / contract-fix tests', '', `Generated by \`npx tsx scripts/sim/correction-suite.ts\`: ${rows.length - fails}/${rows.length} pass. The frozen 85-check suite is unmodified.`, '', '| | Test | Detail |', '|---|---|---|', ...rows.map((r) => `| ${r.pass ? 'PASS' : '**FAIL**'} | ${r.name} | ${r.detail.replace(/\|/g, '/')} |`)].join('\n'));
process.exit(fails ? 1 : 0);

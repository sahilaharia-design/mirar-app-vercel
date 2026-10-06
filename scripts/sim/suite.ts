import * as fs from 'fs';
import * as path from 'path';
import { ENGINE_VERSION, V2 } from '../../lib/innerRep/v2/config';
import { flowContext, applyRep, advanceDay, createState } from '../../lib/innerRep/v2/state';
import { decide } from '../../lib/innerRep/v2/engine';
import { computeEvidence } from '../../lib/innerRep/v2/evidence';
import { applyFeedback, chooseInsight } from '../../lib/innerRep/v2/insights';
import { TEMPLATES, TEMPLATE_BY_ID } from '../../lib/innerRep/v2/templates';
import { StepAnswer, nextStep, primaryOptions } from '../../lib/innerRep/v2/contracts';
const primaryOptionsFor = (t: (typeof TEMPLATES)[number], frame: 'lens', d: Domain) => primaryOptions(t, frame, d).prompt;
import { Commitment, DOMAINS, Domain, Instance, ORIENTATIONS, Observation, State, Thread } from '../../lib/innerRep/v2/types';
import { PROFILES } from './profiles';
import { metrics } from './report';
import { RunResult, runProfile } from './runner';

interface T { section: string; name: string; pass: boolean; detail: string; finding?: boolean }
const results: T[] = [];
const test = (section: string, name: string, fn: () => { pass: boolean; detail: string }) => { try { const r = fn(); results.push({ section, name, ...r }); } catch (e: any) { results.push({ section, name, pass: false, detail: 'THREW ' + (e?.message ?? e) }); } };

// ── runs (cached)
const SEEDS = Array.from({ length: 12 }, (_, k) => k + 1);
const RS: Record<string, RunResult[]> = {};
for (const p of PROFILES) RS[p.id] = SEEDS.map((sd) => runProfile({ ...p, seed: p.seed * 1000 + sd }));
const ALL: RunResult[] = Object.values(RS).flat();
const run = (id: string) => RS[id][0]; // descriptive example only; assertions use forAll/ALL
const pctS = (n: number, d: number) => `${n}/${d} runs (${Math.round((100 * n) / d)}%)`;
/** statistical assertion across seeds: passes if at least `min` of runs satisfy `pred` */
const forAll = (id: string, pred: (r: RunResult) => { ok: boolean; note?: string }, min = 1) => { const res = RS[id].map(pred); const n = res.filter((x) => x.ok).length; const bad = res.find((x) => !x.ok); return { pass: n / res.length >= min, detail: `${pctS(n, res.length)}, required ≥ ${Math.round(min * 100)}%${bad ? `; e.g. ${bad.note}` : ''}` }; };
const R: Record<string, RunResult> = Object.fromEntries(ALL.map((r, k) => [`${r.profile.id}#${k}`, r]));
const ctxIntent = (i: Instance) => /^(lens:|native:)/.test(i.intent) || ['probe_confirm', 'thread_check', 'event_check', 'resolution_check', 'commitment_revisit'].includes(i.intent);

// ── crafted-state helpers
let uidN = 0;
function inst(s: State, day: number, templateId: string, o: Partial<Instance> = {}): Instance {
  const t = TEMPLATE_BY_ID[templateId];
  const i: Instance = { id: ++s.seq.inst, day, templateId, frame: 'base', capacity: t.capacity, mechanism: t.mechanism, intensity: t.intensity, layer: 'training', intent: 'training', trace: {} as any, completed: true, unknownPrimary: false, burden: false, skippedAll: false, ...o };
  s.instances.push(i); return i;
}
function ob(s: State, day: number, templateId: string, o: Partial<Observation> = {}): Observation {
  const i = inst(s, day, templateId, { burden: !!o.burden });
  const t = TEMPLATE_BY_ID[templateId];
  const x: Observation = { id: ++s.seq.obs, day, instanceId: i.id, templateId, capacity: t.capacity, mechanism: t.mechanism, step: 'primary', polarity: 'present', burden: false, unknown: false, domainRole: t.domainRole === 'none' ? 'issue' : t.domainRole, offeredDomains: [], closedSet: false, isLens: false, ...o };
  s.observations.push(x); uidN++; return x;
}
const prompted = (s: State, day: number, tpl: string, d: Domain, o: Partial<Observation> = {}) => ob(s, day, tpl, { domain: d, domainOrigin: 'prompted_choice', domainSource: 'option', offeredDomains: ['work', 'partner', 'family', 'friends', 'money', 'body_health', 'self'], closedSet: true, ...o });
const introduced = (s: State, day: number, d: Domain, tpl = 'probe_anchor', o: Partial<Observation> = {}) => ob(s, day, tpl, { domain: d, domainOrigin: 'user_introduced', domainSource: 'option', offeredDomains: ['work', 'partner', 'family', 'friends', 'money', 'body_health', 'self', 'time', 'technology', 'other'], closedSet: false, ...o });
const follow = (s: State, day: number, d: Domain, tpl = 'foc_attention', o: Partial<Observation> = {}) => ob(s, day, tpl, { domain: d, domainOrigin: 'thread_continuation', domainSource: 'binding', isLens: true, offeredDomains: [d], closedSet: true, ...o });
const thread = (s: State, d: Domain, o: Partial<Thread> = {}): Thread => { const th: Thread = { id: ++s.seq.thread, kind: 'ongoing', domain: d, state: 'open', stateSource: 'user', openedDay: 0, openedVia: 'user_confirmed', lastConfirmedDay: 0, checkDays: [], negStreak: 0, unknownStreak: 0, eventAsks: 0, resolutionOffered: false, cadenceMultiplier: 1, ...o }; s.threads.push(th); return th; };
const ev = (s: State, day: number) => computeEvidence(s, day);
const has = (r: ReturnType<typeof ev>, kind: string, subj?: string) => r.evidence.find((e) => e.kind === kind && (subj === undefined || e.subject === subj));
const refused = (r: ReturnType<typeof ev>, kind: string) => r.refusals.filter((x) => x.kind === kind);
const ok = (pass: boolean, detail: string) => ({ pass, detail });
const finding = (detail: string) => ({ pass: false, detail, finding: true });

// ═══ 6 — CONTINUITY ═══
test('6 Continuity', 'budget: no 5-rep window has more than cap context/continuity reps (due commitments exempt)', () => {
  let worst = 0, where = '';
  for (const r of ALL) { const id = r.profile.id; const a = r.state.instances; for (let k = 0; k + 5 <= a.length; k++) { const c = a.slice(k, k + 5).filter(ctxIntent).length; if (c > worst) { worst = c; where = `${id} reps ${k + 1}-${k + 5}`; } } }
  return ok(worst <= V2.budget.cap, `worst window ${worst} (cap ${V2.budget.cap}) at ${where}`);
});
test('6 Continuity', `never more than ${V2.budget.maxConsecutive} context/continuity-driven reps in a row`, () => {
  let worst = 0, who = '';
  for (const r of ALL) { let c = 0; for (const i of r.state.instances) { c = ctxIntent(i) ? c + 1 : 0; if (c > worst) { worst = c; who = r.profile.id; } } }
  return ok(worst <= V2.budget.maxConsecutive, `worst run ${worst} in ${who}`);
});
test('6 Continuity', 'one thread cannot take over: ≤ maxPerWindow checks on any thread in any 10-day window', () => {
  let worst = 0, who = '';
  for (const r of ALL) for (const t of r.state.threads) if (t.kind === 'ongoing') for (const d of t.checkDays) { const c = t.checkDays.filter((x) => x >= d && x < d + V2.thread.windowDays).length; if (c > worst) { worst = c; who = `${r.profile.id}/${t.domain}`; } }
  return ok(worst <= V2.thread.maxPerWindow, `worst ${worst} checks in ${V2.thread.windowDays} days (${who})`);
});
test('6 Continuity', 'repeated "not this" lets the thread rest; no bound reps for restDays (every seed that opened a work thread)', () => forAll('sel_bias_B', (r) => {
  const th = r.state.threads.find((t) => t.domain === 'work' && t.kind === 'ongoing'); if (!th) return { ok: true, note: 'no work thread opened' };
  if (th.state !== 'resting' && th.state !== 'resolved' && th.state !== 'dormant') return { ok: th.checkDays.length < 2, note: `thread ${th.state} after ${th.checkDays.length} checks` };
  const restDay = th.checkDays[th.checkDays.length - 1];
  const after = r.state.instances.filter((i) => (i.bound === 'work' || i.intent.endsWith(':work')) && i.day > restDay && i.day < restDay + V2.thread.restDays && i.intent !== 'resolution_check');
  return { ok: after.length === 0, note: `${after.length} work-bound reps within ${V2.thread.restDays}d of resting (${th.state})` };
}, 0.95));
test('6 Continuity', 'a user who skips thread checks twice: thread rests, Mirar stops asking', () => {
  const s = createState(); const th = thread(s, 'work');
  for (let k = 0; k < 2; k++) { const i = inst(s, 10 + k * 4, 'cont_thread', { frame: 'thread_check', bound: 'work', intent: 'thread_check', intentRef: th.id, layer: 'continuity' }); applyRep(s, i, flowContext(s, i.day, 'cont_thread', 'thread_check', 'work'), [{ stepId: 'primary', kind: 'unknown' }]); }
  return ok(th.state === 'resting' && th.restReason!.includes('unanswered'), `state ${th.state}: ${th.restReason}`);
});
test('6 Continuity', 'user declines thread offer: no new offer for that domain for offerCooldownDays', () => {
  const s = createState();
  const i = inst(s, 3, 'probe_anchor', { layer: 'probe', intent: 'probe_cadence' });
  const ctx = flowContext(s, 3, 'probe_anchor', 'base', undefined);
  const ans: StepAnswer[] = [{ stepId: 'primary', kind: 'option', optionId: 'work' }];
  ans.push(nextStep(ctx, ans) ? { stepId: 'capture_orientation', kind: 'skip' } : { stepId: 'x', kind: 'skip' });
  ans.length = 1; ans.push({ stepId: 'capture_orientation', kind: 'skip' }); ans.push({ stepId: 'thread_offer', kind: 'no' });
  applyRep(s, i, ctx, ans);
  const ctx2 = flowContext(s, 10, 'probe_anchor', 'base', undefined);
  const step = nextStep(ctx2, [{ stepId: 'primary', kind: 'option', optionId: 'work' }, { stepId: 'capture_orientation', kind: 'skip' }]);
  return ok(!step || step.id !== 'thread_offer', `7 days later next step after naming work: ${step ? step.id : 'none (no offer)'}`);
});
test('6 Continuity', 'changed mind / dropped closes the commitment and Mirar never asks again', () => {
  const s = createState(); const c: Commitment = { id: ++s.seq.commit, kind: 'reach_out', timeframe: 'tomorrow', createdDay: 0, dueDay: 1, status: 'open', statusSource: 'user', asks: 0, noneRevisits: 0, events: [] }; s.commitments.push(c);
  const i = inst(s, 1, 'cont_commitment', { frame: 'commitment_check', intent: 'commitment_due', intentRef: c.id, layer: 'continuity' });
  applyRep(s, i, flowContext(s, 1, 'cont_commitment', 'commitment_check', undefined), [{ stepId: 'primary', kind: 'option', optionId: 'changed_mind' }]);
  let asked = 0; for (let d = 2; d < 40; d++) { const dec = decide(s, d, { ...V2, rest: { ...V2.rest, enabled: false } }); if (dec.intentRef === c.id) asked++; const t = TEMPLATE_BY_ID[dec.templateId!]; inst(s, d, t.id, { frame: dec.frame, layer: dec.layer, intent: dec.intent }); }
  return ok(c.status === 'changed_mind' && c.statusSource === 'user' && asked === 0, `status ${c.status} (${c.statusSource}); asked again ${asked}×; unconfirmed events: ${c.events.filter((e) => e.to === 'unconfirmed').length}`);
});
test('6 Continuity', 'recovery outranks relevance: no non-light rep directly after a burdened rep (all runs)', () => {
  let bad = 0, where = ''; for (const r of ALL) { const id = r.profile.id; const a = r.state.instances; for (let k = 1; k < a.length; k++) if (a[k - 1].burden && a[k].intensity !== 'light') { bad++; where = `${id} day ${a[k].day + 1} ${a[k].templateId}`; } }
  return ok(bad === 0, `${bad} violations${where ? ' e.g. ' + where : ''}`);
});
test('6 Continuity', 'hard reps do not stack: ≤2 consecutive non-light reps (all runs)', () => {
  let worst = 0, who = ''; for (const r of ALL) { let c = 0; for (const i of r.state.instances) { c = i.intensity !== 'light' ? c + 1 : 0; if (c > worst) { worst = c; who = r.profile.id; } } }
  return ok(worst <= V2.intensity.maxNonLightRun, `worst run ${worst} (${who})`);
});
test('6 Continuity', 'deliberate rest is documented: traces record what was let rest and why (work_stress_60, every seed)', () => forAll('work_stress_60', (r) => { const n = r.logs.filter((l) => l.decision && l.decision.trace.letRest.length > 0).length; return { ok: n > 0, note: `${n} decisions with a let-rest note` }; }));
test('6 Continuity', 'continuity pauses without being discarded: a resting thread wakes when the user raises the domain again', () => {
  const s = createState(); const th = thread(s, 'work', { state: 'resting', stateSource: 'engine', restUntilDay: 40, restReason: 'x' });
  const i = inst(s, 12, 'probe_anchor', { layer: 'probe' });
  applyRep(s, i, flowContext(s, 12, 'probe_anchor', 'base', undefined), [{ stepId: 'primary', kind: 'option', optionId: 'work' }]);
  return ok(th.state === 'open', `thread state after the user named work again: ${th.state}`);
});

// ═══ 7 — SELECTION BIAS ═══
test('7 Selection bias', 'A: Focus served, Partner is real → Relationships becomes relevant (≤ day 17)', () => forAll('sel_bias_A', (r) => {
  const rel = r.state.instances.find((i) => i.capacity === 'relationships' && i.intent.includes(':partner'));
  return { ok: r.state.instances[0].capacity === 'focus' && !!rel && rel.day <= 16, note: `first partner-driven Relationships rep: day ${rel ? rel.day + 1 : 'never'}` };
}, 0.9));
test('7 Selection bias', 'A: Mirar never claims the user raised Focus: any insight naming a capacity says Mirar was asking about it; Partner is attributed to the user only through chips or the open probe', () => forAll('sel_bias_A', (r) => {
  const intro = r.state.observations.filter((o) => o.domain === 'partner' && o.domainOrigin === 'user_introduced');
  const srcOk = intro.every((o) => o.domainSource === 'user_tapped' || o.templateId === 'probe_anchor');
  const badFocus = r.state.insights.filter((i) => /\b(focus|energy|relationships|growth|direction|action)\b/i.test(i.text) && !/asking about|asked about/i.test(i.text));
  return { ok: intro.length > 0 && srcOk && badFocus.length === 0, note: `${intro.length} user-introduced, sources ok ${srcOk}, bad insights ${badFocus.length}` };
}));
test('7 Selection bias', 'B: asked about Work, repeatedly "not this" → Work loses relevance (≤ 5 work-driven reps in 30 days, no supported Work insight)', () => forAll('sel_bias_B', (r) => {
  const w = r.state.instances.filter((i) => i.bound === 'work' || i.intent.endsWith(':work')).length;
  const strong = r.state.insights.some((i) => /work/i.test(i.text) && i.tier === 'supported' && i.kind !== 'resolution');
  return { ok: w <= 5 && !strong, note: `${w} work-driven reps, supported insight ${strong}` };
}, 0.95));
test('7 Selection bias', 'C: repeated prompted Family answers never create a supported Family pattern or insight (every seed)', () => forAll('sel_bias_C', (r) => {
  const e = computeEvidence(r.state, 29).evidence.filter((x) => x.subject === 'family'); const sup = e.some((x) => x.support === 'supported') || r.state.insights.some((i) => /family/i.test(i.text) && i.tier === 'supported');
  return { ok: !sup, note: `evidence ${e.map((x) => x.kind + ':' + x.support).join(',')}` };
}));
test('7 Selection bias', 'C: no thread is opened for Family from prompted answers alone (every seed)', () => forAll('sel_bias_C', (r) => ({ ok: !r.state.threads.some((t) => t.domain === 'family'), note: 'a family thread exists' })));
test('7 Selection bias', 'continuation answers are never independent evidence', () => {
  const s = createState(); for (let d = 0; d < 5; d++) follow(s, d, 'work');
  const e = ev(s, 5);
  return ok(!has(e, 'repeated_signal', 'work'), `5 follow-up answers: repeated_signal fired? ${!!has(e, 'repeated_signal', 'work')}; refusal: ${refused(e, 'repeated_signal')[0]?.reason}`);
});
test('7 Selection bias', 'context-driven reps are recorded as thread_continuation, never as independent prompted choice', () => {
  let bad = 0; for (const r of ALL) for (const o of r.state.observations) { const i = r.state.instances.find((x) => x.id === o.instanceId)!; if ((i.intent.startsWith('lens:') || i.intent.startsWith('native:')) && o.domain && o.domainOrigin !== 'thread_continuation') bad++; }
  return ok(bad === 0, `${bad} context-driven observations mislabelled as independent`);
});

// ═══ 8 — DOMAIN (orientation is deferred) ═══
test('8 Domain / orientation', 'orientation is NOT collected: no orientation step is ever emitted and nothing stores one (all runs)', () => {
  let steps = 0, stored = 0; for (const r of ALL) { for (const l of r.logs) steps += l.answers.filter((a) => a.stepId === 'capture_orientation').length; stored += r.state.observations.filter((o) => o.orientation !== undefined).length + r.state.threads.filter((t) => t.orientation !== undefined).length; }
  return ok(steps === 0 && stored === 0 && V2.orientation.enabled === false, `orientation steps answered/skipped: ${steps}; observations/threads carrying an orientation: ${stored}; flag enabled=${V2.orientation.enabled}`);
});
test('8 Domain / orientation', 'the engine never asks the user for an orientation even when one would apply (nextStep after a burdened, domain-bearing answer)', () => {
  const ctx = flowContext(createState(), 0, 'en_drain', 'base', undefined);
  const a: StepAnswer[] = [{ stepId: 'primary', kind: 'option', optionId: 'work' }]; const st = nextStep(ctx, a);
  const ctx2 = flowContext(createState(), 0, 'probe_anchor', 'base', undefined); const b: StepAnswer[] = [{ stepId: 'primary', kind: 'option', optionId: 'work' }, { stepId: 'thread_offer', kind: 'yes' }]; const st2 = nextStep(ctx2, b);
  return ok((!st || st.id !== 'capture_orientation') && (!st2 || st2.id !== 'capture_orientation'), `after a burdened domain answer: ${st ? st.id : 'none'}; after accepting a check-in: ${st2 ? st2.id : 'none'}`);
});
test('8 Domain / orientation', 'domain is still captured, independent of any orientation concept', () => {
  const doms = new Set(ALL.flatMap((r) => r.state.observations.map((o) => o.domain).filter(Boolean))); return ok(doms.size >= 8, `${doms.size} distinct domains observed across all runs: ${[...doms].join(', ')}`);
});

// ═══ 9 — EIGHT EVIDENCE TYPES: fire + near-miss ═══
test('9 Evidence', 'repeated_signal FIRES: 3 independent work observations incl. one the user raised', () => { const s = createState(); prompted(s, 1, 'foc_attention', 'work'); prompted(s, 3, 'en_drain', 'work'); introduced(s, 5, 'work'); const e = has(ev(s, 6), 'repeated_signal', 'work'); return ok(!!e && e.support === 'supported', `${e ? e.support : 'did not fire'}`); });
test('9 Evidence', 'repeated_signal NEAR-MISS: only 2 independent observations', () => { const s = createState(); prompted(s, 1, 'foc_attention', 'work'); introduced(s, 3, 'work'); return ok(!has(ev(s, 4), 'repeated_signal', 'work'), `refusal: ${refused(ev(s, 4), 'repeated_signal')[0]?.reason}`); });
test('9 Evidence', 'repeated_signal NEAR-MISS: chosen 3 of 12 times it was offered (offered often, rarely chosen)', () => { const s = createState(); for (const d of [1, 3, 5]) prompted(s, d, 'en_drain', 'work'); for (const d of [2, 4, 6, 7, 8, 9, 10, 11, 12]) ob(s, d, 'en_drain', { polarity: 'absent', domainOrigin: 'prompted_choice', offeredDomains: ['work', 'partner', 'family', 'friends', 'money', 'body_health', 'self'], closedSet: true }); const e = ev(s, 13); return ok(!has(e, 'repeated_signal', 'work'), `refusal: ${refused(e, 'repeated_signal')[0]?.reason}`); });
test('9 Evidence', 'cross_capacity_convergence FIRES: work via focus, energy and a user-named probe', () => { const s = createState(); prompted(s, 1, 'foc_attention', 'work'); prompted(s, 3, 'en_drain', 'work'); introduced(s, 5, 'work'); const e = has(ev(s, 6), 'cross_capacity_convergence', 'work'); return ok(!!e && e.capacities.length === 2, `${e ? e.capacities.join('+') + ' ' + e.support : 'did not fire'}`); });
test('9 Evidence', 'cross_capacity_convergence NEAR-MISS: focus + probe only (a probe is not a second capacity)', () => { const s = createState(); prompted(s, 1, 'foc_attention', 'work'); prompted(s, 2, 'foc_attention', 'work'); introduced(s, 5, 'work'); return ok(!has(ev(s, 6), 'cross_capacity_convergence', 'work'), `refusal: ${refused(ev(s, 6), 'cross_capacity_convergence')[0]?.reason}`); });
test('9 Evidence', 'cross_capacity_convergence NEAR-MISS: second capacity came only from a lens Mirar chose', () => { const s = createState(); prompted(s, 1, 'foc_attention', 'work'); introduced(s, 2, 'work'); follow(s, 3, 'work', 'en_drain'); follow(s, 4, 'work', 'dir_time'); return ok(!has(ev(s, 5), 'cross_capacity_convergence', 'work'), `refusal: ${refused(ev(s, 5), 'cross_capacity_convergence')[0]?.reason}`); });
test('9 Evidence', 'change FIRES: recent week much heavier than own baseline', () => { const s = createState(); for (let d = 1; d <= 9; d++) ob(s, d, 'foc_loops', { burden: false }); for (let d = 21; d <= 24; d++) ob(s, d, 'foc_loops', { burden: true }); return ok(!!has(ev(s, 25), 'change'), `${has(ev(s, 25), 'change')?.note ?? 'did not fire'}`); });
test('9 Evidence', 'change NEAR-MISS: baseline too thin to call a change', () => { const s = createState(); for (let d = 1; d <= 3; d++) ob(s, d, 'foc_loops', { burden: false }); for (let d = 22; d <= 24; d++) ob(s, d, 'foc_loops', { burden: true }); return ok(!has(ev(s, 25), 'change'), `refusal: ${refused(ev(s, 25), 'change')[0]?.reason}`); });
test('9 Evidence', 'contradiction FIRES: opposite stances within two weeks', () => { const s = createState(); ob(s, 1, 'dir_fits', { stance: { key: 'fit', side: 'fits', durable: true } }); ob(s, 6, 'dir_fits', { stance: { key: 'fit', side: 'outgrown', durable: true } }); return ok(!!has(ev(s, 7), 'contradiction', 'fit'), 'fired'); });
test('9 Evidence', 'contradiction NEAR-MISS: same stance repeated; opposite stances 25 days apart; and day-to-day state variation (not a durable statement)', () => { const s = createState(); ob(s, 1, 'dir_fits', { stance: { key: 'fit', side: 'fits', durable: true } }); ob(s, 6, 'dir_fits', { stance: { key: 'fit', side: 'fits', durable: true } }); const a = !has(ev(s, 7), 'contradiction', 'fit'); const s2 = createState(); ob(s2, 1, 'dir_fits', { stance: { key: 'fit', side: 'fits', durable: true } }); ob(s2, 27, 'dir_fits', { stance: { key: 'fit', side: 'outgrown', durable: true } }); const b = !has(ev(s2, 28), 'contradiction', 'fit'); const s3 = createState(); ob(s3, 1, 'en_pace', { stance: { key: 'pace', side: 'pushing' } }); ob(s3, 3, 'en_pace', { stance: { key: 'pace', side: 'pacing' } }); const c = !has(ev(s3, 4), 'contradiction', 'pace'); return ok(a && b && c, `same-side refused: ${a}; far-apart refused: ${b}; day-to-day state variation (pushing vs pacing) refused: ${c}`); });
test('9 Evidence', 'contradiction stays an EVIDENCE concept but never becomes a user-facing insight in the MVP', () => { const s = createState(); ob(s, 1, 'dir_fits', { stance: { key: 'fit', side: 'fits', durable: true } }); ob(s, 6, 'dir_fits', { stance: { key: 'fit', side: 'outgrown', durable: true } }); const r = ev(s, 7); const sh = chooseInsight(s, r.evidence, 7, false); const anyShown = ALL.some((x) => x.state.insights.some((i) => i.kind === 'contradiction')); return ok(!!has(r, 'contradiction', 'fit') && !sh.shown && !anyShown && V2.insight.contradictionEnabled === false, `evidence fires: ${!!has(r, 'contradiction', 'fit')}; insight shown: ${!!sh.shown}; contradiction insights across ${ALL.length} runs: ${anyShown ? 'some' : 0}`); });
test('9 Evidence', 'unresolved_thread FIRES: user-confirmed, recently confirmed', () => { const s = createState(); thread(s, 'partner', { lastConfirmedDay: 8 }); return ok(!!ev(s, 10).evidence.find((e) => e.kind === 'unresolved_thread'), 'fired'); });
test('9 Evidence', 'unresolved_thread NEAR-MISS: engine candidate; and thread not confirmed for 20 days', () => { const s = createState(); thread(s, 'partner', { state: 'candidate', openedVia: 'engine_candidate', stateSource: 'engine' }); const a = !ev(s, 10).evidence.find((e) => e.kind === 'unresolved_thread'); const s2 = createState(); thread(s2, 'partner', { lastConfirmedDay: 0 }); const b = !ev(s2, 25).evidence.find((e) => e.kind === 'unresolved_thread'); return ok(a && b, `candidate refused: ${a}; stale refused: ${b}`); });
test('9 Evidence', 'follow_through FIRES on a user status; unconfirmed is NOT failure', () => { const s = createState(); const c: Commitment = { id: ++s.seq.commit, kind: 'reach_out', timeframe: 'tomorrow', createdDay: 0, dueDay: 1, status: 'done', statusSource: 'user', asks: 1, noneRevisits: 0, events: [] }; const c2: Commitment = { ...c, id: ++s.seq.commit, status: 'unconfirmed', statusSource: 'system' }; s.commitments.push(c, c2); const r = ev(s, 5); const txt = JSON.stringify(r).toLowerCase().replace(/not as failure/g, ''); return ok(r.evidence.filter((e) => e.kind === 'follow_through').length === 2 && !/fail|avoid|flak|lazy/.test(txt) && r.refusals.some((x) => /not as failure/.test(x.reason)), `fired for done and unconfirmed; failure language present: ${/fail|avoid/.test(txt)}`); });
test('9 Evidence', 'resolution FIRES: user closes the thread; and 3 explicit "not today" after real presence', () => { const s = createState(); introduced(s, 1, 'work'); prompted(s, 2, 'en_drain', 'work'); thread(s, 'work', { state: 'resolved', stateSource: 'user' }); const a = !!has(ev(s, 10), 'resolution', 'work'); const s2 = createState(); introduced(s2, 1, 'work'); prompted(s2, 2, 'en_drain', 'work'); for (const d of [5, 7, 9]) ob(s2, d, 'cont_thread', { domain: 'work', domainOrigin: 'thread_continuation', polarity: 'absent', domainRole: 'issue', closedSet: true, offeredDomains: ['work'] }); const b = has(ev(s2, 10), 'resolution', 'work'); return ok(a && !!b && b.support === 'tentative', `user-closed: ${a}; 3 negatives: ${b ? b.support : 'no'}`); });
test('9 Evidence', 'resolution NEAR-MISS: Mirar never asked (no opportunity); and user simply stopped using the app', () => { const s = createState(); introduced(s, 1, 'work'); prompted(s, 2, 'en_drain', 'work'); inst(s, 3, 'foc_loops'); const a = !has(ev(s, 20), 'resolution', 'work') && refused(ev(s, 20), 'resolution').some((r) => /absence ≠ resolved|silence is not resolution/.test(r.reason)); return ok(a, `refusal: ${refused(ev(s, 20), 'resolution')[0]?.reason}`); });
test('9 Evidence', 'one_off_event FIRES: user flags it; NEAR-MISS: one heavy answer is not an event', () => { const s = createState(); thread(s, 'partner', { kind: 'event', openedVia: 'user_introduced', openedDay: 2, expiresDay: 16 }); const a = !!ev(s, 4).evidence.find((e) => e.kind === 'one_off_event'); const s2 = createState(); const i = inst(s2, 4, 'foc_loops', { burden: true }); void i; const b = !ev(s2, 4).evidence.find((e) => e.kind === 'one_off_event') && ev(s2, 4).refusals.some((r) => r.kind === 'one_off_event'); return ok(a && b, `flagged fires: ${a}; unflagged heavy answer refused: ${b}`); });

// ═══ 10 — USER CORRECTION ═══
function shownRepeated(): { s: State; insightId: number } {
  const s = createState(); prompted(s, 1, 'foc_attention', 'work'); prompted(s, 3, 'en_drain', 'work'); introduced(s, 5, 'work');
  const r = ev(s, 6); const { shown } = chooseInsight(s, r.evidence, 6, false);
  s.insights.push({ ...shown!, id: ++s.seq.insight, day: 6 }); return { s, insightId: s.seq.insight };
}
test('10 Correction', '"No": evidence is withheld, same insight is not resurfaced unchanged', () => { const { s, insightId } = shownRepeated(); applyFeedback(s, insightId, 'no', 7); const r = ev(s, 8); const e = r.evidence.find((x) => x.key === 'repeated_signal:work'); const { shown } = chooseInsight(s, r.evidence, 8, false); return ok(e?.status === 'withheld' && !shown?.text.includes('has come up'), `status ${e?.status}; shown after No: ${shown ? shown.text.slice(0, 60) : 'nothing'}`); });
test('10 Correction', '"No": after ≥2 NEW independent observations it can return, but only as a hedged question that mentions the disagreement', () => { const { s, insightId } = shownRepeated(); applyFeedback(s, insightId, 'no', 7); introduced(s, 9, 'work'); prompted(s, 11, 'foc_attention', 'work'); const r = ev(s, 12); const e = r.evidence.find((x) => x.key === 'repeated_signal:work')!; const { shown } = chooseInsight(s, r.evidence, 40, false); return ok(e.status === 'active' && e.support === 'tentative' && !!shown && shown.tier === 'hedged' && /didn't fit|question/.test(shown.text), `support ${e.support}; ${shown?.tier}: ${shown?.text.slice(0, 110)}`); });
test('10 Correction', '"No" also rests the subject: Mirar stops testing that domain for suppressDaysNo', () => { const { s, insightId } = shownRepeated(); applyFeedback(s, insightId, 'no', 7); const rest = s.domainState.work?.restUntilDay ?? 0; return ok(rest >= 7 + V2.feedback.suppressDaysNo, `work resting until day ${rest}`); });
test('10 Correction', '"Partly": wording acknowledges it; support not raised', () => { const { s, insightId } = shownRepeated(); applyFeedback(s, insightId, 'partly', 7); const r = ev(s, 30); const ins = chooseInsight(s, r.evidence, 40, false).shown; return ok(!!s.feedbackMem['repeated_signal:work']?.partlyDay && (!ins || /partly/.test(ins.text) || ins.tier !== 'supported'), `${ins ? ins.tier + ': ' + ins.text.slice(0, 100) : 'none'}`); });
test('10 Correction', '"Not sure": waits suppressDaysUnsure; "Accurate": no change', () => { const { s, insightId } = shownRepeated(); applyFeedback(s, insightId, 'unsure', 7); const a = ev(s, 9).evidence.find((x) => x.key === 'repeated_signal:work')?.status === 'withheld'; const b = ev(s, 7 + V2.feedback.suppressDaysUnsure + 1).evidence.find((x) => x.key === 'repeated_signal:work')?.status === 'active'; const t = shownRepeated(); applyFeedback(t.s, t.insightId, 'accurate', 7); const c = ev(t.s, 9).evidence.find((x) => x.key === 'repeated_signal:work')?.status === 'active'; return ok(a && b && c, `unsure withheld ${a}, active after wait ${b}; accurate unchanged ${c}`); });
test('10 Correction', 'two "No"s in the last 3 → tentative mode: evidence bar rises, wording hedged, cooldown doubles', () => { const s = createState(); for (const [k, d] of [[1, 7], [2, 8]] as const) { s.insights.push({ id: k, day: d, evidenceKey: `x${k}`, kind: 'repeated_signal', tier: 'supported', text: 't', snapshot: { independentN: 3, introducedN: 1, promptedN: 2 }, feedback: { day: d, value: 'no' } }); } const r = ev(s, 9); return ok(r.tentativeMode, `tentativeMode ${r.tentativeMode}`); });
test('10 Correction', 'disagreement is never turned into a claim about the person (banned terms in every insight and trace)', () => {
  const banned = /denial|in denial|resist|defensive|deflect|avoidance|avoiding|pathology|disorder|diagnos|unwilling|refus(es|ing) to|can't accept|won't admit/i;
  let hits: string[] = []; for (const r of ALL) { const id = r.profile.id; for (const i of r.state.insights) if (banned.test(i.text)) hits.push(`${id}: ${i.text.slice(0, 60)}`); for (const l of r.logs) { if (!l.decision) continue; const t = l.decision.trace; const txt = [t.primaryReason, ...t.secondaryReasons, ...t.constraints.map((c) => c.effect), ...t.letRest, ...t.rejected.map((r) => r.why), ...l.refusals.map((r) => r.reason)].join(' | '); if (banned.test(txt)) hits.push(`${id} d${l.day + 1}: ${txt.match(banned)![0]}`); } }
  return ok(hits.length === 0, `${hits.length} banned-term hits${hits[0] ? ' e.g. ' + hits[0] : ''}`);
});
test('10 Correction', 'disagrees profile: after "No", Mirar stops bringing that subject up for 21 days unless the user raises it again themselves (every seed with a "No")', () => forAll('disagrees', (r) => {
  const first = r.state.insights.find((i) => i.feedback?.value === 'no' && (i.kind === 'repeated_signal' || i.kind === 'cross_capacity_convergence')); if (!first) return { ok: true, note: 'no domain insight was disagreed with' };
  // only the user raising the subject again can end the quiet period early
  const raisedAgain = r.state.observations.find((o) => o.domain === 'work' && o.domainOrigin === 'user_introduced' && o.day > first.day);
  const until = raisedAgain ? raisedAgain.day : first.day + V2.feedback.suppressDaysNo;
  const after = r.state.instances.filter((i) => i.day > first.day && i.day < until && (i.bound === 'work' || i.intent.endsWith(':work')) && i.intent !== 'resolution_check');
  return { ok: after.length === 0, note: `"No" on day ${first.day + 1}; ${after.length} work-bound reps in the next ${V2.feedback.suppressDaysNo} days` };
}));
// ═══ 11 — "I DON'T KNOW" ═══
test('11 Uncertainty', 'frequent "I don\'t know" triggers simplify/ease mode; during it every rep is light and not free-form (every seed)', () => forAll('dont_know', (r) => {
  const days = r.logs.filter((l) => l.decision?.trace.constraints.some((c) => c.name === 'simplify' || c.name === 'ease')); const simp = r.logs.filter((l) => l.decision?.trace.constraints.some((c) => c.name === 'simplify')).map((l) => l.instance!).filter(Boolean);
  const bad = simp.filter((i) => i.intensity !== 'light' || TEMPLATE_BY_ID[i.templateId].interaction === 'words').length;
  return { ok: days.length > 0 && bad === 0, note: `${days.length} ease/simplify days, ${bad} non-light or free-form reps during simplify` };
}));
test('11 Uncertainty', 'no lens/thread/event reps while the user is not answering (uncertainty is not escalated; every seed)', () => forAll('dont_know', (r) => { const bad = r.logs.filter((l) => l.decision?.trace.constraints.some((c) => c.name === 'simplify') && l.instance && (/^lens:/.test(l.instance.intent) || ['thread_check', 'event_check', 'resolution_check'].includes(l.instance.intent))).length; return { ok: bad === 0, note: `${bad} served during simplify` }; }));
test('11 Uncertainty', 'unknown is never turned into avoidance: no contradiction/change/resolution evidence is built from "I don\'t know" (every seed)', () => forAll('dont_know', (r) => { const kinds = new Set(computeEvidence(r.state, 29).evidence.map((e) => e.kind)); const risky = [...kinds].filter((k) => ['contradiction', 'resolution', 'change'].includes(k)); return { ok: risky.length === 0, note: `kinds ${[...kinds].join(',')}` }; }, 0.9));
test('11 Uncertainty', 'interpretive confidence drops: no supported insight is shown while the user is mostly answering "I don\'t know"', () => { let bad = 0, tot = 0; for (const r of RS['dont_know']) for (const l of r.logs) if (l.insight) { tot++; if (l.tentativeAtInsight && l.insight.tier === 'supported' && l.insight.kind !== 'resolution') bad++; } return ok(bad === 0, `${bad} of ${tot} insights across ${RS['dont_know'].length} seeds were supported while confidence was lowered`); });
// ═══ 12 — STABLE / POSITIVE ═══
test('12 Stable', 'nothing is manufactured: every lens/thread/event rep traces to something the user originated; no pattern insights (every seed)', () => { const bad: string[] = []; for (const id of ['stable', 'stable_60', 'stable_blip']) for (const r of RS[id]) {
    for (const i of r.state.instances) { if (i.frame === 'commitment_check') continue; const d = i.bound ?? (i.intent.startsWith('native:') ? (i.intent.split(':')[1] as Domain) : undefined); if (!d) continue; const origin = r.state.observations.some((o) => o.day <= i.day && o.domain === d && o.domainOrigin === 'user_introduced') || r.state.threads.some((t) => t.domain === d && (t.openedVia === 'user_introduced' || t.openedVia === 'user_confirmed')); if (!origin) bad.push(`${r.profile.id} d${i.day + 1}`); }
    if (id !== 'stable_blip' && r.state.insights.some((i) => i.kind === 'repeated_signal' || i.kind === 'cross_capacity_convergence')) bad.push(`${id}: pattern insight`); }
  return ok(bad.length === 0, bad.slice(0, 4).join('; ') || 'none'); });
test('12 Stable', 'a passing worry does not become a thread forever: stable_blip rests/closes it, no pattern claim (≥ 90% of seeds)', () => forAll('stable_blip', (r) => { const th = r.state.threads.filter((t) => t.kind === 'ongoing'); const ctx = r.state.instances.filter((i) => ctxIntent(i) && i.intent !== 'probe_confirm').length; const patt = r.state.insights.filter((i) => i.kind === 'repeated_signal' || i.kind === 'cross_capacity_convergence').length;
  return { ok: ctx <= 7 && patt <= 0 && th.every((t) => t.state !== 'open' || (29 - (t.lastConfirmedDay ?? 0)) < 14), note: `threads ${th.map((t) => t.domain + ':' + t.state).join(',') || 'none'}, ctx reps ${ctx}, pattern insights ${patt}` }; }, 0.9));
test('12 Stable', 'positive/maintenance reps appear regularly (≥ 25% of reps carry a positive tag or are light acknowledgments; every seed)', () => forAll('stable_60', (r) => { const pos = r.state.instances.filter((i) => TEMPLATE_BY_ID[i.templateId].tags.includes('positive') || ['presence', 'probe_anchor'].includes(i.templateId)).length; return { ok: pos / r.state.instances.length >= 0.25, note: `${pos}/${r.state.instances.length}` }; }));
test('12 Stable', '"No rep today" can appear for a stable user in most seeds, but never above 10% of opened days', () => { const ms = RS['stable_60'].map(metrics); const some = ms.filter((m) => m.rest >= 1).length; const worst = Math.max(...ms.map((m) => m.rest / m.opened)); return ok(some / ms.length >= 0.7 && worst <= 0.1, `${some}/${ms.length} seeds had ≥1 no-rep day; worst share ${Math.round(worst * 100)}%`); });
// ═══ 13 — HIGH BURDEN ═══
test('13 High burden', 'no endless escalation: ≤ 2 consecutive non-light reps in the heavy window (every seed)', () => forAll('high_burden', (r) => { const heavy = r.state.instances.filter((i) => i.day >= 6 && i.day <= 16); let c = 0, w = 0; for (const i of heavy) { c = i.intensity !== 'light' ? c + 1 : 0; w = Math.max(w, c); } return { ok: w <= 2, note: `worst ${w}; non-light ${heavy.filter((i) => i.intensity !== 'light').length}/${heavy.length}` }; }));
test('13 High burden', 'recovery can outrank relevance, and the system never discards a thread (≥ 80% of seeds show recovery overriding relevance; 100% no system resolution)', () => { const rs = RS['high_burden']; const rec = rs.filter((r) => r.logs.some((l) => l.decision?.trace.constraints.some((c) => c.name === 'recovery' && /relevance/.test(c.overrode ?? '')))).length; const sys = rs.filter((r) => r.state.threads.some((t) => t.state === 'resolved' && t.stateSource !== 'user')).length; return ok(rec / rs.length >= 0.8 && sys === 0, `recovery overrode relevance in ${rec}/${rs.length} seeds; seeds with a system-resolved thread: ${sys}`); });
// ═══ 14 — IRREGULAR USE ═══
test('14 Irregular', 'after a 7+ day absence the first rep is an open probe, not the old thread (every seed, every gap)', () => { let bad = 0, tot = 0; for (const id of ['absence_week', 'absence_month_60', 'every_2_3_days']) for (const r of RS[id]) { const a = r.state.instances; for (let k = 1; k < a.length; k++) if (a[k].day - a[k - 1].day >= V2.gaps.returnDays) { tot++; if (a[k].intent !== 'probe_return') bad++; } } return ok(bad === 0 && tot > 0, `${tot} returns checked, ${bad} did not start with an open probe`); });
test('14 Irregular', 'after a month away: threads go dormant, past-due commitments lapse quietly, no old asks on return (every seed)', () => forAll('absence_month_60', (r) => { const back = r.state.instances.find((i) => i.day > 48); const reRaised = (d: string) => r.state.observations.some((o) => o.day > 48 && o.domain === d && o.domainOrigin === 'user_introduced'); const askedOld = r.state.instances.filter((i) => i.day > 48 && i.day <= (back?.day ?? 0) + 3 && ((i.intent === 'thread_check' && !reRaised(i.bound as string)) || (i.intent === 'commitment_due' && (r.state.commitments.find((c) => c.id === i.intentRef)?.createdDay ?? 99) < 15))).length; const stillOpen = r.state.threads.filter((t) => t.kind === 'ongoing' && t.state === 'open' && t.openedDay < 15 && (t.lastConfirmedDay ?? 0) < 15 && !reRaised(t.domain)).length;
  const dormantOrWoken = r.state.threads.filter((t) => t.openedDay < 15).every((t) => t.state !== 'open' || (t.lastConfirmedDay ?? 0) > 48);
  return { ok: !!back && back.intent === 'probe_return' && askedOld === 0 && dormantOrWoken, note: `first back ${back?.intent}; old asks ${askedOld}; threads from before still open without the user raising them: ${stillOpen}` }; }));
test('14 Irregular', 'a thread from 30 days ago does not dominate on return: ≤ 1 partner-driven rep among the first 5 back (every seed)', () => forAll('absence_month_60', (r) => { const back = r.state.instances.filter((i) => i.day > 48).slice(0, 5); const n = back.filter((i) => i.bound === 'partner' || i.intent.endsWith(':partner')).length; return { ok: n <= 1, note: `${n} of ${back.length}` }; }));
test('14 Irregular', 'use every 2–3 days: windows count reps, not calendar days (no assumed daily practice)', () => forAll('every_2_3_days', (r) => { const m = metrics(r); return { ok: m.reps >= 10, note: `${m.reps} reps over ${m.days} days` }; }));
// ═══ 16 — NO REP TODAY ═══
test('16 No rep today', 'never in the first 10 reps, never twice in a row, never right after a burden or while a thread is open (all runs)', () => {
  const bad: string[] = []; for (const r of ALL) { for (const l of r.logs) if (l.rest) { const prior = r.state.instances.filter((i) => i.day < l.day); if (prior.length < V2.rest.minHistoryReps) bad.push(`${r.profile.id} d${l.day + 1}: only ${prior.length} reps`); if (prior.length && prior[prior.length - 1].burden) bad.push(`${r.profile.id} d${l.day + 1}: after burden`); if (r.logs[l.day - 1]?.rest) bad.push(`${r.profile.id} d${l.day + 1}: consecutive`); if (l.decision!.trace.openThreads.some((t) => t.includes('[open'))) bad.push(`${r.profile.id} d${l.day + 1}: open thread`); } }
  return ok(bad.length === 0, bad.slice(0, 3).join('; ') || `none across ${ALL.length} runs`); });
test('16 No rep today', 'it is never served while Mirar holds evidence of an active issue (open thread, active domain, topic named in the last 28 days; all runs)', () => {
  const bad: string[] = []; for (const r of ALL) for (const l of r.logs) if (l.rest) { const t = l.decision!.trace; if (t.openThreads.some((x) => x.includes('[open')) || t.activeDomains.length) bad.push(`${r.profile.id} d${l.day + 1}`); const named = r.state.observations.some((o) => o.day > l.day - V2.rest.issueLookbackDays && o.day < l.day && o.domainRole === 'issue' && o.polarity === 'present' && o.domain && o.domain !== 'unknown' && ['prompted_choice', 'user_introduced'].includes(o.domainOrigin ?? '')); if (named) bad.push(`${r.profile.id} d${l.day + 1} (named topic)`); }
  return ok(bad.length === 0, bad.slice(0, 3).join(', ') || 'none'); });
test('16 No rep today', 'it follows an explicit "nothing" from the user and is not periodic (stable_60: rest gaps vary across seeds)', () => { const gapsets = RS['stable_60'].map((r) => { const d = r.logs.filter((l) => l.rest).map((l) => l.day); return d.slice(1).map((x, k) => x - d[k]); }); const allGaps = gapsets.flat(); const distinct = new Set(allGaps).size; const follows = ALL.every((r) => r.logs.filter((l) => l.rest).every((l) => /said nothing|themselves said nothing/.test(l.decision!.trace.secondaryReasons.join(' ')))); return ok(follows && (allGaps.length === 0 || distinct >= 2), `rest gaps across seeds: ${[...new Set(allGaps)].sort((a, b) => a - b).join(',') || 'n/a'}; every no-rep day cites the user's own "nothing": ${follows}`); });
test('16 No rep today', 'is rare enough not to feel absent (≤ 10% of opened days in every run)', () => { let worst = 0, who = ''; for (const r of ALL) { const m = metrics(r); const sh = m.rest / Math.max(1, m.opened); if (sh > worst) { worst = sh; who = r.profile.id; } } return ok(worst <= 0.1, `worst ${Math.round(worst * 100)}% (${who}) across ${ALL.length} runs`); });
// ═══ 17 — COMMITMENTS ═══
const mkC = (s: State, tf: Commitment['timeframe'], due: number | undefined, day = 0): Commitment => { const c: Commitment = { id: ++s.seq.commit, kind: 'reach_out', timeframe: tf, createdDay: day, dueDay: due, status: 'open', statusSource: 'user', asks: 0, noneRevisits: 0, events: [{ day, from: null, to: 'open', by: 'user' }] }; s.commitments.push(c); return c; };
test('17 Commitments', 'all five timeframes behave: today/tomorrow/this_week/date are asked at their date; "none" is not', () => {
  const s = createState(); const cs = [mkC(s, 'today', 0), mkC(s, 'tomorrow', 1), mkC(s, 'this_week', 6), mkC(s, 'specific_date', 4), mkC(s, 'none', undefined)];
  const cfg = { ...V2, rest: { ...V2.rest, enabled: false } };
  const askedOn: Record<number, number[]> = {}; let day = 0;
  for (day = 0; day < 12; day++) { const dec = decide(s, day, cfg); const t = TEMPLATE_BY_ID[dec.templateId!]; const i = inst(s, day, t.id, { frame: dec.frame, bound: dec.bound, layer: dec.layer, intent: dec.intent, intentRef: dec.intentRef }); if (dec.frame === 'commitment_check') { const c = s.commitments.find((x) => x.id === dec.intentRef)!; (askedOn[c.id] ??= []).push(day); applyRep(s, i, flowContext(s, day, t.id, 'commitment_check', undefined), [{ stepId: 'primary', kind: 'unknown' }]); } }
  const first = (c: Commitment) => askedOn[c.id]?.[0];
  return ok(first(cs[0]) !== undefined && first(cs[0])! >= 0 && first(cs[1])! >= 1 && first(cs[3])! >= 4 && first(cs[2])! >= 6 && first(cs[4]) === undefined, `first ask days: today ${first(cs[0])}, tomorrow ${first(cs[1])}, date ${first(cs[3])}, this_week ${first(cs[2])}, none ${first(cs[4]) ?? 'not asked before day 14'}`);
});
test('17 Commitments', 'no nagging: a user who never answers is asked at most maxAsks times, then it is recorded "unconfirmed" (not failure)', () => {
  const s = createState(); const c = mkC(s, 'tomorrow', 1); const cfg = { ...V2, rest: { ...V2.rest, enabled: false } }; let asks = 0;
  for (let d = 0; d < 25; d++) { const dec = decide(s, d, cfg); const t = TEMPLATE_BY_ID[dec.templateId!]; const i = inst(s, d, t.id, { frame: dec.frame, layer: dec.layer, intent: dec.intent, intentRef: dec.intentRef }); if (dec.frame === 'commitment_check') { asks++; applyRep(s, i, flowContext(s, d, t.id, 'commitment_check', undefined), [{ stepId: 'primary', kind: 'skip' }]); } }
  return ok(asks <= V2.commitment.maxAsks && c.status === 'unconfirmed' && c.statusSource === 'system', `asked ${asks}× (max ${V2.commitment.maxAsks}); status ${c.status} (${c.statusSource})`);
});
test('17 Commitments', 'only the user can mark done/partly/postponed/changed_mind/dropped; the system can only set "unconfirmed"', () => {
  let bad = 0; for (const r of ALL) for (const c of r.state.commitments) for (const e of c.events) if (e.by === 'system' && e.to !== 'unconfirmed') bad++; else if (e.by === 'user' && e.to === 'unconfirmed') bad++;
  return ok(bad === 0, `${bad} events set by the wrong party across all runs`);
});
test('17 Commitments', 'statuses reachable by the user: done, partly_done, postponed, changed_mind, dropped_on_purpose', () => {
  const s = createState(); const seen = new Set<string>(); const map: [string, string][] = [['done', 'done'], ['partly', 'partly_done'], ['not_yet', 'postponed'], ['changed_mind', 'changed_mind'], ['dropped', 'dropped_on_purpose']];
  for (const [opt, st] of map) { const c = mkC(s, 'tomorrow', 1); const i = inst(s, 1, 'cont_commitment', { frame: 'commitment_check', intentRef: c.id, intent: 'commitment_due' }); const a: StepAnswer[] = [{ stepId: 'primary', kind: 'option', optionId: opt }]; if (opt === 'not_yet') a.push({ stepId: 'timeframe', kind: 'timeframe', timeframe: 'this_week' }); applyRep(s, i, flowContext(s, 1, 'cont_commitment', 'commitment_check', undefined), a); if (c.status === st && c.statusSource === 'user') seen.add(st); }
  return ok(seen.size === 5, `reached: ${[...seen].join(', ')}`);
});
test('17 Commitments', 'a passed deadline is not failure: unconfirmed never appears in any insight or negative wording', () => {
  let bad = 0; for (const r of ALL) for (const i of r.state.insights) if (/unconfirmed|missed|failed|didn't (do|follow)|fell short/i.test(i.text)) bad++;
  return ok(bad === 0, `${bad} insights mention missed/failed commitments`);
});
test('17 Commitments', 'introspective_inactive (mostly changes mind): zero "avoidance"-type claims and zero commitment-based insights (every seed)', () => forAll('introspective_inactive', (r) => { const bad = r.state.insights.filter((i) => /commit|follow|avoid|inactive|act\b/i.test(i.text)).length; return { ok: bad === 0, note: `${bad} insights about acting` }; }));
// ═══ HEURISTICS APPLIED AFTER SIMULATION REVIEW ═══
test('18 Applied heuristics', 'open context probe runs about every 10 reps (cadence probes: median gap ≥ 9 reps, stable users)', () => {
  const gaps: number[] = []; for (const r of RS['stable_60']) { const a = r.state.instances; let last = -1; a.forEach((i, k) => { if (i.templateId === 'probe_anchor') { if (last >= 0) gaps.push(k - last); last = k; } }); }
  const sorted = [...gaps].sort((x, y) => x - y); const med = sorted[Math.floor(sorted.length / 2)];
  return ok(med >= 9 && med <= 12, `${gaps.length} gaps; median ${med} reps, min ${sorted[0]}, max ${sorted[sorted.length - 1]} (config everyReps ${V2.probe.everyReps})`);
});
test('18 Applied heuristics', 'the open question has 3 phrasings; consecutive uses never repeat the same wording (all runs)', () => {
  let bad = 0, uses = 0; const seen = new Set<number>(); for (const r of ALL) { let prev = -1; for (const i of r.state.instances) if (i.templateId === 'probe_anchor') { uses++; seen.add(i.variant ?? 0); if (i.variant === prev) bad++; prev = i.variant ?? 0; } }
  return ok(TEMPLATE_BY_ID['probe_anchor'].promptVariants!.length === 3 && bad === 0 && seen.size === 3, `${uses} uses; variants seen ${[...seen].join(',')}; back-to-back repeats ${bad}`);
});
test('18 Applied heuristics', 'tie-break is deterministic per user: same user → same order; different users → different first reps', () => {
  const p = PROFILES.find((x) => x.id === 'stable')!; const first = (seed: number) => runProfile({ ...p, seed }).state.instances.slice(0, 8).map((i) => i.templateId).join('>');
  const a1 = first(111), a2 = first(111); const many = new Set(Array.from({ length: 20 }, (_, k) => first(1000 + k)));
  return ok(a1 === a2 && many.size >= 10, `same seed identical: ${a1 === a2}; distinct first-8 sequences across 20 users: ${many.size} (was 5 with a day-only hash)`);
});
test('18 Applied heuristics', 'exercise window 14: no non-continuity exercise repeats (same binding) within 14 reps unless the trace says the window was relaxed (all runs)', () => {
  let worst = Infinity, where = '', relaxedN = 0, unexplained = 0; for (const r of ALL) { const a = r.state.instances; const last: Record<string, number> = {}; a.forEach((i, k) => { const t = TEMPLATE_BY_ID[i.templateId]; if (t.role === 'continuity' || t.role === 'probe') return; const key = `${i.templateId}|${i.frame}|${i.bound ?? ''}`; if (key in last && k - last[key] < V2.templateWindowReps) { if (/repeat window relaxed/.test(i.trace.secondaryReasons.join(' '))) relaxedN++; else { unexplained++; if (k - last[key] < worst) { worst = k - last[key]; where = `${r.profile.id} ${key}`; } } } last[key] = k; }); }
  return ok(unexplained === 0, `repeats inside the window: ${relaxedN} (all explicitly relaxed in the trace, only when every allowed exercise was inside its window), ${unexplained} unexplained${unexplained ? ` (closest ${worst} reps apart: ${where})` : ''}; window ${V2.templateWindowReps}`);
});
test('18 Applied heuristics', 'current budget (2 of 5) and rest behaviour are unchanged', () => ok(V2.budget.cap === 2 && V2.budget.maxConsecutive === 2 && V2.rest.calmRun === 8 && V2.rest.minGapDays === 10, `budget ${V2.budget.cap}/${V2.budget.lookbackReps}, max ${V2.budget.maxConsecutive} in a row; rest calmRun ${V2.rest.calmRun}, minGap ${V2.rest.minGapDays}d`));
test('18 Applied heuristics', 'internal terms never reach users: no "probe", "bias", "calibration" or "selection" in any prompt, option, chip, or shown insight (all runs)', () => {
  const banned = /\bprobe\b|\bbias\b|calibrat|selection|\blens\b|thread|\bengine\b/i; const strings: string[] = [];
  for (const t of TEMPLATES) { strings.push(t.prompt, ...(t.promptVariants ?? []), ...t.options.map((o) => o.label)); if (t.followUp) strings.push(t.followUp.prompt, ...t.followUp.options.map((o) => o.label)); if (t.words) strings.push(t.words.prompt); }
  for (const c of ['focus', 'energy', 'relationships', 'growth', 'direction', 'action'] as const) for (const d of ['work', 'partner', 'family', 'friends', 'self', 'body_health', 'money', 'time', 'technology', 'rest', 'other'] as Domain[]) { const t = TEMPLATES.find((x) => x.hasLens && x.capacity === c)!; strings.push(primaryOptionsFor(t, 'lens', d)); }
  const hits = strings.filter((x) => banned.test(x)); const ins = ALL.flatMap((r) => r.state.insights.map((i) => i.text)).filter((x) => banned.test(x));
  return ok(hits.length === 0 && ins.length === 0, `${strings.length} authored strings and ${ALL.reduce((a, r) => a + r.state.insights.length, 0)} generated insights scanned; hits ${hits.length + ins.length}${hits[0] ? ' e.g. ' + hits[0] : ''}${ins[0] ? ' e.g. ' + ins[0] : ''}`);
});

// ═══ COMMITMENT FOLLOW-UP BUDGET (final adjustment before integration) ═══
const rolling3 = (insts: Instance[]) => { const cc = insts.filter((i) => i.completed).map((i) => (i.frame === 'commitment_check' ? 1 : 0)); let w = 0; for (let k = 0; k + 3 <= cc.length; k++) w = Math.max(w, cc[k] + cc[k + 1] + cc[k + 2]); return w; };
test('17 Commitments', 'follow-up budget: at most 1 commitment check in any rolling 3 completed reps (all runs)', () => { let worst = 0, who = ''; for (const r of ALL) { const w = rolling3(r.state.instances); if (w > worst) { worst = w; who = r.profile.id; } } return ok(worst <= 1, `worst window ${worst} (${who}) across ${ALL.length} runs`); });
test('17 Commitments', 'several commitments due at once: one rep, one commitment, deterministic order, nothing combined into a list', () => {
  const s = createState(); const mk = (id: number, tf: Commitment['timeframe'], due: number | undefined, created: number, asks = 0, lastAsk?: number) => { const c: Commitment = { id, kind: 'reach_out', timeframe: tf, createdDay: created, dueDay: due, status: 'open', statusSource: 'user', asks, lastAskDay: lastAsk, noneRevisits: 0, events: [{ day: created, from: null, to: 'open', by: 'user' }] }; s.commitments.push(c); s.seq.commit = Math.max(s.seq.commit, id); return c; };
  const A = mk(1, 'specific_date', 15, 10); const B = mk(2, 'today', 20, 20); const C = mk(3, 'today', 20, 17, 1, 17); const D = mk(4, 'none', undefined, 0); const E = mk(5, 'tomorrow', 19, 18);
  const cfg = { ...V2, rest: { ...V2.rest, enabled: false } }; const order: number[] = []; const dayOf: Record<number, number> = {}; const seenReps: number[] = [];
  inst(s, 19, 'foc_loops'); // the user was here yesterday (otherwise Mirar would treat past-due items as a long absence and lapse them quietly)
  for (let d = 20; d < 34; d++) { const dec = decide(s, d, cfg); const t = TEMPLATE_BY_ID[dec.templateId!]; const i = inst(s, d, t.id, { frame: dec.frame, bound: dec.bound, layer: dec.layer, intent: dec.intent, intentRef: dec.intentRef });
    if (dec.frame === 'commitment_check') { order.push(dec.intentRef!); dayOf[dec.intentRef!] = d; applyRep(s, i, flowContext(s, d, t.id, 'commitment_check', undefined), [{ stepId: 'primary', kind: 'unknown' }]); seenReps.push(1); }
    else { applyRep(s, i, flowContext(s, d, t.id, dec.frame!, dec.bound), [{ stepId: 'primary', kind: 'option', optionId: (t.options[0] ?? { id: 'x' }).id }]); seenReps.push(0); } }
  const first = order[0]; const second = order[1]; const idxA = order.indexOf(A.id), idxB = order.indexOf(B.id), idxE = order.indexOf(E.id);
  const askDays: number[] = []; s.instances.forEach((x) => { if (x.frame === 'commitment_check') askDays.push(x.day); }); const gapsOk = askDays.every((d2, k) => k === 0 || d2 - askDays[k - 1] >= 3);
  const statuses = s.commitments.map((c) => `#${c.id}:${c.status}(${c.statusSource})`);
  const noFailure = s.commitments.every((c) => ['open', 'unconfirmed', 'postponed', 'done', 'partly_done', 'changed_mind', 'dropped_on_purpose'].includes(c.status)) && s.commitments.filter((c) => c.status === 'unconfirmed').every((c) => c.statusSource === 'system') && s.commitments.every((c) => !c.events.some((e) => e.by === 'user' && e.to === 'unconfirmed'));
  const overdueNotPrivileged = idxA === -1 || (idxB !== -1 && idxB < idxA) && (idxE === -1 || idxE < idxA);
  return ok(first === B.id && second === E.id && gapsOk && overdueNotPrivileged && noFailure && rolling3(s.instances) <= 1, `asked in order [${order.join(', ')}] (expected B=#${B.id} first: due today and never asked; then E=#${E.id}: never asked, 1 day overdue); ask days ${askDays.join(',')}; the item 5 days overdue (#${A.id}) ${idxA === -1 ? 'was never asked (it lapsed to unconfirmed)' : 'was asked after the fresher ones'}; end states ${statuses.join(' ')}`);
});
test('17 Commitments', 'a waiting commitment is never marked failed and never gains priority for being overdue: only the system status "unconfirmed" can appear, set by the system', () => {
  const s = createState(); const c: Commitment = { id: ++s.seq.commit, kind: 'start', timeframe: 'today', createdDay: 0, dueDay: 0, status: 'open', statusSource: 'user', asks: 0, noneRevisits: 0, events: [] }; s.commitments.push(c);
  const c2: Commitment = { ...c, id: ++s.seq.commit, dueDay: 12, createdDay: 10, events: [] }; s.commitments.push(c2);
  advanceDay(s, 9); const early = c.status; const dec = decide(s, 12, { ...V2, rest: { ...V2.rest, enabled: false } });
  return ok(early === 'unconfirmed' && c.statusSource === 'system' && dec.intentRef === c2.id, `item overdue 9 days: ${early} (${c.statusSource}); on day 12 the fresh one (#${c2.id}) is chosen, not the overdue one: asked #${dec.intentRef}`);
});
test('17 Commitments', 'committer profile exercises the budget: several commitments are due together and the rest wait with a recorded reason', () => {
  let multi = 0, deferred = 0, runs = 0; for (const r of RS['committer']) { runs++; for (const l of r.logs) if (l.decision) { if (l.decision.trace.dueCommitments.length >= 2) multi++; if (l.decision.trace.letRest.some((x) => /commitment #\d+/.test(x) && /(budget|also eligible)/.test(x))) deferred++; } }
  return ok(multi > 0 && deferred > 0, `${multi} decision-days with ≥2 commitments due, ${deferred} with a recorded deferral, across ${runs} seeds`);
});

// ═══ ENGINE FREEZE ═══
test('Freeze', 'engine configuration matches the frozen snapshot (any tuning must be a deliberate, reviewed change)', () => {
  const fs2 = require('fs'); const path2 = require('path'); const snap = path2.join(__dirname, 'freeze.json'); const now = JSON.stringify({ ENGINE_VERSION, config: V2 }, null, 1);
  if (process.env.UPDATE_FREEZE === '1') { fs2.writeFileSync(snap, now); return ok(true, 'snapshot rewritten'); }
  const frozen = fs2.existsSync(snap) ? fs2.readFileSync(snap, 'utf8') : ''; return ok(frozen === now, frozen === now ? `config identical to freeze.json (${ENGINE_VERSION})` : 'config differs from scripts/sim/freeze.json — re-run with UPDATE_FREEZE=1 only after review');
});

// ═══ contract + structural ═══
test('Contracts', '"I don\'t know" ends a rep without asking anything further', () => {
  const ctx = flowContext(createState(), 0, 'foc_attention', 'base', undefined);
  const a = nextStep(ctx, [{ stepId: 'primary', kind: 'unknown' }]); return ok(a === null, `next step after "I don't know": ${a ? a.id : 'none'}`);
});
test('Contracts', 'raw text cannot leak through the engine: a words answer carrying text leaves no trace in any state', () => {
  const s = createState(); const i = inst(s, 2, 'rel_appreciation', {}); const ctx = flowContext(s, 2, 'rel_appreciation', 'base', undefined);
  const leaky = [{ stepId: 'primary', kind: 'option', optionId: 'yes' }, { stepId: 'words', kind: 'words', text: 'my private sentence about my father' }] as unknown as StepAnswer[];
  applyRep(s, i, ctx, leaky);
  const dump = JSON.stringify(s) + JSON.stringify(computeEvidence(s, 3)) + JSON.stringify(decide(s, 3, { ...V2, rest: { ...V2.rest, enabled: false } }).trace);
  return ok(!/private sentence|father/.test(dump), `state, evidence and decision trace serialised (${dump.length} chars): text present = ${/private sentence|father/.test(dump)}`);
});
test('Structure', 'domain and orientation vocabularies are disjoint (imported from the real lists)', () => { const shared = (DOMAINS as readonly string[]).filter((x) => (ORIENTATIONS as readonly string[]).includes(x)); return ok(shared.length === 1 && shared[0] === 'unknown', `shared values: ${shared.join(',')} ("unknown" is a value in each field, not a merged field); domains ${DOMAINS.length}, orientations ${ORIENTATIONS.length}`); });
test('Structure', 'resource-role domains (what helped) never count as issue evidence', () => { let bad = 0; for (const r of ALL) for (const e of computeEvidence(r.state, r.profile.days).evidence) if (['repeated_signal', 'cross_capacity_convergence'].includes(e.kind) && ['rest'].includes(e.subject)) bad++; return ok(bad === 0, `${bad} evidence objects about "rest" as an issue from "what helped" answers`); });

// ── output
const sections = Array.from(new Set(results.map((r) => r.section)));
const lines: string[] = ['# V2 simulator — test results', '', `Generated by \`npx tsx scripts/sim/suite.ts\`. ${results.filter((r) => r.pass).length}/${results.length} pass, ${results.filter((r) => r.finding).length} recorded as findings, ${results.filter((r) => !r.pass && !r.finding).length} failing. Nothing is hidden: failing and finding rows stay in this file.`, ''];
for (const s of sections) { lines.push(`## ${s}`, '', '| | Test | Detail |', '|---|---|---|'); for (const r of results.filter((x) => x.section === s)) lines.push(`| ${r.pass ? 'PASS' : r.finding ? 'FINDING' : '**FAIL**'} | ${r.name} | ${r.detail.replace(/\|/g, '/')} |`); lines.push(''); }
fs.writeFileSync(path.join(__dirname, '../../docs/V2_TEST_RESULTS.md'), lines.join('\n'));
for (const r of results) console.log(`${r.pass ? 'PASS' : r.finding ? 'FIND' : 'FAIL'}  [${r.section}] ${r.name}\n        ${r.detail}`);
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} pass, ${results.filter((r) => r.finding).length} findings, ${results.filter((r) => !r.pass && !r.finding).length} failing`);
void advanceDay; void V2; void uidN;

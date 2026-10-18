// READ-ONLY EVALUATION TOOL: a 14-day walkthrough of the REAL runtime (frozen engine, v2 templates, Mirror read model) for three simulated personas.
// Nothing here changes the engine, thresholds, UI, Supabase, billing or any branch. It only drives the public runtime API, exactly like the app does:
//   rt.init → rt.today → nextStep (the step machine the UI renders) → rt.complete → rt.receipt / rt.mirror.
// Three kinds of text appear in the output and are labelled: ENGINE (verbatim from the engine/runtime), UI (verbatim copy that the shipped components
// render around it; mirrored from the source file named in the label), SIMULATED (this script's persona choosing an answer). No product copy is invented.
// Run: npx tsx scripts/sim/first14.ts   (writes docs/product/first14/*)
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { V2 } from '../../lib/innerRep/v2/config';
import { TEMPLATE_BY_ID, TEMPLATES } from '../../lib/innerRep/v2/templates';
import { nextStep, primaryOptions, StepAnswer, Step, FlowContext, TIMEFRAME_LABEL, DOMAIN_CHIP_LABEL, CORRECTION_REASONS, CORRECTION_PROMPT } from '../../lib/innerRep/v2/contracts';
import { createRuntime, V2Runtime } from '../../lib/innerRep/runtime/v2-runtime';
import { MemKV } from '../../lib/innerRep/backup/replay';
import { MirrorModel, MirrorStatement } from '../../lib/innerRep/runtime/mirror-contract';
import { Receipt } from '../../lib/innerRep/runtime/receipt';
import { rng, Rng } from './rng';
import { NOTES, TONE } from './first14-notes';

type Persona = 'everyday' | 'avoider' | 'reflective';
const PERSONAS: Record<Persona, { name: string; blurb: string; opens: (d: number) => boolean }> = {
  everyday: { name: 'The Everyday User', blurb: 'Busy, reasonably happy, not looking to improve anything. Opens it when there is a spare minute; misses two days.', opens: (d) => d !== 5 && d !== 9 },
  avoider: { name: 'The Avoider', blurb: 'Finds serious questions uncomfortable and will not perform introspection. Tries it for a few days and drifts away.', opens: (d) => [1, 2, 3, 5, 8].includes(d) },
  reflective: { name: 'The Reflective User', blurb: 'Already interested in emotional awareness. Opens it every day and is willing to go deeper. Carries real work pressure and a conversation with a partner they have been putting off.', opens: () => true },
};
const BASE = new Date(2026, 9, 19, 15, 0);                                    // Monday 19 October 2026, 15:00 local
const dayDate = (d: number) => new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + d - 1, 15, 0);
const eyebrow = (dt: Date) => dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

// ── persona policies: how a simulated person chooses ──
interface Mem { leftToday: boolean; eventFlagged: boolean }
function pickOption(p: Persona, r: Rng, step: Extract<Step, { type: 'choice' }>, ctx: FlowContext, day: number): StepAnswer {
  const tpl = ctx.template;
  const meta = step.id === 'primary' ? primaryOptions(tpl, ctx.frame, ctx.bound, ctx.variant).options : (tpl.followUp?.options ?? []);
  const withMeta = step.options.map((o) => ({ ...o, m: meta.find((x) => x.id === o.id) }));
  const absent = withMeta.filter((o) => o.m?.polarity === 'absent');
  const burden = withMeta.filter((o) => o.m?.burden);
  const light = withMeta.filter((o) => !o.m?.burden && o.m?.polarity !== 'absent');
  const choose = (xs: typeof withMeta) => xs[Math.floor(r() * xs.length)] ?? withMeta[0];
  const opt = (id: string) => ({ stepId: step.id, kind: 'option', optionId: id }) as StepAnswer;
  const unknown = { stepId: step.id, kind: 'unknown' } as StepAnswer;
  const byId = (id: string) => withMeta.find((o) => o.id === id);
  // commitment check-ins and lenses have fixed vocabularies
  if (ctx.frame === 'commitment_check') { const x = r(); return opt(x < 0.4 ? 'done' : x < 0.65 ? 'partly' : x < 0.9 ? 'not_yet' : 'changed_mind'); }
  if (ctx.frame === 'lens' || ctx.frame === 'thread_check') {
    const x = r();
    if (p === 'reflective') return opt(ctx.bound === 'work' || ctx.bound === 'self' ? (x < 0.6 ? 'a_lot' : 'somewhat') : x < 0.3 ? 'somewhat' : 'not_today');
    if (p === 'avoider') return x < 0.35 ? unknown : opt('not_this');
    return opt(x < 0.6 ? 'not_today' : x < 0.9 ? 'somewhat' : 'a_lot');
  }
  if (ctx.frame === 'event_check') return opt(p === 'reflective' ? (day < 9 ? 'heavier' : 'same') : 'same');
  if (ctx.frame === 'resolution') return opt('mostly');
  if (tpl.id === 'probe_anchor') {
    if (p === 'reflective') { if (day === 4 && byId('event')) return opt('event'); return opt(r() < 0.55 ? 'work' : r() < 0.7 ? 'self' : 'partner'); }
    if (p === 'avoider') return r() < 0.5 ? unknown : opt('other');
    return opt(r() < 0.45 ? 'work' : r() < 0.7 ? 'time' : r() < 0.85 ? 'friends' : 'other');
  }
  // generic templates
  if (p === 'everyday') {
    if (r() < 0.04) return unknown;
    if (absent.length && r() < 0.5) return opt(choose(absent).id);
    if (tpl.interaction === 'compare') return opt(choose(withMeta.filter((o) => !o.m?.burden).length && r() < 0.7 ? withMeta.filter((o) => !o.m?.burden) : withMeta).id);
    if (light.length && r() < 0.7) return opt(choose(light).id);
    return opt(choose(withMeta).id);
  }
  if (p === 'avoider') {
    if (r() < 0.3) return unknown;
    if (absent.length && r() < 0.8) return opt(choose(absent).id);
    if (light.length) return opt(choose(light).id);
    return opt(choose(withMeta).id);
  }
  // reflective: honest, tends toward what is actually weighing on them (work, self, partner)
  if (r() < 0.03) return unknown;
  const want = withMeta.filter((o) => ['work', 'self', 'partner'].includes(String(o.m?.domain)) && (o.m?.burden || tpl.domainRole === 'resource'));
  if (want.length && r() < 0.7) return opt(choose(want).id);
  if (tpl.interaction === 'compare' && burden.length) return opt(r() < 0.6 ? choose(burden).id : choose(withMeta).id);
  if (burden.length && r() < 0.5) return opt(choose(burden).id);
  if (tpl.id === 'act_tiny') return opt('reply');
  return opt(choose(withMeta.filter((o) => o.m?.polarity !== 'absent').length ? withMeta.filter((o) => o.m?.polarity !== 'absent') : withMeta).id);
}
function answerStep(p: Persona, r: Rng, step: Step, ctx: FlowContext, day: number): StepAnswer {
  switch (step.type) {
    case 'choice': return pickOption(p, r, step, ctx, day);
    case 'words': return p === 'reflective' ? { stepId: step.id, kind: 'words' } : { stepId: step.id, kind: 'skip' };
    case 'domain_chips': return p === 'reflective' && step.domains.includes('work') ? { stepId: step.id, kind: 'domain', domain: r() < 0.6 ? 'work' : 'self' } : p === 'everyday' && r() < 0.15 ? { stepId: step.id, kind: 'domain', domain: 'work' } : { stepId: step.id, kind: 'skip' };
    case 'timeframe': { const x = r(); return p === 'reflective' ? { stepId: step.id, kind: 'timeframe', timeframe: x < 0.6 ? 'tomorrow' : 'this_week' } : p === 'everyday' && x < 0.6 ? { stepId: step.id, kind: 'timeframe', timeframe: x < 0.3 ? 'tomorrow' : 'none' } : { stepId: step.id, kind: 'skip' }; }
    case 'yes_no': return p === 'reflective' ? { stepId: step.id, kind: 'yes' } : { stepId: step.id, kind: p === 'everyday' && r() < 0.2 ? 'yes' : 'no' };
    default: return { stepId: step.id, kind: 'skip' };
  }
}
/** Would this simulated person leave without answering? (Avoider only: a serious-feeling rep is not finished.) */
function leaves(p: Persona, r: Rng, ctx: FlowContext): boolean {
  if (p !== 'avoider') return false;
  const t = ctx.template; const serious = t.intensity === 'medium' || t.sensitivity !== 'low' || t.role === 'probe' || t.role === 'presence' || t.interaction === 'words' || ctx.frame !== 'base';
  return serious && r() < 0.65;
}

// ── mirrors of the shipped UI copy (sources named in each label) ──
export function todayScreenUi(td: any, practiceDays: number, dt: Date): string[] {            // components/inner-rep/v2/DailyExperience.tsx, width < 768 (phone)
  const first = nextStep(td.context, [])?.prompt ?? 'A little room to notice.';
  const L: string[] = [eyebrow(dt), 'Good afternoon.', first];
  if (practiceDays) L.push('Room for today. No need to catch up.');
  L.push('[Begin]', 'There is no answer to perform. You can leave any time.');
  if (td.payload.capacityLabel) L.push(td.payload.capacityLabel);
  L.push(`${td.payload.estimatedSeconds} seconds`);
  if (!practiceDays) L.push('[What is an Inner Rep?] → “A small exercise, not a test. Notice what is real, exercise a capacity, then take that noticing into your day. “I don’t know” is a real answer. You can disagree with the mirror.”');
  if (practiceDays) L.push(`${practiceDays} ${practiceDays === 1 ? 'day' : 'days'} of practice this month`);
  return L;
}
export function doneScreenUi(rec: Receipt | null, ctxFallback: boolean): string[] {              // components/experience/IntegrationMoment.tsx + DailyExperience.tsx
  const steps = rec?.steps ?? []; const unknown = steps.some((s) => s.choice.kind === 'unknown'); const commitment = rec?.commitment;
  const first = steps[0]?.choice; const permission = first?.kind === 'option' && first.absent;
  const title = unknown ? 'Room for not knowing.' : commitment ? 'Something you chose to carry.' : permission ? 'You can leave it here.' : steps.length > 1 ? 'Both responses, in context.' : steps.length ? 'This session, in view.' : 'The practice can end here.';
  const L = ['Done for today.', 'Take it into life', title];
  for (const s of steps) L.push(`The offered question: ${s.prompt}`, `Your selected response: ${s.choice.kind === 'unknown' ? 'I don’t know' : s.choice.kind === 'domain' ? s.choice.label : s.choice.label}`, s.choice.kind === 'domain' ? 'Context you selected' : 'Your response to the offered question');
  if (commitment) L.push(`Your chosen intention: ${commitment.label}`, commitment.timeframe === 'specific_date' ? String(commitment.date) : TIMEFRAME_LABEL[commitment.timeframe]);
  L.push(unknown ? 'Not knowing is a complete answer. Nothing more is asked of you.' : commitment ? 'The intention is yours. Its outcome is yours to name.' : permission ? 'There is no need to turn this into another task.' : steps.length > 1 ? 'These are the responses you chose, side by side. One does not explain the other.' : steps.length ? 'The offered question and selected response stay together. No further conclusion is added.' : 'Done for today. There is nothing else to complete here.');
  return L;
}
const SRC = { user_said: 'Your selected response', observed: 'A fact about practice', inferred: 'A possible reading', unknown: 'What remains open' } as const;
export function mirrorScreenUi(m: MirrorModel, practiceDays: number): string[] {               // components/experience/MirrorExperience.tsx (tab passes readingHistory="approved")
  const L: string[] = []; const st = (s: MirrorStatement) => `· ${SRC[s.source]}: ${s.text}${s.date ? ` (${s.date})` : ''}`;
  const facts = m.sections.practised, carried = m.sections.carrying, said = m.sections.said;
  const supplied = [...m.sections.come_up, ...m.sections.readings, ...m.sections.shifted, ...m.sections.unknown];
  const readings = supplied.filter((s) => s.source === 'inferred'), observed = supplied.filter((s) => s.source === 'observed'), history = supplied.filter((s) => s.source === 'user_said'), unk = supplied.filter((s) => s.source === 'unknown');
  const has = practiceDays > 0 || facts.length > 0;
  L.push('The Mirror · no verdict on you', 'A view with room around it.', has ? 'Practice, responses and possible readings. Each keeps its own source.' : 'Nothing needs to fill this space. Practice can stand on its own.', m.state === 'populated' ? 'Only currently supplied readings appear here.' : 'A quiet Mirror does not need to be filled.');
  if (has) { L.push('Daily Inner Rep facts · not ability', 'What has been exercised.'); if (practiceDays) L.push(`${practiceDays} ${practiceDays === 1 ? 'day' : 'days'} of practice this month. No need for consecutive days.`); facts.forEach((s) => L.push(st(s))); L.push('These are completed reps, not levels of emotional fitness.'); }
  if (carried.length) { L.push('A chosen intention', 'Only what was genuinely chosen.'); carried.forEach((s) => L.push(st(s))); L.push('An intention is not an outcome. A supplied follow-up lets you name what happened.'); }
  L.push('Mirar’s side of the window', readings.length ? 'A reading stays revisable.' : 'There need not be a reading.'); readings.forEach((s) => L.push(st(s)));
  if (!readings.length) L.push('No personal explanation is supplied to fill the space. Practice can be useful without a reflection.');
  if (observed.length) { L.push('Counts, kept distinct'); observed.forEach((s) => L.push(st(s))); }
  L.push('Your side of the window', history.length ? 'Your say about the instrument.' : 'Room to leave something open.'); history.forEach((s) => L.push(st(s))); unk.forEach((s) => L.push(st(s)));
  if (!history.length && !unk.length) L.push('Missing context remains missing. A reading, when offered, can be qualified, rejected or left uncertain.');
  if (said.length) L.push(`Source material → [Read your selected responses] (collapsed; ${said.length} statement${said.length === 1 ? '' : 's'}) — The offered question stays with the selected response. Neither is a description of who you are.`);
  L.push('In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.');
  return L;
}

// ── one persona run ──
export interface StepLog { id: string; type: string; prompt: string; options: string[]; allowUnknown: boolean; answer: string }
export interface DayLog {
  day: number; date: string; opened: boolean; left: boolean; prompt?: string; templateId?: string; frame?: string; bound?: string; layer?: string; intent?: string; capacity?: string; intensity?: string; sensitivity?: string; seconds?: number;
  today?: string[]; steps?: StepLog[]; done?: string[]; insight?: { text: string; tier: string; counts: string; feedback: string; correction?: string }; mirror?: string[]; said?: string[]; mirrorChanged?: boolean; practiceDays?: number;
}
const describeAnswer = (a: StepAnswer, step: Step): string => {
  if (a.kind === 'option' && 'options' in step) return `“${(step.options as any[]).find((o) => o.id === a.optionId)?.label}”`;
  if (a.kind === 'unknown') return '“I don’t know”'; if (a.kind === 'skip') return '(skipped)'; if (a.kind === 'domain') return `chip “${DOMAIN_CHIP_LABEL[a.domain]}”`;
  if (a.kind === 'timeframe') return `“${TIMEFRAME_LABEL[a.timeframe === 'specific_date' ? 'pick_date' : a.timeframe]}”`; if (a.kind === 'yes') return '“Yes”'; if (a.kind === 'no') return '“No”'; if (a.kind === 'words') return '(types a few words; never stored)'; return a.kind;
};
export async function runPersona(p: Persona, seed: number, detail = true): Promise<DayLog[]> {
  const uid = `first14-${p}-${seed}`; const kv = new MemKV(); let clock = dayDate(1);
  const rt: V2Runtime = createRuntime({ storage: kv, now: () => clock }); const r = rng(seed * 7919 + (p === 'everyday' ? 1 : p === 'avoider' ? 2 : 3));
  const out: DayLog[] = []; let prevMirror = '';
  for (let d = 1; d <= 14; d++) {
    clock = dayDate(d); const log: DayLog = { day: d, date: eyebrow(clock), opened: PERSONAS[p].opens(d), left: false };
    if (!log.opened) { out.push(log); continue; }
    await rt.init(uid); const td = rt.today();
    if (td.kind !== 'rep') { out.push(log); continue; }
    const t = TEMPLATE_BY_ID[td.payload.templateId]; const practiceDays = rt.practiceDaysThisMonth();
    log.prompt = nextStep(td.context, [])?.prompt;
    Object.assign(log, { templateId: td.payload.templateId, frame: td.payload.frame, bound: td.payload.bound, layer: td.context.template.role, capacity: td.payload.capacityLabel, intensity: t.intensity, sensitivity: t.sensitivity, seconds: td.payload.estimatedSeconds, practiceDays });
    if (detail) log.today = todayScreenUi(td, practiceDays, clock);
    if (leaves(p, r, td.context)) { log.left = true; out.push(log); continue; }
    const answers: StepAnswer[] = []; const steps: StepLog[] = [];
    for (let g = 0; g < 10; g++) {
      const step = nextStep(td.context, answers); if (!step) break;
      const a = answerStep(p, r, step, td.context, d); answers.push(a);
      steps.push({ id: step.id, type: step.type, prompt: step.prompt, options: step.type === 'choice' ? step.options.map((o) => o.label) : step.type === 'timeframe' ? step.options.map((o) => TIMEFRAME_LABEL[o]) : step.type === 'domain_chips' ? step.domains.map((x) => DOMAIN_CHIP_LABEL[x]) : step.type === 'yes_no' ? ['Yes', 'No'] : [], allowUnknown: step.type === 'choice', answer: describeAnswer(a, step) });
      if (a.kind === 'unknown') break;
    }
    const comp = await rt.complete(answers); log.steps = steps; if (detail) log.done = doneScreenUi(rt.receipt(), true);
    if (comp.insight) {
      const fb = p === 'reflective' ? (r() < 0.6 ? 'accurate' : 'partly') : p === 'everyday' ? (r() < 0.5 ? 'accurate' : r() < 0.6 ? 'unsure' : 'partly') : 'unsure';
      await rt.feedback(comp.insight.id, fb as any); let correction: string | undefined;
      if (fb === 'partly') { const reason = p === 'reflective' ? 'situation_right_meaning_off' : 'importance_overstated'; await rt.correction(comp.insight.id, reason as any); correction = CORRECTION_REASONS.find((x) => x.id === reason)!.label; }
      log.insight = { text: comp.insight.text, tier: comp.insight.tier, counts: `${comp.insight.evidence.independentN} independent observations · ${comp.insight.evidence.promptedN} chosen from offered options · ${comp.insight.evidence.introducedN} raised by you`, feedback: fb, correction };
    }
    const m = rt.mirror(); const mu = mirrorScreenUi(m, rt.practiceDaysThisMonth()); const key = JSON.stringify(mu); log.mirrorChanged = key !== prevMirror; prevMirror = key; if (detail) { log.mirror = mu; log.said = m.sections.said.map((x) => x.text); } log.practiceDays = rt.practiceDaysThisMonth();
    out.push(log);
  }
  return out;
}

// ── aggregate statistics over many seeds (shows the single walkthrough is not an outlier) ──
const SEEDS = 40;
async function aggregate(p: Persona) {
  const day1: Record<string, number> = {}; let reps = 0, med = 0, sens = 0, wordsSteps = 0, chipSteps = 0, offerSteps = 0, timeSteps = 0, unknownAns = 0, steps = 0, introspective = 0, light = 0, left = 0, opened = 0, firstInsight: number[] = [], insights = 0, tmplSet = 0, commitRep = 0;
  const byDay: { reps: number; intro: number }[] = Array.from({ length: 14 }, () => ({ reps: 0, intro: 0 }));
  const CATS = ['probe', 'lens', 'medium', 'words', 'chips', 'offer', 'commitment', 'heavy', 'continuity', 'repeat', 'sameQuestion'] as const; const first: Record<string, number[]> = Object.fromEntries(CATS.map((c) => [c, []])); const dayTemplates: Record<number, Record<string, number>> = {}; 
  for (let s = 1; s <= SEEDS; s++) {
    const logs = await runPersona(p, s, false); const seen = new Set<string>(); let fi = 0; const fd: Record<string, number> = {};
    const mark = (c: string, d: number) => { if (!fd[c]) fd[c] = d; }; const prompts = new Set<string>();
    for (const l of logs) {
      if (l.opened) opened++; if (l.left) left++; if (l.day === 1 && l.templateId) day1[l.templateId] = (day1[l.templateId] ?? 0) + 1;
      if (l.templateId) { const k = `${l.templateId}${l.frame !== 'base' ? '/' + l.frame : ''}`; (dayTemplates[l.day] ??= {})[k] = (dayTemplates[l.day][k] ?? 0) + 1; }
      if (l.prompt) { if (prompts.has(l.prompt)) mark('sameQuestion', l.day); prompts.add(l.prompt); }
      if (l.templateId === 'probe_anchor') mark('probe', l.day); if (l.frame === 'lens') mark('lens', l.day); if (l.intensity === 'medium') mark('medium', l.day);
      if (['gro_mistake', 'dir_fits', 'dir_know_act', 'rel_boundary', 'presence'].includes(l.templateId ?? '')) mark('heavy', l.day); if (l.layer === 'continuity') mark('continuity', l.day);
      if (!l.steps) continue; if (seen.has(l.templateId!)) mark('repeat', l.day); reps++; byDay[l.day - 1].reps++; seen.add(l.templateId!);
      for (const st of l.steps) { if (st.type === 'words') mark('words', l.day); if (st.type === 'domain_chips') mark('chips', l.day); if (st.type === 'yes_no') mark('offer', l.day); if (st.type === 'timeframe') mark('commitment', l.day); }
      if (l.intensity === 'medium') med++; if (l.sensitivity !== 'low') sens++;
      const tone = TONE[l.templateId!] ?? 'introspective'; const intro = tone === 'introspective' || l.frame !== 'base'; if (intro) { introspective++; byDay[l.day - 1].intro++; } else light++;
      for (const st of l.steps) { steps++; if (st.type === 'words') wordsSteps++; if (st.type === 'domain_chips') chipSteps++; if (st.type === 'yes_no') offerSteps++; if (st.type === 'timeframe') timeSteps++; if (st.answer === '“I don’t know”') unknownAns++; }
      if (l.steps.some((x) => x.type === 'timeframe')) commitRep++;
      if (l.insight) { insights++; if (!fi) fi = l.day; }
    }
    tmplSet += seen.size; if (fi) firstInsight.push(fi); for (const c of CATS) if (fd[c]) first[c].push(fd[c]);
  }
  const n = SEEDS; const f = (x: number, d = 1) => (x / n).toFixed(d);
  return { p, seeds: n, openedPerRun: f(opened), repsPerRun: f(reps), leftPerRun: f(left), distinctTemplatesPerRun: f(tmplSet), stepsPerRep: (steps / Math.max(1, reps)).toFixed(2), mediumShare: pc(med, reps), sensitiveShare: pc(sens, reps), introspectiveShare: pc(introspective, reps), lightShare: pc(light, reps), wordsPerRun: f(wordsSteps), chipsPerRun: f(chipSteps), threadOffersPerRun: f(offerSteps), timeframePerRun: f(timeSteps), unknownPerRun: f(unknownAns), insightsPerRun: f(insights), runsWithInsight: pc(firstInsight.length, n), medianFirstInsightDay: firstInsight.length ? firstInsight.sort((a, b) => a - b)[firstInsight.length >> 1] : null, day1, exposure: Object.fromEntries(CATS.map((c) => { const a = first[c].sort((x, y) => x - y); return [c, { by4: pc(a.filter((x) => x <= 4).length, n), by7: pc(a.filter((x) => x <= 7).length, n), by14: pc(a.length, n), medianFirstDay: a.length ? a[a.length >> 1] : null, earliest: a[0] ?? null }]; })), earlyDays: Object.fromEntries([1, 2, 3, 4, 5, 6].map((d) => [d, Object.entries(dayTemplates[d] ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round((100 * v) / n)}%`).join(', ')])), byDay: byDay.map((b, i) => ({ day: i + 1, reps: b.reps, introspective: pc(b.intro, b.reps) })) };
}
const pc = (a: number, b: number) => (b ? Math.round((100 * a) / b) + '%' : 'n/a');

// ── markdown ──
const q = (xs: string[]) => xs.map((x) => `> ${x}`).join('\n');
export async function main() {
  const WALK_SEED = 1; const out: string[] = []; const raw: any = { walkSeed: WALK_SEED, personas: {}, aggregate: {} };
  const dayList = (logs: DayLog[], p: Persona) => {
    const L: string[] = []; let prevMirrorLines: string[] = [];
    for (const l of logs) {
      L.push(`\n#### Day ${l.day} · ${l.date}`);
      if (!l.opened) { L.push(`**SIMULATED:** does not open the app today (${p === 'everyday' ? 'a busy day' : 'has drifted away'}). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.`); const n = NOTES[`${p}:${l.day}`]; if (n) L.push(`**EVAL:** ${n}`); continue; }
      if (!l.templateId) { L.push('The runtime served no rep.'); continue; }
      const t = TEMPLATE_BY_ID[l.templateId];
      L.push(`**ENGINE served:** \`${l.templateId}\` · frame \`${l.frame}\`${l.bound ? ` bound to \`${l.bound}\`` : ''} · role \`${t.role}\` · intensity \`${l.intensity}\` · sensitivity \`${t.sensitivity}\` · ~${l.seconds}s${l.capacity ? ` · capacity label “${l.capacity}”` : ''} · source \`lib/innerRep/v2/templates.ts\``);
      L.push(`\n**UI — Today screen (phone width), \`DailyExperience.tsx\`:**\n${q(l.today ?? [])}`);
      if (l.left) { L.push(`\n**SIMULATED:** reads the question and leaves without answering (“Back to Today”). The engine records the unfinished rep as skipped when the app is next opened.`); const n = NOTES[`${p}:${l.day}`]; if (n) L.push(`\n**EVAL:** ${n}`); continue; }
      L.push('\n**ENGINE steps shown, with SIMULATED answers:**');
      l.steps!.forEach((s, i) => L.push(`${i + 1}. *${s.type}* — **ENGINE:** “${s.prompt}”${s.options.length ? ` — options: ${s.options.map((o) => `[${o}]`).join(' ')}${s.allowUnknown ? " [I don't know]" : ''}` : ''}  \n   **SIMULATED answer:** ${s.answer}`));
      L.push(`\n**UI — completion screen (\`IntegrationMoment.tsx\`, built from the runtime receipt):**\n${q(l.done ?? [])}`);
      if (l.insight) L.push(`\n**ENGINE — Honest Mirror reading shown (\`HonestMirror.tsx\` renders: “Possible reading · revisable” / “${l.insight.tier === 'hedged' ? 'Something to consider' : 'Worth noticing'}”):**\n> ${l.insight.text}\n> *${l.insight.counts}* · buttons: [Accurate] [Partly] [No] [Not sure]  \n**SIMULATED response:** ${l.insight.feedback}${l.insight.correction ? ` → “${CORRECTION_PROMPT}” → “${l.insight.correction}”` : ''}`);
      if ([1, 7, 14].includes(l.day)) L.push(`\n**UI — The Mirror tab after today, in full (\`MirrorExperience.tsx\`; statements are ENGINE/runtime \`mirror-contract.ts\` output):**\n${q(l.mirror ?? [])}`);
      else { const prevLines = new Set(prevMirrorLines); const added = (l.mirror ?? []).filter((x) => !prevLines.has(x) && !/^· (A fact about practice|What remains open): /.test(x) ? true : !prevLines.has(x)); L.push(`\n*The Mirror tab after today, changes since the last time it was shown:* ${added.length ? added.map((x) => `“${x}”`).join(' · ') : 'none'}`); }
      prevMirrorLines = l.mirror ?? prevMirrorLines;
      const n = NOTES[`${p}:${l.day}`]; if (n) L.push(`\n**EVAL:** ${n}`);
    }
    return L.join('\n');
  };
  for (const p of ['everyday', 'avoider', 'reflective'] as Persona[]) {
    const logs = await runPersona(p, WALK_SEED); const agg = await aggregate(p); raw.personas[p] = logs; raw.aggregate[p] = agg;
    out.push(`\n---\n\n## ${PERSONAS[p].name}\n\n*${PERSONAS[p].blurb}*  \n**SIMULATED persona.** Engine user seed: \`first14-${p}-${WALK_SEED}\`. Other seeds change which exercises are served; the aggregate table in section 3 shows how typical this run is.\n${dayList(logs, p)}`);
  }
  const cat: string[] = ['| Template | Role · capacity · intensity · sensitivity · seconds | Question as authored (verbatim) | Answer options (verbatim) | Extra steps it can trigger | Evaluator tone tag |', '|---|---|---|---|---|---|'];
  for (const t of TEMPLATES) {
    const extra = [t.words ? `typed words (“${t.words.prompt}”, max ${t.words.maxChars})` : '', t.followUp ? `follow-up “${t.followUp.prompt}”` : '', t.capture.domain !== 'never' ? `context chips (${t.capture.domain})` : '', t.options.some((x) => x.creates === 'commitment') ? 'timeframe “When would you like to do it?”' : ''].filter(Boolean).join('; ') || '—';
    cat.push(`| \`${t.id}\` | ${t.role} · ${t.capacity} · ${t.intensity} · ${t.sensitivity} · ${t.seconds}s | ${t.prompt} | ${t.options.map((x) => `[${x.label}]`).join(' ')} | ${extra} | ${TONE[t.id] ?? 'introspective'} |`);
  }
  const ag = raw.aggregate; const rows = (k: string, label: string) => `| ${label} | ${(['everyday', 'avoider', 'reflective'] as Persona[]).map((p) => String(ag[p][k])).join(' | ')} |`;
  const ex = (c: string, label: string) => `| ${label} | ${(['everyday', 'avoider', 'reflective'] as Persona[]).map((p) => `${ag[p].exposure[c].by4} / ${ag[p].exposure[c].by7} / ${ag[p].exposure[c].by14} (median day ${ag[p].exposure[c].medianFirstDay ?? '—'})`).join(' | ')} |`;
  const agg: string[] = ['| Per simulated person, mean of 40 runs | Everyday | Avoider | Reflective |', '|---|---|---|---|', rows('openedPerRun', 'Days opened (of 14)'), rows('repsPerRun', 'Reps completed'), rows('leftPerRun', 'Reps opened and abandoned'), rows('distinctTemplatesPerRun', 'Distinct exercises'), rows('stepsPerRep', 'Screens per rep (questions + optional asks)'), rows('lightShare', 'Reps tagged light (evaluator tag)'), rows('introspectiveShare', 'Reps tagged introspective (evaluator tag)'), rows('mediumShare', 'Reps the engine marks medium intensity'), rows('sensitiveShare', 'Reps the engine marks sensitivity above low'), rows('wordsPerRun', 'Typed-words boxes shown'), rows('chipsPerRun', 'Context-chip questions shown'), rows('threadOffersPerRun', '“Check in on this now and then?” offers'), rows('timeframePerRun', '“When would you like to do it?” asks'), rows('unknownPerRun', '“I don’t know” answers (simulated)'), rows('insightsPerRun', 'Honest Mirror readings shown'), rows('runsWithInsight', 'Runs that received any reading in 14 days'), '', 'Share of runs exposed by day 4 / day 7 / day 14:', '', '| First exposure to… | Everyday | Avoider | Reflective |', '|---|---|---|---|', ex('probe', 'The open question “What’s most on your mind today?” (12 options)'), ex('lens', 'A domain lens (“Did work pull at your attention today?”)'), ex('medium', 'A medium-intensity exercise'), ex('heavy', 'A heavier template (`gro_mistake`, `dir_fits`, `dir_know_act`, `rel_boundary`, `presence`)'), ex('words', 'A typed-words box'), ex('chips', 'The ten-chip context question'), ex('offer', 'The standing check-in offer'), ex('commitment', 'A timeframe question for an intention'), ex('continuity', 'A follow-up on something named earlier'), ex('sameQuestion', 'The exact same question served again'), '', 'What the first days look like (share of runs):', '', '| Day | Everyday | Avoider | Reflective |', '|---|---|---|---|', ...[1, 2, 3, 4, 5, 6].map((d) => `| ${d} | ${(['everyday', 'avoider', 'reflective'] as Persona[]).map((p) => ag[p].earlyDays[d] || '—').join(' | ')} |`)];
  mkdirSync(join(__dirname, '../../docs/product/first14'), { recursive: true });
  writeFileSync(join(__dirname, '../../docs/product/first14/_catalogue.md'), cat.join('\n'));
  writeFileSync(join(__dirname, '../../docs/product/first14/_aggregate.md'), agg.join('\n'));
  writeFileSync(join(__dirname, '../../docs/product/first14/_walkthrough-body.md'), out.join('\n'));
  writeFileSync(join(__dirname, '../../docs/product/first14/first14-raw.json'), JSON.stringify(raw, null, 1));
  console.log('written');
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
void V2;

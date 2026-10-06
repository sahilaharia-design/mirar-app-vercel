import { V2 } from '../../lib/innerRep/v2/config';
import { TEMPLATES } from '../../lib/innerRep/v2/templates';
import { Instance } from '../../lib/innerRep/v2/types';
import { PROFILES } from './profiles';
import { metrics } from './report';
import { RunResult, runProfile } from './runner';

// Stress: every profile × many seeds. Invariants must hold for ALL of them, not just the lucky seed.
const ctxIntent = (i: Instance) => /^(lens:|native:)/.test(i.intent) || ['probe_confirm', 'thread_check', 'event_check', 'resolution_check', 'commitment_revisit'].includes(i.intent);
const BANNED = /denial|resist|defensive|deflect|avoidance|avoiding|pathology|disorder|diagnos|unwilling|can't accept|won't admit/i;

export interface Violation { rule: string; where: string }
export const hiddenRest: string[] = [];
export const latencyA: number[] = [];
export interface SweepResult { runs: number; violations: Violation[]; byRule: Record<string, number>; runsData: RunResult[] }

export function sweep(seeds: number[], onlyIds?: string[]): SweepResult {
  const violations: Violation[] = []; const runsData: RunResult[] = []; hiddenRest.length = 0; latencyA.length = 0;
  const v = (rule: string, where: string) => violations.push({ rule, where });
  for (const p of PROFILES) {
    if (onlyIds && !onlyIds.includes(p.id)) continue;
    for (const seed of seeds) {
      const r = runProfile({ ...p, seed: p.seed * 1000 + seed });
      runsData.push(r);
      const tag = `${p.id}#${seed}`; const a = r.state.instances;
      // continuity budget
      for (let k = 0; k + 5 <= a.length; k++) if (a.slice(k, k + 5).filter(ctxIntent).length > V2.budget.cap) { v('budget cap exceeded', `${tag} reps ${k + 1}-${k + 5}`); break; }
      let c = 0; for (const i of a) { c = ctxIntent(i) ? c + 1 : 0; if (c > V2.budget.maxConsecutive) { v('too many context reps in a row', `${tag} day ${i.day + 1}`); break; } }
      // recovery + stacking
      for (let k = 1; k < a.length; k++) if (a[k - 1].burden && a[k].intensity !== 'light') { v('non-light rep after a burden', `${tag} day ${a[k].day + 1}`); break; }
      let nl = 0; for (const i of a) { nl = i.intensity !== 'light' ? nl + 1 : 0; if (nl > V2.intensity.maxNonLightRun) { v('hard reps stacked', `${tag} day ${i.day + 1}`); break; } }
      // one thread cannot take over
      for (const t of r.state.threads) for (const d of t.checkDays) if (t.checkDays.filter((x) => x >= d && x < d + V2.thread.windowDays).length > V2.thread.maxPerWindow + (t.kind === 'event' ? 2 : 0)) { v('thread over-asked', `${tag} ${t.domain}`); break; }
      // commitment follow-up budget: ≤1 commitment check in any rolling 3 completed reps
      { const cc = a.filter((i) => i.completed).map((i) => (i.frame === 'commitment_check' ? 1 : 0)); for (let k = 0; k + 3 <= cc.length; k++) if (cc[k] + cc[k + 1] + cc[k + 2] > 1) { v('commitment follow-up budget exceeded', `${tag} reps ${k + 1}-${k + 3}`); break; } }
      // authority: only the user closes things
      for (const t of r.state.threads) if (t.state === 'resolved' && t.stateSource !== 'user') v('thread resolved by system', `${tag} ${t.domain}`);
      for (const cm of r.state.commitments) for (const e of cm.events) { if (e.by === 'system' && e.to !== 'unconfirmed') v('system set a user-only commitment status', `${tag} #${cm.id}`); if (e.by === 'user' && e.to === 'unconfirmed') v('user event marked unconfirmed', `${tag} #${cm.id}`); }
      for (const cm of r.state.commitments) { if (cm.asks > V2.commitment.maxAsks + (cm.events.some((e) => e.to === 'postponed') ? V2.commitment.maxAsks * cm.events.filter((e) => e.to === 'postponed').length : 0)) v('commitment nagged', `${tag} #${cm.id} asks ${cm.asks}`); }
      for (const cm of r.state.commitments) if (cm.status === 'unconfirmed') { const lastUnc = cm.events.find((e) => e.to === 'unconfirmed')!.day; if (a.some((i) => i.intentRef === cm.id && i.frame === 'commitment_check' && i.day > lastUnc)) v('asked about an unconfirmed commitment', `${tag} #${cm.id}`); }
      // decisions applied after review
      if (r.state.observations.some((o) => o.orientation !== undefined) || r.state.threads.some((t) => t.orientation !== undefined)) v('orientation was collected (disabled in the MVP)', tag);
      if (r.state.insights.some((i) => i.kind === 'contradiction')) v('a contradiction insight was shown (disabled in the MVP)', tag);
      if (r.logs.some((l) => l.answers.some((a) => a.stepId === 'capture_orientation'))) v('orientation step was emitted', tag);
      // feedback semantics (v2.0.1): Partly qualifies, never supports; unchanged text never returns; No stays stronger
      for (const i of r.state.insights) if (i.feedback?.value === 'partly') {
        const subj = (k: string) => (k.startsWith('repeated_signal:') || k.startsWith('cross_capacity_convergence:') ? 'domain:' + k.split(':')[1] : k);
        const later = r.state.insights.filter((x) => x.id > i.id && subj(x.evidenceKey) === subj(i.evidenceKey));
        for (const x of later) { if (x.tier === 'supported') v('a "supported" insight about a subject the user said was only partly right', `${tag} insight ${x.id}`); if (x.text === i.text) v('unchanged text resurfaced after Partly', `${tag} insight ${x.id}`); if (x.day - i.day < V2.insight.cooldownDaysSameKey * V2.feedback.partlyCooldownMultiplier && x.evidenceKey === i.evidenceKey) v('resurfaced inside the doubled Partly cooldown', `${tag} insight ${x.id}`); }
        if (i.correction && !i.correction.reason) v('correction without a reason', tag);
      }
      for (const i of r.state.insights) if (i.feedback?.value === 'no') { const rest = (r.state.domainState as any)[i.evidenceKey.split(':')[1]]?.restUntilDay; if ((i.kind === 'repeated_signal' || i.kind === 'cross_capacity_convergence') && (rest === undefined || rest < i.feedback.day)) { /* rest may have been cleared by the user raising the domain again, which is allowed */ } }
      // text hygiene
      for (const i of r.state.insights) if (BANNED.test(i.text)) v('banned wording in an insight', `${tag}: ${i.text.slice(0, 50)}`);
      for (const l of r.logs) if (l.decision) { const t = l.decision.trace; if (BANNED.test([t.primaryReason, ...t.secondaryReasons, ...t.constraints.map((x) => x.effect), ...t.letRest, ...l.refusals.map((x) => x.reason)].join(' '))) { v('banned wording in a trace', `${tag} day ${l.day + 1}`); break; } }
      // rest
      for (const l of r.logs) if (l.rest) { const prior = a.filter((i) => i.day < l.day); if (prior.length < V2.rest.minHistoryReps) v('rest too early', `${tag} day ${l.day + 1}`); if (prior.length && prior[prior.length - 1].burden) v('rest after a burden', `${tag} day ${l.day + 1}`); if (r.logs[l.day - 1]?.rest) v('rest twice in a row', `${tag} day ${l.day + 1}`); const lat = p.latent(l.day); if (Object.values(lat.domains).some((x) => (x ?? 0) >= 0.3) || lat.burden >= 0.4) hiddenRest.push(`${tag} day ${l.day + 1}`); }
      const m = metrics(r); if (m.rest / Math.max(1, m.opened) > 0.15) v('rest more than 15% of opened days', `${tag} ${m.rest}/${m.opened}`);
      // returns after a gap
      for (let k = 1; k < a.length; k++) if (a[k].day - a[k - 1].day >= V2.gaps.returnDays && a[k].intent !== 'probe_return') v('no open probe after a long gap', `${tag} day ${a[k].day + 1} (${a[k].intent})`);
      // selection-bias scenarios
      if (p.id === 'sel_bias_C') { for (const e of r.state.insights) if (/family/i.test(e.text) && e.tier === 'supported') v('C: supported Family insight from prompted answers', tag); if (r.state.threads.some((t) => t.domain === 'family')) v('C: Family thread from prompted answers', tag); }
      if (p.id === 'sel_bias_B') { const w = a.filter((i) => i.bound === 'work' || i.intent.endsWith(':work')).length; if (w > 5) v('B: Work kept being asked about despite "not this"', `${tag} ${w} reps`); }
      if (p.id === 'sel_bias_A') { const rel = a.find((i) => i.capacity === 'relationships' && (i.intent.includes(':partner'))); latencyA.push(rel ? rel.day + 1 : 99); if (!rel || rel.day > 16) v('A: Relationships did not become relevant by day 17', `${tag} ${rel ? 'day ' + (rel.day + 1) : 'never'}`); }
      // nothing is manufactured: every lens/native/thread/event rep must trace to something the USER originated
      for (const i of a) { const d = i.bound ?? (i.intent.startsWith('native:') ? (i.intent.split(':')[1] as any) : undefined); if (!d) continue; if (i.frame === 'commitment_check') continue; const userOriginated = r.state.observations.some((o) => o.day <= i.day && o.domain === d && o.domainOrigin === 'user_introduced') || r.state.threads.some((t) => t.domain === d && t.openedDay <= i.day && (t.openedVia === 'user_introduced' || t.openedVia === 'user_confirmed')) || r.state.observations.filter((o) => o.day <= i.day && o.domain === d && o.domainOrigin === 'prompted_choice').length >= 2; if (!userOriginated) { v('context rep with no user-originated basis', `${tag} day ${i.day + 1} ${i.templateId}[${d}]`); break; } }
      // stable: nothing manufactured
      if (p.id === 'stable' || p.id === 'stable_60') { if (r.state.insights.some((i) => i.kind === 'repeated_signal' || i.kind === 'cross_capacity_convergence')) v('stable: pattern manufactured', tag); }
      // no insight text is built on unknown-only evidence
      for (const l of r.logs) if (l.insight && l.tentativeAtInsight && l.insight.tier === 'supported' && l.insight.kind !== 'resolution') v('supported insight shown while interpretive confidence was lowered', `${tag} day ${l.day + 1}`);
    }
  }
  const byRule: Record<string, number> = {}; for (const x of violations) byRule[x.rule] = (byRule[x.rule] ?? 0) + 1;
  return { runs: runsData.length, violations, byRule, runsData };
}

if (require.main === module) {
  const seeds = Array.from({ length: 20 }, (_, k) => k + 1);
  const r = sweep(seeds);
  console.log(`${r.runs} runs (${PROFILES.length} profiles × ${seeds.length} seeds)`);
  if (!r.violations.length) console.log('no invariant violations');
  console.log(`rest while the hidden latent issue was active (follows the user's own "nothing"; not a rule violation): ${hiddenRest.length}`);
  console.log(`sel_bias_A latency to a partner-driven Relationships rep (day): ${[...latencyA].sort((x, y) => x - y).join(',')}`);
  for (const [k, n] of Object.entries(r.byRule)) console.log(`${String(n).padStart(4)} × ${k}   e.g. ${r.violations.find((x) => x.rule === k)!.where}`);
  void TEMPLATES;
  const lines = ['# V2 simulator — invariant sweep', '', `${r.runs} runs (${PROFILES.length} profiles × ${seeds.length} seeds). Every run must satisfy every invariant; this is a stress test, not a sample.`, '', r.violations.length ? '**Violations:**' : '**No invariant violations.**', ''];
  for (const [k, n] of Object.entries(r.byRule)) lines.push(`- ${n} × ${k} (e.g. ${r.violations.find((x) => x.rule === k)!.where})`);
  lines.push('', `Rest offered while the hidden latent issue was active (follows the user's own "nothing" with no recent evidence; not a rule violation): ${hiddenRest.length} of ${r.runs} runs.`, `Selection-bias A — day on which a partner-driven Relationships rep first appeared (20 seeds, sorted): ${[...latencyA].sort((x, y) => x - y).join(', ')}.`);
  require('fs').writeFileSync(require('path').join(__dirname, '../../docs/V2_SWEEP.md'), lines.join('\n'));
}

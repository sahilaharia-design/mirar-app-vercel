import { StepAnswer } from '../../lib/innerRep/v2/contracts';
import { TEMPLATES } from '../../lib/innerRep/v2/templates';
import { CAPACITIES, Capacity, Instance } from '../../lib/innerRep/v2/types';
import { DayLog, RunResult } from './runner';

const ansText = (a: StepAnswer[]) => a.map((x) => (x.kind === 'option' ? x.optionId : x.kind === 'domain' ? `domain:${x.domain}` : x.kind === 'orientation' ? `orient:${x.orientation}` : x.kind === 'timeframe' ? `when:${x.timeframe}` : x.kind)).join(' → ') || '(none)';

export function traceBlock(l: DayLog): string {
  if (!l.engaged) return `DAY ${l.day + 1}\n  (did not open the app)\n`;
  const t = l.decision!.trace;
  const o: string[] = [];
  o.push(`DAY ${l.day + 1}`);
  o.push(`  Selected experience: ${t.selected}   [${t.layer}${l.instance ? ' · ' + l.instance.intent : ''}]`);
  o.push(`  Primary reason: ${t.primaryReason}`);
  if (t.secondaryReasons.length) o.push(`  Secondary reason: ${t.secondaryReasons.join('; ')}`);
  if (t.constraints.length) o.push(`  Constraints: ${t.constraints.map((c) => `${c.name} — ${c.effect}${c.overrode ? ` (overrode ${c.overrode})` : ''}`).join(' | ')}`);
  o.push(`  Continuity budget: ${t.budget.used}/${t.budget.cap}`);
  if (t.rejected.length) o.push(`  Rejected: ${t.rejected.slice(0, 7).map((r) => `${r.what} — ${r.why}`).join(' | ')}`);
  if (t.letRest.length) o.push(`  Deliberately let rest: ${t.letRest.slice(0, 4).join(' | ')}`);
  if (t.restCheck) o.push(`  Rest check: ${t.restCheck.length > 260 ? t.restCheck.slice(0, 257) + '…' : t.restCheck}`);
  if (l.rest) { o.push('  Outcome: NO REP TODAY'); return o.join('\n') + '\n'; }
  const dom = l.newObs.find((x) => x.domain)?.domain ?? t.domain;
  const ori = l.newObs.find((x) => x.orientation)?.orientation;
  o.push(`  Answer: ${ansText(l.answers)}`);
  o.push(`  Domain: ${dom ?? '—'}   Orientation: ${ori ?? '—'}`);
  o.push(`  Observations created: ${l.newObs.map((x) => `${x.step}${x.domain ? ':' + x.domain : ''}${x.domainOrigin ? '(' + x.domainOrigin + ')' : ''}${x.polarity !== 'present' ? '/' + x.polarity : ''}`).join(', ') || 'none'}`);
  o.push(`  Evidence created: ${l.newEvidence.join(', ') || 'none'}`);
  o.push(`  Inference: ${l.insight ? `[${l.insight.tier}] ${l.insight.text}${l.feedback ? `  → user: ${l.feedback}` : ''}` : 'None'}`);
  const ref = l.refusals.filter((r) => ['repeated_signal', 'cross_capacity_convergence', 'resolution', 'one_off_event', 'follow_through', 'unresolved_thread', 'change', 'contradiction'].includes(r.kind)).slice(0, 4);
  if (ref.length) o.push(`  Refused to infer: ${ref.map((r) => `${r.kind}[${r.subject}] — ${r.reason}`).join(' | ')}`);
  if (t.openThreads.length) o.push(`  Open threads: ${t.openThreads.join('; ')}`);
  if (t.dueCommitments.length) o.push(`  Commitments due: ${t.dueCommitments.join('; ')}`);
  return o.join('\n') + '\n';
}

export interface Metrics {
  id: string; days: number; reps: number; opened: number; rest: number; layers: Record<string, number>;
  templatesUsed: number; templateCounts: Record<string, number>; earliestExactRepeat: number | null; earliestMechanismFatigue: number | null;
  capShare: Record<string, number>; maxConsecutiveContext: number; maxThreadReps: number; insights: number; insightsByTier: Record<string, number>;
  maxSameCapStreak: number; unknownShare: number; commitments: Record<string, number>; threads: Record<string, number>;
}
const CTX = (i: Instance) => (i.layer === 'context' || i.layer === 'continuity' || i.intent === 'probe_confirm') && i.intent !== 'commitment_due';
export function metrics(r: RunResult): Metrics {
  const insts = r.state.instances;
  const layers: Record<string, number> = {};
  for (const l of r.logs) if (l.engaged) layers[l.rest ? 'rest' : l.decision!.layer] = (layers[l.rest ? 'rest' : l.decision!.layer] ?? 0) + 1;
  const templateCounts: Record<string, number> = {};
  for (const i of insts) templateCounts[i.templateId] = (templateCounts[i.templateId] ?? 0) + 1;
  let earliestExactRepeat: number | null = null;
  const seen = new Set<string>();
  for (const i of insts) { if (['continuity', 'probe'].includes(TEMPLATES.find((t) => t.id === i.templateId)!.role)) continue; const k = `${i.templateId}|${i.frame}|${i.bound ?? ''}`; if (seen.has(k) && earliestExactRepeat === null) earliestExactRepeat = i.day + 1; seen.add(k); }
  let earliestMechanismFatigue: number | null = null;
  for (let k = 4; k < insts.length && earliestMechanismFatigue === null; k++) { const w = insts.slice(k - 4, k + 1); const c: Record<string, number> = {}; w.forEach((i) => { const m = i.frame === 'lens' ? 'lens_test' : i.mechanism; c[m] = (c[m] ?? 0) + 1; }); if (Math.max(...Object.values(c)) >= 3) earliestMechanismFatigue = insts[k].day + 1; }
  const trainingInsts = insts.filter((i) => TEMPLATES.find((t) => t.id === i.templateId)!.role === 'training');
  const capShare: Record<string, number> = {}; for (const c of CAPACITIES) capShare[c] = trainingInsts.filter((i) => i.capacity === c).length / Math.max(1, trainingInsts.length);
  let maxConsecutiveContext = 0, cur = 0; for (const i of insts) { cur = CTX(i) ? cur + 1 : 0; maxConsecutiveContext = Math.max(maxConsecutiveContext, cur); }
  const perThread: Record<number, number> = {}; for (const i of insts) if (i.intentRef !== undefined && (i.intent === 'thread_check' || i.intent === 'event_check' || i.intent === 'resolution_check')) perThread[i.intentRef] = (perThread[i.intentRef] ?? 0) + 1;
  let maxSameCapStreak = 0; cur = 0; let prev: Capacity | null = null; for (const i of insts) { cur = i.capacity === prev ? cur + 1 : 1; prev = i.capacity; maxSameCapStreak = Math.max(maxSameCapStreak, cur); }
  const commitments: Record<string, number> = {}; for (const c of r.state.commitments) commitments[c.status] = (commitments[c.status] ?? 0) + 1;
  const threads: Record<string, number> = {}; for (const t of r.state.threads) threads[t.state] = (threads[t.state] ?? 0) + 1;
  const insightsByTier: Record<string, number> = {}; for (const i of r.state.insights) insightsByTier[i.tier] = (insightsByTier[i.tier] ?? 0) + 1;
  return { id: r.profile.id, days: r.profile.days, reps: insts.length, opened: r.logs.filter((l) => l.engaged).length, rest: layers.rest ?? 0, layers, templatesUsed: Object.keys(templateCounts).length, templateCounts, earliestExactRepeat, earliestMechanismFatigue, capShare, maxConsecutiveContext, maxThreadReps: Math.max(0, ...Object.values(perThread)), insights: r.state.insights.length, insightsByTier, maxSameCapStreak, unknownShare: insts.filter((i) => i.unknownPrimary).length / Math.max(1, insts.length), commitments, threads };
}

export function profileDoc(r: RunResult): string {
  const m = metrics(r);
  const o: string[] = [];
  o.push(`# ${r.profile.name}\n`);
  o.push(`_${r.profile.blurb}_  \nseed ${r.profile.seed} · ${r.profile.days} days · generated by \`scripts/sim/main.ts\` (synthetic user; the engine never sees the hidden latent state)\n`);
  o.push(`**Summary** — opened ${m.opened}/${m.days} days · reps ${m.reps} · rest ${m.rest} · layers ${JSON.stringify(m.layers)} · templates used ${m.templatesUsed}/${TEMPLATES.length} · earliest exact repeat: day ${m.earliestExactRepeat ?? 'none'} · max consecutive context/continuity reps ${m.maxConsecutiveContext} · max checks on one thread ${m.maxThreadReps} · insights ${m.insights} ${JSON.stringify(m.insightsByTier)} · commitments ${JSON.stringify(m.commitments)} · threads ${JSON.stringify(m.threads)}\n`);
  o.push('```');
  o.push(r.logs.map(traceBlock).join('\n'));
  o.push('```');
  return o.join('\n');
}
export const CAPS = CAPACITIES;

import { V2, V2Config } from './config';
import { CAPACITIES, Capacity, Domain, Evidence, EvidenceKind, Observation, Refusal, State } from './types';

// ─── Evidence (INFERRED) ──────────────────────────────────────────────────────
// Eight typed claims, each with its own rule. Counts are by origin, never one
// pooled number. Near-misses are returned as refusals with a reason, so "what
// Mirar refused to infer" is inspectable. Nothing here reads raw text.

const INDEPENDENT = new Set(['prompted_choice', 'user_introduced', 'prompted_text']);

export interface EvidenceResult { evidence: Evidence[]; refusals: Refusal[]; tentativeMode: boolean }

const issueDomains = (s: State) => Array.from(new Set(s.observations.filter((o) => o.domainRole === 'issue' && o.domain && o.domain !== 'unknown').map((o) => o.domain as Domain)));
const inWin = (o: Observation, day: number, days: number) => o.day > day - days && o.day <= day;

/** user-facing support after applying the user's own corrections */
export function tentativeModeOf(s: State, cfg: V2Config = V2): boolean {
  // (1) the user disagreed with recent readings; (2) the user is mostly answering "I don't know".
  // Both lower interpretive confidence. Neither says anything about the person.
  const last = s.insights.filter((i) => i.feedback).slice(-cfg.feedback.tentativeModeWindow);
  if (last.filter((i) => i.feedback!.value === 'no').length >= cfg.feedback.tentativeModeNo) return true;
  const recent = s.instances.slice(-cfg.disengage.window);
  return recent.length >= 4 && recent.filter((i) => i.unknownPrimary || i.skippedAll).length / recent.length >= cfg.disengage.threshold;
}

export function independentPresent(s: State, d: Domain, day: number, win: number): Observation[] {
  const seen = new Set<number>();
  return s.observations.filter((o) => o.domainRole === 'issue' && o.domain === d && o.polarity === 'present' && INDEPENDENT.has(o.domainOrigin ?? '') && inWin(o, day, win) && !seen.has(o.day) && (seen.add(o.day), true));
}

export function computeEvidence(s: State, day: number, cfg: V2Config = V2): EvidenceResult {
  const ev: Evidence[] = [];
  const refusals: Refusal[] = [];
  const tentativeMode = tentativeModeOf(s, cfg);
  const E = cfg.evidence;
  const minIndep = E.repeated.minIndependent + (tentativeMode ? cfg.uncertaintyMode.raiseMinIndependentBy : 0);
  const W = E.windowDays;
  const mk = (kind: EvidenceKind, subject: string, p: Partial<Evidence>): Evidence => ({ key: `${kind}:${subject}`, kind, subject, independentN: 0, promptedN: 0, introducedN: 0, continuationN: 0, negativeN: 0, unknownN: 0, offeredN: 0, presentOfferedN: 0, capacities: [], days: [], support: 'tentative', status: 'active', ...p });

  for (const d of issueDomains(s)) {
    const win = s.observations.filter((o) => o.domainRole === 'issue' && inWin(o, day, W));
    const ind = independentPresent(s, d, day, W);
    const introduced = ind.filter((o) => o.domainOrigin === 'user_introduced').length;
    const prompted = ind.length - introduced;
    const continuation = win.filter((o) => o.domain === d && o.polarity === 'present' && o.domainOrigin === 'thread_continuation').length;
    const negatives = win.filter((o) => o.domain === d && o.polarity === 'absent' && o.domainOrigin === 'thread_continuation');
    const closed = win.filter((o) => o.closedSet && o.offeredDomains.includes(d) && o.polarity !== 'unknown' && o.domainOrigin !== 'thread_continuation');
    const presentOffered = closed.filter((o) => o.domain === d && o.polarity === 'present').length;
    const caps = Array.from(new Set(ind.map((o) => o.capacity))) as Capacity[];
    const days = ind.map((o) => o.day);
    const userConfirmed = s.threads.some((t) => t.domain === d && (t.openedVia === 'user_introduced' || t.openedVia === 'user_confirmed') && t.state !== 'candidate');
    const base = { independentN: ind.length, promptedN: prompted, introducedN: introduced, continuationN: continuation, negativeN: negatives.length, offeredN: closed.length, presentOfferedN: presentOffered, capacities: caps, days };
    const supported = introduced >= 1 || userConfirmed;

    // 1 — REPEATED SIGNAL
    if (ind.length >= minIndep && new Set(days).size >= E.repeated.minDistinctDays) {
      const share = closed.length >= E.repeated.blockMinOpportunities ? presentOffered / closed.length : 1;
      if (share < E.repeated.blockShareBelow) {
        refusals.push({ kind: 'repeated_signal', subject: d, reason: `chosen ${presentOffered} of ${closed.length} times it was offered (${Math.round(share * 100)}%) — offered often, rarely chosen: not salient` });
      } else ev.push(mk('repeated_signal', d, { ...base, support: supported ? 'supported' : 'tentative', note: supported ? undefined : 'prompted-only: every observation was a choice from a list Mirar offered' }));
    } else if (ind.length > 0 || continuation > 0) {
      const why = ind.length === 0 && continuation > 0 ? `${continuation} observation(s) were follow-ups Mirar initiated — not independent` : `${ind.length} independent observation(s) on ${new Set(days).size} day(s); needs ${minIndep} on ${E.repeated.minDistinctDays}`;
      refusals.push({ kind: 'repeated_signal', subject: d, reason: why });
    }

    // 2 — CROSS-CAPACITY CONVERGENCE
    // probes/presence name a topic but are not a capacity: they add independent *topic* evidence, not a second lens
    const trainingCaps = Array.from(new Set(ind.filter((o) => !['probe_anchor', 'presence'].includes(o.templateId)).map((o) => o.capacity))) as Capacity[];
    if (trainingCaps.length >= E.convergence.minCapacities && ind.length >= E.convergence.minIndependent) {
      ev.push(mk('cross_capacity_convergence', d, { ...base, capacities: trainingCaps, support: supported ? 'supported' : 'tentative', note: continuation ? `${continuation} further answer(s) came from lens tests Mirar chose; counted as corroboration only` : undefined }));
    } else if (ind.length > 0) {
      refusals.push({ kind: 'cross_capacity_convergence', subject: d, reason: trainingCaps.length <= 1 && continuation > 0 ? 'second lens was a follow-up Mirar chose — a test, not independent evidence' : trainingCaps.length < E.convergence.minCapacities ? `seen through ${trainingCaps.length} capacity only (probes name a topic; they are not a second capacity)` : `${ind.length} independent observation(s); needs ${E.convergence.minIndependent}` });
    }
  }

  // 3 — CHANGE (user's own baseline vs recent; two dimensions)
  {
    const c = E.change;
    const answered = s.observations.filter((o) => o.step === 'primary' && !o.unknown && o.day > day - W && o.domainOrigin !== 'thread_continuation');
    const recent = answered.filter((o) => o.day > day - c.recentDays);
    const baseline = answered.filter((o) => o.day <= day - c.recentDays);
    if (baseline.length >= c.baselineMin && recent.length >= c.recentMin) {
      const rate = (xs: Observation[]) => xs.filter((o) => o.burden).length / xs.length;
      const delta = rate(recent) - rate(baseline);
      if (Math.abs(delta) >= c.minDelta) ev.push(mk('change', 'burden_rate', { independentN: recent.length, offeredN: baseline.length, presentOfferedN: Math.round(rate(baseline) * baseline.length), promptedN: recent.filter((o) => o.burden).length, days: recent.map((o) => o.day), support: 'tentative', note: delta > 0 ? 'heavier than own baseline' : 'lighter than own baseline' }));
      else refusals.push({ kind: 'change', subject: 'burden_rate', reason: `difference ${Math.round(Math.abs(delta) * 100)} points < ${c.minDelta * 100}` });
    } else if (answered.length >= 3) refusals.push({ kind: 'change', subject: 'burden_rate', reason: `baseline has ${baseline.length} answers (needs ${c.baselineMin}), last week has ${recent.length} (needs ${c.recentMin}) — not enough of the user's own history to compare yet` });
  }

  // 4 — CONTRADICTION (stored user stance vs later opposite)
  {
    const byKey = new Map<string, Observation[]>();
    // only DURABLE statements can contradict; day-to-day states (pushing vs pacing today) are just variation
    for (const o of s.observations) if (o.stance?.durable && !o.unknown) byKey.set(o.stance.key, [...(byKey.get(o.stance.key) ?? []), o]);
    for (const [key, os] of byKey) {
      const recent = os.filter((o) => o.day > day - E.contradiction.windowDays);
      const sides = new Set(recent.map((o) => o.stance!.side));
      if (sides.size >= 2) ev.push(mk('contradiction', key, { independentN: recent.length, days: recent.map((o) => o.day), support: 'tentative', note: `sides: ${[...sides].join(' / ')}` }));
      else if (os.length >= 2) refusals.push({ kind: 'contradiction', subject: key, reason: sides.size === 1 && recent.length >= 2 ? 'same stance repeated — consistent, not contradictory' : 'opposite stances were more than the window apart' });
    }
  }

  // 5 — UNRESOLVED THREAD (user-opened only)
  for (const t of s.threads) {
    if (t.kind !== 'ongoing') continue;
    if (t.state === 'open' && t.openedVia !== 'engine_candidate') {
      const fresh = t.lastConfirmedDay !== undefined && day - t.lastConfirmedDay <= cfg.thread.staleDays;
      if (fresh) ev.push(mk('unresolved_thread', String(t.id), { independentN: 1, support: 'supported', days: [t.openedDay], note: `${t.domain}; opened ${t.openedVia}` }));
      else refusals.push({ kind: 'unresolved_thread', subject: t.domain, reason: `not confirmed by the user for ${day - (t.lastConfirmedDay ?? t.openedDay)} days — not assumed still open` });
    } else if (t.state === 'candidate' || t.openedVia === 'engine_candidate') refusals.push({ kind: 'unresolved_thread', subject: t.domain, reason: 'engine candidate, not user-confirmed — never shown as fact' });
  }

  // 6 — FOLLOW-THROUGH (from the commitment lifecycle; never a failure claim)
  for (const c of s.commitments) {
    if (c.status === 'open' && !(c.dueDay !== undefined && day >= c.dueDay)) continue;
    ev.push(mk('follow_through', String(c.id), { independentN: 1, support: 'supported', days: [c.createdDay], note: `${c.kind}; status ${c.status} (${c.statusSource})` }));
    if (c.status === 'unconfirmed') refusals.push({ kind: 'follow_through', subject: String(c.id), reason: 'date passed with no update — recorded as "unconfirmed", not as failure' });
    if (c.status === 'changed_mind' || c.status === 'dropped_on_purpose') refusals.push({ kind: 'follow_through', subject: String(c.id), reason: `user ${c.status.replace(/_/g, ' ')} — a decision, not a failure` });
  }

  // 7 — RESOLUTION
  for (const d of issueDomains(s)) {
    const all = s.observations.filter((o) => o.domainRole === 'issue' && o.domain === d);
    const presentDays = all.filter((o) => o.polarity === 'present').map((o) => o.day);
    const lastPresent = presentDays.length ? Math.max(...presentDays) : -1;
    const hadSignal = all.filter((o) => o.polarity === 'present' && INDEPENDENT.has(o.domainOrigin ?? '')).length >= 2;
    const negs = all.filter((o) => o.polarity === 'absent' && o.domainOrigin === 'thread_continuation' && o.day > lastPresent);
    const resolvedByUser = s.threads.find((t) => t.domain === d && t.state === 'resolved' && t.stateSource === 'user');
    if (resolvedByUser) { ev.push(mk('resolution', d, { independentN: 1, support: 'supported', days: [], note: 'closed by the user' })); continue; }
    if (!hadSignal) continue;
    const gapSince = s.instances.length ? day - s.instances[s.instances.length - 1].day : 0;
    if (negs.length >= E.resolution.minNegatives) ev.push(mk('resolution', d, { negativeN: negs.length, independentN: negs.length, support: 'tentative', days: negs.map((o) => o.day), note: `${negs.length} explicit "not this/not today" answers since last present` }));
    else if (negs.length === 0 && day - lastPresent >= 7) refusals.push({ kind: 'resolution', subject: d, reason: gapSince >= 7 ? `absence of ${d} follows ${gapSince} days of no use — silence is not resolution` : `${d} not seen for ${day - lastPresent} days but Mirar asked 0 times — no opportunity to say "not this"; absence ≠ resolved` });
    else refusals.push({ kind: 'resolution', subject: d, reason: `${negs.length} explicit negative(s); needs ${E.resolution.minNegatives}` });
  }

  // 8 — ONE-OFF SIGNIFICANT EVENT (user-flagged only)
  let flagged = false;
  for (const t of s.threads) if (t.kind === 'event' && t.openedVia === 'user_introduced') {
    flagged = true;
    if (t.state === 'open') ev.push(mk('one_off_event', String(t.id), { independentN: 1, support: 'supported', days: [t.openedDay], note: `${t.domain}; flagged by the user; expires day ${t.expiresDay}` }));
  }
  const lastInst = s.instances[s.instances.length - 1];
  if (!flagged && lastInst && lastInst.burden && lastInst.day === day) refusals.push({ kind: 'one_off_event', subject: lastInst.templateId, reason: 'one heavy answer is not a significant event unless the user flags it' });

  // ── apply the user's corrections
  for (const e of ev) {
    const fb = s.feedbackMem[e.key] ?? (e.kind === 'repeated_signal' || e.kind === 'cross_capacity_convergence' ? s.feedbackMem[`domain:${e.subject}`] : undefined);
    if (!fb) continue;
    if (fb.noDay !== undefined) {
      const newInd = e.kind === 'repeated_signal' || e.kind === 'cross_capacity_convergence' ? independentPresent(s, e.subject as Domain, day, W).filter((o) => o.day > fb.noDay!).length : 0;
      if (newInd < cfg.feedback.newEvidenceAfterNo) { e.status = 'withheld'; e.note = `user said "No"; ${newInd}/${cfg.feedback.newEvidenceAfterNo} new independent observations since`; }
      else { e.support = 'tentative'; e.note = 'user disagreed earlier; shown only with new evidence and hedged'; }
    }
    if (fb.unsureDay !== undefined && day - fb.unsureDay < cfg.feedback.suppressDaysUnsure) { e.status = 'withheld'; e.note = 'user was unsure; waiting'; }
  }
  return { evidence: ev, refusals, tentativeMode };
}

export const ALL_CAPACITIES = CAPACITIES;

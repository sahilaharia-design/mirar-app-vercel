import { V2, V2Config } from './config';
import { EvidenceResult, computeEvidence, independentPresent } from './evidence';
import { advanceDay, completed, daysSinceLast, ds, lastInstance } from './state';
import { AFFINITY, TEMPLATES, TEMPLATE_BY_ID } from './templates';
import { CAPACITIES, Capacity, Commitment, Domain, Frame, Instance, Layer, State, Template, Thread, Trace, TraceRejection } from './types';

// ─── Decision engine v2: CONTINUITY → LIFE CONTEXT → TRAINING NEED ────────────
// No single score. Three layers are tried in order; each produces named intents
// with a stated reason. Constraints (intensity, budget, windows, suppressions)
// are applied to all layers and are recorded when they overrule something.
// Rest ("no rep today") is an outcome, enabled only when config says so.

export interface Decision {
  layer: Layer;
  templateId?: string;
  frame?: Frame;
  bound?: Domain;
  intent: string;
  intentRef?: number;
  /** which wording of the question to use (deterministic per user, rotates) */
  variant: number;
  trace: Trace;
  evidence: EvidenceResult;
}

export const label = (t: string, f: Frame = 'base', b?: Domain) => `${t}${f !== 'base' ? `#${f}` : ''}${b ? `[${b}]` : ''}`;
const CONTEXT_INTENTS = (i: string) => i.startsWith('lens:') || i.startsWith('native:') || i === 'probe_confirm' || i === 'thread_check' || i === 'event_check' || i === 'resolution_check' || i === 'commitment_revisit';

export function decide(s: State, day: number, cfg: V2Config = V2): Decision {
  advanceDay(s, day, cfg);
  const insts = s.instances;
  const n = insts.length;
  const last = lastInstance(s);
  const gap = daysSinceLast(s, day);
  const evidence = computeEvidence(s, day, cfg);
  const constraints: Trace['constraints'] = [];
  const rejected: TraceRejection[] = [];
  const letRest: string[] = [];
  const repsAgoOf = (pred: (i: Instance) => boolean) => { for (let k = n - 1; k >= 0; k--) if (pred(insts[k])) return n - 1 - k; return Infinity; };

  // ── facts
  const returnMode = n > 0 && gap >= cfg.gaps.returnDays;
  const nonLightRun = (() => { let c = 0; for (let k = n - 1; k >= 0 && insts[k].intensity !== 'light'; k--) c++; return c; })();
  const unknownRun = (() => { let c = 0; for (let k = n - 1; k >= 0 && (insts[k].unknownPrimary || insts[k].skippedAll); k--) c++; return c; })();
  const recentAnswers = insts.slice(-cfg.disengage.window);
  const unknownShare = recentAnswers.length >= 4 ? recentAnswers.filter((i) => i.unknownPrimary || i.skippedAll).length / recentAnswers.length : 0;
  const disengaged = unknownShare >= cfg.disengage.threshold;
  const lastBurden = !!last && last.burden;
  const budgetUsed = insts.slice(-cfg.budget.lookbackReps).filter((i) => CONTEXT_INTENTS(i.intent)).length;
  const consecCtx = (() => { let c = 0; for (let k = n - 1; k >= 0 && CONTEXT_INTENTS(insts[k].intent); k--) c++; return c; })();
  const budgetExhausted = budgetUsed >= cfg.budget.cap || consecCtx >= cfg.budget.maxConsecutive;
  const tentMin = cfg.evidence.active.minIndependent + (evidence.tentativeMode ? cfg.uncertaintyMode.raiseMinIndependentBy : 0);

  // ── constraints (named; recorded when they bite)
  let maxIntensity: 'light' | 'medium' = 'medium';
  if (lastBurden && cfg.intensity.lightAfterBurden) { maxIntensity = 'light'; constraints.push({ name: 'recovery', effect: 'light reps only: the last rep carried a burden', overrode: 'relevance and novelty' }); }
  if (nonLightRun >= cfg.intensity.maxNonLightRun) { maxIntensity = 'light'; constraints.push({ name: 'no stacking', effect: `light reps only: ${nonLightRun} non-light reps in a row`, overrode: 'relevance and novelty' }); }
  if (unknownRun >= cfg.ease.unknownRun) { maxIntensity = 'light'; constraints.push({ name: 'ease', effect: `light + simple: ${unknownRun} unanswered reps in a row`, overrode: 'interpretation' }); }
  if (returnMode) { maxIntensity = 'light'; constraints.push({ name: 'return', effect: `back after ${gap} days: no assumptions, light and open`, overrode: 'open threads' }); }
  let simplify = false;
  if (disengaged) { simplify = true; maxIntensity = 'light'; constraints.push({ name: 'simplify', effect: `${Math.round(unknownShare * 100)}% of recent reps unanswered: shorter, choice-only reps; open threads rest`, overrode: 'continuity' }); }
  if (evidence.tentativeMode) constraints.push({ name: 'tentative mode', effect: 'interpretive confidence lowered (the user disagreed with recent readings, or is mostly answering "I don\'t know"): higher evidence bar, hedged wording only. This is about how reliable Mirar\'s reading is, not about the person.', overrode: 'insight thresholds' });

  const openThreads = s.threads.filter((t) => t.state === 'open' || t.state === 'resting').map((t) => `${t.domain}${t.kind === 'event' ? ' (event)' : ''} [${t.state}${t.restUntilDay !== undefined ? ` until d${t.restUntilDay}` : ''}]`);
  const dueCommitments: string[] = [];
  const domainResting = (d: Domain) => (ds(s, d).restUntilDay ?? -1) > day;
  const activeDomains: Domain[] = [];
  for (const d of Array.from(new Set(s.observations.filter((o) => o.domainRole === 'issue' && o.domain && o.domain !== 'unknown').map((o) => o.domain as Domain))))
    { const ind = independentPresent(s, d, day, cfg.evidence.activeDays).filter((o) => o.day > (ds(s, d).quietSince ?? -1));
      // something the user raised themselves is strong enough to test on its own; list-prompted answers need corroboration
      if (ind.length >= tentMin || ind.some((o) => o.domainOrigin === 'user_introduced')) activeDomains.push(d); }
  // a thread the user themselves opened or confirmed makes its domain active even before a second observation
  for (const th of s.threads) if (th.kind === 'ongoing' && th.state === 'open' && th.openedVia !== 'engine_candidate' && !activeDomains.includes(th.domain) && th.lastConfirmedDay !== undefined && day - th.lastConfirmedDay <= cfg.thread.staleDays) activeDomains.push(th.domain);

  const windowBlocked = (t: Template, frame: Frame, bound?: Domain): string | null => {
    if (t.role === 'continuity' || t.role === 'probe') return null; // governed by their own cadence rules
    for (let k = n - 1; k >= 0; k--) {
      const i = insts[k];
      if (i.templateId !== t.id) continue;
      const ago = n - 1 - k;
      const sameBinding = i.frame === frame && (i.bound ?? '') === (bound ?? '');
      if (sameBinding && ago < cfg.templateWindowReps) return `same exercise ${ago + 1} reps ago (window ${cfg.templateWindowReps})`;
      if (!sameBinding && ago < cfg.lensWindowReps) return `same exercise, other binding, ${ago + 1} reps ago (window ${cfg.lensWindowReps})`;
    }
    return null;
  };
  const intensityBlocked = (t: Template) => (t.intensity === 'medium' && maxIntensity === 'light') ? 'medium rep during a light-only period' : (t.sensitivity === 'medium' && (maxIntensity === 'light') ? 'sensitive rep during a light-only period' : null);
  const simpleBlocked = (t: Template) => simplify && (t.interaction === 'words' || t.options.length > 5) ? 'too long/free-form for simplify mode' : null;

  const traceBase = (selected: string, layer: Layer, primary: string, secondary: string[], domain?: Domain): Trace => ({
    day, selected, layer, primaryReason: primary, secondaryReasons: secondary, constraints, rejected, letRest, domain,
    orientation: undefined, openThreads, dueCommitments, activeDomains: activeDomains.map(String), budget: { used: budgetUsed, cap: cfg.budget.cap },
  });
  const hashStr = (str: string) => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); };
  /** deterministic per user, rotates with use, never the same wording twice in a row */
  const pickVariant = (templateId: string): number => {
    const n = TEMPLATE_BY_ID[templateId].promptVariants?.length ?? 1; if (n <= 1) return 0;
    const used = insts.filter((i) => i.templateId === templateId);
    return (hashStr(`${s.userSeed}|${templateId}`) + used.length) % n;
  };
  const finish = (layer: Layer, templateId: string, frame: Frame, intent: string, primary: string, secondary: string[], bound?: Domain, intentRef?: number): Decision =>
    ({ layer, templateId, frame, bound, intent, intentRef, variant: pickVariant(templateId), evidence, trace: traceBase(label(templateId, frame, bound), layer, primary, secondary, bound) });

  // ═══ RETURN AFTER A GAP: ask openly first, assume nothing ═══
  if (returnMode) {
    letRest.push(`open threads/commitments not raised: user was away ${gap} days — what mattered before is not assumed to matter now`);
    const probeBlock = windowBlocked(TEMPLATE_BY_ID.probe_anchor, 'base');
    if (!probeBlock) return finish('probe', 'probe_anchor', 'base', 'probe_return', `Returning after ${gap} days. Ask an open question; do not resume old threads.`, ['light, open, no assumed topic']);
    rejected.push({ what: 'probe_anchor', why: probeBlock });
  }

  // ═══ LAYER C — CONTINUITY ═══
  const due: { c: Commitment; why: string }[] = [];
  for (const c of s.commitments) {
    if (c.status !== 'open' && c.status !== 'postponed') continue;
    const dueDay = c.status === 'postponed' ? c.postponedUntil : c.dueDay;
    const spacingOk = c.lastAskDay === undefined || day - c.lastAskDay >= cfg.commitment.askSpacingDays;
    if (dueDay === undefined) {
      if (c.status === 'open' && day - c.createdDay >= cfg.commitment.noneRevisitDays && c.asks < cfg.commitment.maxNoneRevisits) {
        if (budgetExhausted || disengaged) letRest.push(`commitment #${c.id} (no deadline): revisit postponed — ${disengaged ? 'simplify mode' : 'continuity budget'}`);
        else due.push({ c, why: `no-deadline item, ${day - c.createdDay} days old: one gentle revisit` });
      }
      if (c.status === 'open' && c.asks >= cfg.commitment.maxNoneRevisits) letRest.push(`commitment #${c.id} (no deadline): already revisited ${c.asks}×; not asked again`);
      continue;
    }
    if (day < dueDay) continue;
    dueCommitments.push(`#${c.id} ${c.kind}${c.domain ? ` [${c.domain}]` : ''} due d${dueDay}`);
    if (c.asks >= cfg.commitment.maxAsks) { letRest.push(`commitment #${c.id}: asked ${c.asks}× already; no more asks, will be recorded "unconfirmed" (not failure)`); continue; }
    if (!spacingOk) { letRest.push(`commitment #${c.id}: asked ${day - (c.lastAskDay as number)}d ago; spacing ${cfg.commitment.askSpacingDays}d`); continue; }
    due.push({ c, why: `due d${dueDay}, ask ${c.asks + 1} of ${cfg.commitment.maxAsks}` });
  }
  if (!returnMode || rejected.length) {
    if (due.length) {
      const { c, why } = due[0];
      return finish('continuity', 'cont_commitment', 'commitment_check', c.dueDay === undefined && c.status === 'open' ? 'commitment_revisit' : 'commitment_due', `Commitment ${why}.`, ['exempt from the continuity budget; only the user can close it', `${due.length - 1} other due item(s) wait`], c.domain, c.id);
    }

    // events
    for (const th of s.threads) {
      if (th.kind !== 'event' || th.state !== 'open') continue;
      const when = cfg.event.askAtDays[th.eventAsks];
      if (when === undefined) { letRest.push(`event [${th.domain}]: asked ${th.eventAsks}× — enough; it fades on its own`); continue; }
      if (day - th.openedDay < when) continue;
      if (disengaged) { letRest.push(`event [${th.domain}]: not asked — simplify mode`); continue; }
      if (budgetExhausted) { rejected.push({ what: `event check [${th.domain}]`, why: `continuity budget ${budgetUsed}/${cfg.budget.cap}` }); continue; }
      return finish('continuity', 'cont_event', 'event_check', 'event_check', `Something significant (${th.domain}) was flagged ${day - th.openedDay} days ago; ask how it sits now.`, [`ask ${th.eventAsks + 1} of ${cfg.event.askAtDays.length}`], th.domain, th.id);
    }

    // threads
    const cands: { th: Thread; why: string }[] = [];
    for (const th of s.threads) {
      if (th.kind !== 'ongoing') continue;
      if (th.state === 'resting') { letRest.push(`thread [${th.domain}]: resting until d${th.restUntilDay} (${th.restReason})`); continue; }
      if (th.state !== 'open') continue;
      if (domainResting(th.domain)) { letRest.push(`thread [${th.domain}]: domain resting until d${ds(s, th.domain).restUntilDay} (${ds(s, th.domain).restReason})`); continue; }
      if (th.lastConfirmedDay !== undefined && day - th.lastConfirmedDay > cfg.thread.staleDays) { letRest.push(`thread [${th.domain}]: not confirmed for ${day - th.lastConfirmedDay} days — not assumed still open`); continue; }
      const anchor = Math.max(th.lastCheckDay ?? -1, th.lastConfirmedDay ?? -1);
      const sinceCheck = anchor < 0 ? Infinity : insts.filter((i) => i.day > anchor).length;
      const spacing = cfg.thread.checkEveryReps * th.cadenceMultiplier;
      if (sinceCheck < spacing) { letRest.push(`thread [${th.domain}]: checked ${sinceCheck} rep(s) ago; spacing ${spacing}`); continue; }
      const inWin = th.checkDays.filter((d) => d > day - cfg.thread.windowDays).length;
      if (inWin >= cfg.thread.maxPerWindow) { letRest.push(`thread [${th.domain}]: ${inWin} checks in ${cfg.thread.windowDays} days (cap ${cfg.thread.maxPerWindow})`); continue; }
      cands.push({ th, why: `open ${day - th.openedDay}d, last confirmed ${th.lastConfirmedDay !== undefined ? day - th.lastConfirmedDay : '?'}d ago` });
    }
    if (disengaged && cands.length) { for (const c of cands) letRest.push(`thread [${c.th.domain}]: not asked — simplify mode (user is not answering)`); cands.length = 0; }
    if (cands.length && budgetExhausted) { for (const c of cands) rejected.push({ what: `thread check [${c.th.domain}]`, why: `continuity budget ${budgetUsed}/${cfg.budget.cap}${consecCtx >= cfg.budget.maxConsecutive ? `, ${consecCtx} in a row` : ''} — novelty gets a turn` }); cands.length = 0; }
    if (cands.length) {
      const c = cands.sort((a, b) => (b.th.lastConfirmedDay ?? 0) - (a.th.lastConfirmedDay ?? 0))[0];
      return finish('continuity', 'cont_thread', 'thread_check', 'thread_check', `Open thread [${c.th.domain}] is still relevant (${c.why}).`, [`budget ${budgetUsed}/${cfg.budget.cap}`, 'check offers an honest "not today"'], c.th.domain, c.th.id);
    }

    // resolution offers (once) for threads that went quiet by the user's own "not this"
    for (const th of s.threads) if (th.kind === 'ongoing' && th.state === 'resting' && !th.resolutionOffered && (th.restReason ?? '').includes('not') && !disengaged && !budgetExhausted && th.stateSource === 'engine' && th.checkDays.filter((d) => d > day - cfg.thread.windowDays).length < cfg.thread.maxPerWindow) {
      return finish('continuity', 'cont_thread', 'resolution', 'resolution_check', `Thread [${th.domain}] went quiet after the user's own "not this" answers. Ask once whether it feels settled; the user decides.`, ['Mirar does not call it resolved'], th.domain, th.id);
    }
  }

  // ═══ LAYER B — LIFE CONTEXT ═══
  if (!returnMode || rejected.length) {
    // concentration without independent confirmation → open probe, not an assumption
    const unconfirmed: Domain[] = [];
    for (const d of activeDomains) {
      const ind = independentPresent(s, d, day, cfg.evidence.activeDays);
      const intro = ind.filter((o) => o.domainOrigin === 'user_introduced').length;
      const confirmedThread = s.threads.some((t) => t.domain === d && t.state === 'open' && t.openedVia !== 'engine_candidate');
      if (!intro && !confirmedThread && !domainResting(d)) unconfirmed.push(d);
    }
    const sinceProbe = repsAgoOf((i) => i.templateId === 'probe_anchor');
    const U = cfg.probe.unexplainedBurden;
    const lastReps = insts.slice(-U.window);
    const unexplained = lastReps.filter((i) => i.burden && !s.observations.some((o) => o.instanceId === i.id && o.domain && o.domain !== 'unknown')).length;
    if (unexplained >= U.minBurdenReps && !disengaged && !activeDomains.length && !budgetExhausted && sinceProbe >= cfg.probe.minBetweenReps)
      return finish('probe', 'probe_anchor', 'base', 'probe_confirm', `${unexplained} heavy answers in the last ${U.window} reps with no stated context. Ask an open question rather than guess what they are about.`, [`last probe ${sinceProbe === Infinity ? 'never' : sinceProbe + ' reps ago'}`, 'selection-bias safeguard: Mirar cannot see what it did not ask']);
    if (unconfirmed.length && !disengaged) {
      if (sinceProbe >= cfg.probe.minBetweenReps && !budgetExhausted) return finish('probe', 'probe_anchor', 'base', 'probe_confirm', `${unconfirmed.join(', ')} appeared only through lists Mirar offered. Ask an open question before treating it as salient.`, [`last probe ${sinceProbe === Infinity ? 'never' : sinceProbe + ' reps ago'}`, 'selection-bias safeguard']);
      rejected.push({ what: 'probe_confirm', why: budgetExhausted ? `continuity budget ${budgetUsed}/${cfg.budget.cap}` : `last probe only ${sinceProbe} reps ago (min ${cfg.probe.minBetweenReps})` });
    }

    // confirmed domain → test through a lens or a native rep in the same capacity
    const confirmed = activeDomains.filter((d) => !unconfirmed.includes(d));
    for (const d of confirmed) {
      if (domainResting(d)) { letRest.push(`domain [${d}]: resting until d${ds(s, d).restUntilDay} (${ds(s, d).restReason}); no lenses`); continue; }
      if (disengaged) { letRest.push(`domain [${d}]: no lenses — simplify mode`); continue; }
      if (budgetExhausted) { rejected.push({ what: `lens/native rep for [${d}]`, why: `continuity budget ${budgetUsed}/${cfg.budget.cap}` }); continue; }
      const order = AFFINITY[d];
      const lensTested = (c: Capacity) => { const x = ds(s, d).lastLensDay[c]; return x !== undefined && day - x < 7; };
      const choices: { t: Template; frame: Frame; intent: string; why: string }[] = [];
      for (const c of order) {
        const host = TEMPLATES.find((t) => t.hasLens && t.capacity === c)!;
        if (!lensTested(c)) choices.push({ t: host, frame: 'lens', intent: `lens:${d}`, why: `${d} has not been tested through ${c}` });
        // a same-capacity rep only counts as "about d" if d is actually one of its answers
        for (const t of TEMPLATES.filter((x) => x.capacity === c && x.role === 'training' && x.domainRole === 'issue' && x.options.some((o) => o.domain === d)))
          if (c === order[0]) choices.push({ t, frame: 'base', intent: `native:${d}`, why: `${c} is the closest capacity to ${d}; a different exercise, same capacity` });
      }
      for (const ch of choices) {
        const wb = windowBlocked(ch.t, ch.frame, ch.frame === 'lens' ? d : undefined) ?? intensityBlocked(ch.t) ?? simpleBlocked(ch.t);
        if (wb) { rejected.push({ what: label(ch.t.id, ch.frame, ch.frame === 'lens' ? d : undefined), why: wb }); continue; }
        return finish('context', ch.t.id, ch.frame, ch.intent, `[${d}] is active (${independentPresent(s, d, day, cfg.evidence.activeDays).length} independent observations, confirmed by the user). ${ch.why}.`, [`budget ${budgetUsed}/${cfg.budget.cap}`, ch.frame === 'lens' ? 'lens offers an honest "not today / not this"' : 'capacity may repeat; the exercise does not'], ch.frame === 'lens' ? d : undefined);
      }
    }
  }

  // ═══ REST ═══
  let restCheck: string | undefined;
  if (cfg.rest.enabled) {
    const R = cfg.rest;
    const why: string[] = [];
    if (n < R.minHistoryReps) why.push(`only ${n} reps of history (need ${R.minHistoryReps})`);
    const calm = insts.slice(-R.calmRun);
    if (calm.length < R.calmRun || calm.some((i) => i.burden)) why.push(`last ${R.calmRun} reps not all unburdened`);
    const last14 = insts.slice(-14); if (last14.length && last14.filter((i) => i.burden).length / last14.length > R.maxBurdenShare14) why.push(`${last14.filter((i) => i.burden).length} of the last ${last14.length} reps carried a burden (cap ${Math.round(R.maxBurdenShare14 * 100)}%)`);
    if (calm.length && calm.filter((i) => i.unknownPrimary || i.skippedAll).length / calm.length > 1 - R.minAnsweredShare) why.push('too many unanswered reps: needs simplifying, not rest');
    if (openThreads.some((t) => t.includes('[open'))) why.push('an open thread exists');
    const recentIssue = Array.from(new Set(s.observations.filter((o) => o.domainRole === 'issue' && o.polarity === 'present' && o.domain && o.domain !== 'unknown' && ['prompted_choice', 'user_introduced', 'prompted_text'].includes(o.domainOrigin ?? '') && o.day > day - R.issueLookbackDays).map((o) => o.domain)));
    if (recentIssue.length) why.push(`the user named ${recentIssue.join(', ')} in the last ${R.issueLookbackDays} days — a recent topic is not "nothing", even if today's answer is`);
    if (dueCommitments.length) why.push('a commitment is due');
    if (activeDomains.length) why.push(`active domain(s): ${activeDomains.join(', ')}`);
    if (returnMode) why.push('just returned');
    const lastRest = s.restDays.length ? s.restDays[s.restDays.length - 1] : -Infinity;
    if (day - lastRest < R.minGapDays) why.push(`rest ${day - lastRest}d ago (min gap ${R.minGapDays})`);
    const recentWindow = insts.filter((i) => i.day > day - 10).length + s.restDays.filter((d) => d > day - 10).length;
    if (recentWindow > 0 && s.restDays.filter((d) => d > day - 10).length / recentWindow > R.maxShareLast10) why.push('rest share of last 10 days would exceed cap');
    const covered = new Set(insts.slice(-R.coverageWindowReps).map((i) => i.capacity));
    if (covered.size < CAPACITIES.length) why.push(`capacities not recently practised: ${CAPACITIES.filter((c) => !covered.has(c)).join(', ')} — training still has something justified`);
    // Rest must follow the USER'S OWN statement that nothing needs attention (open probe or presence check),
    // never a schedule.
    const recentNothing = insts.slice(-R.nothingWithinReps).some((i) => (i.templateId === 'probe_anchor' || i.templateId === 'presence') && s.observations.some((o) => o.instanceId === i.id && o.step === 'primary' && o.polarity === 'absent'));
    if (!recentNothing) why.push(`the user has not said "nothing" to an open question in the last ${R.nothingWithinReps} reps — rest follows their statement, not a schedule`);
    if (why.length === 0) {
      restCheck = 'REST: no useful new inner work can be justified — calm run, nothing open, all capacities recently exercised, and the user said nothing needs attention.';
      s.restDays.push(day);
      return { layer: 'rest', intent: 'rest', variant: 0, evidence, trace: { ...traceBase('(no rep today)', 'rest', 'Nothing needs examining today. This is a justified outcome, not filler.', ['calm run', 'nothing open', 'coverage satisfied', 'the user themselves said nothing needs attention']), restCheck } };
    }
    restCheck = `not rest: ${why.join('; ')}`;
  }

  // ═══ LAYER A — TRAINING NEED ═══
  const sinceProbe = repsAgoOf((i) => i.templateId === 'probe_anchor');
  if (n >= cfg.probe.firstAfterReps && sinceProbe >= cfg.probe.everyReps && !disengaged) {
    const wb = windowBlocked(TEMPLATE_BY_ID.probe_anchor, 'base');
    if (!wb) { const d = finish('probe', 'probe_anchor', 'base', 'probe_cadence', `Calibration: no open question for ${sinceProbe === Infinity ? 'ever' : sinceProbe + ' reps'}. Let the user choose the topic.`, ['keeps Mirar from only learning about what it asks']); d.trace.restCheck = restCheck; return d; }
  }
  const trainingPool = TEMPLATES.filter((t) => (t.role === 'training' || t.role === 'presence'));
  const rank = (t: Template) => {
    // only real training reps count as practising a capacity (probes, check-ins and presence are not exercises)
    const capAgo = repsAgoOf((i) => i.capacity === t.capacity && TEMPLATE_BY_ID[i.templateId].role === 'training');
    const coverage = capAgo === Infinity ? 4 : capAgo >= 10 ? 3 : capAgo >= 5 ? 2 : capAgo >= 2 ? 1 : 0;
    const mechAgo = repsAgoOf((i) => i.mechanism === t.mechanism);
    const mech = mechAgo <= 1 ? 0 : 1;
    const lastInt = n ? TEMPLATE_BY_ID[last.templateId].interaction : null;
    const fmt = lastInt === t.interaction ? 0 : 1;
    const hasPositive = insts.slice(-5).some((i) => TEMPLATE_BY_ID[i.templateId].tags.includes('positive'));
    const positive = !hasPositive && t.tags.includes('positive') ? 1 : 0;
    const lightFit = n && insts[n - 1].intensity !== 'light' ? (t.intensity === 'light' ? 1 : 0) : 0;
    const quick = simplify ? -t.seconds : 0;
    const cold = n === 0 && t.id === cfg.coldStartTemplate ? 1 : 0;
    const presenceOk = t.role === 'presence' ? (n >= 6 && !lastBurden ? 0 : -1) : 0; // presence is for settled stretches
    const hash = (hashStr(`${s.userSeed}|${day}|${t.id}`) % 1000) / 1000; // per-user: two users do not get the same order
    return { t, vec: [cold, quick, presenceOk, coverage, mech, fmt, positive, lightFit, hash], coverage, capAgo, mechAgo };
  };
  const NAMES = ['cold start', 'simple/quick', 'presence fit', 'capacity coverage', 'mechanism fatigue', 'format fatigue', 'positive mix', 'light after non-light', 'tie-break'];
  const eligible: ReturnType<typeof rank>[] = [];
  const blockedWin: string[] = [];
  for (const t of trainingPool) {
    const wb = windowBlocked(t, 'base') ?? intensityBlocked(t) ?? simpleBlocked(t);
    if (wb) { blockedWin.push(`${t.id} (${wb.replace(/ \(window \d+\)/, '')})`); continue; }
    eligible.push(rank(t));
  }
  const cmp = (a: number[], b: number[]) => { for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return b[k] - a[k]; return 0; };
  eligible.sort((x, y) => cmp(x.vec, y.vec));
  // If the repetition window leaves nothing (e.g. simplify mode only allows a handful of short, light reps),
  // do not ignore variety silently: relax the window and take the exercise used LONGEST ago, and say so.
  let relaxedNote: string | null = null;
  let pool = eligible;
  if (!eligible.length) {
    const relaxed = trainingPool.filter((t) => !(intensityBlocked(t) ?? simpleBlocked(t))).map((t) => ({ t, ago: repsAgoOf((i) => i.templateId === t.id) })).sort((a, b) => b.ago - a.ago);
    const candidates = (relaxed.length ? relaxed.map((x) => x.t) : trainingPool);
    pool = candidates.map(rank).sort((x, y) => cmp(x.vec, y.vec));
    const pick = relaxed[0];
    if (pick) { const idx = pool.findIndex((q) => q.t.id === pick.t.id); if (idx > 0) pool.unshift(...pool.splice(idx, 1)); }
    relaxedNote = `repeat window relaxed: every allowed exercise was inside its window, so the one used longest ago was taken (${pick ? (pick.ago === Infinity ? 'never used' : pick.ago + 1 + ' reps ago') : '—'})`;
  }
  const win = pool[0];
  const lostOn = (o: typeof win) => { for (let k = 0; k < win.vec.length; k++) if (win.vec[k] !== o.vec[k]) return NAMES[k]; return 'tie-break'; };
  // why the other layers did not win
  const openC = openThreads.length + dueCommitments.length;
  rejected.unshift({ what: 'Layer C (continuity)', why: openC ? `${openThreads.concat(dueCommitments).join('; ')} — present but not asked today (see "let rest" and budget notes)` : 'nothing is open or due' });
  rejected.splice(1, 0, { what: 'Layer B (life context)', why: activeDomains.length ? `active: ${activeDomains.join(', ')} — no eligible test today (budget, rest, or intensity cap)` : 'no domain has enough independent, user-originated evidence to test' });
  for (const o of pool.slice(1, 4)) rejected.push({ what: o.t.id, why: `lower on ${lostOn(o)}` });
  if (blockedWin.length) rejected.push({ what: `${blockedWin.length} exercises`, why: `inside their repetition window: ${blockedWin.slice(0, 4).join(', ')}${blockedWin.length > 4 ? '…' : ''}` });
  const reasons: string[] = [];
  if (win.vec[0]) reasons.push('cold start: light, concrete first rep');
  reasons.push(win.capAgo === Infinity ? `capacity ${win.t.capacity} not yet practised` : `capacity ${win.t.capacity} last practised ${win.capAgo + 1} reps ago`);
  if (win.vec[4]) reasons.push('mechanism not used in the last 2 reps');
  if (win.vec[6]) reasons.push('no positive rep in the last 5');
  if (relaxedNote) reasons.push(relaxedNote);
  const d = finish('training', win.t.id, 'base', 'training', 'Nothing is open and no context needs testing: exercise what is least recently practised.', reasons);
  d.trace.restCheck = restCheck;
  d.trace.constraints = constraints;
  return d;
}

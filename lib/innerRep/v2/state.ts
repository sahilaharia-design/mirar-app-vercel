import { V2, V2Config } from './config';
import { FlowContext, StepAnswer, chosenOption, primaryOptions } from './contracts';
import { TEMPLATE_BY_ID } from './templates';
import { Commitment, Domain, DomainState, Instance, Observation, Orientation, State, Thread, Timeframe } from './types';

// ─── State + reducer ──────────────────────────────────────────────────────────
// Everything the engine knows lives in State and is changed only here. The
// reducer is where "what the user said" becomes an observation; nothing in this
// file reads raw text (there is none in the contract).

export function createState(userSeed = 0): State {
  return { userSeed, day: 0, instances: [], observations: [], threads: [], commitments: [], insights: [], feedbackMem: {}, domainState: {}, restDays: [], seq: { obs: 0, inst: 0, thread: 0, commit: 0, insight: 0 } };
}

export const ds = (s: State, d: Domain): DomainState => (s.domainState[d] ??= { negStreak: 0, lastLensDay: {} });
export const completed = (s: State) => s.instances.filter((i) => i.completed);
export const lastInstance = (s: State) => s.instances[s.instances.length - 1];
export const daysSinceLast = (s: State, day: number) => (s.instances.length ? day - lastInstance(s).day : Infinity);

export function flowContext(s: State, day: number, t: Instance['templateId'], frame: Instance['frame'], bound: Domain | undefined, cfg: V2Config = V2, variant = 0): FlowContext {
  return {
    template: TEMPLATE_BY_ID[t], frame, bound, variant,
    captureCooledDown: s.lastCaptureDay === undefined || day - s.lastCaptureDay >= cfg.capture.cooldownDays,
    openThreadDomains: s.threads.filter((x) => x.state === 'open' || x.state === 'resting').map((x) => x.domain),
    threadDeclinedDomains: (Object.entries(s.domainState) as [Domain, DomainState][]).filter(([, v]) => (v.threadDeclinedUntil ?? -1) > day).map(([k]) => k),
  };
}

const timeframeDue = (day: number, tf: Timeframe, inDays: number | undefined, cfg: V2Config): number | undefined =>
  tf === 'today' ? day : tf === 'tomorrow' ? day + 1 : tf === 'this_week' ? day + cfg.commitment.thisWeekDays : tf === 'specific_date' ? day + (inDays ?? 3) : undefined;

/** Apply one completed (or abandoned) rep: answers → observations, threads, commitments. */
export function applyRep(s: State, inst: Instance, ctx: FlowContext, answers: StepAnswer[], cfg: V2Config = V2) {
  const day = inst.day;
  const t = ctx.template;
  const chosen = chosenOption(ctx, answers);
  const ans = (id: string) => answers.find((a) => a.stepId === id);
  const isLensLike = ctx.frame !== 'base';
  inst.skippedAll = answers.length === 0 || (answers[0]?.kind === 'skip');

  if (ans('capture_domain') || ans('capture_orientation')) s.lastCaptureDay = day; // chips were shown (answered or skipped): start the cool-down
  inst.unknownPrimary = chosen === 'unknown' || chosen === null;

  if (chosen === 'unknown' || chosen === null) {
    s.observations.push({ id: ++s.seq.obs, day, instanceId: inst.id, templateId: t.id, capacity: t.capacity, mechanism: t.mechanism, step: 'primary', polarity: 'unknown', burden: false, unknown: true, domainRole: t.domainRole, offeredDomains: [], closedSet: false, isLens: ctx.frame === 'lens' });
    inst.completed = !inst.skippedAll; inst.burden = false;
    afterUnknown(s, inst, ctx, cfg);
    return;
  }

  const prim = primaryOptions(t, ctx.frame, ctx.bound, ctx.variant);
  const optionDomains = Array.from(new Set(prim.options.map((x) => x.domain).filter((d): d is Domain => !!d && d !== 'unknown')));
  const cap = ans('capture_domain');
  const capturedDomain: Domain | undefined = cap && cap.kind === 'domain' ? cap.domain : undefined;
  const orA = ans('capture_orientation');
  const capturedOrientation: Orientation | undefined = cfg.orientation.enabled && orA && orA.kind === 'orientation' ? orA.orientation : undefined;

  let domain: Domain | undefined = chosen.domain && chosen.domain !== 'unknown' ? chosen.domain : undefined;
  let domainSource: Observation['domainSource'] | undefined = domain ? 'option' : undefined;
  let origin: Observation['domainOrigin'] | undefined;
  // A rep Mirar served BECAUSE of a context cannot independently prove that context.
  const contextDriven = isLensLike || inst.intent.startsWith('native:') || inst.intent.startsWith('lens:');
  if (domain) origin = contextDriven ? 'thread_continuation' : t.role === 'probe' ? 'user_introduced' : 'prompted_choice';
  if (isLensLike && ctx.bound) { domainSource = 'binding'; }
  if (!domain && capturedDomain) { domain = capturedDomain; domainSource = 'user_tapped'; origin = contextDriven ? 'thread_continuation' : 'user_introduced'; }

  const offeredDomains: Domain[] = capturedDomain && !chosen.domain ? ['work', 'partner', 'family', 'friends', 'self', 'body_health', 'money', 'time', 'technology', 'other'] : optionDomains;
  const burden = !!chosen.burden;
  const obs: Observation = {
    id: ++s.seq.obs, day, instanceId: inst.id, templateId: t.id, capacity: t.capacity, mechanism: t.mechanism, step: 'primary', optionId: chosen.id,
    domain, domainSource, domainOrigin: origin,
    orientation: cfg.orientation.enabled ? (chosen.orientation ?? capturedOrientation) : undefined, signal: chosen.signal,
    polarity: chosen.polarity ?? 'present', burden, unknown: false,
    domainRole: isLensLike ? 'issue' : t.domainRole, offeredDomains,
    closedSet: offeredDomains.length > 0 && offeredDomains.length <= cfg.evidence.closedSetMax,
    stance: chosen.stance, isLens: ctx.frame === 'lens',
  };
  // Closed-set obs where the user chose an option: `domain` is the one present; others offered were passed over.
  s.observations.push(obs);

  const fu = ans('follow_up');
  if (fu && fu.kind === 'option' && t.followUp) {
    const fo = t.followUp.options.find((x) => x.id === fu.optionId);
    if (fo) {
      s.observations.push({ id: ++s.seq.obs, day, instanceId: inst.id, templateId: t.id, capacity: t.capacity, mechanism: t.mechanism, step: 'follow_up', optionId: fo.id, polarity: 'present', burden: !!fo.burden, unknown: false, domainRole: 'none', offeredDomains: [], closedSet: false, isLens: false });
    }
  }
  inst.burden = burden || !!(fu && fu.kind === 'option' && t.followUp?.options.find((x) => x.id === fu.optionId)?.burden);
  inst.completed = true;

  // ── a user-introduced domain wakes anything resting/dormant about it
  if (domain && origin === 'user_introduced') for (const th of s.threads) if (th.domain === domain && (th.state === 'resting' || th.state === 'dormant')) { th.state = 'open'; th.stateSource = 'user'; th.negStreak = 0; th.unknownStreak = 0; delete th.restUntilDay; const d = ds(s, domain); d.negStreak = 0; delete d.restUntilDay; }

  // ── lens bookkeeping (domain-level negative streak → let it rest)
  // Lens tests and thread checks are the same question about the same domain: their "not this" answers add up.
  if ((ctx.frame === 'lens' || ctx.frame === 'thread_check') && ctx.bound) {
    const d = ds(s, ctx.bound);
    if (ctx.frame === 'lens') d.lastLensDay[t.capacity] = day;
    if (obs.polarity === 'absent') {
      d.negStreak++;
      if (d.negStreak >= cfg.thread.negStreakToRest) {
        d.restUntilDay = day + cfg.thread.restDays; d.restReason = `${d.negStreak} "not this" answers in a row (lens + check-ins)`;
        for (const t2 of s.threads) if (t2.domain === ctx.bound && t2.kind === 'ongoing' && t2.state === 'open') restThread(s, t2, day, `${d.negStreak} "not this / not today" answers in a row`, cfg, 'engine');
      }
    } else if (obs.polarity === 'present') { d.negStreak = 0; }
  }

  // ── thread / event / resolution frames
  const th = inst.intentRef !== undefined ? s.threads.find((x) => x.id === inst.intentRef) : undefined;
  if (th && (ctx.frame === 'thread_check' || ctx.frame === 'event_check' || ctx.frame === 'resolution')) {
    th.lastCheckDay = day; th.checkDays.push(day); obs.threadId = th.id;
    if (ctx.frame === 'resolution') {
      th.resolutionOffered = true;
      if (chosen.id === 'settled') { th.state = 'resolved'; th.stateSource = 'user'; const dd = ds(s, th.domain); dd.quietSince = day; dd.restUntilDay = day + cfg.thread.restDays; dd.restReason = 'the user said it feels settled'; }
      else if (chosen.id === 'mostly') { restThread(s, th, day, 'user said "mostly settled"', cfg, 'user'); }
      else { th.cadenceMultiplier = Math.min(4, th.cadenceMultiplier * 2); th.negStreak = 0; th.unknownStreak = 0; }
    } else if (ctx.frame === 'event_check') {
      th.eventAsks++;
      if (chosen.id === 'settled') { th.state = 'resolved'; th.stateSource = 'user'; const dd = ds(s, th.domain); dd.quietSince = day; dd.restUntilDay = day + cfg.thread.restDays; dd.restReason = 'the user said it is settled'; }
    } else if (obs.polarity === 'present') { th.lastConfirmedDay = day; th.negStreak = 0; th.unknownStreak = 0; }
    else if (obs.polarity === 'absent') {
      th.negStreak++;
      if (th.negStreak >= cfg.thread.negStreakToRest) restThread(s, th, day, `${th.negStreak} "not this / not today" answers in a row`, cfg, 'engine');
    }
  }

  // ── commitments
  if (ctx.frame === 'commitment_check') {
    const c = s.commitments.find((x) => x.id === inst.intentRef);
    if (c) {
      c.asks++; c.lastAskDay = day;
      const set = (to: Commitment['status']) => { c.events.push({ day, from: c.status, to, by: 'user' }); c.status = to; c.statusSource = 'user'; };
      if (chosen.id === 'done') set('done');
      else if (chosen.id === 'partly') set('partly_done');
      else if (chosen.id === 'changed_mind') set('changed_mind');
      else if (chosen.id === 'dropped') set('dropped_on_purpose');
      else if (chosen.id === 'not_yet') {
        set('postponed');
        const tf = ans('timeframe');
        if (tf && tf.kind === 'timeframe') c.postponedUntil = timeframeDue(day, tf.timeframe, tf.inDays, cfg);
        else c.postponedUntil = undefined;
        c.asks = 0; // a user-chosen postponement resets the ask budget (the user set the new date)
      }
    }
  }
  if (chosen.creates === 'commitment' && ctx.frame === 'base') {
    const tf = ans('timeframe');
    const timeframe: Timeframe = tf && tf.kind === 'timeframe' ? tf.timeframe : 'none';
    const c: Commitment = { id: ++s.seq.commit, kind: chosen.commitKind ?? 'other', domain: domain, timeframe, createdDay: day, dueDay: timeframeDue(day, timeframe, tf && tf.kind === 'timeframe' ? tf.inDays : undefined, cfg), status: 'open', statusSource: 'user', asks: 0, noneRevisits: 0, events: [{ day, from: null, to: 'open', by: 'user' }] };
    s.commitments.push(c);
  }

  // ── thread offer / event flag
  const offer = ans('thread_offer');
  const offerDomain = ctx.frame === 'lens' ? ctx.bound : domain;
  if (offer && offerDomain) {
    if (offer.kind === 'yes') openThread(s, offerDomain, day, ctx.frame === 'lens' ? 'user_confirmed' : 'user_introduced', capturedOrientation ?? chosen.orientation);
    else if (offer.kind === 'no') ds(s, offerDomain).threadDeclinedUntil = day + cfg.thread.offerCooldownDays;
  }
  if (chosen.flagEvent && domain) {
    // an event is its own thread: it must never overwrite an ongoing thread about the same domain
    const ev: Thread = { id: ++s.seq.thread, kind: 'event', domain, orientation: capturedOrientation, state: 'open', stateSource: 'user', openedDay: day, openedVia: 'user_introduced', lastConfirmedDay: day, checkDays: [], negStreak: 0, unknownStreak: 0, eventAsks: 0, resolutionOffered: false, cadenceMultiplier: 1, expiresDay: day + cfg.event.expiresDays };
    s.threads.push(ev);
  }
  if (t.role === 'probe') s.lastProbeInstance = inst.id;
}

function afterUnknown(s: State, inst: Instance, ctx: FlowContext, cfg: V2Config) {
  const th = inst.intentRef !== undefined ? s.threads.find((x) => x.id === inst.intentRef) : undefined;
  if (th && (ctx.frame === 'thread_check' || ctx.frame === 'event_check' || ctx.frame === 'resolution')) {
    if (ctx.frame === 'resolution') th.resolutionOffered = true;
    if (ctx.frame === 'event_check') th.eventAsks++;
    th.lastCheckDay = inst.day; th.checkDays.push(inst.day); th.unknownStreak++;
    if (th.unknownStreak >= cfg.thread.unknownStreakToRest) restThread(s, th, inst.day, `${th.unknownStreak} unanswered checks in a row`, cfg, 'engine');
  }
  if (ctx.frame === 'commitment_check') {
    const c = s.commitments.find((x) => x.id === inst.intentRef);
    if (c) { c.asks++; c.lastAskDay = inst.day; }
  }
}

export function restThread(s: State, th: Thread, day: number, reason: string, cfg: V2Config, by: 'engine' | 'user') {
  th.state = 'resting'; th.stateSource = by; th.restReason = reason;
  th.restUntilDay = day + cfg.thread.restDays * th.cadenceMultiplier;
  th.cadenceMultiplier = Math.min(4, th.cadenceMultiplier * 2);
  void s;
}

export function openThread(s: State, domain: Domain, day: number, via: Thread['openedVia'], orientation?: Orientation): Thread {
  const existing = s.threads.find((x) => x.domain === domain && x.kind === 'ongoing' && (x.state === 'open' || x.state === 'resting'));
  if (existing) { existing.state = 'open'; existing.lastConfirmedDay = day; return existing; }
  const th: Thread = { id: ++s.seq.thread, kind: 'ongoing', domain, orientation, state: 'open', stateSource: 'user', openedDay: day, openedVia: via, lastConfirmedDay: day, checkDays: [], negStreak: 0, unknownStreak: 0, eventAsks: 0, resolutionOffered: false, cadenceMultiplier: 1 };
  s.threads.push(th);
  return th;
}

/** Calendar housekeeping before each decision. Changes only SYSTEM-owned states. */
export function advanceDay(s: State, day: number, cfg: V2Config = V2) {
  s.day = day;
  const gap = daysSinceLast(s, day);
  for (const c of s.commitments) {
    if (c.status !== 'open' && c.status !== 'postponed') continue;
    const due = c.status === 'postponed' ? c.postponedUntil : c.dueDay;
    if (due === undefined) continue;
    const silent = gap >= cfg.commitment.silentAfterAbsenceDays;
    if (day > due && (silent || c.asks >= cfg.commitment.maxAsks || day >= due + 7)) {
      c.events.push({ day, from: c.status, to: 'unconfirmed', by: 'system' }); c.status = 'unconfirmed'; c.statusSource = 'system';
    }
  }
  for (const th of s.threads) {
    if (th.state === 'resolved') continue;
    if (th.kind === 'event' && th.expiresDay !== undefined && day > th.expiresDay && th.state !== 'dormant') { th.state = 'dormant'; th.stateSource = 'engine'; th.restReason = 'event window passed'; }
    if (gap >= cfg.gaps.dormantDays && (th.state === 'open' || th.state === 'resting')) { th.state = 'dormant'; th.stateSource = 'engine'; th.restReason = `no use for ${gap} days`; }
    if (th.state === 'resting' && th.restUntilDay !== undefined && day >= th.restUntilDay) { th.state = 'open'; th.stateSource = 'engine'; th.negStreak = 1; delete th.restUntilDay; }
  }
  for (const [, v] of Object.entries(s.domainState)) if (v && v.restUntilDay !== undefined && day >= v.restUntilDay) { delete v.restUntilDay; v.negStreak = 1; }
}

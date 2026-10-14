import type { AttendFacts, AttendRecord, Disposition, PAnswer, PilotContext, POption, PStep, RepValue, SetAsideWhen } from './types';

// ─── PILOT 2 · ATTEND (Choose Attention) ──────────────────────────────────────
// Operation the person performs: they name what is pulling at them, then give each pull exactly one place:
//   attend to it now (only one can have it), set it aside for now, leave it open, or deliberately do nothing with it.
// The one-at-a-time limit is the constraint that makes this a choice rather than a list. Choosing no "attend now" at all,
// and choosing "nothing", are complete results. Setting aside is not a task: no reminder, due date or commitment is
// created (PILOT_CAPS.commitments is false), and an item set aside is only offered back once, next time, within 7 days.
// Not a productivity tool: there is no ranking, no timer, no overdue state, and no measure of how much was "done".

export const PULLS: { id: string; label: string }[] = [
  { id: 'messages', label: 'A message or notification waiting' },
  { id: 'work', label: 'A work task' },
  { id: 'asked', label: 'Something someone asked of me' },
  { id: 'worry', label: 'A worry about later' },
  { id: 'phone', label: 'My phone or feeds' },
  { id: 'want', label: 'Something I want to do' },
  { id: 'rest', label: 'A need to rest' },
  { id: 'avoiding', label: 'Something I have been avoiding' },
];
const pullLabel = (id: string) => PULLS.find((p) => p.id === id)?.label ?? id;
export const MAX_PULLS = 5;
export const CARRY_WINDOW_DAYS = 7;
export const MAX_CARRY = 2;

export const DISPOSITION_LABEL: Record<Exclude<Disposition, 'unknown'>, string> = { attend_now: 'Attend to it now', set_aside: 'Set it aside for now', leave_open: 'Leave it open', let_be: 'Do nothing with it for now' };
export const WHEN_LABEL: Record<SetAsideWhen, string> = { later_today: 'Later today', another_day: 'Another day', no_time_set: 'No time set' };
export const SIT_LABEL = { settled: 'Settled', mixed: 'Mixed', still_pulling: 'Still pulling at me' } as const;

const dayNumber = (iso: string) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000);
const last = (a: PAnswer[], id: string) => { for (let i = a.length - 1; i >= 0; i--) if (a[i].stepId === id) return a[i]; return undefined; };
const optionOf = (a: PAnswer | undefined) => (a && a.kind === 'option' ? a.optionId : undefined);

/** Pulls set aside in an earlier Attend record, still inside the window, and not already offered back once. */
export function carryCandidates(ctx: PilotContext): { pull: string; fromRecord: number }[] {
  const attends = ctx.prior.filter((r): r is AttendRecord => r.pilot === 'attend' && r.status === 'completed');
  const offered = new Set<string>(); for (const r of attends) for (const c of r.facts.carriedIn) offered.add(`${c.fromRecord}:${c.pull}`);
  const out: { pull: string; fromRecord: number }[] = []; const seen = new Set<string>();
  for (const r of [...attends].reverse()) {
    if (dayNumber(ctx.today) - dayNumber(r.date) > CARRY_WINDOW_DAYS || r.date === ctx.today) continue;
    for (const d of r.facts.dispositions) if (d.disposition === 'set_aside' && !seen.has(d.pull) && !offered.has(`${r.id}:${d.pull}`)) { seen.add(d.pull); out.push({ pull: d.pull, fromRecord: r.id }); }
  }
  return out.slice(0, MAX_CARRY);
}

/** Answers that still count after any "rearrange" (earlier placements are discarded, naming the pulls is kept). */
function effective(answers: PAnswer[]): PAnswer[] {
  let cut = -1; answers.forEach((a, i) => { if (a.stepId === 'rearrange' && optionOf(a) === 'rearrange') cut = i; });
  return answers.filter((a, i) => i > cut || !/^(place|when|sit|rearrange):?/.test(a.stepId) || a.stepId === 'rearrange');
}

export function pullsOf(ctx: PilotContext, answers: PAnswer[]): string[] {
  const out: string[] = [];
  for (const c of carryCandidates(ctx)) { const a = last(answers, `carry:${c.pull}`); if (optionOf(a) === 'still_pulling') out.push(c.pull); }
  const p = last(answers, 'pulls'); if (p && p.kind === 'options') for (const id of p.optionIds) if (!out.includes(id)) out.push(id);
  return out;
}

export function attendNext(ctx: PilotContext, answers: PAnswer[]): PStep | null {
  const carry = carryCandidates(ctx);
  for (const c of carry) if (!last(answers, `carry:${c.pull}`))
    return { id: `carry:${c.pull}`, type: 'choice', prompt: `Last time you set aside “${pullLabel(c.pull)}”. Is it pulling at you now?`, options: [{ id: 'still_pulling', label: 'Yes, it is pulling at me' }, { id: 'not_now', label: 'Not right now' }], allowUnknown: true, allowBack: false };
  const stillCount = carry.filter((c) => optionOf(last(answers, `carry:${c.pull}`)) === 'still_pulling').length;
  const carriedIds = carry.filter((c) => optionOf(last(answers, `carry:${c.pull}`)) === 'still_pulling').map((c) => c.pull);
  const pA = last(answers, 'pulls');
  if (!pA) {
    const room = MAX_PULLS - stillCount;
    return { id: 'pulls', type: 'multi', prompt: `What is pulling at your attention right now? Choose up to ${room}.`, options: PULLS.filter((p) => !carriedIds.includes(p.id)).map((p) => ({ id: p.id, label: p.label })), max: room, noneLabel: 'Nothing is pulling at me right now', allowUnknown: true, allowBack: carry.length > 0 };
  }
  const pulls = pullsOf(ctx, answers);
  if (pA.kind === 'unknown' && !pulls.length) return null;                 // could not name: complete
  if (!pulls.length) return null;                                          // nothing pulling: complete

  const eff = effective(answers);
  let attendNow: string | null = null;
  for (const p of pulls) {
    const pl = last(eff, `place:${p}`);
    if (!pl) {
      const options: POption[] = (Object.keys(DISPOSITION_LABEL) as (keyof typeof DISPOSITION_LABEL)[]).map((id) => ({ id, label: DISPOSITION_LABEL[id], ...(id === 'attend_now' && attendNow ? { disabled: `Only one thing can have your attention first (“${pullLabel(attendNow)}” has it). Change that one to free this.` } : {}) }));
      return { id: `place:${p}`, type: 'choice', prompt: `“${pullLabel(p)}”: where does it go?`, options, allowUnknown: true, allowBack: true };
    }
    if (optionOf(pl) === 'attend_now') attendNow = p;
    if (optionOf(pl) === 'set_aside' && !last(eff, `when:${p}`))
      return { id: `when:${p}`, type: 'choice', prompt: `Set aside “${pullLabel(p)}”. When might it come back to you? Mirar will not remind you.`, options: (Object.keys(WHEN_LABEL) as SetAsideWhen[]).map((id) => ({ id, label: WHEN_LABEL[id] })), allowUnknown: false, allowBack: true };
  }
  if (attendNow && !last(answers, 'hold_offer'))
    return { id: 'hold_offer', type: 'choice', prompt: `Give “${pullLabel(attendNow)}” your attention now?`, options: [{ id: 'hold_now', label: 'Stay with it now. I will say when I am ready.' }, { id: 'after', label: 'I will go to it after this' }], allowUnknown: true, allowBack: false };
  if (attendNow && optionOf(last(answers, 'hold_offer')) === 'hold_now' && !last(answers, 'hold'))
    return { id: 'hold', type: 'hold', prompt: `“${pullLabel(attendNow)}” has your attention. There is no timer.`, endLabel: 'I am ready' , allowBack: false };
  if (!last(eff, 'sit')) return { id: 'sit', type: 'choice', prompt: 'Where does this arrangement sit with you now?', options: (Object.keys(SIT_LABEL) as (keyof typeof SIT_LABEL)[]).map((id) => ({ id, label: SIT_LABEL[id] })), allowUnknown: true, allowBack: false };
  const sit = optionOf(last(eff, 'sit'));
  const rearranged = answers.some((a) => a.stepId === 'rearrange' && optionOf(a) === 'rearrange');
  if (sit && sit !== 'settled' && !rearranged && !last(answers, 'rearrange'))
    return { id: 'rearrange', type: 'choice', prompt: 'Do you want to rearrange it?', options: [{ id: 'rearrange', label: 'Rearrange it' }, { id: 'keep', label: 'Leave it as it is' }], allowUnknown: false, allowBack: false };
  return null;
}

export function attendFacts(ctx: PilotContext, answers: PAnswer[]): AttendFacts {
  const pulls = pullsOf(ctx, answers); const pA = last(answers, 'pulls'); const eff = effective(answers);
  const carriedIn = carryCandidates(ctx).map((c) => ({ c, a: last(answers, `carry:${c.pull}`) })).filter((x) => x.a).map(({ c, a }) => ({ pull: c.pull, fromRecord: c.fromRecord, response: (a!.kind === 'option' ? (a!.optionId as 'still_pulling' | 'not_now') : 'unknown') as 'still_pulling' | 'not_now' | 'unknown' }));
  const dispositions = pulls.flatMap((p) => { const pl = last(eff, `place:${p}`); if (!pl) return []; const d: Disposition = pl.kind === 'option' ? (pl.optionId as Disposition) : 'unknown'; const w = last(eff, `when:${p}`); return [{ pull: p, disposition: d, ...(d === 'set_aside' ? { when: ((w && w.kind === 'option' ? w.optionId : 'no_time_set') as SetAsideWhen) } : {}) }]; });
  const attendNow = dispositions.find((d) => d.disposition === 'attend_now')?.pull ?? null;
  const hi = answers.findIndex((x) => x.stepId === 'hold_offer');
  let holdOn: string | null = null;
  if (hi >= 0) { const sub = answers.slice(0, hi); const e = effective(sub); for (const p of pulls) if (optionOf(last(e, `place:${p}`)) === 'attend_now') holdOn = p; }
  const ho = optionOf(last(answers, 'hold_offer'));
  const hold: AttendFacts['hold'] = !holdOn ? null : ho === 'after' ? 'after' : ho === 'hold_now' ? (last(answers, 'hold') ? 'ended' : 'left_during') : 'skipped';
  const s = last(eff, 'sit');
  const outcome: AttendFacts['outcome'] = !pA ? null : pulls.length ? 'arranged' : pA.kind === 'unknown' ? 'could_not_name' : 'nothing_pulling';
  return { pulls, outcome, carriedIn, dispositions, attendNow, holdOn, hold, sit: s ? (s.kind === 'option' ? (s.optionId as AttendFacts['sit']) : 'unknown') : null, rearranged: answers.some((a) => a.stepId === 'rearrange' && optionOf(a) === 'rearrange') };
}

const names = (ids: string[]) => ids.map((i) => `“${pullLabel(i)}”`).join(', ');
export function attendValue(rec: AttendRecord): RepValue {
  const f = rec.facts; const by = (d: Disposition) => f.dispositions.filter((x) => x.disposition === d);
  const practised: string[] = [];
  if (f.outcome === 'nothing_pulling') practised.push('Checking what is pulling at you, and finding nothing that needed arranging');
  else if (f.outcome === 'could_not_name') practised.push('Checking what is pulling at you, and saying it was hard to tell');
  else if (f.dispositions.length) {
    const placed = f.dispositions.filter((d) => d.disposition !== 'unknown').length;
    practised.push(placed === f.pulls.length ? 'Giving each thing pulling at you one place: now, for later, open, or deliberately nothing' : placed ? `Giving ${placed} of the ${f.pulls.length} things pulling at you a place: now, for later, open, or deliberately nothing` : 'Looking at what is pulling at you without placing any of it');
    if (f.attendNow) practised.push('Choosing the one thing that gets your attention first');
    if (f.hold === 'ended' && f.holdOn) practised.push(`Staying with ${names([f.holdOn])} until you said you were ready`);
    if (by('set_aside').length) practised.push('Setting something down without dropping it');
    if (by('let_be').length) practised.push('Deliberately doing nothing with something');
  } else practised.push('Starting to arrange what is pulling at you');

  const established: string[] = [];
  if (f.pulls.length) established.push(`What you named as pulling at you: ${names(f.pulls)}.`);
  if (f.attendNow) established.push(`You chose to attend to ${names([f.attendNow])} first.`);
  else if (f.dispositions.length && f.dispositions.length === f.pulls.length && by('unknown').length < f.dispositions.length) established.push('You chose not to give any one of them your attention first.');
  for (const d of by('set_aside')) established.push(`Set aside: ${names([d.pull])} (${WHEN_LABEL[d.when ?? 'no_time_set'].toLowerCase()}).`);
  if (by('leave_open').length) established.push(`Left open: ${names(by('leave_open').map((x) => x.pull))}.`);
  if (by('let_be').length) established.push(`You chose to do nothing for now with: ${names(by('let_be').map((x) => x.pull))}.`);
  if (f.sit) established.push(`How the arrangement sat afterwards: ${f.sit === 'unknown' ? 'you were not sure' : SIT_LABEL[f.sit].toLowerCase()}.`);
  if (f.outcome === 'nothing_pulling') established.push('You said nothing is pulling at you right now.');

  const everyPlaced = f.outcome === 'arranged' && f.dispositions.length === f.pulls.length && f.dispositions.every((d) => d.disposition !== 'unknown');
  const somePlaced = f.dispositions.some((d) => d.disposition !== 'unknown');
  const usefulNow = f.outcome === 'nothing_pulling' ? 'Nothing needs arranging. You do not have to find something to do.'
    : f.outcome === 'could_not_name' ? 'Not being able to name it is a complete answer. Nothing more is asked.'
    : !everyPlaced ? (somePlaced ? 'Part of what you named has a place. The rest is still open, and that is allowed.' : 'Nothing has been placed yet. What you named is still open, and that is allowed.')
    : f.attendNow ? 'Each thing you named now has a place, and one of them has your attention first.'
    : 'Each thing you named has a place, and you kept your attention free of any single one.';

  const unknown: string[] = [];
  if (by('set_aside').length) unknown.push('Whether anything you set aside will need attention. Mirar does not track it as a task.');
  if (by('unknown').length) unknown.push(`Where you wanted ${names(by('unknown').map((x) => x.pull))} to go.`);
  if (f.sit === 'unknown') unknown.push('How the arrangement sits.');
  if (f.outcome === 'could_not_name') unknown.push('What is pulling at you.');
  if (!unknown.length) unknown.push('How this will feel later today. Mirar has not been told.');

  return {
    practised, usefulNow, established, unknown,
    carriedForward: [f.pulls.length ? 'What you named and where each thing went, as your own choices.' : f.outcome === 'could_not_name' ? 'That it was hard to tell what was pulling at you.' : 'That you checked and nothing was pulling at you.', ...(by('set_aside').length ? [`Items you set aside can be offered back to you once, the next time you practise Attend within ${CARRY_WINDOW_DAYS} days. You can say “not right now”.`] : [])],
    notCarried: ['No reminder, due date, task or commitment is created.', 'No measure of how much was done.'],
  };
}

export const ATTEND = { id: 'attend' as const, title: 'Attend', next: attendNext, facts: attendFacts, value: attendValue };

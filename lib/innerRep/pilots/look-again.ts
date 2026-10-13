import type { Camera, LookAgainFacts, LookAgainRecord, PAnswer, PilotContext, POption, PStep, RepValue, Reweigh, Valence, Weight } from './types';

// ─── PILOT 1 · LOOK AGAIN (Reframe) ───────────────────────────────────────────
// Operation the person performs: they write what happened as a camera would record it (words stay on screen only),
// check their own sentence against that standard, name the reading they are carrying, rate how certain it feels,
// set other possible readings beside it, and re-rate. Every step is an act on their own material; nothing is graded.
// The exercise never states why anything happened. A less charitable reading is always among the alternatives, and
// "keep my reading" is an equal outcome. Leaving the reason open is a complete result.

interface Situation { id: string; label: string; interps: { id: string; label: string; focus: 'about_them' | 'about_me' | 'about_next' }[]; alts: { id: string; label: string; valence: Valence }[] }
export const SITUATIONS: Situation[] = [
  { id: 'no_reply', label: 'Someone has not replied',
    interps: [{ id: 'ignoring', label: 'They are ignoring me on purpose', focus: 'about_them' }, { id: 'said_wrong', label: 'I said something wrong', focus: 'about_me' }, { id: 'keeps_happening', label: 'This will keep happening', focus: 'about_next' }],
    alts: [{ id: 'busy', label: 'They may be busy or away from their phone', valence: 'neutral' }, { id: 'unsure_what_say', label: 'They may have read it and not know what to say', valence: 'neutral' }, { id: 'may_not_want', label: 'They may not want to reply, and I cannot tell that from this', valence: 'less_charitable' }, { id: 'unrelated', label: 'The silence may have nothing to do with me', valence: 'more_charitable' }] },
  { id: 'plan_changed', label: 'A plan changed',
    interps: [{ id: 'dont_value', label: 'They do not value my time', focus: 'about_them' }, { id: 'easy_to_drop', label: 'I am easy to drop', focus: 'about_me' }, { id: 'keeps_falling', label: 'Plans with them will keep falling through', focus: 'about_next' }],
    alts: [{ id: 'came_up', label: 'Something may have come up for them', valence: 'neutral' }, { id: 'logistics', label: 'The change may have been about logistics, not about me', valence: 'more_charitable' }, { id: 'not_priority', label: 'They may not be prioritising this, and one change does not tell me', valence: 'less_charitable' }, { id: 'single_event', label: 'I may be reading a pattern into a single event', valence: 'uncertain' }] },
  { id: 'feedback', label: 'I received feedback or a comment',
    interps: [{ id: 'not_good', label: 'They think I am not good enough', focus: 'about_them' }, { id: 'should_known', label: 'I should have known better', focus: 'about_me' }, { id: 'will_repeat', label: 'This will happen again', focus: 'about_next' }],
    alts: [{ id: 'about_work', label: 'The comment may be about this piece of work, not about me', valence: 'more_charitable' }, { id: 'blunt', label: 'They may have been rushed or blunt without meaning more', valence: 'neutral' }, { id: 'real_concern', label: 'They may have a real concern, and I cannot tell how big it is from this', valence: 'less_charitable' }, { id: 'others_differ', label: 'Other people might read it differently', valence: 'uncertain' }] },
  { id: 'unexpected', label: 'Something did not go as expected',
    interps: [{ id: 'my_fault', label: 'It went wrong because of me', focus: 'about_me' }, { id: 'their_fault', label: 'It went wrong because of someone else', focus: 'about_them' }, { id: 'how_it_goes', label: 'This is how things go for me', focus: 'about_next' }],
    alts: [{ id: 'several', label: 'Several things may have contributed', valence: 'neutral' }, { id: 'outside', label: 'Some of it may have been outside anyone’s control', valence: 'more_charitable' }, { id: 'part_mine', label: 'Part of it may really be mine, and the rest is unclear', valence: 'less_charitable' }, { id: 'one_outcome', label: 'One outcome may not say how the next one goes', valence: 'uncertain' }] },
  { id: 'something_else', label: 'Something else',
    interps: [{ id: 'about_them', label: 'It means something about them', focus: 'about_them' }, { id: 'about_me', label: 'It means something about me', focus: 'about_me' }, { id: 'about_next', label: 'It means something about what comes next', focus: 'about_next' }],
    alts: [{ id: 'unseen', label: 'There may be an explanation I cannot see', valence: 'neutral' }, { id: 'more_than_one', label: 'More than one explanation may fit', valence: 'uncertain' }, { id: 'as_it_looks', label: 'It may be what it looks like, and I cannot tell', valence: 'less_charitable' }, { id: 'no_need', label: 'I may not need to decide what it means', valence: 'more_charitable' }] },
];
const sit = (id: string | 'unknown') => SITUATIONS.find((s) => s.id === id) ?? SITUATIONS[SITUATIONS.length - 1];

const CAMERA: POption[] = [{ id: 'yes', label: 'Yes, as written' }, { id: 'partly', label: 'Partly' }, { id: 'no', label: 'No, some of it is my reading' }];
const WEIGHT: POption[] = [{ id: 'certain', label: 'Certain' }, { id: 'likely', label: 'Likely' }, { id: 'one_possibility', label: 'One possibility among others' }, { id: 'cant_tell', label: 'I can’t tell' }];
const REWEIGH: POption[] = [{ id: 'more_certain', label: 'More certain' }, { id: 'same', label: 'About the same' }, { id: 'less_certain', label: 'Less certain' }, { id: 'cant_tell', label: 'I can’t tell' }];
export const LABELS = {
  camera: Object.fromEntries(CAMERA.map((o) => [o.id, o.label])) as Record<string, string>,
  weight: Object.fromEntries(WEIGHT.map((o) => [o.id, o.label])) as Record<string, string>,
  reweigh: Object.fromEntries(REWEIGH.map((o) => [o.id, o.label])) as Record<string, string>,
  exit: { nothing: 'No. Leave it here.', leave_open: 'Leave the reason open', find_out: 'Find out something later' } as Record<string, string>,
};

const last = (a: PAnswer[], id: string) => { for (let i = a.length - 1; i >= 0; i--) if (a[i].stepId === id) return a[i]; return undefined; };
const optionOf = (a: PAnswer | undefined) => (a && a.kind === 'option' ? a.optionId : undefined);

export function lookAgainNext(ctx: PilotContext, answers: PAnswer[]): PStep | null {
  const sA = last(answers, 'situation');
  if (!sA) return { id: 'situation', type: 'choice', prompt: 'Think of one situation where the meaning is not settled. Which kind is it?', options: SITUATIONS.map((s) => ({ id: s.id, label: s.label })), allowUnknown: true, allowBack: false };
  const S = sit(optionOf(sA) ?? 'unknown');

  const obs = last(answers, 'observation');
  if (!obs) return { id: 'observation', type: 'words', prompt: 'Write what happened the way a camera would record it: only what could be seen or heard.', maxChars: 240, optional: true, saved: false, sessionOnly: true, allowBack: true };
  const wrote = obs.kind === 'words';
  let observationDone = !wrote;
  if (wrote) {
    const cam = last(answers, 'camera');
    if (!cam) return { id: 'camera', type: 'choice', prompt: 'Could a camera record this exactly as you wrote it?', options: CAMERA, allowUnknown: true, allowBack: true };
    const needsRetry = (optionOf(cam) === 'partly' || optionOf(cam) === 'no');
    if (needsRetry && !last(answers, 'observation_retry')) return { id: 'observation_retry', type: 'words', prompt: 'Try once more, keeping only what a camera would show. Or keep it as it is.', maxChars: 240, optional: true, saved: false, sessionOnly: true, allowBack: true };
    const retry = last(answers, 'observation_retry');
    if (needsRetry && retry && retry.kind === 'words' && !last(answers, 'camera_retry')) return { id: 'camera_retry', type: 'choice', prompt: 'And now: could a camera record this exactly as written?', options: CAMERA, allowUnknown: true, allowBack: true };
    observationDone = true;
  }
  void observationDone;

  const iA = last(answers, 'interpretation');
  if (!iA) return { id: 'interpretation', type: 'choice', prompt: 'Which of these is closest to the reading you are carrying? These are common readings, not predictions.', options: [...S.interps.map((i) => ({ id: i.id, label: i.label })), { id: 'none_yet', label: 'I am not carrying a reading yet' }], allowUnknown: true, allowBack: true };
  const carrying = optionOf(iA) && optionOf(iA) !== 'none_yet';
  if (carrying) {
    if (!last(answers, 'weight')) return { id: 'weight', type: 'choice', prompt: 'Right now, how does this reading feel to you?', options: WEIGHT, allowUnknown: true, allowBack: true };
    if (!last(answers, 'alternatives')) return { id: 'alternatives', type: 'multi', prompt: 'Here are other readings that could also fit what happened. Choose any that fit, or none.', options: S.alts.map((x) => ({ id: x.id, label: x.label })), max: S.alts.length, noneLabel: 'None of these fit. I am keeping my reading.', allowUnknown: true, allowBack: true };
    if (!last(answers, 'reweigh')) return { id: 'reweigh', type: 'choice', prompt: 'Now, how does your first reading sit?', options: REWEIGH, allowUnknown: true, allowBack: true };
  }
  if (!last(answers, 'exit')) {
    const options: POption[] = [{ id: 'nothing', label: LABELS.exit.nothing }, { id: 'leave_open', label: LABELS.exit.leave_open }];
    if (ctx.caps.commitments) options.push({ id: 'find_out', label: LABELS.exit.find_out });
    return { id: 'exit', type: 'choice', prompt: 'Do you want to do anything with this?', options, allowUnknown: true, allowBack: carrying ? true : true };
  }
  return null;
}

export function lookAgainFacts(answers: PAnswer[]): LookAgainFacts {
  const sA = last(answers, 'situation'); const sid = optionOf(sA) ?? (sA ? 'unknown' : 'unknown'); const S = sit(sid);
  const obs = last(answers, 'observation');
  const cams: Camera[] = []; for (const id of ['camera', 'camera_retry']) { const c = last(answers, id); if (c) cams.push(c.kind === 'option' ? (c.optionId as Camera) : 'unknown'); }
  const iA = last(answers, 'interpretation');
  let interpretation: LookAgainFacts['interpretation'] = null;
  if (iA) { if (iA.kind === 'unknown') interpretation = 'unknown'; else if (iA.kind === 'option') { const f = S.interps.find((i) => i.id === iA.optionId); interpretation = f ? { id: f.id, focus: f.focus } : 'none_yet'; } }
  const w = last(answers, 'weight'); const al = last(answers, 'alternatives'); const rw = last(answers, 'reweigh'); const ex = last(answers, 'exit');
  const chosen = al && al.kind === 'options' ? al.optionIds : [];
  return {
    situation: sA ? sid : 'unknown',
    observation: obs && obs.kind === 'words' ? 'written' : 'none',
    cameraChecks: cams, retried: !!last(answers, 'observation_retry') && last(answers, 'observation_retry')!.kind === 'words',
    interpretation,
    weightBefore: w ? (w.kind === 'option' ? (w.optionId as Weight) : 'unknown') : null,
    alternativesOffered: al ? S.alts.length : 0,
    alternativesChosen: chosen,
    valencesChosen: chosen.map((id) => S.alts.find((x) => x.id === id)!.valence),
    reweigh: rw ? (rw.kind === 'option' ? (rw.optionId as Reweigh) : 'unknown') : null,
    exit: ex ? (ex.kind === 'option' ? (ex.optionId as 'nothing' | 'leave_open' | 'find_out') : 'unspecified') : null,
  };
}

const listJoin = (xs: string[]) => xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join('; ') + '; and ' + xs[xs.length - 1];

/** The five-question standard, computed only from the stored record. */
export function lookAgainValue(rec: LookAgainRecord): RepValue {
  const f = rec.facts; const S = sit(f.situation);
  const practised: string[] = [];
  if (f.observation === 'written') practised.push('Writing what happened separately from how you read it, and checking that sentence against what a camera could record');
  if (f.interpretation && typeof f.interpretation === 'object') practised.push('Naming the reading you were carrying as a reading, and noting how certain it felt');
  if (f.alternativesChosen.length) practised.push(`Setting ${f.alternativesChosen.length === 1 ? 'another possibility' : 'other possibilities'} beside your reading`);
  else if (f.alternativesOffered) practised.push('Looking at other possible readings and deciding which, if any, fit');
  if (!practised.length) practised.push('Starting an exercise and stopping where it stopped being useful');

  const established: string[] = [];
  if (f.situation !== 'unknown') established.push(`The situation you chose: ${S.label}.`);
  if (f.cameraChecks.length) { const c = f.cameraChecks[f.cameraChecks.length - 1]; established.push(`Your own check of your wording against a camera: ${c === 'unknown' ? 'you were not sure' : LABELS.camera[c]}.`); }
  if (f.interpretation && typeof f.interpretation === 'object') { const it = S.interps.find((i) => i.id === (f.interpretation as { id: string }).id)!; established.push(`The reading you named: “${it.label}”.`); }
  if (f.weightBefore) established.push(`How it felt before looking at alternatives: ${f.weightBefore === 'unknown' ? 'you were not sure' : LABELS.weight[f.weightBefore]}.`);
  if (f.alternativesChosen.length) established.push(`What you set beside it: ${listJoin(f.alternativesChosen.map((id) => `“${S.alts.find((x) => x.id === id)!.label}”`))}.`);
  else if (f.alternativesOffered) established.push('You looked at the other possibilities and chose none of them.');
  if (f.reweigh) established.push(`How your first reading sat afterwards: ${f.reweigh === 'unknown' ? 'you were not sure' : LABELS.reweigh[f.reweigh]}.`);

  const usefulNow = f.observation === 'written' && f.interpretation && typeof f.interpretation === 'object'
    ? 'What happened and your reading of it are now named separately, so you can come back to either one on its own.'
    : f.interpretation && typeof f.interpretation === 'object' ? 'Your reading is named as a reading, with the other possibilities you saw beside it.'
    : f.observation === 'written' ? 'What happened is written apart from any reading of it.'
    : 'Nothing needs to be settled. Stopping here is a complete result.';

  const unknown = ['Why it happened: this exercise does not establish a reason.'];
  if (f.interpretation === 'none_yet' || f.interpretation === 'unknown') unknown.push('Which reading, if any, you are carrying.');
  if (f.reweigh === 'cant_tell' || f.reweigh === 'unknown') unknown.push('How your first reading sits after looking at the others.');
  if (f.weightBefore === 'cant_tell' || f.weightBefore === 'unknown') unknown.push('How certain the reading felt.');
  if (f.exit === 'leave_open') unknown.push('The reason, which you chose to leave open.');

  return {
    practised, usefulNow, established, unknown,
    carriedForward: ['The situation type, the reading you named, how it felt before and after, and what you set beside it, as your own choices.'],
    notCarried: ['Anything you typed. It was shown on this screen only.', 'Any judgement about which reading is right.'],
  };
}

export const LOOK_AGAIN = { id: 'look_again' as const, title: 'Look Again', next: lookAgainNext, facts: lookAgainFacts, value: lookAgainValue };

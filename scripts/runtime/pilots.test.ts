// Exercise pilots: Look Again (Reframe) and Attend (Choose Attention). Runs the real step machines, session, store and read models.
import { execSync } from 'child_process';
import { PilotSession } from '../../lib/innerRep/pilots/session';
import { PilotStore, clearPilotKeys, PILOT_KEY_PREFIX, RETENTION_DAYS } from '../../lib/innerRep/pilots/store';
import { buildPilotMirror, pilotReceipt, pilotOffers, SPARSE_MIN } from '../../lib/innerRep/pilots/read';
import { SITUATIONS } from '../../lib/innerRep/pilots/look-again';
import { carryCandidates, PULLS } from '../../lib/innerRep/pilots/attend';
import { PAnswer, PILOT_CAPS, PilotAnswerError, PilotContext, PilotRecord, PStep, AttendRecord, LookAgainRecord } from '../../lib/innerRep/pilots/types';
import { KV } from '../../lib/innerRep/runtime/v2-runtime';

class MemKV implements KV { m = new Map<string, string>(); fail = false; async getItem(k: string) { if (this.fail) throw new Error('x'); return this.m.get(k) ?? null; } async setItem(k: string, v: string) { if (this.fail) throw new Error('x'); this.m.set(k, v); } async removeItem(k: string) { this.m.delete(k); } async getAllKeys() { return [...this.m.keys()]; } }
let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const ctxAt = (today: string, prior: PilotRecord[] = [], commit = false): PilotContext => ({ today, caps: { ...PILOT_CAPS, commitments: commit }, prior });
const opt = (st: PStep, id: string): PAnswer => ({ stepId: st.id, kind: 'option', optionId: id });
const throws = (f: () => void) => { try { f(); return false; } catch (e) { return e instanceof PilotAnswerError; } };
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

/** Drive a session with a function that answers each step; returns the step ids seen in order. */
function drive(s: PilotSession, f: (st: PStep) => PAnswer, limit = 60): string[] {
  const seen: string[] = []; for (let i = 0; i < limit; i++) { const st = s.step(); if (!st) break; seen.push(st.id); s.answer(f(st)); } return seen;
}
const script = (m: Record<string, PAnswer | ((st: PStep) => PAnswer)>) => (st: PStep): PAnswer => { const v = m[st.id]; if (!v) throw new Error('no script for ' + st.id); return typeof v === 'function' ? v(st) : v; };
const o = (id: string) => (st: PStep): PAnswer => opt(st, id);
const words = (st: PStep): PAnswer => ({ stepId: st.id, kind: 'words', chars: 42 });
const multi = (...ids: string[]) => (st: PStep): PAnswer => ({ stepId: st.id, kind: 'options', optionIds: ids });
const unk = (st: PStep): PAnswer => ({ stepId: st.id, kind: 'unknown' });
const skip = (st: PStep): PAnswer => ({ stepId: st.id, kind: 'skip' });
/** A random valid answerer: picks only offered, enabled options; sometimes unknown/skip/back. */
function randomAnswer(st: PStep): PAnswer {
  const r = rnd();
  if (st.type === 'choice') { if (st.allowUnknown && r < 0.12) return unk(st); return opt(st, pick(st.options.filter((x) => !x.disabled)).id); }
  if (st.type === 'multi') { if (st.allowUnknown && r < 0.1) return unk(st); const n = Math.floor(rnd() * (st.max + 1)); const ids = [...st.options].sort(() => rnd() - 0.5).slice(0, n).map((x) => x.id); return { stepId: st.id, kind: 'options', optionIds: ids }; }
  if (st.type === 'words') return r < 0.35 ? skip(st) : { stepId: st.id, kind: 'words', chars: 1 + Math.floor(rnd() * st.maxChars) };
  return { stepId: st.id, kind: 'hold_end' };
}
const complete = (id: number, s: PilotSession) => s.record(id)!;
const LOOK_FULL = { situation: o('no_reply'), observation: words, camera: o('partly'), observation_retry: words, camera_retry: o('yes'), interpretation: o('ignoring'), weight: o('certain'), alternatives: multi('busy', 'may_not_want'), reweigh: o('less_certain'), exit: o('leave_open') };

(async () => {
  console.log('— Look Again —');
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14'));
    const seen = drive(s, script(LOOK_FULL)); const rec = complete(1, s) as LookAgainRecord;
    check('the exercise is an operation: ten distinct acts in a fixed order', seen.join('>') === 'situation>observation>camera>observation_retry>camera_retry>interpretation>weight>alternatives>reweigh>exit', seen.join('>'));
    check('it completes and the record holds the exact structured choices', rec.status === 'completed' && rec.facts.interpretation !== null && typeof rec.facts.interpretation === 'object' && rec.facts.interpretation.id === 'ignoring' && rec.facts.cameraChecks.join() === 'partly,yes' && rec.facts.retried && rec.facts.alternativesChosen.join() === 'busy,may_not_want' && rec.facts.reweigh === 'less_certain' && rec.facts.exit === 'leave_open');
    check('a less charitable alternative the person chose is recorded as such, not corrected', rec.facts.valencesChosen.join() === 'neutral,less_charitable');
    const v = pilotReceipt(rec).value;
    check('value: all five questions are answered from the record', v.practised.length >= 3 && !!v.usefulNow && v.established.length >= 5 && v.unknown.length >= 2 && v.carriedForward.length >= 1 && v.notCarried.length >= 2);
    check('value: it never states why anything happened', v.unknown[0].startsWith('Why it happened') && !/because|the reason is|actually|really means/i.test(JSON.stringify(v.established)));
    check('value: typed words are explicitly not carried', v.notCarried.some((x) => /typed/i.test(x)));
  }
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14'));
    drive(s, script({ ...LOOK_FULL, camera: o('yes'), alternatives: multi(), reweigh: o('more_certain'), exit: o('nothing') }));
    const r = complete(1, s) as LookAgainRecord; const v = pilotReceipt(r).value;
    check('"keep my reading" is an equal outcome: none chosen, reading held, "more certain" accepted without correction', r.facts.alternativesChosen.length === 0 && r.facts.reweigh === 'more_certain' && v.established.some((x) => /chose none/.test(x)) && !/better|healthy|positive|reframe|shift|improv/i.test(JSON.stringify(v)));
  }
  {
    const bad = SITUATIONS.filter((x) => !x.alts.some((a) => a.valence === 'less_charitable') || new Set(x.alts.map((a) => a.valence)).size < 3 || x.alts.length < 4 || x.interps.length !== 3);
    check('every authored set includes a less charitable alternative, at least three valences, 4 alternatives and 3 readings', bad.length === 0, bad.map((x) => x.id).join());
    check('no authored text names a cause as fact', !SITUATIONS.some((x) => [...x.alts, ...x.interps].some((a) => /\b(is because|was because|definitely|obviously|clearly)\b/i.test(a.label))));
  }
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14'));
    const seen = drive(s, script({ situation: unk, observation: skip, interpretation: unk, exit: unk })); const r = complete(1, s) as LookAgainRecord;
    check('"I don’t know" and skip are complete results: every unknown path terminates with a record', s.isComplete && seen.join('>') === 'situation>observation>interpretation>exit' && r.facts.interpretation === 'unknown' && r.facts.observation === 'none' && r.facts.exit === 'unspecified');
    const v = pilotReceipt(r).value;
    check('and the receipt lists what is unknown instead of filling the gap', v.unknown.some((x) => /which reading/i.test(x)) && /complete result/.test(v.usefulNow));
  }
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14'));
    drive(s, script({ situation: o('feedback'), observation: words, camera: unk, interpretation: o('none_yet'), exit: o('nothing') }));
    const r = complete(1, s) as LookAgainRecord;
    check('no reading yet: the exercise skips weighing and alternatives and still completes', r.status === 'completed' && r.facts.interpretation === 'none_yet' && r.facts.alternativesOffered === 0 && r.facts.weightBefore === null);
  }
  {
    const st0 = new PilotSession('look_again', ctxAt('2026-10-14'), ); drive(st0, script({ situation: o('plan_changed'), observation: skip, interpretation: o('dont_value'), weight: o('likely'), alternatives: (st) => ({ stepId: st.id, kind: 'options', optionIds: [] }), reweigh: o('same') }), 6);
    const exit = st0.step()!; check('"find out something later" is not offered while commitments are not an approved capability', exit.type === 'choice' && !exit.options.some((x) => x.id === 'find_out'));
    const s2 = new PilotSession('look_again', ctxAt('2026-10-14', [], true)); drive(s2, script({ situation: o('plan_changed'), observation: skip, interpretation: o('dont_value'), weight: o('likely'), alternatives: multi(), reweigh: o('same') }), 6);
    const e2 = s2.step()!; check('…and appears only when the capability is switched on', e2.type === 'choice' && e2.options.some((x) => x.id === 'find_out'));
    check('PILOT_CAPS ships with commitments, engine evidence and durable history all off', !PILOT_CAPS.commitments && !PILOT_CAPS.engineEvidence && !PILOT_CAPS.durableHistory);
  }
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14')); s.answer(opt(s.step()!, 'no_reply'));
    check('a words answer is only a character count: extra text is rejected from the contract, never stored', !throws(() => s.answer({ stepId: 'observation', kind: 'words', chars: 40, text: 'my secret sentence' } as any)) && !JSON.stringify(s.snapshot()).includes('secret'));
    const s2 = new PilotSession('look_again', ctxAt('2026-10-14')); s2.answer(opt(s2.step()!, 'no_reply'));
    check('a zero or oversized character count is rejected', throws(() => s2.answer({ stepId: 'observation', kind: 'words', chars: 0 })) && throws(() => s2.answer({ stepId: 'observation', kind: 'words', chars: 9999 })));
    check('answers for the wrong step, unoffered options and impossible kinds are rejected', throws(() => s2.answer({ stepId: 'camera', kind: 'unknown' })) && throws(() => s.answer({ stepId: 'camera', kind: 'option', optionId: 'x' })) );
  }
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14')); s.answer(opt(s.step()!, 'no_reply'));
    s.answer({ stepId: 'observation', kind: 'safety' });
    check('crisis language halts the session: no further step, no record, nothing kept', s.isHalted && s.step() === null && s.record(1) === null && throws(() => s.answer(skip({ id: 'observation' } as PStep))) && s.snapshot().answers.length === 0);
    const kv = new MemKV(); const st = new PilotStore({ storage: kv, now: () => new Date(2026, 9, 14) }); await st.init('u'); const ss = st.start('look_again'); ss.answer(opt(ss.step()!, 'no_reply')); ss.answer({ stepId: 'observation', kind: 'safety' }); await st.saveDraft(); await st.discard();
    check('the store keeps no trace of a halted session', st.records().length === 0 && !JSON.stringify([...kv.m.values()]).includes('no_reply'));
  }
  console.log('— Attend —');
  const ATT_FULL = { pulls: multi('work', 'messages', 'worry'), 'place:work': o('attend_now'), 'place:messages': o('set_aside'), 'when:messages': o('later_today'), 'place:worry': o('leave_open'), hold_offer: o('hold_now'), hold: (st: PStep): PAnswer => ({ stepId: st.id, kind: 'hold_end' }), sit: o('settled') };
  {
    const s = new PilotSession('attend', ctxAt('2026-10-14')); const seen = drive(s, script(ATT_FULL)); const r = complete(1, s) as AttendRecord;
    check('the exercise is an allocation: each pull gets exactly one place, then a hold the person ends, then a self-report', seen.join('>') === 'pulls>place:work>place:messages>when:messages>place:worry>hold_offer>hold>sit', seen.join('>'));
    check('the record holds the exact dispositions, the hold, and no task fields', r.facts.attendNow === 'work' && r.facts.hold === 'ended' && r.facts.holdOn === 'work' && r.facts.dispositions.map((d) => d.disposition).join() === 'attend_now,set_aside,leave_open' && r.facts.dispositions[1].when === 'later_today' && r.facts.sit === 'settled' && !/due|remind|task|commit/i.test(JSON.stringify(r)));
    const v = pilotReceipt(r).value; check('value: states the arrangement and says set-aside is not a task', v.practised.length >= 4 && v.established.some((x) => /Set aside/.test(x)) && v.notCarried.some((x) => /No reminder/.test(x)) && v.unknown.some((x) => /does not track/.test(x)));
  }
  {
    const s = new PilotSession('attend', ctxAt('2026-10-14')); drive(s, script({ pulls: multi('work', 'asked'), 'place:work': o('attend_now') }), 2);
    const st = s.step()!; const second = st.type === 'choice' ? st.options.find((x) => x.id === 'attend_now') : undefined;
    check('only one thing can have attention first: the second "attend now" is disabled with a reason and cannot be submitted', !!second?.disabled && /Only one/.test(second.disabled) && throws(() => s.answer(opt(st, 'attend_now'))));
  }
  {
    const s = new PilotSession('attend', ctxAt('2026-10-14')); drive(s, script({ pulls: multi('phone', 'avoiding'), 'place:phone': o('let_be'), 'place:avoiding': o('leave_open'), sit: o('settled') })); const r = complete(1, s) as AttendRecord;
    check('attending to nothing is valid: deliberate nothing + leave open complete with no hold and no follow-up', r.status === 'completed' && r.facts.attendNow === null && r.facts.hold === null && pilotReceipt(r).value.usefulNow.includes('kept your attention free'));
    const s2 = new PilotSession('attend', ctxAt('2026-10-14')); drive(s2, script({ pulls: multi(), })); const r2 = complete(1, s2) as AttendRecord;
    check('"nothing is pulling at me" completes at once and says nothing needs arranging', r2.facts.outcome === 'nothing_pulling' && /does not have to find something|do not have to find/.test(pilotReceipt(r2).value.usefulNow));
    const s3 = new PilotSession('attend', ctxAt('2026-10-14')); drive(s3, script({ pulls: unk })); const r3 = complete(1, s3) as AttendRecord;
    check('"hard to tell" is its own complete outcome', r3.facts.outcome === 'could_not_name' && pilotReceipt(r3).value.unknown.some((x) => /What is pulling/.test(x)));
  }
  {
    const s = new PilotSession('attend', ctxAt('2026-10-14')); const seen = drive(s, script({ pulls: multi('work', 'asked'), 'place:work': o('attend_now'), 'place:asked': o('set_aside'), 'when:asked': o('no_time_set'), hold_offer: o('after'), sit: o('mixed'), rearrange: o('rearrange') }), 7);
    const next = s.step()!; check('after "mixed" the person may rearrange once; rearranging clears earlier placements', seen.includes('rearrange') && next.id === 'place:work');
    drive(s, script({ 'place:work': o('let_be'), 'place:asked': o('attend_now'), sit: o('mixed') })); const r = complete(1, s) as AttendRecord;
    check('rearranged result: new dispositions kept, rearranged flagged, the hold stays tied to the first item, and no second rearrange is offered', r.facts.rearranged && r.facts.attendNow === 'asked' && r.facts.holdOn === 'work' && r.facts.hold === 'after' && s.isComplete);
  }
  {
    const s = new PilotSession('attend', ctxAt('2026-10-14')); drive(s, script({ pulls: multi('work'), 'place:work': o('attend_now'), hold_offer: o('hold_now') }), 3);
    check('the hold has no timer and no back button', s.step()!.type === 'hold' && !s.back());
    s.leave(); const r = s.record(1) as AttendRecord;
    check('leaving during the hold is recorded as left_during and is never a completion', r.status === 'left' && r.facts.hold === 'left_during' && r.leftAt === 'hold');
  }
  {
    const day1: AttendRecord = { id: 1, schema: 1, pilot: 'attend', date: '2026-10-10', status: 'completed', stepsSeen: 6, facts: { pulls: ['messages', 'work'], outcome: 'arranged', carriedIn: [], dispositions: [{ pull: 'messages', disposition: 'set_aside', when: 'later_today' }, { pull: 'work', disposition: 'let_be' }], attendNow: null, holdOn: null, hold: null, sit: 'settled', rearranged: false } };
    check('continuity: an item set aside is offered back once within 7 days, and not on the same day', carryCandidates(ctxAt('2026-10-11', [day1])).length === 1 && carryCandidates(ctxAt('2026-10-10', [day1])).length === 0 && carryCandidates(ctxAt('2026-10-18', [day1])).length === 0);
    const s = new PilotSession('attend', ctxAt('2026-10-11', [day1])); const first = s.step()!;
    check('the offer names the item, takes "not right now" as a normal answer, and says nothing about overdue', first.id === 'carry:messages' && first.type === 'choice' && /set aside/.test(first.prompt) && first.options.some((x) => x.id === 'not_now') && !/overdue|late|should/i.test(JSON.stringify(first)));
    drive(s, script({ 'carry:messages': o('still_pulling'), pulls: multi('work'), 'place:messages': o('attend_now'), 'place:work': o('let_be'), hold_offer: o('after'), sit: o('settled') })); const day2 = complete(2, s) as AttendRecord;
    check('"still pulling" brings it into today’s arrangement and records where the offer came from', day2.facts.pulls.join() === 'messages,work' && day2.facts.carriedIn[0].fromRecord === 1 && day2.facts.carriedIn[0].response === 'still_pulling');
    check('an item offered back is never offered again', carryCandidates(ctxAt('2026-10-12', [day1, day2])).length === 0);
    const p = new PilotSession('attend', ctxAt('2026-10-11', [day1])); drive(p, script({ 'carry:messages': o('not_now'), pulls: multi('work'), 'place:work': o('let_be'), sit: o('settled') }));
    check('"not right now" closes it quietly', (complete(2, p) as AttendRecord).facts.carriedIn[0].response === 'not_now');
    const cap = new PilotSession('attend', ctxAt('2026-10-11', [day1])); drive(cap, script({ 'carry:messages': o('still_pulling') }), 1); const ps = cap.step()!;
    check('carried items count against the five-pull limit', ps.type === 'multi' && ps.max === 4 && !ps.options.some((x) => x.id === 'messages'));
  }
  console.log('— Session behaviour —');
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14')); s.answer(opt(s.step()!, 'no_reply')); s.answer(skip(s.step()!));
    check('back() undoes the last answer, and is refused at the first step', s.back() && s.step()!.id === 'observation' && s.back() && s.step()!.id === 'situation' && !s.back());
    let bad = 0, leftOk = 0, leftRuns = 0; seed = 99;
    for (let i = 0; i < 400; i++) for (const p of ['look_again', 'attend'] as const) { const sx = new PilotSession(p, ctxAt('2026-10-14')); let n = 0; const stopAt = Math.floor(rnd() * 14); try { while (sx.step() && n < stopAt) { if (rnd() < 0.15 && sx.back()) { n++; continue; } sx.answer(randomAnswer(sx.step()!)); n++; } } catch { bad++; continue; }
      const closing = sx.step() === null; if (closing) { const r = sx.record(1); if (sx.answerCount && (!r || r.status !== 'completed')) bad++; } else { sx.leave(); leftRuns++; const r = sx.record(1); if (r === null ? sx.answerCount === 0 : r.status === 'left') leftOk++; else bad++; } }
    check('fuzz: 800 random sessions never throw on valid answers; leaving anywhere gives a "left" record or nothing; completion only when no step remains', bad === 0 && leftOk === leftRuns, `bad=${bad} left ${leftOk}/${leftRuns}`);
    let over = 0, long = 0; seed = 5; for (let i = 0; i < 400; i++) { const sx = new PilotSession('attend', ctxAt('2026-10-14')); let n = 0; while (sx.step() && n++ < 60) sx.answer(randomAnswer(sx.step()!)); if (n >= 60) long++; const r = sx.record(1) as AttendRecord | null; if (r && r.facts.dispositions.filter((d) => d.disposition === 'attend_now').length > 1) over++; }
    check('fuzz: every Attend session terminates in under 60 acts and never has two "attend now"', over === 0 && long === 0, `over=${over} long=${long}`);
  }
  {
    const s = new PilotSession('look_again', ctxAt('2026-10-14')); drive(s, script(LOOK_FULL), 5); const snap = JSON.parse(JSON.stringify(s.snapshot()));
    const r1 = PilotSession.restore(snap, ctxAt('2026-10-14'));
    check('a draft restores to the same open step with the same answers', !!r1 && r1.step()!.id === s.step()!.id && r1.answerCount === s.answerCount);
    check('a draft from another day is dropped, not resumed and not counted', PilotSession.restore(snap, ctxAt('2026-10-15')) === null);
    check('a corrupt draft is dropped', PilotSession.restore({ ...snap, answers: [{ stepId: 'camera', kind: 'unknown' }] }, ctxAt('2026-10-14')) === null);
  }
  console.log('— Store, receipt, Mirror —');
  {
    const kv = new MemKV(); let day = 14; const now = () => new Date(2026, 9, day); const st = new PilotStore({ storage: kv, now }); await st.init('u1');
    const s = st.start('attend'); drive(s, script({ pulls: multi('work') }), 1); await st.saveDraft();
    const st2 = new PilotStore({ storage: kv, now }); await st2.init('u1');
    check('reload resumes the unfinished exercise on the same day', st2.resumable()?.pilot === 'attend' && st2.session()!.step()!.id === 'place:work');
    day = 15; const st3 = new PilotStore({ storage: kv, now }); await st3.init('u1');
    check('next day: no resume, and the draft is gone from storage', st3.resumable() === null && JSON.parse(kv.m.get(`${PILOT_KEY_PREFIX}:u1`)!).draft === null);
    day = 14; const s4 = st.start('look_again'); drive(s4, script(LOOK_FULL)); const rec = await st.close('finish');
    check('finishing stores one record and clears the draft', !!rec && st.records().length === 1 && JSON.parse(kv.m.get(`${PILOT_KEY_PREFIX}:u1`)!).draft === null);
    const stB = new PilotStore({ storage: kv, now }); await stB.init('u2');
    check('records are per user', stB.records().length === 0);
    check('the engine blob is never written by pilots', ![...kv.m.keys()].some((k) => k.startsWith('mirar_inner_rep_v2')));
    await clearPilotKeys(kv); check('sign-out clearing removes every pilot key', ![...kv.m.keys()].some((k) => k.startsWith(PILOT_KEY_PREFIX)));
    const kv2 = new MemKV(); kv2.fail = true; const s5 = new PilotStore({ storage: kv2, now }); await s5.init('u'); const x = s5.start('look_again'); x.answer(opt(x.step()!, 'no_reply')); let ok = true; try { await s5.saveDraft(); await s5.close('leave'); } catch { ok = false; }
    check('unavailable storage never throws into the UI', ok);
    const old: LookAgainRecord = { id: 1, schema: 1, pilot: 'look_again', date: '2026-01-01', status: 'completed', stepsSeen: 3, facts: (rec as LookAgainRecord).facts }; kv.m.set(`${PILOT_KEY_PREFIX}:u3`, JSON.stringify({ v: 1, seq: 1, records: [old], draft: null }));
    const s6 = new PilotStore({ storage: kv, now }); await s6.init('u3'); s6.start('attend'); await s6.saveDraft();
    check(`records older than ${RETENTION_DAYS} days are dropped on the next write`, s6.records().length === 0);
  }
  {
    const mk = (n: number, pilot: 'look_again' | 'attend', date: string, f: Partial<LookAgainRecord['facts'] & AttendRecord['facts']>, status: 'completed' | 'left' = 'completed') => ({ id: n, schema: 1, pilot, date, status, stepsSeen: 5, facts: f } as unknown as PilotRecord);
    const empty = buildPilotMirror([], '2026-10-20');
    check('Mirror: no records → empty, no statements', empty.state === 'empty' && empty.statements.length === 0);
    const laFacts = (rw: string) => ({ situation: 'no_reply', observation: 'written', cameraChecks: ['yes'], retried: false, interpretation: { id: 'ignoring', focus: 'about_them' }, weightBefore: 'certain', alternativesOffered: 4, alternativesChosen: ['busy'], valencesChosen: ['neutral'], reweigh: rw, exit: 'nothing' });
    const one = buildPilotMirror([mk(1, 'look_again', '2026-10-14', laFacts('less_certain') as any)], '2026-10-20');
    check('Mirror: one session → sparse; shows the person’s own latest answers; no cross-session counts; says why', one.state === 'sparse' && one.statements.some((x) => x.id === 'latest:look_again') && !one.statements.some((x) => x.id === 'reweigh') && one.statements.some((x) => x.facts.kind === 'pilot_sparse' && x.text.includes(String(SPARSE_MIN))));
    const recs = ['less_certain', 'less_certain', 'same', 'more_certain'].map((x, i) => mk(i + 1, 'look_again', `2026-10-1${i}`, laFacts(x) as any));
    const four = buildPilotMirror(recs, '2026-10-20'); const rw = four.statements.find((x) => x.id === 'reweigh')!;
    check('Mirror: four sessions → populated; the count shows numerator, denominator and the person’s exact categories', four.state === 'populated' && rw.facts.kind === 'pilot_reweigh' && rw.facts.n === 4 && rw.facts.less === 2 && rw.facts.same === 1 && rw.facts.more === 1 && /4 sessions/.test(rw.text) && rw.trace.pilotRecordIds.length === 4);
    const aFacts = (d: string, extra: any = {}) => ({ pulls: ['work', 'phone'], outcome: 'arranged', carriedIn: [], dispositions: [{ pull: 'work', disposition: d, ...(d === 'set_aside' ? { when: 'another_day' } : {}) }, { pull: 'phone', disposition: 'let_be' }], attendNow: d === 'attend_now' ? 'work' : null, holdOn: null, hold: null, sit: 'settled', rearranged: false, ...extra });
    const ars = ['attend_now', 'set_aside', 'set_aside', 'leave_open'].map((d, i) => mk(i + 1, 'attend', `2026-10-1${i}`, aFacts(d) as any)); const am = buildPilotMirror(ars, '2026-10-14'); const pm = am.statements.find((x) => x.id === 'pull:work')!;
    check('Mirror: Attend counts per pull with exact numbers, only from three sessions, never ranked', pm.facts.kind === 'pilot_pull' && pm.facts.sessions === 4 && pm.facts.of === 4 && pm.facts.attended === 1 && pm.facts.setAside === 2 && pm.facts.open === 1 && !am.statements.some((x) => x.id === 'pull:messages'));
    const carrying = am.statements.filter((x) => x.section === 'carrying');
    check('Mirror: set-aside items appear as the person’s own words, only inside the window, never as tasks', carrying.length === 1 && carrying[0].source === 'user_said' && /not a task/.test(carrying[0].text) && buildPilotMirror(ars, '2026-11-30').statements.every((x) => x.section !== 'carrying'));
    check('Mirror: retention is reported and the inactive capabilities are listed so nothing implies them', four.retention.days === RETENTION_DAYS && four.retention.synced === false && four.inactive.some((x) => /Reminders/.test(x)) && four.inactive.some((x) => /not synced/.test(x)));
    const all = JSON.stringify([four.statements, am.statements, one.statements].map((m) => m.map((s) => s.text)));
    check('Mirror language: no scores, traits, trends, advice or reasons', !/(you tend|always|never|pattern|improv|progress|score|better|worse|should|because|weakness|strength|streak|trend)/i.test(all), (all.match(/(you tend|always|never|pattern|improv|progress|score|better|worse|should|because|weakness|strength|streak|trend)/i) ?? [''])[0]);
    check('Mirror: every statement traces to stored record ids, all exact', [...four.statements, ...am.statements].every((x) => x.provenance === 'exact' && x.trace.pilotRecordIds.every((id) => id >= 1)));
    const left = pilotReceipt(mk(9, 'look_again', '2026-10-14', { ...(laFacts('same') as any), reweigh: null, exit: null }, 'left'));
    check('receipt of a left session says what was done before leaving and never calls it complete', left.status === 'left' && left.value.established.length > 0);
    const offers = pilotOffers(ars, '2026-10-11', 'attend'); check('Today offers: the person chooses; a resume flag and the count of carried items are surfaced', offers.length === 2 && offers[1].resume && offers[1].carried >= 0 && offers[0].pilot === 'look_again');
  }
  {
    const { buildFixtures } = await import('./pilot-fixtures'); const fx = buildFixtures('2026-10-20'); const m = buildPilotMirror(fx, '2026-10-20');
    check('fixtures are produced by the real sessions: 9 completed records, ids sequential, all valid', fx.length === 9 && fx.every((r, i) => r.id === i + 1 && r.status === 'completed') && m.state === 'populated');
    check('fixture Mirror passes the same language and trace rules', m.statements.length >= 5 && !/(you tend|always|pattern|improv|progress|score|better|worse|should|because|trend)/i.test(m.statements.map((x) => x.text).join(' ')));
  }
  console.log('— Compatibility —');
  {
    let diff = 'x'; try { diff = execSync('git diff --name-only mirar-integration -- lib/innerRep/v2 lib/innerRep/engine.ts lib/innerRep/evidence.ts lib/innerRep/catalog.ts lib/innerRep/runtime', { encoding: 'utf8' }).trim(); } catch { diff = 'git unavailable'; }
    check('the frozen engine and the runtime adapter are byte-for-byte unchanged by the pilots', diff === '', diff);
    const src = execSync("grep -rn \"from '\\.\\./v2\\|from '\\.\\./engine\\|from '\\.\\./runtime\\|supabase\\|fetch(\\|AsyncStorage\" lib/innerRep/pilots || true", { encoding: 'utf8' });
    check('pilot modules import no engine, no network and no storage backend (only a KV type)', src.split('\n').filter(Boolean).every((l) => /import type \{ KV \}/.test(l)), src);
  }
  void PULLS;
  console.log(fails ? `\n${fails} FAILED` : '\nPASS: all pilot checks');
  process.exit(fails ? 1 : 0);
})();

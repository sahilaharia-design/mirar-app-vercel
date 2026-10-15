// Option B local prototype: event contract, validator, recorder, replay equivalence. NON-PERSISTENT: in-memory only, no network,
// no Supabase. The SQL side is tested separately by scripts/runtime/backup-sql.test.ts against an in-process PostgreSQL.
import { ENGINE_VERSION, PROFILES, VOCAB, at, runUser, sameJSON, noTrace, noIds } from './backup-fixtures';
import { validateEvent, BackupEvent } from '../../lib/innerRep/backup/events';
import { replayFresh, ReplayDriftError } from '../../lib/innerRep/backup/replay';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };

(async () => {
  console.log('— Event contract and whitelist —');
  {
    const good: BackupEvent = { kind: 'rep_completed', day: '2026-06-02', engine: ENGINE_VERSION, template: 'foc_attention', frame: 'base', answers: [{ s: 'primary', k: 'option', o: 'phone' }] };
    check('a well-formed event passes, with and without the catalog vocabulary', validateEvent(good).ok && validateEvent(good, VOCAB).ok, JSON.stringify(validateEvent(good, VOCAB)));
    const cases: [string, any][] = [
      ['free text in an option id', { ...good, answers: [{ s: 'primary', k: 'option', o: 'I felt awful at work today' }] }],
      ['an id-shaped but unknown option', { ...good, answers: [{ s: 'primary', k: 'option', o: 'iamveryanxious' }] }],
      ['an extra top-level key (a note)', { ...good, note: 'hello' }],
      ['an extra key inside an answer', { ...good, answers: [{ s: 'primary', k: 'option', o: 'phone', text: 'x' }] }],
      ['a time of day instead of a date', { ...good, day: '2026-06-02T10:15:00Z' }],
      ['an unknown template id', { ...good, template: 'made_up_template' }],
      ['a words answer carrying a payload', { ...good, answers: [{ s: 'words', k: 'words', o: 'private words' }] }],
      ['no answers', { ...good, answers: [] }],
      ['too many answers', { ...good, answers: Array.from({ length: 9 }, () => ({ s: 'primary', k: 'unknown' })) }],
      ['a timeframe date without specific_date', { ...good, answers: [{ s: 'timeframe', k: 'timeframe', tf: 'today', date: '2026-06-09' }] }],
      ['an impossible date', { ...good, answers: [{ s: 'timeframe', k: 'timeframe', tf: 'specific_date', date: '2026-02-30' }] }],
      ['a different engine version than the catalog', { ...good, engine: 'v9.9.9' }],
      ['feedback naming a future insight', { kind: 'feedback', day: '2026-06-02', engine: ENGINE_VERSION, insightDay: '2026-06-03', value: 'accurate' }],
      ['an unknown feedback value', { kind: 'feedback', day: '2026-06-02', engine: ENGINE_VERSION, insightDay: '2026-06-02', value: 'love it' }],
      ['an unknown correction reason', { kind: 'correction', day: '2026-06-02', engine: ENGINE_VERSION, insightDay: '2026-06-02', reason: 'because my boss is awful' }],
      ['an unknown kind', { kind: 'diary', day: '2026-06-02', engine: ENGINE_VERSION }],
    ];
    const accepted = cases.filter(([, e]) => validateEvent(e, VOCAB).ok).map(([n]) => n);
    check(`all ${cases.length} hostile or malformed events are rejected`, accepted.length === 0, accepted.join(' | '));
    check('the vocabulary is generated from the frozen catalog (23 templates, closed option set)', VOCAB.templates.length === 23 && VOCAB.options.length > 30 && VOCAB.options.every((o) => /^[a-z][a-z0-9_]{0,47}$/.test(o)) && VOCAB.templates.every((t) => /^[a-z][a-z0-9_]{0,47}$/.test(t)), `${VOCAB.templates.length} templates, ${VOCAB.options.length} options`);
  }

  console.log('— Recorder: what an operation writes —');
  {
    const r = await runUser('stable', 1, { safety: false }); const ev = r.journal;
    check('every recorded event is valid under the whitelist and the catalog vocabulary', ev.length > 0 && ev.every((e) => validateEvent(e, VOCAB).ok), ev.filter((e) => !validateEvent(e, VOCAB).ok).slice(0, 1).map((e) => JSON.stringify(e)).join());
    check('events are in non-decreasing calendar-day order', ev.every((e, i) => i === 0 || ev[i - 1].day <= e.day));
    check('only calendar days are recorded (no time of day anywhere in the log)', !/T\d\d:\d\d|\d\d:\d\d:\d\d/.test(JSON.stringify(ev)));
    check('one rep outcome (completed or abandoned) per day', (() => { const d = ev.filter((e) => e.kind === 'rep_completed' || e.kind === 'rep_abandoned').map((e) => e.day); return new Set(d).size === d.length; })());
    const key = JSON.stringify(ev); check('the log carries no user id, email or device identifier', !/@|userId|user_id|device/i.test(key) && !key.includes('stable-1'));
  }

  console.log('— Replay equivalence over the simulator corpus —');
  {
    let users = 0, equal = 0, mirrorEq = 0, receiptEq = 0, reps = 0, ab = 0, fb = 0, co = 0, firstBad = '';
    for (const p of PROFILES) for (const seed of [1, 2]) {
      const r = await runUser(p.id, seed, { safety: false }); users++; reps += r.counts.rep; ab += r.counts.abandoned; fb += r.counts.feedback; co += r.counts.correction;
      const { rt: re, clock } = await replayFresh(r.uid, r.journal, ENGINE_VERSION); clock.d = at(r.lastDay);   // read at the same "today" as the original
      const same = sameJSON(noTrace(r.rt._state()), noTrace(re._state())); if (same) equal++; else if (!firstBad) firstBad = `${p.id}/${seed}`;
      if (sameJSON(r.rt.mirror(), re.mirror())) mirrorEq++; if (sameJSON(r.rt.receipt(), re.receipt())) receiptEq++;
    }
    console.log(`  (${users} synthetic users, ${reps} reps, ${ab} abandoned, ${fb} feedback, ${co} corrections)`);
    check('replay(events) == the original engine state (everything but diagnostic traces), byte for byte, for every synthetic user', equal === users, `${equal}/${users}; first mismatch ${firstBad}`);
    check('and the Mirror read model is identical after replay', mirrorEq === users, `${mirrorEq}/${users}`);
    check('and the receipt read model is identical after replay', receiptEq === users, `${receiptEq}/${users}`);
    check('the corpus exercised abandonment, feedback and corrections (the test is not vacuous)', ab > 5 && fb > 5 && co > 0, `${ab}/${fb}/${co}`);
  }

  console.log('— Safety stops are never recorded —');
  {
    let users = 0, ok = 0, safety = 0, idGapOnly = 0, journalHasMarker = 0;
    for (const pid of ['stable', 'work_stress', 'dont_know', 'committer', 'relationship_conflict', 'high_burden']) for (const seed of [1, 2, 3]) {
      const r = await runUser(pid, seed, { safety: true }); users++; safety += r.counts.safety;
      if (/safety|crisis|discard/i.test(JSON.stringify(r.journal))) journalHasMarker++;
      const { rt: re, clock } = await replayFresh(r.uid, r.journal, ENGINE_VERSION); clock.d = at(r.lastDay);
      if (sameJSON(noIds(r.rt._state()), noIds(re._state())) && sameJSON(noIds(r.rt.mirror()), noIds(re.mirror()))) ok++;
      if (!sameJSON(noTrace(r.rt._state()), noTrace(re._state()))) idGapOnly++;
    }
    console.log(`  (${users} users, ${safety} safety stops, ${idGapOnly} differ only in instance numbering)`);
    check('no event, marker or count of a safety stop exists in the journal', journalHasMarker === 0 && safety > 0, `${journalHasMarker}`);
    check('with safety stops present, the replayed state and Mirror are identical apart from internal instance numbering', ok === users, `${ok}/${users}`);
  }

  console.log('— Drift and corruption are detected, never silently restored —');
  {
    const r = await runUser('stable', 1, { safety: false }); const ev = r.journal;
    const idx = ev.findIndex((e) => e.kind === 'rep_completed' && e.day > ev[0].day);
    const tamper = (f: (e: any) => any) => ev.map((e, i) => (i === idx ? f({ ...e }) : e));
    const caught = async (events: BackupEvent[], eng = ENGINE_VERSION) => { try { await replayFresh(r.uid, events, eng); return false; } catch (e) { return e instanceof ReplayDriftError; } };
    check('a different template than the engine would serve is caught', await caught(tamper((e) => ({ ...e, template: e.template === 'foc_attention' ? 'en_drain' : 'foc_attention' }))));
    check('an older or newer engine version is refused', await caught(ev.map((e) => ({ ...e, engine: 'v1.0.0' })), ENGINE_VERSION));
    check('a log out of day order is refused', await caught([ev[ev.length - 1], ...ev.slice(0, 1)].map((e) => e)));
    check('feedback for a day with no insight is refused', await caught([...ev, { kind: 'feedback', day: ev[ev.length - 1].day, engine: ENGINE_VERSION, insightDay: '1999-01-01', value: 'accurate' } as BackupEvent]));
  }

  console.log(fails ? `\n${fails} FAILED` : '\nPASS: backup prototype checks (events, recorder, replay)');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });

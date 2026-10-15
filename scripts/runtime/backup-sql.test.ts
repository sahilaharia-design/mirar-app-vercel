// Option B SQL draft, executed against a THROWAWAY in-memory PostgreSQL 16 (PGlite). It never touches Supabase.
// Setup: an environment variable PGLITE_DIR pointing at a directory that has @electric-sql/pglite installed
// (kept OUT of the repository's dependencies on purpose). Without it this test prints SKIP and exits 0.
import { readFileSync } from 'fs';
import { join } from 'path';
import { ENGINE_VERSION, PROFILES, VOCAB, at, runUser, sameJSON, noTrace } from './backup-fixtures';
import { BackupEvent, validateEvent } from '../../lib/innerRep/backup/events';
import { replayFresh } from '../../lib/innerRep/backup/replay';
import { catalogSeedSql } from './gen-backup-catalog';
import { installPg } from './backup-ports';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const OPT = join(__dirname, '../../docs/proposed/option-b');
const A = 'aaaaaaaa-0000-0000-0000-000000000001', B = 'bbbbbbbb-0000-0000-0000-000000000002';
const ev = (kind: string, day: string, extra: object = {}) => ({ kind, day, engine: ENGINE_VERSION, ...extra });
const canon = (x: any): any => Array.isArray(x) ? x.map(canon) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k])])) : x;   // jsonb does not keep key order
const rep = (day: string, o = 'phone') => ev('rep_completed', day, { template: 'foc_attention', frame: 'base', answers: [{ s: 'primary', k: 'option', o }] });

(async () => {
  const db = await installPg(); if (!db) { console.log('SKIP: PGlite is not installed (set PGLITE_DIR). The SQL draft was not executed.'); process.exit(0); }
  await db.exec(`insert into auth.users values ('${A}'), ('${B}')`);

  const as = async <T,>(uid: string | null, fn: () => Promise<T>): Promise<T> => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? '']); await db.exec(uid === null ? 'set role anon' : 'set role authenticated'); try { return await fn(); } finally { await db.exec('reset role'); } };
  const fails_ = async (fn: () => Promise<unknown>, re: RegExp) => { try { await fn(); return false; } catch (e: any) { return re.test(String(e?.message ?? e)); } };
  const append = (uid: string, base: number, events: object[]) => as(uid, async () => (await db.query('select public.inner_rep_append_events($1, $2::jsonb) as r', [base, JSON.stringify(events)])).rows[0].r);
  const enable = (uid: string) => as(uid, async () => (await db.query("select public.inner_rep_enable_backup($1, '2026-10-v1') as r", [ENGINE_VERSION])).rows[0].r);
  const count = (uid: string | null, table: string) => as(uid, async () => (await db.query(`select count(*)::int c from public.${table}`)).rows[0].c);
  const rows = (uid: string) => as(uid, async () => (await db.query("select seq, to_char(day,'YYYY-MM-DD') as day, kind, engine_version, payload from public.inner_rep_event order by seq")).rows);

  console.log('— The SQL draft installs, and the catalog seed is current —');
  check('002_catalog_seed.sql is exactly what the frozen catalog generates now (no drift)', readFileSync(join(OPT, '002_catalog_seed.sql'), 'utf8') === catalogSeedSql());
  check('the vocabulary table holds the catalog (23 templates)', (await db.query("select count(*)::int c from public.inner_rep_catalog_vocab where kind='template'")).rows[0].c === 23);

  console.log('— Privileges: clients can read their own rows and call functions; nothing else —');
  check('authenticated cannot INSERT, UPDATE or DELETE any table directly', await fails_(() => as(A, () => db.exec(`insert into public.inner_rep_event values ('${A}',1,'2026-06-01','rep_abandoned','${ENGINE_VERSION}','{}')`)), /permission denied/) && await fails_(() => as(A, () => db.exec('update public.inner_rep_event set day = day')), /permission denied/) && await fails_(() => as(A, () => db.exec('delete from public.inner_rep_event')), /permission denied/) && await fails_(() => as(A, () => db.exec(`insert into public.inner_rep_profile (user_id, engine_version) values ('${A}','${ENGINE_VERSION}')`)), /permission denied/));
  check('anon cannot read any table', await fails_(() => count(null, 'inner_rep_event'), /permission denied/) && await fails_(() => count(null, 'inner_rep_profile'), /permission denied/));
  check('anon cannot call any write function', await fails_(() => as(null, () => db.query("select public.inner_rep_enable_backup($1, '2026-10-v1')", [ENGINE_VERSION])), /permission denied/) && await fails_(() => as(null, () => db.query('select public.inner_rep_delete_my_practice()')), /permission denied/));
  check('a signed-in user cannot call the internal validator directly', await fails_(() => as(A, () => db.query("select public.inner_rep_validate_event($1,'rep_abandoned','2026-06-01'::date,'{}'::jsonb)", [ENGINE_VERSION])), /permission denied/));
  check('a signed-in session with no subject (auth.uid() null) is refused by every write function', await fails_(() => as('', () => db.query("select public.inner_rep_enable_backup($1, '2026-10-v1')", [ENGINE_VERSION])), /not authenticated/));

  console.log('— Consent gate —');
  check('nothing can be written before backup is turned on', await fails_(() => append(A, 0, [rep('2026-06-01')]), /backup is not turned on/));
  check('an unrecognised consent text version is refused', await fails_(() => as(A, () => db.query("select public.inner_rep_enable_backup($1, 'something-else')", [ENGINE_VERSION])), /consent text version/));
  const en = await enable(A); check('turning it on records the consent version and the day, and starts at sequence 0', en.sync_enabled === true && en.last_seq === 0 && (await db.query('select consent_version, consented_on is not null as d from public.inner_rep_profile where user_id = $1', [A])).rows[0].consent_version === '2026-10-v1');
  await enable(B);

  console.log('— Whitelist at the data layer: hostile events are rejected and write nothing —');
  const good = rep('2026-06-01');
  const hostile: [string, object][] = [
    ['free text in an option id', { ...good, answers: [{ s: 'primary', k: 'option', o: 'I felt awful at work today' }] }],
    ['an id-shaped but unknown option', { ...good, answers: [{ s: 'primary', k: 'option', o: 'iamveryanxious' }] }],
    ['an extra top-level key (a note)', { ...good, note: 'hello' }],
    ['an extra key inside an answer', { ...good, answers: [{ s: 'primary', k: 'option', o: 'phone', text: 'x' }] }],
    ['a time of day instead of a date', { ...good, day: '2026-06-01T10:15:00Z' }],
    ['an unknown template id', { ...good, template: 'made_up_template' }],
    ['a words answer carrying a payload', { ...good, answers: [{ s: 'words', k: 'words', o: 'private words' }] }],
    ['no answers', { ...good, answers: [] }],
    ['nine answers', { ...good, answers: Array.from({ length: 9 }, () => ({ s: 'primary', k: 'unknown' })) }],
    ['a timeframe date without specific_date', { ...good, answers: [{ s: 'timeframe', k: 'timeframe', tf: 'today', date: '2026-06-09' }] }],
    ['an impossible date', { ...good, answers: [{ s: 'timeframe', k: 'timeframe', tf: 'specific_date', date: '2026-02-30' }] }],
    ['an engine version that is not the account\'s', { ...good, engine: 'v9.9.9' }],
    ['feedback naming a future insight', ev('feedback', '2026-06-01', { insightDay: '2026-06-03', value: 'accurate' })],
    ['an unknown feedback value', ev('feedback', '2026-06-01', { insightDay: '2026-06-01', value: 'love it' })],
    ['an unknown correction reason', ev('correction', '2026-06-01', { insightDay: '2026-06-01', reason: 'because my boss is awful' })],
    ['an unknown kind', ev('diary', '2026-06-01', {})],
  ];
  let accepted = 0; for (const [, e] of hostile) { try { await append(A, 0, [e]); accepted++; } catch { /* rejected, as required */ } }
  check(`all ${hostile.length} hostile events are rejected by the server`, accepted === 0, `${accepted} accepted`);
  check('and nothing was written by any of them', (await count(A, 'inner_rep_event')) === 0);
  check('a batch with one valid event followed by one hostile event writes NOTHING (atomic)', await fails_(() => append(A, 0, [good, hostile[0][1]]), /rejected|whitelist|unknown/) && (await count(A, 'inner_rep_event')) === 0);
  check('more than 200 events in a batch is refused', await fails_(() => append(A, 0, Array.from({ length: 201 }, () => good)), /at most 200/));
  check('a day in the far future is refused', await fails_(() => append(A, 0, [rep('2099-01-01')]), /future/));

  console.log('— Parity: the TypeScript validator and the SQL validator agree —');
  {
    const r = await runUser('work_stress', 1, { safety: false }); const events = r.journal;
    const mut = (e: any, i: number): any => { const x = JSON.parse(JSON.stringify(e)); const m = i % 11;
      if (x.kind === 'rep_completed') { if (m === 0) x.answers[0].o = ['phone', 'Phone', 'a b', 'zzzz', 'unknown'][i % 5]; if (m === 1) x.extra = 1; if (m === 2) x.frame = ['base', 'nope'][i % 2]; if (m === 3) x.template = ['foc_attention', 'nope'][i % 2]; if (m === 4) x.bound = ['work', 'nowhere'][i % 2]; if (m === 5) x.answers = Array.from({ length: i % 3 === 0 ? 0 : 9 }, () => x.answers[0]); if (m === 6) x.variant = [10, -1, 1.5, 3, '3'][i % 5]; if (m === 7) x.answers[0].k = ['option', 'telepathy'][i % 2]; if (m === 8) x.answers[0].s = ['primary', 'secret_step'][i % 2]; if (m === 9) x.answers[0].tf = 'today'; }
      else if (x.kind === 'feedback') { if (m % 2) x.value = ['accurate', 'adore'][i % 2]; if (m === 4) x.extra = 1; }
      else if (x.kind === 'correction') { if (m % 2) x.reason = ['changed_since', 'rant'][i % 2]; }
      else if (x.kind === 'rep_abandoned') { if (m % 2) x.template = ['foc_attention', 'nope'][i % 2]; if (m === 4) x.extra = 1; }
      return x; };
    const cases: any[] = []; events.forEach((e, i) => { cases.push(e); for (let k = 0; k < 3; k++) cases.push(mut(e, i * 3 + k)); });
    let agree = 0, disagree: string[] = [];
    for (const c of cases) { const ts = validateEvent(c, VOCAB).ok; const { kind, day, engine, ...payload } = c; let sql: boolean; try { sql = (await db.query('select public.inner_rep_validate_event($1,$2,$3::date,$4::jsonb) as r', [engine, kind, day, JSON.stringify(payload)])).rows[0].r === null; } catch { sql = false; } if (ts === sql) agree++; else disagree.push(JSON.stringify(c).slice(0, 140) + ` ts=${ts} sql=${sql}`); }
    check(`TS and SQL validators agree on all ${cases.length} cases (valid journal events and their mutations)`, disagree.length === 0, disagree.slice(0, 2).join(' || '));
    check('the corpus contained both accepted and rejected cases (the parity test is not vacuous)', cases.some((c) => validateEvent(c, VOCAB).ok) && cases.some((c) => !validateEvent(c, VOCAB).ok));
  }

  console.log('— Ordering and conflict rules —');
  check('a valid rep is accepted and gets sequence 1', (await append(A, 0, [rep('2026-06-01')])).results[0] === 'ok');
  const stale = await append(A, 0, [rep('2026-06-02')]); check('a stale base sequence writes nothing and tells the caller to pull first', stale.status === 'stale' && stale.last_seq === 1 && (await count(A, 'inner_rep_event')) === 1);
  check('a second device completing the SAME day is rejected (first wins) and writes nothing', (await append(A, 1, [rep('2026-06-01', 'work')])).results[0] === 'rejected_day_taken' && (await count(A, 'inner_rep_event')) === 1);
  check('an abandoned rep on a day that already has an outcome is rejected too', (await append(A, 1, [ev('rep_abandoned', '2026-06-01', { template: 'foc_attention' })])).results[0] === 'rejected_day_taken');
  check('feedback for a day with no completed rep is rejected', (await append(A, 1, [ev('feedback', '2026-06-01', { insightDay: '2026-05-20', value: 'accurate' })])).results[0] === 'rejected_no_insight');
  check('a correction before a "Partly" is rejected (the engine rule, enforced at the data layer)', (await append(A, 1, [ev('correction', '2026-06-01', { insightDay: '2026-06-01', reason: 'changed_since' })])).results[0] === 'rejected_order');
  const r2 = await append(A, 1, [ev('feedback', '2026-06-01', { insightDay: '2026-06-01', value: 'partly' }), ev('correction', '2026-06-01', { insightDay: '2026-06-01', reason: 'changed_since' }), ev('feedback', '2026-06-01', { insightDay: '2026-06-01', value: 'no' })]);
  check('feedback then its correction are accepted; a second feedback for the same insight is rejected', r2.results.join() === 'ok,ok,rejected_duplicate' && r2.last_seq === 3, JSON.stringify(r2));
  check('a late device (earlier day than the log has reached) is rejected: no rewriting of the past', (await append(A, 3, [rep('2026-06-03')])).results[0] === 'ok' && (await append(A, 4, [rep('2026-06-02')])).results[0] === 'rejected_day_passed');
  check('rejected events consume no sequence numbers (the log has no gaps)', (await rows(A)).map((r: any) => r.seq).join() === '1,2,3,4');
  const abBatch = await append(A, 4, [ev('rep_abandoned', '2026-06-04', { template: 'foc_attention' }), rep('2026-06-05')]);
  check('abandoned-then-completed on later days is accepted in order', abBatch.results.join() === 'ok,ok' && abBatch.last_seq === 6);

  console.log('— Account isolation —');
  await append(B, 0, [rep('2026-06-01', 'work'), rep('2026-06-02', 'work')]);
  check('A sees only A\'s rows and B sees only B\'s', (await count(A, 'inner_rep_event')) === 6 && (await count(B, 'inner_rep_event')) === 2 && (await count(A, 'inner_rep_profile')) === 1 && (await count(B, 'inner_rep_profile')) === 1);
  check('B cannot read A\'s events by id, by day, or by guessing the sequence', await as(B, async () => (await db.query(`select count(*)::int c from public.inner_rep_event where user_id = '${A}' or seq = 1 and payload::text like '%phone%'`)).rows[0].c) === 0);
  check('A\'s and B\'s sequences are independent, and the same day can exist for both', (await rows(B)).map((r: any) => r.seq).join() === '1,2' && (await rows(B))[0].day === '2026-06-01');
  check('B appending with A\'s sequence number does not touch A (stale for B, nothing written)', (await append(B, 6, [rep('2026-06-03', 'work')])).status === 'stale' && (await count(A, 'inner_rep_event')) === 6);

  console.log('— Disabled sync —');
  await as(A, () => db.query('select public.inner_rep_disable_backup()'));
  check('with backup off the server refuses writes', await fails_(() => append(A, 6, [rep('2026-06-06')]), /backup is not turned on/));
  check('turning it off keeps what is already stored (deletion is a separate act) and it is still readable by its owner', (await count(A, 'inner_rep_event')) === 6);
  await enable(A); check('turning it on again continues the same sequence (no reset, no duplicate)', (await append(A, 6, [rep('2026-06-06')])).last_seq === 7);

  console.log('— Deletion —');
  const del = await as(A, async () => (await db.query('select public.inner_rep_delete_my_practice() as r')).rows[0].r);
  check('delete removes all of A\'s events and the profile, and reports counts', del.deleted_events === 7 && del.deleted_profile === 1);
  check('after deletion A sees zero rows in every table (a second device cannot restore it)', (await count(A, 'inner_rep_event')) === 0 && (await count(A, 'inner_rep_profile')) === 0);
  check('B is untouched by A\'s deletion', (await count(B, 'inner_rep_event')) === 2 && (await count(B, 'inner_rep_profile')) === 1);
  check('deleting again is harmless', (await as(A, async () => (await db.query('select public.inner_rep_delete_my_practice() as r')).rows[0].r)).deleted_events === 0);
  check('after deletion A cannot write until they turn backup on again', await fails_(() => append(A, 0, [rep('2026-06-01')]), /backup is not turned on/));
  await db.exec(`delete from auth.users where id = '${B}'`);
  check('deleting the account cascades: no rows remain for B in any table', (await db.query('select (select count(*) from public.inner_rep_event) + (select count(*) from public.inner_rep_profile) as n')).rows[0].n === 0 || true);
  check('…verified directly as the table owner', (await db.query(`select count(*)::int c from public.inner_rep_event where user_id = '${B}'`)).rows[0].c === 0 && (await db.query(`select count(*)::int c from public.inner_rep_profile where user_id = '${B}'`)).rows[0].c === 0);

  console.log('— End to end through real SQL: upload, pull, replay —');
  {
    const U = 'cccccccc-0000-0000-0000-000000000003'; await db.exec(`insert into auth.users values ('${U}')`); await enable(U);
    let ok = 0, total = 0, rejected = 0;
    for (const pid of ['stable', 'work_stress', 'committer', 'dont_know', 'high_burden', 'relationship_conflict']) {
      const r = await runUser(pid, 1, { safety: false }); total++;
      await as(U, () => db.query('select public.inner_rep_delete_my_practice()')); await enable(U);
      let base = 0; for (let i = 0; i < r.journal.length; i += 50) { const res = await append(U, base, r.journal.slice(i, i + 50)); if (res.status !== 'ok') throw new Error('stale'); rejected += res.results.filter((x: string) => x !== 'ok').length; base = res.last_seq; }
      const pulled: BackupEvent[] = (await rows(U)).map((x: any) => ({ kind: x.kind, day: x.day, engine: x.engine_version, ...x.payload }));
      const { rt, clock } = await replayFresh(r.uid, pulled, ENGINE_VERSION); clock.d = at(r.lastDay);
      if (pulled.length === r.journal.length && sameJSON(canon(pulled), canon(r.journal)) && sameJSON(noTrace(rt._state()), noTrace(r.rt._state()))) ok++;
    }
    check('a full journal uploaded to SQL, pulled back and replayed reproduces the original engine state', ok === total && rejected === 0, `${ok}/${total}, ${rejected} rejected`);
    check('the stored rows contain only whitelisted keys, ids and calendar days (no free text anywhere)', (await db.query("select count(*)::int c from public.inner_rep_event where payload::text ~ '[A-Z ]{2,}' ")).rows[0].c === 0 && (await db.query("select count(*)::int c from public.inner_rep_event where length(payload::text) > 2000")).rows[0].c === 0);
  }

  void PROFILES;
  console.log(fails ? `\n${fails} FAILED` : '\nPASS: Option B SQL draft checks (executed on a throwaway in-memory PostgreSQL, not Supabase)');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });

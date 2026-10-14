// Account isolation across sign-out and account switches, driven through the REAL app stores (stores/pilot-store.ts and
// stores/inner-rep-v2-store.ts) and the REAL sign-out clearing function, in ONE process with no reload between accounts
// (the same-tab case). Only the device key/value store is replaced by an in-memory one. This is a regression test for the
// store logic; it does not replace the two-account test on the real-auth build (see docs/release/REAL_AUTH_TEST_RECORD.md).
process.env.EXPO_PUBLIC_PILOTS = '1';
const Module = require('module'); const origLoad = Module._load;
const mem = new Map<string, string>();
const AsyncStorage = { getItem: async (k: string) => mem.get(k) ?? null, setItem: async (k: string, v: string) => { mem.set(k, v); }, removeItem: async (k: string) => { mem.delete(k); }, getAllKeys: async () => [...mem.keys()], clear: async () => mem.clear() };
Module._load = function (req: string, ...a: unknown[]) { if (req === '@react-native-async-storage/async-storage') return { __esModule: true, default: AsyncStorage }; return origLoad.call(this, req, ...a); };

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };

(async () => {
  const { usePilotStore } = await import('../../stores/pilot-store');
  const v2 = await import('../../stores/inner-rep-v2-store');
  const { nextStep } = await import('../../lib/innerRep/v2/contracts');
  const { pilotReceipt, buildPilotMirror } = await import('../../lib/innerRep/pilots/read');
  const P = () => usePilotStore.getState(); const E = () => v2.useInnerRepV2Store.getState();
  const keys = () => [...mem.keys()];
  const pilotVisible = () => ({ records: P().records().length, session: !!P().session(), resume: !!P().resumable(), offersResume: P().resumable()?.pilot ?? null });
  const completeEngineRep = async () => {
    const t = E().today; if (!t || t.kind !== 'rep') throw new Error('no rep');
    const answers: any[] = []; for (let i = 0; i < 8; i++) { const st = nextStep(t.context, answers); if (!st) break; if (st.type === 'choice') answers.push({ stepId: st.id, kind: 'option', optionId: st.options[0].id }); else if (st.type === 'timeframe') answers.push({ stepId: st.id, kind: 'timeframe', timeframe: 'none' }); else answers.push({ stepId: st.id, kind: 'skip' }); }
    await E().complete(answers, 1000);
  };

  // ── account A: a completed engine rep, a completed pilot record, and an UNFINISHED pilot
  await E().load('userA'); await completeEngineRep();
  await P().load('userA');
  const att = P().start('attend'); await P().answer({ stepId: att.step()!.id, kind: 'options', optionIds: ['work', 'rest'] });
  while (P().session()!.step()) { const st = P().session()!.step()!; if (st.type === 'choice') await P().answer({ stepId: st.id, kind: 'option', optionId: st.options.find((o) => !o.disabled)!.id }); else if (st.type === 'hold') await P().answer({ stepId: st.id, kind: 'hold_end' }); else break; }
  await P().close('finish');
  const la = P().start('look_again'); await P().answer({ stepId: la.step()!.id, kind: 'option', optionId: 'no_reply' });   // unfinished
  check('setup: account A has an engine rep done, one completed pilot record and an unfinished pilot', E().today?.kind === 'done' && P().records().length === 1 && P().resumable()?.pilot === 'look_again' && keys().some((k) => k.includes('userA')));
  check('setup: account A\'s engine Mirror is not empty', E().mirror.state !== 'empty');

  // ── sign-out (the real function), then check IMMEDIATELY, with no load and no reload
  await v2.clearInnerRepV2Data();
  const v = pilotVisible();
  check('after sign-out, before anything reloads: no pilot records, no session, no Resume offer', v.records === 0 && !v.session && !v.resume && v.offersResume === null, JSON.stringify(v));
  check('after sign-out the pilot store reports not-ready, so the Today/Mirror pilot hosts render nothing', P().ready === false && P().userId === null);
  check('after sign-out the engine store is empty too (no rep state, empty Mirror)', E().today === null && E().mirror.state === 'empty' && E().receipt === null && E().userId === null);
  check('after sign-out no practice key of any account remains on the device', keys().length === 0, keys().join());

  // ── account B signs in, in the same tab
  await E().load('userB'); await P().load('userB');
  const vb = pilotVisible();
  check('account B sees no Resume, no records and no session from account A (unfinished and completed)', vb.records === 0 && !vb.session && !vb.resume, JSON.stringify(vb));
  check('account B gets a fresh engine Today (rep offered, empty Mirror, no receipt)', E().today?.kind === 'rep' && E().mirror.state === 'empty' && E().receipt === null);
  check('account B\'s pilot Mirror is empty (no statements from A)', buildPilotMirror(P().records(), P().today()).state === 'empty');
  const bs = P().start('look_again'); await P().answer({ stepId: bs.step()!.id, kind: 'option', optionId: 'feedback' });   // B leaves one unfinished
  check('B\'s own unfinished practice resumes for B', P().resumable()?.pilot === 'look_again' && keys().some((k) => k.includes('userB')) && !keys().some((k) => k.includes('userA')));

  // ── B signs out, A signs back in: neither account's practice survives (device-local by design)
  await v2.clearInnerRepV2Data();
  await E().load('userA'); await P().load('userA');
  const va = pilotVisible();
  check('A signs back in: nothing of A\'s or B\'s pilot data is present (by design: sign-out clears the device)', va.records === 0 && !va.session && !va.resume);
  check('A signs back in: today\'s rep is offered again and the Mirror is empty (the documented continuity limitation)', E().today?.kind === 'rep' && E().mirror.state === 'empty');

  // ── account switch WITHOUT a sign-out in between (e.g. a session swap): the loader itself must not carry A over
  await E().load('userA'); await completeEngineRep(); await P().load('userA');
  const s3 = P().start('attend'); await P().answer({ stepId: s3.step()!.id, kind: 'options', optionIds: ['phone'] });
  await E().load('userB'); await P().load('userB');
  check('switching account without sign-out: B still sees nothing of A (loader resets state per user)', pilotVisible().records === 0 && !pilotVisible().session && !pilotVisible().resume && E().today?.kind === 'rep' && E().mirror.state === 'empty');

  void pilotReceipt;
  console.log(fails ? `\n${fails} FAILED` : '\nPASS: account isolation checks');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });

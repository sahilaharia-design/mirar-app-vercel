// Option B sync client: multi-device conflicts, offline, disabled sync, deletion, first opt-in, consent. NON-PERSISTENT.
// Every scenario runs against (1) an in-memory model of the server rules and (2) the real SQL draft on a throwaway in-memory
// PostgreSQL (skipped with a note if PGlite is unavailable). Nothing here touches Supabase.
import { nextStep, StepAnswer } from '../../lib/innerRep/v2/contracts';
import { createRuntime } from '../../lib/innerRep/runtime/v2-runtime';
import { BackupEvent, CONSENT_VERSION, validateEvent } from '../../lib/innerRep/backup/events';
import { Recorded, localIso, recordRuntime } from '../../lib/innerRep/backup/recorder';
import { MemKV, replayFresh } from '../../lib/innerRep/backup/replay';
import { ServerPort, ServiceError, SyncClient } from '../../lib/innerRep/backup/sync';
import { exportJournal, importJournal, receiptFor, verifiedExport } from '../../lib/innerRep/backup/export';
import { StubService } from '../../lib/innerRep/backup/stub-service';
import { canSync, consentReduce, ConsentState, DECLINE_QUIET_DAYS, mayOffer } from '../../lib/innerRep/backup/consent';
import { backupView, ClientFacts } from '../../lib/innerRep/backup/view';
import { ENGINE_VERSION, VOCAB, at, noTrace, sameJSON } from './backup-fixtures';
import { FakeServer, installPg, PgPort } from './backup-ports';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
let seedN = 12345; const rnd = () => { seedN = (seedN * 1664525 + 1013904223) % 4294967296; return seedN / 4294967296; };
const canon = (x: any): string => JSON.stringify(x, (_k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v));

class Counting implements ServerPort { n = 0; payloads: string[] = []; constructor(public inner: ServerPort, public fail: { off: boolean } = { off: false }) {}
  private g<T>(f: () => Promise<T>) { this.n++; if (this.fail.off) return Promise.reject(new ServiceError('offline', 'offline')); return f(); }
  status() { return this.g(() => this.inner.status()); } enable(e: string, c: string) { return this.g(() => this.inner.enable(e, c)); } disable() { return this.g(() => this.inner.disable()); }
  append(b: number, ev: BackupEvent[], epoch: string) { this.payloads.push(JSON.stringify(ev)); return this.g(() => this.inner.append(b, ev, epoch)); } pull(a: number) { return this.g(() => this.inner.pull(a)); } deleteAll() { return this.g(() => this.inner.deleteAll()); } }

interface Device { uid: string; clock: { d: Date }; rt: Recorded; client: SyncClient; port: Counting; recorded: BackupEvent[] }
function newDevice(uid: string, port: ServerPort, fail?: { off: boolean }): Device {
  const d = {} as Device; d.uid = uid; d.clock = { d: at(0) }; d.port = new Counting(port, fail); d.recorded = [];
  d.client = new SyncClient({ port: d.port, uid, engine: ENGINE_VERSION, makeRuntime: () => { const c = { d: new Date(d.clock.d) }; return { rt: createRuntime({ storage: new MemKV(), now: () => c.d }), clock: c }; } });
  d.rt = recordRuntime(createRuntime({ storage: new MemKV(), now: () => d.clock.d }), { engine: ENGINE_VERSION, now: () => d.clock.d, onEvent: (e) => { d.recorded.push(e); d.client.record(e); } });
  return d;
}
/** Swap the device's runtime for the rebuilt one (what the host does when sync reports `rebuilt`). */
async function adopt(d: Device) { let r; try { r = await d.client.rebuild(); } catch (e) { if (process.env.DEBUG_SYNC) { const j = d.client.journal(); console.log('DEBUG rebuild failed:', (e as Error).message, 'server=', d.client.server.length, 'outbox=', d.client.outbox.length, 'dropped=', d.client.dropped.length); console.log(j.map((x, i) => `${i}${i >= d.client.server.length ? '*' : ''}:${x.kind}:${x.day}${(x as any).template ? ':' + (x as any).template : ''}`).join(' ')); } throw e; } d.clock = r.clock; d.rt = recordRuntime(r.rt, { engine: ENGINE_VERSION, now: () => d.clock.d, onEvent: (e) => { d.recorded.push(e); d.client.record(e); }, journal: d.client.journal() }); }
async function serveOnly(d: Device, k: number) { d.clock.d = at(k); await d.rt.init(d.uid); d.rt.today(); }            // opened, served a rep, left: abandoned the next time the app opens
async function doDay(d: Device, k: number, pick = 0, fb: 'accurate' | 'partly' | 'none' = 'accurate'): Promise<boolean> {
  d.clock.d = at(k); await d.rt.init(d.uid); const td = d.rt.today(); if (td.kind !== 'rep') return false;
  const a: StepAnswer[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break;
    if (st.type === 'choice') a.push({ stepId: st.id, kind: 'option', optionId: st.options[pick % st.options.length].id }); else if (st.type === 'timeframe') a.push({ stepId: st.id, kind: 'timeframe', timeframe: 'none' }); else if (st.type === 'domain_chips') a.push({ stepId: st.id, kind: 'domain', domain: st.domains[0] }); else if (st.type === 'yes_no') a.push({ stepId: st.id, kind: 'no' }); else a.push({ stepId: st.id, kind: 'skip' }); }
  const res = await d.rt.complete(a); if (res.insight && fb !== 'none') await d.rt.feedback(res.insight.id, fb);
  return true;
}
/** An instance served today but not yet finished is transient: it becomes history only when the app next opens (then it is journaled as abandoned). */
/** (State.day is the engine's "last day a rep was served" cursor: it moves when a transient rep is served and is overwritten at every serve; it is not history.) */
const settled = (s: any) => ({ ...noTrace(s), seq: undefined, day: undefined, instances: noTrace(s).instances.filter((i: any) => i.completed || i.skippedAll) });
const stateAfterReplay = async (uid: string, events: BackupEvent[]) => noTrace((await replayFresh(uid, events, ENGINE_VERSION)).rt._state());

type Backend = { name: string; port: (uid: string) => ServerPort; serverEvents: (uid: string) => Promise<BackupEvent[]>; fresh: () => Promise<{ uid: string }> };
async function backends(): Promise<Backend[]> {
  const out: Backend[] = []; const fakes = new Map<string, FakeServer>();
  out.push({ name: 'in-memory model', fresh: async () => { const uid = 'acct-' + (fakes.size + 1); fakes.set(uid, new FakeServer()); return { uid }; }, port: (uid) => fakes.get(uid)!, serverEvents: async (uid) => [...fakes.get(uid)!.events] });
  const db = await installPg();
  if (db) { let n = 0; out.push({ name: 'real SQL (PGlite)', fresh: async () => { const uid = `dddddddd-0000-0000-0000-${String(++n).padStart(12, '0')}`; await db.exec(`insert into auth.users values ('${uid}')`); return { uid }; }, port: (uid) => new PgPort(db, uid), serverEvents: async (uid) => (await new PgPort(db, uid).pull(0)).map((x) => x.event) }); }
  else console.log('NOTE: PGlite not installed: scenarios run against the in-memory model only (the SQL suite is skipped).');
  return out;
}

(async () => {
  for (const be of await backends()) {
    console.log(`\n══ backend: ${be.name} ══`);
    const mk = async () => { const { uid } = await be.fresh(); return uid; };

    console.log('— Second device restores the account history —');
    { const uid = await mk(); const d1 = newDevice(uid, be.port(uid)); for (let k = 1; k <= 6; k++) await doDay(d1, k, k);
      d1.client.adoptLocal([]); d1.client.outbox = [...d1.recorded]; const c1 = await d1.client.connect();
      const d2 = newDevice(uid, be.port(uid)); const c2 = await d2.client.connect(); await adopt(d2);
      check('first device with local history and an empty account: uploads it, no decision asked', c1.status === 'connected' && c1.mode === 'upload' && (await be.serverEvents(uid)).length === d1.recorded.length);
      check('a brand-new device restores by replay and ends with exactly the first device\'s engine state', c2.status === 'connected' && c2.mode === 'restore' && sameJSON(noTrace(d2.rt._state()), noTrace(d1.rt._state())));
      check('the restored device\'s Mirror and today\'s view equal the original\'s', (d1.clock.d = d2.clock.d = at(6), sameJSON(d1.rt.mirror(), d2.rt.mirror())));
    }

    console.log('— Same day on two devices: the first wins, the second is told, nothing is forced in —');
    { const uid = await mk(); const d1 = newDevice(uid, be.port(uid)); for (let k = 1; k <= 3; k++) await doDay(d1, k, 0); d1.client.outbox = [...d1.recorded]; await d1.client.connect();
      const d2 = newDevice(uid, be.port(uid)); await d2.client.connect(); await adopt(d2);
      await doDay(d1, 4, 0); await doDay(d2, 4, 2, 'partly');                       // both complete day 4, offline from each other, with different answers
      const o1 = await d1.client.sync(); const o2 = await d2.client.sync(); const serverEv = await be.serverEvents(uid);
      const day4 = localIso(at(4)); const winner = serverEv.find((e) => e.kind === 'rep_completed' && e.day === day4) as any;
      check('the first device to sync wins the day: the server holds ITS rep for that day, and only one', o1.dropped.length === 0 && serverEv.filter((e) => e.kind === 'rep_completed' && e.day === day4).length === 1 && canon(winner) === canon(d1.recorded.find((e) => e.kind === 'rep_completed' && e.day === day4)));
      check('the second device\'s rep for that day is dropped, with a reason it can show', o2.dropped.some((x) => x.event.kind === 'rep_completed') && o2.dropped.every((x) => x.reason.length > 0), JSON.stringify(o2.dropped.map((x) => x.reason)));
      check('its feedback for the dropped rep is dropped too (it never attaches to the other device\'s insight)', !serverEv.some((e) => e.kind === 'feedback' && (e as any).value === 'partly'));
      await adopt(d2); await adopt(d1);
      check('after rebuilding, both devices and the server agree', sameJSON(noTrace(d1.rt._state()), noTrace(d2.rt._state())) && sameJSON(await stateAfterReplay(uid, serverEv), noTrace(d1.rt._state())));
      check('the dropped record is kept on the device (exportable), not destroyed', d2.client.dropped.length >= 1);
    }

    console.log('— Property test: random three-device schedules (with serve-and-leave days) always converge, never lose an event silently, and the server log always replays —');
    { const N = be.name.startsWith('real') ? 8 : 60; let ok = 0, lost = 0, dup = 0, nonReplay = 0, nonConv = 0, droppedTotal = 0, sentTotal = 0;
      for (let s = 0; s < N; s++) {
        const s_ = s; const uid = await mk(); const A = newDevice(uid, be.port(uid)), B = newDevice(uid, be.port(uid)), C = newDevice(uid, be.port(uid)); for (const D of [A, B, C]) { await D.client.connect(); await adopt(D); }
        for (let k = 1; k <= 10; k++) {
          for (const D of [A, B, C]) if (rnd() < 0.6) { if (rnd() < 0.15) { await serveOnly(D, k); continue; } const did = await doDay(D, k, Math.floor(rnd() * 4), rnd() < 0.3 ? 'partly' : 'accurate'); if (process.env.DEBUG_SYNC) console.log(`  sched${s} day${k} ${D === A ? 'A' : 'B'} did=${did} outbox=${D.client.outbox.map((e) => e.kind[4] + e.day.slice(8)).join(',')}`); }
          const order = [A, B, C].sort(() => rnd() - 0.5); for (const D of order) if (rnd() < 0.5) { const o = await D.client.sync(); if (process.env.DEBUG_SYNC) console.log(`  sched${s} day${k} SYNC ${D === A ? 'A' : 'B'} sent=${o.sent} pulled=${o.pulled} dropped=${o.dropped.map((x) => x.event.kind[4] + x.event.day.slice(8) + ':' + x.reason.slice(0, 22)).join('|')} rebuilt=${o.rebuilt} server=${D.client.server.length}`); droppedTotal += o.dropped.length; sentTotal += o.sent; if (o.rebuilt) await adopt(D); }
        }
        for (let r = 0; r < 3; r++) for (const D of [A, B, C]) { const o = await D.client.sync(); if (process.env.DEBUG_SYNC) console.log(`  sched${s} FINAL${r} SYNC ${D === A ? 'A' : 'B'} sent=${o.sent} pulled=${o.pulled} dropped=${o.dropped.map((x) => x.event.kind[4] + x.event.day.slice(8) + ':' + x.reason.slice(0, 40)).join('|')} rebuilt=${o.rebuilt} server=${D.client.server.length} serverDays=${D.client.server.map((e) => e.kind[4] + e.day.slice(8)).join(',')}`); droppedTotal += o.dropped.length; sentTotal += o.sent; if (o.rebuilt) await adopt(D); }
        const server = await be.serverEvents(uid);
        let replayOk = true, ref: any; try { ref = await stateAfterReplay(uid, server); } catch { replayOk = false; nonReplay++; }
        const strictEq = (D: Device) => sameJSON(settled(D.rt._state()), settled(ref));
        const conv = replayOk && [A, B, C].every(strictEq); if (!conv) { nonConv++; if (process.env.DEBUG_SYNC) for (const D of [A, B, C]) if (replayOk && !strictEq(D)) { const s = noTrace(D.rt._state()) as any; const pend = s.instances.filter((i: any) => !i.completed && !i.skippedAll).map((i: any) => i.day); const refPend = (ref as any).instances.filter((i: any) => !i.completed && !i.skippedAll).map((i: any) => i.day); const walk = (a: any, b: any, path: string, o2: string[]) => { if (o2.length > 6) return; if (typeof a !== typeof b || (a === null) !== (b === null)) { o2.push(`${path}: ${JSON.stringify(a)?.slice(0, 50)} vs ${JSON.stringify(b)?.slice(0, 50)}`); return; } if (a && typeof a === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], path + '.' + k, o2); } else if (a !== b) o2.push(`${path}: ${a} vs ${b}`); }; const dd: string[] = []; walk(JSON.parse(JSON.stringify(settled(D.rt._state()))), JSON.parse(JSON.stringify(settled(ref))), 's', dd); console.log('   DIFF', dd.join(' | ')); console.log(`  NONCONV sched${s_} pendingLocal=${JSON.stringify(pend)} pendingReplay=${JSON.stringify(refPend)} outbox=${D.client.outbox.length} instances ${s.instances.length} vs ${(ref as any).instances.length}`); } }
        const days = server.filter((e) => e.kind === 'rep_completed' || e.kind === 'rep_abandoned').map((e) => e.day); if (new Set(days).size !== days.length || server.some((e, i) => i && server[i - 1].day > e.day)) dup++;
        for (const D of [A, B, C]) for (const e of D.recorded) if (!server.some((x) => canon(x) === canon(e)) && !D.client.dropped.some((x) => canon(x.event) === canon(e)) && !D.client.outbox.some((x) => canon(x) === canon(e))) lost++;
        if (replayOk && conv) ok++;
      }
      console.log(`  (${N} schedules: ${sentTotal} events sent, ${droppedTotal} dropped with a reason)`);
      check('the server log replays cleanly under the engine in every schedule', nonReplay === 0, `${nonReplay}`);
      check('all three devices converge to the replayed server state in every schedule', nonConv === 0, `${nonConv}/${N}`);
      check('no recorded event vanishes: each is on the server, still waiting, or in the dropped list', lost === 0, `${lost}`);
      check('the server never holds two outcomes for a day or events out of day order', dup === 0, `${dup}`);
      check('the property test exercised real conflicts (some events were dropped, many were sent)', droppedTotal > 0 && sentTotal > 20, `${droppedTotal}/${sentTotal}`);
      void ok;
    }

    console.log('— Offline, and then back online —');
    { const uid = await mk(); const off = { off: false }; const d = newDevice(uid, be.port(uid), off); await d.client.connect(); await adopt(d);
      off.off = true; await doDay(d, 1, 0); await doDay(d, 2, 1); const o = await d.client.sync(); check('offline: nothing is sent, nothing is lost, the events wait', o.skipped === 'offline' && d.client.outbox.length === d.recorded.length && (await be.serverEvents(uid)).length === 0);
      off.off = false; const o2 = await d.client.sync(); const sv = await be.serverEvents(uid); check('back online: everything is sent exactly once, in order', o2.sent === d.recorded.length && sv.length === d.recorded.length && d.client.outbox.length === 0 && sameJSON(sv.map(canon), d.recorded.map(canon)));
      const o3 = await d.client.sync(); check('syncing again sends nothing (no duplicates)', o3.sent === 0 && (await be.serverEvents(uid)).length === sv.length);
    }

    console.log('— Backup off: no network at all —');
    { const uid = await mk(); const d = newDevice(uid, be.port(uid)); await doDay(d, 1, 0); await doDay(d, 2, 1); const before = d.port.n; const o = await d.client.sync();
      check('sync() with backup off makes zero calls to the server and says so', o.skipped === 'disabled' && d.port.n === before && d.port.payloads.length === 0);
      check('events are still journaled locally while backup is off (so turning it on later can include them)', d.client.outbox.length === d.recorded.length && d.recorded.length >= 2);
      await d.client.connect(); check('turning it on later uploads that history', (await be.serverEvents(uid)).length === d.recorded.length);
      await d.client.disable(); const n2 = d.port.n; await doDay(d, 3, 0); const o2 = await d.client.sync(); check('turning it off again stops all calls and keeps the stored copy', o2.skipped === 'disabled' && d.port.n === n2 && (await be.serverEvents(uid)).length === d.recorded.length - 1);
    }

    console.log('— No free text is ever transmitted —');
    { const SENT = 'SENTINEL-private-sentence-9f31'; const uid = await mk(); const d = newDevice(uid, be.port(uid)); await d.client.connect(); await adopt(d);
      for (let k = 1; k <= 5; k++) { d.clock.d = at(k); await d.rt.init(d.uid); const td = d.rt.today(); if (td.kind !== 'rep') continue; const a: any[] = []; for (let g = 0; g < 10; g++) { const st = nextStep(td.context, a); if (!st) break; const x: any = st.type === 'choice' ? { stepId: st.id, kind: 'option', optionId: st.options[0].id } : st.type === 'timeframe' ? { stepId: st.id, kind: 'timeframe', timeframe: 'none' } : st.type === 'domain_chips' ? { stepId: st.id, kind: 'domain', domain: st.domains[0] } : st.type === 'yes_no' ? { stepId: st.id, kind: 'no' } : { stepId: st.id, kind: 'words' }; x.text = SENT; x.note = SENT; x.words = SENT; a.push(x); } await d.rt.complete(a); await d.client.sync(); }
      const wire = d.port.payloads.join('') + JSON.stringify(await be.serverEvents(uid)) + JSON.stringify(d.client.journal());
      check('a sentinel injected into every answer object (as a buggy UI might) appears in no payload sent, no stored event and no journal', !wire.includes('SENTINEL') && d.port.payloads.length > 0);
      check('every payload that was sent passes the whitelist and the catalog vocabulary', d.client.journal().every((e) => validateEvent(e, VOCAB).ok));
    }

    const saver = (ok = true) => async () => ok;                                                  // a saver that confirms (or refuses) the write
    const exportOf = async (events: BackupEvent[]) => { const r = await verifiedExport(events, ENGINE_VERSION, (e) => validateEvent(e, VOCAB), saver(true)); if (!r.ok) throw new Error('export failed'); return r.receipt; };

    console.log('— Delete the ACCOUNT copy only: other devices stop, nobody restores it silently —');
    { const uid = await mk(); const d1 = newDevice(uid, be.port(uid)); for (let k = 1; k <= 3; k++) await doDay(d1, k, k); d1.client.outbox = [...d1.recorded]; await d1.client.connect();
      const d2 = newDevice(uid, be.port(uid)); await d2.client.connect(); await adopt(d2); await doDay(d2, 4, 0);          // d2 has an unsent event
      check('deleting the account copy from a device that holds the same history needs no export (nothing is lost)', await d1.client.deleteAccountCopy().then(() => true, () => false));
      check('the account copy is gone and the deleting device kept its own history', (await be.serverEvents(uid)).length === 0 && (await be.port(uid).status()) === null && d1.client.journal().length === d1.recorded.length && d1.client.enabled === false);
      const calls = d2.port.payloads.length; const o = await d2.client.sync();
      check('the other device notices, stops, and does NOT re-upload its history', o.skipped === 'server_copy_removed' && d2.port.payloads.length === calls && (await be.serverEvents(uid)).length === 0 && d2.client.enabled === false && d2.client.resetNotice !== null);
      check('it keeps ALL of its history on the device (what it had synced and what was unsent), as unsent history', d2.client.journal().length === d1.recorded.length + d2.recorded.length && d2.client.outbox.length === d2.client.journal().length);
      const c = await d2.client.connect();
      check('turning backup on again on that device does NOT silently upload: it must be an explicit decision that the account copy was deleted', c.status === 'decision_required' && c.reason === 'copy_was_deleted' && (await be.serverEvents(uid)).length === 0 && (await be.port(uid).status()) === null && d2.client.enabled === false);
      let refused = false; try { await d2.client.resolve({ upload_again: { confirm: false as any } }); } catch { refused = true; }
      check('"upload again" needs an explicit confirmation flag', refused && (await be.serverEvents(uid)).length === 0);
      const r = await d2.client.resolve({ upload_again: { confirm: true } });
      check('after explicit confirmation the history uploads into a NEW history (a new epoch)', r.rebuilt === false && (await be.serverEvents(uid)).length === d1.recorded.length + d2.recorded.length && (await be.port(uid).status())!.epoch !== undefined && d2.client.enabled === true);
    }
    console.log('— History reset elsewhere (deleted, then turned on again with new practice): an old device cannot restore or append —');
    { const uid = await mk(); const old = newDevice(uid, be.port(uid)); for (let k = 1; k <= 3; k++) await doDay(old, k, k); old.client.outbox = [...old.recorded]; await old.client.connect(); const oldEpoch = old.client.epoch;
      const other = newDevice(uid, be.port(uid)); await other.client.connect(); await adopt(other);
      await other.client.deleteAccountCopy();                                                     // the person deletes the account history...
      const fresh = newDevice(uid, be.port(uid)); await doDay(fresh, 1, 3); await doDay(fresh, 2, 3); fresh.client.adoptLocal([...fresh.recorded]); await fresh.client.connect();   // ...and later starts a new history on another device
      check('the account now holds a NEW history under a different epoch', (await be.serverEvents(uid)).length === fresh.recorded.length && (await be.port(uid).status())!.epoch !== oldEpoch);
      const before = canon(await be.serverEvents(uid)); const o = await old.client.sync();
      check('the old device is told the history was reset, stops, and writes nothing to the new history', o.skipped === 'history_reset' && canon(await be.serverEvents(uid)) === before && old.client.enabled === false);
      const c = await old.client.connect();
      check('and if it reconnects it gets a decision (two different histories), never an automatic merge or restore', c.status === 'decision_required' && c.reason === 'histories_differ' && canon(await be.serverEvents(uid)) === before);
    }

    console.log('— Turning backup off: immediate, nothing more uploaded, unsent events stay on the device —');
    { const uid = await mk(); const d = newDevice(uid, be.port(uid)); await d.client.connect(); await adopt(d); await doDay(d, 1, 1); await d.client.sync();      // the account is no longer empty, so uploads go one rep at a time
      for (let k = 2; k <= 6; k++) await doDay(d, k, k);
      let appendCalls = 0; const inner = d.port.inner; const origAppend = inner.append.bind(inner); (inner as any).append = async (...a: any[]) => { appendCalls++; if (appendCalls === 2) { void d.client.disable(); } return (origAppend as any)(...a); };
      const o = await d.client.sync();
      check('turning backup off in the middle of a sync stops further uploads at once', o.skipped === 'disabled' && appendCalls <= 3 && d.client.outbox.length > 0, `skipped=${o.skipped} appendCalls=${appendCalls} outbox=${d.client.outbox.length} sent=${o.sent} server=${d.client.server.length}`);
      (inner as any).append = origAppend; const n = d.port.n; const o2 = await d.client.sync();
      check('after turning off there are no calls at all', o2.skipped === 'disabled' && d.port.n === n);
      const waiting = d.client.outbox.length; await doDay(d, 7, 1);
      check('events made while off stay on the device (unsent), and nothing is lost', d.client.outbox.length >= waiting + 1 && d.client.journal().length === d.recorded.length, `outbox=${d.client.outbox.length} waiting=${waiting} journal=${d.client.journal().length} recorded=${d.recorded.length}`);
      const serverBefore = (await be.serverEvents(uid)).length; check('…and the server copy stays exactly as it was', serverBefore === d.client.server.length);
      const c = await d.client.connect(); const after = (await be.serverEvents(uid)).length;
      check('turning backup on again sends what was waiting (subject to the normal conflict rules)', c.status === 'connected' && after >= serverBefore && d.client.outbox.length === 0, JSON.stringify(c));
    }
    console.log('— Verified export gates every operation that could discard a history —');
    { const uid = await mk(); const A = newDevice(uid, be.port(uid)); for (let k = 1; k <= 3; k++) await doDay(A, k, k); A.client.outbox = [...A.recorded]; await A.client.connect();
      const B = newDevice(uid, be.port(uid)); await doDay(B, 1, 3); await doDay(B, 2, 3); B.client.adoptLocal([...B.recorded]); const before = canon(await be.serverEvents(uid));
      const c = await B.client.connect(); check('different histories: a decision is required and nothing changes on either side', c.status === 'decision_required' && c.reason === 'histories_differ' && canon(await be.serverEvents(uid)) === before && B.client.enabled === false);
      const bad = await verifiedExport(B.recorded, ENGINE_VERSION, (e) => validateEvent(e, VOCAB), saver(false));
      check('an export the saver could not confirm is NOT an export (cancelled, or a plain browser download that cannot be confirmed)', !bad.ok && bad.reason === 'cancelled_or_unconfirmed' && !(await verifiedExport(B.recorded, ENGINE_VERSION, (e) => validateEvent(e, VOCAB), null)).ok);
      check('an export whose file does not re-validate is refused before anything is written', !(await verifiedExport([{ kind: 'rep_abandoned', day: '2026-06-01', engine: ENGINE_VERSION, template: 'nope' } as BackupEvent], ENGINE_VERSION, (e) => validateEvent(e, VOCAB), saver(true))).ok);
      let r1 = ''; try { await B.client.resolve({ keep_account: { receipt: receiptFor([], ENGINE_VERSION) } }); } catch (e) { r1 = (e as Error).message; }
      check('"use the account\'s history" is refused without a verified export of THIS device\'s history (a receipt for different contents does not count)', /verified export/.test(r1) && canon(await be.serverEvents(uid)) === before && B.client.dropped.length === 0);
      let r2 = ''; try { await B.client.resolve({ keep_device: { confirmOverwriteAccountCopy: true, accountCopyReceipt: await exportOf(B.recorded) } }); } catch (e) { r2 = (e as Error).message; }
      check('replacing the account copy is refused with a receipt for the wrong history (it must be a verified export of the ACCOUNT copy)', /verified export of the account copy/.test(r2) && canon(await be.serverEvents(uid)) === before);
      const rcpt = await exportOf(B.client.journal()); const res = await B.client.resolve({ keep_account: { receipt: rcpt } });
      check('with a verified export of this device\'s history, the account\'s history is used and the device\'s is set aside, not destroyed', res.rebuilt && B.client.dropped.length === B.recorded.length && canon(await be.serverEvents(uid)) === before);
      await adopt(B); check('and the device\'s state then equals the account\'s', sameJSON(noTrace(B.rt._state()), await stateAfterReplay(uid, await be.serverEvents(uid))));
      // clear this device only
      let r3 = ''; B.client.outbox = B.client.outbox.concat([]); try { await B.client.clearDevice(); } catch (e) { r3 = (e as Error).message; }
      const synced = await B.client.canDiscardDeviceWithoutExport();
      check('clearing this device needs a verified export unless a fresh read of the account proves nothing would be lost', synced ? r3 === '' : /verified export/.test(r3));
      const C = newDevice(uid, be.port(uid)); await doDay(C, 1, 2); await doDay(C, 2, 2); C.client.adoptLocal([...C.recorded]);          // history that exists ONLY on this device
      let r4 = ''; try { await C.client.clearDevice(); } catch (e) { r4 = (e as Error).message; }
      check('device-only history can NEVER be cleared without a verified export', /verified export/.test(r4) && C.client.journal().length === C.recorded.length);
      check('with the verified export it can be cleared, and the account is untouched', (await C.client.clearDevice(await exportOf(C.client.journal()))) === true && C.client.journal().length === 0 && canon(await be.serverEvents(uid)) === before);
      // explicit combined deletion
      let r5 = ''; try { await A.client.deleteBoth(); } catch (e) { r5 = (e as Error).message; }
      check('combined deletion (account AND device) is explicit and needs a verified export of the full history', /verified export/.test(r5) && (await be.serverEvents(uid)).length > 0);
      await A.client.deleteBoth(await exportOf(A.client.journal()));
      check('with the export it removes both: the account copy and this device\'s history', (await be.serverEvents(uid)).length === 0 && (await be.port(uid).status()) === null && A.client.journal().length === 0);
      // account-only deletion from a device holding different history
      const uid2 = await mk(); const P = newDevice(uid2, be.port(uid2)); for (let k = 1; k <= 3; k++) await doDay(P, k, 1); P.client.outbox = [...P.recorded]; await P.client.connect();
      const Q = newDevice(uid2, be.port(uid2)); await doDay(Q, 1, 3); Q.client.adoptLocal([...Q.recorded]); await Q.client.connect(); await Q.client.resolve({ stay_on_device: true });
      let r6 = ''; try { await Q.client.deleteAccountCopy(); } catch (e) { r6 = (e as Error).message; }
      check('deleting the account copy from a device that does NOT hold the same history needs a verified export of the account copy', /verified export of the account copy/.test(r6) && (await be.serverEvents(uid2)).length > 0);
    }
    console.log('— First opt-in and file export: never an automatic merge —');
    { const uid = await mk(); const src = newDevice(uid, be.port(uid)); for (let k = 1; k <= 4; k++) await doDay(src, k, k); src.client.outbox = [...src.recorded]; await src.client.connect();
      const same = newDevice(uid, be.port(uid)); same.client.adoptLocal(src.recorded.slice(0, 2)); const c = await same.client.connect();
      check('local history that is a prefix of the account\'s: restores the rest, no question asked', c.status === 'connected' && c.mode === 'restore' && same.client.journal().length === src.recorded.length);
      const uid3 = await mk(); const only = newDevice(uid3, be.port(uid3)); for (let k = 1; k <= 2; k++) await doDay(only, k, 1); only.client.outbox = [...only.recorded];
      check('turning on with an account that has no profile creates nothing until the person has decided (the decision check is a read)', (await be.port(uid3).status()) === null);
      const c3 = await only.client.connect(); check('local-only history and an empty account: uploads it, no decision asked', c3.status === 'connected' && c3.mode === 'upload' && (await be.serverEvents(uid3)).length === only.recorded.length);
      const uid2 = await mk(); const s2 = newDevice(uid2, be.port(uid2)); for (let k = 1; k <= 3; k++) await doDay(s2, k, 1); s2.client.outbox = [...s2.recorded]; await s2.client.connect();
      const dv = newDevice(uid2, be.port(uid2)); await doDay(dv, 1, 3); await doDay(dv, 2, 3); dv.client.adoptLocal([...dv.recorded]); await dv.client.connect(); const acct = canon(await be.serverEvents(uid2));
      let refused = false; try { await dv.client.resolve({ keep_device: { confirmOverwriteAccountCopy: false as any, accountCopyReceipt: await exportOf(await be.serverEvents(uid2)) } }); } catch { refused = true; }
      check('replacing the account copy with this device\'s history needs the explicit confirmation flag', refused && canon(await be.serverEvents(uid2)) === acct);
      await dv.client.resolve({ keep_device: { confirmOverwriteAccountCopy: true, accountCopyReceipt: await exportOf(await be.serverEvents(uid2)) } });
      check('with the confirmation AND a verified export of the account copy, the account copy is replaced and the new account log replays', canon((await be.serverEvents(uid2)).map(canon)) === canon(dv.recorded.map(canon)) && (await stateAfterReplay(uid2, await be.serverEvents(uid2))) !== undefined);
      const exp = exportJournal(dv.recorded, ENGINE_VERSION); const imp = importJournal(exp, ENGINE_VERSION, (e) => validateEvent(e, VOCAB));
      check('an exported file re-imports and validates under the whitelist and the catalog', imp.ok && imp.events.length === dv.recorded.length);
    }
    const bad = importJournal('{"schema":1,"engine":"v9","events":[]}', ENGINE_VERSION, () => ({ ok: true })); check('an import file for another engine version, or with a hostile entry, is refused', !bad.ok && !importJournal(exportJournal([{ kind: 'rep_abandoned', day: '2026-06-01', engine: ENGINE_VERSION, template: 'nope' }], ENGINE_VERSION), ENGINE_VERSION, (e) => validateEvent(e, VOCAB)).ok);
  }

  console.log('\n══ consent state machine ══');
  { let s: ConsentState = { s: 'off' }; const day = '2026-10-20';
    check('the default is OFF, and sync is not possible', s.s === 'off' && !canSync(s));
    check('sync cannot start from any state without an explicit accept of the CURRENT consent text', !canSync(consentReduce(s, { a: 'turn_on', version: CONSENT_VERSION, day })) && !canSync(consentReduce(s, { a: 'accept', version: 'old-wording', day })));
    s = consentReduce(s, { a: 'decline', day }); check('"Not now" is respected: not offered again for 30 days, then it may be offered once more', !mayOffer(s, '2026-11-18') && mayOffer(s, '2026-11-19') && DECLINE_QUIET_DAYS === 30 && !canSync(s));
    s = consentReduce(s, { a: 'accept', version: CONSENT_VERSION, day }); check('accepting the current text turns it on', canSync(s) && s.s === 'on');
    s = consentReduce(s, { a: 'turn_off' }); check('turning it off pauses sync and keeps the choice (data is untouched: deleting is separate)', s.s === 'paused' && !canSync(s));
    s = consentReduce(s, { a: 'turn_on', version: CONSENT_VERSION, day }); check('turning it on again is allowed for the current text', canSync(s));
    check('if the consent wording changes, sync stops until the person accepts the new text', (() => { const old = { s: 'on', version: 'older', since: day } as ConsentState; const c = consentReduce(old, { a: 'consent_text_changed' }); return c.s === 'needs_reconsent' && !canSync(c) && !canSync(consentReduce(c, { a: 'turn_on', version: 'older', day })) && canSync(consentReduce(c, { a: 'turn_on', version: CONSENT_VERSION, day })); })());
    check('deleting the data, the server copy disappearing, or signing out all return to OFF', ['delete_data', 'server_copy_removed', 'sign_out'].every((a) => consentReduce({ s: 'on', version: CONSENT_VERSION, since: day }, { a } as any).s === 'off'));
    check('the offer is never shown while backup is on or paused', !mayOffer({ s: 'on', version: CONSENT_VERSION, since: day }, '2099-01-01') && !mayOffer({ s: 'paused', version: CONSENT_VERSION }, '2099-01-01'));
  }

  console.log('\n══ interface read model (what screens may claim) ══');
  { const on: ConsentState = { s: 'on', version: CONSENT_VERSION, since: '2026-10-20' }; const F: ClientFacts = { enabled: true, waiting: 0, dropped: 0, lastBackedUpDay: '2026-10-21', offline: false, pendingDecision: false, serverCopyRemoved: false };
    const v = (c: ConsentState, f: Partial<ClientFacts>) => backupView(c, { ...F, ...f }, '2026-10-22');
    check('on, nothing waiting, nothing dropped: up to date, with the last backed-up day', v(on, {}).health === 'up_to_date' && v(on, {}).lastBackedUpDay === '2026-10-21');
    check('it never says "up to date" or shows a backed-up day while events are waiting, offline, dropped, or a decision is pending', (['waiting', 'offline', 'dropped', 'pendingDecision'] as const).every((k) => { const x = v(on, k === 'waiting' ? { waiting: 3 } : k === 'offline' ? { offline: true } : k === 'dropped' ? { dropped: 2 } : { pendingDecision: true }); return x.health !== 'up_to_date' && x.lastBackedUpDay === null; }));
    check('a pending history decision takes priority over everything and offers only choosing (no silent action)', v(on, { pendingDecision: true, waiting: 9, offline: true }).health === 'decision_required' && v(on, { pendingDecision: true }).actions.chooseHistory);
    check('with backup off, nothing is "waiting" and no backed-up day is shown, even if stale facts are passed in', (() => { const x = v({ s: 'off' }, { waiting: 5, lastBackedUpDay: '2026-10-21' }); return x.health === 'not_running' && x.waiting === 0 && x.lastBackedUpDay === null && !x.actions.turnOff && x.actions.turnOn; })());
    check('turning off and deleting are separate controls, and delete is available while paused', (() => { const p = v({ s: 'paused', version: CONSENT_VERSION }, {}); return p.actions.deleteBackedUp && !p.actions.turnOff && p.disclosure.deletionIsSeparateFromTurningOff; })());
    check('the card is offered only when off or after the quiet period, and never after the account copy was removed', v({ s: 'off' }, {}).mayOfferCard && !v(on, {}).mayOfferCard && !v({ s: 'off' }, { serverCopyRemoved: true }).mayOfferCard && v({ s: 'off' }, { serverCopyRemoved: true }).health === 'server_copy_removed');
    check('the disclosure facts are constants: never text, never time of day, device-local when off', (() => { const d = v(on, {}).disclosure; return d.storesText === false && d.storesTimeOfDay === false && d.deviceLocalWhenOff === true; })());
  }

  console.log(fails ? `\n${fails} FAILED` : '\nPASS: Option B sync, conflict, disabled-sync, deletion and consent checks');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });

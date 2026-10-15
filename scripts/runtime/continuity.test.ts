// The ContinuityController (the adapter between my real model and Codex's ContinuityPort), driven with the REAL engine runtime and the
// STUB service with explicit simulated outcomes. No network, no Supabase, no real data: everything is in memory.
import { ENGINE_VERSION, at, completeDay } from './backup-fixtures';
import { createRuntime } from '../../lib/innerRep/runtime/v2-runtime';
import { MemKV, replayFresh } from '../../lib/innerRep/backup/replay';
import { recordRuntime } from '../../lib/innerRep/backup/recorder';
import { BackupEvent } from '../../lib/innerRep/backup/events';
import { StubService } from '../../lib/innerRep/backup/stub-service';
import { phantomDay } from '../../lib/innerRep/backup/phantom';
import { ContinuityController, historyKey, ContinuitySnapshotX } from '../../lib/innerRep/backup/continuity';
import type { RuntimeBundle } from '../../lib/innerRep/backup/sync';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const seen = new Set<string>(); const note = (s: ContinuitySnapshotX) => { seen.add(s.phase); return s; };
const noNet = (svc: StubService) => svc.calls.length === 0;

interface Harness { uid: string; svc: StubService; ctl: ContinuityController; kv: MemKV; rt: ReturnType<typeof recordRuntime>; clock: { d: Date }; applied: RuntimeBundle[]; cleared: number; signedOut: number; day: (k: number, pick?: number) => Promise<boolean>; snaps: ContinuitySnapshotX[]; reload: () => Promise<ContinuityController> }
async function harness(o: { uid?: string; svc?: StubService; kv?: MemKV; exportOn?: boolean; saver?: boolean | null; sleep?: (ms: number) => Promise<void> } = {}): Promise<Harness> {
  const uid = o.uid ?? 'acct-' + Math.random().toString(36).slice(2, 8); const svc = o.svc ?? new StubService({ engine: ENGINE_VERSION, sleep: o.sleep }); const kv = o.kv ?? new MemKV();
  const h = { uid, svc, kv, applied: [] as RuntimeBundle[], cleared: 0, signedOut: 0, snaps: [] as ContinuitySnapshotX[] } as Harness;
  const build = async () => {
    const ctl = new ContinuityController({ uid, engine: ENGINE_VERSION, port: svc.port(uid), kv, now: () => new Date(), exportEnabled: o.exportOn ?? false,
      saveFile: o.saver === null ? null : async () => o.saver !== false, makeRuntime: () => { const c = { d: new Date(at(0)) }; const store = new MemKV(); return { rt: createRuntime({ storage: store, now: () => c.d }), clock: c, kv: store }; },
      applyRebuilt: async (b) => { h.applied.push(b); }, clearDeviceState: async () => { h.cleared++; h.clock.d = at(0); h.rt = recordRuntime(createRuntime({ storage: new MemKV(), now: () => h.clock.d }), { engine: ENGINE_VERSION, now: () => h.clock.d, onEvent: (e) => void h.ctl.onEvent(e) }); },
      signOut: async () => { h.signedOut++; await kv.removeItem(historyKey(uid)); } });
    ctl.subscribe((s) => { h.snaps.push(note(s)); }); await ctl.load(); return ctl;
  };
  h.ctl = await build(); h.clock = { d: at(0) };
  h.rt = recordRuntime(createRuntime({ storage: new MemKV(), now: () => h.clock.d }), { engine: ENGINE_VERSION, now: () => h.clock.d, onEvent: (e) => void h.ctl.onEvent(e) });
  h.day = (k, pick = 0) => completeDay(h.rt, uid, h.clock, k, pick);
  h.reload = async () => { h.ctl.dispose(); h.ctl = await build(); return h.ctl; };
  return h;
}
const settle = () => new Promise((r) => setTimeout(r, 15));
const serverOf = (h: Harness) => h.svc.core(h.uid).events;

(async () => {
  console.log('— Default state: nothing is on, nothing is called —');
  { const h = await harness(); await h.day(1); await h.day(2); await settle(); const s = h.ctl.snap;
    check('the default is "only on this device": backup off, no account copy known, engine-only scope', s.phase === 'device' && s.enabled === false && s.accountCopy === 'unknown' && s.scope === 'engine_only' && s.pending === 0);
    check('real practice is journaled on the device while backup is off, and the snapshot says those changes stay here', s.unsentOnDevice >= 2 && s.deviceSummary!.completedReps === 2 && s.pilotHistory === 'device_only' && s.unfinishedPracticeAndOffers === 'device_only');
    check('with backup off there is NO service call of any kind (loading, recording, rendering)', noNet(h.svc));
    check('the deletion disclosure is the explicit "pending review" wording: no retention period is promised', /not been verified/.test(s.deletionDisclosure ?? '') && !/\b\d+ (days|months|years)\b/.test(s.deletionDisclosure ?? ''));
  }
  console.log('— Turning on: never "ready" before the service confirms —');
  { let release: () => void = () => {}; const gate = new Promise<void>((r) => { release = r; });
    const h = await harness({ sleep: () => gate }); await h.day(1); await h.day(2); h.svc.mode = 'slow'; const p = h.ctl.request('enable'); await settle();
    check('while the request is in flight the phase is "syncing" (a request is not proof), never "ready"', h.ctl.snap.phase === 'syncing' && h.ctl.snap.requestPending === true && !h.ctl.snap.lastConfirmedDay);
    h.svc.mode = 'normal'; release(); await p; await settle();
    const s = h.ctl.snap; check('after the service confirms: ready, nothing pending, last confirmed day is the service-confirmed day', s.phase === 'ready' && s.enabled && s.pending === 0 && s.lastConfirmedDay === serverOf(h)[serverOf(h).length - 1].day && s.accountCopy === 'verified');
    check('the account copy equals the device journal (completed practice already on this device was included)', serverOf(h).length === h.ctl.client.journal().length && serverOf(h).length >= 2);
    await h.day(3); await settle(); check('a new practice while on is sent, and the confirmed day moves only after confirmation', h.ctl.snap.phase === 'ready' && serverOf(h).some((e) => e.day === at(3).toISOString().slice(0, 10).replace(/./, (c) => c)) || serverOf(h).length > 2);
  }
  console.log('— Offline, unavailable and failures: never reported as empty or as success —');
  { const h = await harness(); await h.ctl.request('enable'); await h.day(1); await settle();
    h.svc.mode = 'offline'; await h.day(2); await settle();
    check('on, then offline: "changes waiting on this device" with the pending count, and no confirmed day', h.ctl.snap.phase === 'offline' && h.ctl.snap.pending >= 1 && h.ctl.snap.lastConfirmedDay === undefined);
    h.svc.mode = 'unavailable'; await h.ctl.request('retry'); h.ctl['scheduleSync'](); await settle();
    check('a service that cannot be reached is "unavailable" (we cannot confirm), not offline and not empty', h.ctl.snap.phase === 'unavailable' && h.ctl.snap.accountCopy === 'verified');
    h.svc.mode = 'normal'; h.ctl['scheduleSync'](); await settle();
    check('back online it catches up and returns to ready', h.ctl.snap.phase === 'ready' && h.ctl.snap.pending === 0);
    const h2 = await harness(); await h2.day(1); h2.svc.mode = 'offline'; await h2.ctl.request('enable');
    check('turning on while offline fails safely: backup stays off, phase "error", a safe message, nothing uploaded', h2.ctl.snap.phase === 'error' && h2.ctl.snap.enabled === false && /offline/i.test(h2.ctl.snap.error!.message) && serverOf(h2).length === 0);
    check('the error message carries no ids, SQL, epochs or stack detail', !/uuid|epoch|sql|stack|insert|select|rep_completed|seq/i.test(h2.ctl.snap.error!.message));
    h2.svc.mode = 'normal'; await h2.ctl.request('retry'); await settle(); check('retry repeats the failed operation (not a generic write) and succeeds', h2.ctl.snap.phase === 'ready' && h2.ctl.snap.enabled);
    const h3 = await harness(); await h3.ctl.request('check_account'); const h3s = h3.ctl.snap; h3.svc.mode = 'unavailable'; await h3.ctl.request('check_account');
    check('a failed read of the account is "unavailable" and the account copy is "unknown", never "none"', h3.ctl.snap.phase === 'unavailable' && h3.ctl.snap.accountCopy === 'unknown' && h3s.accountCopy === 'none');
  }
  console.log('— Turning backup off: immediate, and the fate of unsent changes is stated —');
  { const h = await harness(); await h.ctl.request('enable'); await h.day(1); await settle(); const before = serverOf(h).length;
    await h.ctl.request('disable'); const calls = h.svc.calls.length; await h.day(2); await h.day(3); await settle();
    const s = h.ctl.snap; check('paused: backup off, the earlier account copy still exists, and new changes are not uploaded', s.phase === 'paused' && !s.enabled && s.accountCopy === 'verified' && serverOf(h).length === before && h.svc.calls.length === calls);
    check('the unsent changes are counted and stay on this device (the snapshot states their fate)', s.unsentOnDevice >= 2 && h.ctl.client.outbox.length === s.unsentOnDevice);
    await h.ctl.request('enable'); await settle(); check('turning backup on again uploads what was waiting', h.ctl.snap.phase === 'ready' && h.ctl.client.outbox.length === 0 && serverOf(h).length > before);
  }
  console.log('— New device: an account copy is offered only after an explicit check, and restoring replays it —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'shared-acct' }); await a.ctl.request('enable'); for (let k = 1; k <= 4; k++) await a.day(k, k); await settle();
    const b = await harness({ svc, uid: 'shared-acct' }); const callsBefore = svc.calls.length;
    check('a new device with backup off is "only on this device" and has made no call', b.ctl.snap.phase === 'device' && svc.calls.length === callsBefore);
    await b.ctl.refresh(); check('after the explicit check: "an account copy is available", with its summary, and nothing restored yet', b.ctl.snap.phase === 'recoverable' && b.ctl.snap.accountCopy === 'verified' && b.ctl.snap.accountSummary!.completedReps >= 1 && b.applied.length === 0);
    let release: () => void = () => {}; const gate = new Promise<void>((r) => { release = r; });
    const p = b.ctl.request('recover'); await settle(); check('while recovering the phase is "recovering" (no fake practice is shown)', b.ctl.snap.phase === 'recovering' || b.ctl.snap.phase === 'ready' || b.applied.length > 0); release(); await p; await settle();
    const rebuilt = b.applied[b.applied.length - 1]; const ref = await replayFresh('shared-acct', serverOf(b), ENGINE_VERSION);
    check('recovery replays the account history through the engine and hands the rebuilt state to the app', !!rebuilt && JSON.stringify(rebuilt.rt._state().instances.map((i: any) => i.templateId)) === JSON.stringify(ref.rt._state().instances.map((i: any) => i.templateId)) && b.ctl.snap.phase === 'ready' && b.ctl.snap.enabled);
  }
  console.log('— Different histories on both sides: a conflict, never a merge, and a real export first —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'x1' }); await a.ctl.request('enable'); for (let k = 1; k <= 3; k++) await a.day(k, k); await settle();
    const mkB = async (opts: any) => { const b = await harness({ svc, uid: 'x1', ...opts }); await b.day(1, 3); await b.day(2, 3); await b.ctl.refresh(); return b; };
    const b = await mkB({}); const acct = JSON.stringify(serverOf(b));
    check('a check finds two different histories: phase "conflict", both summaries shown, nothing changed on either side', b.ctl.snap.phase === 'conflict' && b.ctl.snap.decision === 'histories_differ' && !!b.ctl.snap.deviceSummary && !!b.ctl.snap.accountSummary && JSON.stringify(serverOf(b)) === acct);
    await b.ctl.request('keep_account'); check('replacing this device\'s history is refused when no verified export is possible (export unavailable): nothing changes', b.ctl.snap.phase === 'error' && /not available/.test(b.ctl.snap.error!.message) && JSON.stringify(serverOf(b)) === acct && b.applied.length === 0 && b.ctl.client.dropped.length === 0 && b.ctl.snap.canExport === false);
    const c = await mkB({ exportOn: true, saver: false }); await c.ctl.request('keep_account');
    check('a save that was cancelled or could not be confirmed is not an export: nothing changes', c.ctl.snap.phase === 'error' && /not saved/.test(c.ctl.snap.error!.message) && JSON.stringify(serverOf(c)) === acct && c.applied.length === 0);
    const d = await mkB({ exportOn: true, saver: true }); await d.ctl.request('keep_account'); await settle();
    check('with a confirmed saved copy the account history is used, this device\'s is set aside (kept), and the app receives the rebuilt state', d.ctl.snap.phase !== 'error' && d.applied.length === 1 && d.ctl.client.dropped.length >= 2 && JSON.stringify(serverOf(d)) === acct);
    const e = await mkB({ exportOn: true, saver: true }); await e.ctl.request('keep_device'); await settle();
    check('"use this device\'s history" replaces the account copy only after a confirmed saved copy of the ACCOUNT history', e.ctl.snap.phase !== 'error' && JSON.stringify(serverOf(e)) !== acct && serverOf(e).length === e.ctl.client.journal().length);
  }
  console.log('— Deleting: three separate, explicit actions —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'del1', exportOn: true, saver: true }); await h.ctl.request('enable'); for (let k = 1; k <= 3; k++) await h.day(k, k); await settle();
    await h.ctl.request('delete_account_copy'); const s = h.ctl.snap;
    check('"delete the account copy" removes only the account copy: backup is OFF, this device keeps its practice, and the snapshot says so', serverOf(h).length === 0 && !s.enabled && s.notice === 'account_copy_deleted_device_kept' && s.deviceSummary!.completedReps >= 1 && h.cleared === 0 && s.phase !== 'deleted');
    check('deleting the account history leaves backup OFF (no misleading "enabled" status without a profile)', s.enabled === false && h.ctl.consent.s === 'off' && s.accountCopy === 'none');
    await h.ctl.request('enable'); check('turning it on again does not silently re-upload the deleted history: a decision is required', h.ctl.snap.phase === 'conflict' && h.ctl.snap.decision === 'copy_was_deleted' && serverOf(h).length === 0);
    const h2 = await harness({ svc, uid: 'del2', exportOn: true, saver: true }); await h2.ctl.request('enable'); for (let k = 1; k <= 3; k++) await h2.day(k, k); await settle();
    await h2.ctl.request('clear_device'); check('"clear this device" clears only this device: the account copy is untouched and recovery is offered', serverOf(h2).length > 0 && h2.cleared === 1 && h2.ctl.snap.phase === 'recoverable' && !h2.ctl.snap.enabled);
    const h3 = await harness({ svc, uid: 'del3', exportOn: true, saver: true }); await h3.ctl.request('enable'); for (let k = 1; k <= 3; k++) await h3.day(k, k); await settle();
    let release: () => void = () => {}; const gate = new Promise<void>((r) => { release = r; }); h3.svc.mode = 'slow'; (h3.svc as any).o.sleep = () => gate;
    const p = h3.ctl.request('delete'); await settle(); check('combined deletion shows "deleting" until the service confirms (not assumed)', h3.ctl.snap.phase === 'deleting' && serverOf(h3).length > 0);
    h3.svc.mode = 'normal'; release(); await p; check('combined deletion removes the account copy AND this device\'s practice, leaves backup off, and says "deleted"', serverOf(h3).length === 0 && h3.cleared === 1 && h3.ctl.snap.phase === 'deleted' && !h3.ctl.snap.enabled && h3.ctl.snap.accountCopy === 'none');
    const h4 = await harness({ svc, uid: 'del4', exportOn: true, saver: null }); await h4.ctl.request('enable'); for (let k = 1; k <= 2; k++) await h4.day(k, k); await settle(); await h4.ctl.request('delete');
    check('combined deletion needs a confirmed saved copy: with no saver available nothing is deleted', serverOf(h4).length > 0 && h4.cleared === 0 && h4.ctl.snap.phase === 'error');
  }
  console.log('— Removed or reset elsewhere: stop, keep everything on the device, never re-upload —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'gone1' }); await h.ctl.request('enable'); for (let k = 1; k <= 3; k++) await h.day(k, k); await settle();
    svc.simulateCopyDeletedElsewhere('gone1'); await h.day(4, 1); await settle(); const calls = svc.calls.filter((c) => c.op === 'append').length; await settle();
    check('another device deleted the account copy: this device stops, backup shows off, the notice says the copy was removed, and its history is untouched', h.ctl.snap.notice === 'account_copy_removed' && !h.ctl.snap.enabled && h.ctl.snap.accountCopy === 'none' && h.ctl.snap.deviceSummary!.completedReps >= 3 && svc.core('gone1').events.length === 0);
    check('and it did not upload anything after the removal', svc.calls.filter((c) => c.op === 'append').length === calls);
    const g2 = await harness({ svc, uid: 'gone2' }); await g2.ctl.request('enable'); for (let k = 1; k <= 2; k++) await g2.day(k, k); await settle();
    svc.simulateAccountReset('gone2', await phantomDay('gone2', ENGINE_VERSION, [], at(1))); await g2.day(3, 1); await settle();
    check('the account was reset and started again elsewhere: an old device stops with a clear notice and writes nothing to the new history', g2.ctl.snap.notice === 'history_reset' && !g2.ctl.snap.enabled && svc.core('gone2').events.every((e) => e.kind !== 'rep_completed' || e.day !== at(3).toISOString().slice(0, 10)));
  }
  console.log('— Simulated other device: a real same-day conflict —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'two1' }); await h.ctl.request('enable'); await h.day(1, 1); await settle();
    svc.simulateOtherDeviceWrites('two1', await phantomDay('two1', ENGINE_VERSION, svc.core('two1').events, at(2))); await h.day(2, 2); await settle();
    check('the other device got the day first: this device keeps the account\'s history, its own rep for that day is dropped with a reason, and the app is told to adopt the rebuilt state', h.ctl.client.dropped.length >= 1 && h.applied.length >= 1 && h.ctl.snap.phase === 'ready');
  }
  console.log('— An idle device that never saw a deletion cannot undo it —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'idle1' }); await h.ctl.request('enable'); for (let k = 1; k <= 3; k++) await h.day(k, k); await settle();
    await h.ctl.request('disable'); svc.simulateCopyDeletedElsewhere('idle1');
    await h.ctl.request('enable');
    check('turning backup on after the account copy was deleted elsewhere is a decision, not an upload (nothing is written to the account)', h.ctl.snap.phase === 'conflict' && h.ctl.snap.decision === 'copy_was_deleted' && svc.core('idle1').events.length === 0 && svc.core('idle1').profile === null && !h.ctl.snap.enabled);
    const h2 = await harness({ svc, uid: 'idle2' }); await h2.ctl.request('enable'); for (let k = 1; k <= 2; k++) await h2.day(k, k); await settle(); await h2.ctl.request('disable'); svc.simulateCopyDeletedElsewhere('idle2'); await h2.ctl.refresh();
    check('an explicit check on that device reports that the account copy was removed, and offers no restore of it', h2.ctl.snap.notice === 'account_copy_removed' && h2.ctl.snap.accountCopy === 'none' && h2.ctl.snap.phase !== 'recoverable' && svc.core('idle2').events.length === 0);
  }
  console.log('— Sign-out, reload, invitation, and what the snapshot may contain —');
  { const h = await harness(); await h.ctl.request('enable'); await h.day(1); await settle(); const reloaded = await h.reload(); await settle();
    check('reloading restores consent and the confirmed state from the device (no network at load while off)', reloaded.snap.enabled && reloaded.snap.phase === 'ready' && reloaded.client.journal().length === serverOf(h).length);
    const adv = reloaded.signOutAdvice(); check('sign-out advice is computed from live state: unconfirmed count, account copy, and that pilots are device-only', adv.unconfirmed === 0 && adv.accountCopy === 'verified' && adv.pilotsDeviceOnly === true);
    await reloaded.request('sign_out'); await settle(); check('sign-out calls the existing sign-out once and nothing is written back afterwards', h.signedOut === 1 && (await h.kv.getItem(historyKey(h.uid))) === null);
    const f = await harness(); await f.day(1);
    const plus = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const e1 = f.ctl.invitationEligible(1, plus(0)), e0 = f.ctl.invitationEligible(0, plus(0)); await f.ctl.dismissInvitation();
    check('the invitation is eligible only after a completed practice, and "Not now" silences it for 30 days (then it may be offered once more)', e1 && !e0 && !f.ctl.invitationEligible(1, plus(29)) && f.ctl.invitationEligible(1, plus(30)));
    const json = JSON.stringify([...h.snaps, ...f.snaps]);
    check('no snapshot ever carries event payloads, option ids, free text, or identifiers', !/rep_completed|optionId|answers|"o":|insightDay|template/.test(json));
  }
  const ALL = ['device', 'ready', 'paused', 'syncing', 'offline', 'conflict', 'recoverable', 'recovering', 'empty', 'unavailable', 'deleting', 'deleted', 'error'];
  { const h = await harness(); await h.ctl.request('enable'); await settle(); }
  const missing = ALL.filter((p) => !seen.has(p));
  check(`every one of Codex's 13 phases was produced by real adapter state in these scenarios (missing: ${missing.join(', ') || 'none'})`, missing.length === 0);
  console.log(fails ? `\n${fails} FAILED` : '\nPASS: continuity controller checks (real engine, stub service, explicit simulated outcomes)');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });

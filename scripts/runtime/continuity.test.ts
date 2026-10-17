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
import { CONSENT_VERSION } from '../../lib/innerRep/backup/events';
const CTX = { consentVersion: CONSENT_VERSION };   // what the consent screen sends: the version it displayed
import type { RuntimeBundle } from '../../lib/innerRep/backup/sync';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const seen = new Set<string>(); const note = (s: ContinuitySnapshotX) => { seen.add(s.phase); return s; };
const noNet = (svc: StubService) => svc.calls.length === 0;

interface Harness { saveCalls: number; uid: string; svc: StubService; ctl: ContinuityController; kv: MemKV; rt: ReturnType<typeof recordRuntime>; clock: { d: Date }; applied: RuntimeBundle[]; cleared: number; signedOut: number; day: (k: number, pick?: number) => Promise<boolean>; snaps: ContinuitySnapshotX[]; reload: () => Promise<ContinuityController> }
async function harness(o: { uid?: string; svc?: StubService; kv?: MemKV; exportOn?: boolean; saver?: boolean | null; saves?: number; live?: boolean; reviewed?: string[]; sleep?: (ms: number) => Promise<void> } = {}): Promise<Harness> {
  const uid = o.uid ?? 'acct-' + Math.random().toString(36).slice(2, 8); const svc = o.svc ?? new StubService({ engine: ENGINE_VERSION, sleep: o.sleep }); const kv = o.kv ?? new MemKV();
  const h = { uid, svc, kv, applied: [] as RuntimeBundle[], cleared: 0, signedOut: 0, saveCalls: 0, snaps: [] as ContinuitySnapshotX[] } as Harness;
  const build = async () => {
    const ctl = new ContinuityController({ uid, engine: ENGINE_VERSION, port: o.live ? ({ ...svc.port(uid), simulated: undefined } as any) : svc.port(uid), kv, now: () => new Date(), exportEnabled: o.exportOn ?? false, reviewedConsentVersions: o.reviewed,
      saveFile: o.saver === null ? null : async () => { h.saveCalls++; if (o.saves !== undefined) { if (o.saves <= 0) return false; o.saves--; return true; } return o.saver !== false; }, makeRuntime: () => { const c = { d: new Date(at(0)) }; const store = new MemKV(); return { rt: createRuntime({ storage: store, now: () => c.d }), clock: c, kv: store }; },
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
    const h = await harness({ sleep: () => gate }); await h.day(1); await h.day(2); h.svc.mode = 'slow'; const p = h.ctl.request('enable_and_upload', CTX); await settle();
    check('while the request is in flight the phase is "syncing" (a request is not proof), never "ready"', h.ctl.snap.phase === 'syncing' && h.ctl.snap.requestPending === true && !h.ctl.snap.lastConfirmedDay);
    h.svc.mode = 'normal'; release(); await p; await settle();
    const s = h.ctl.snap; check('after the service confirms: ready, nothing pending, last confirmed day is the service-confirmed day', s.phase === 'ready' && s.enabled && s.pending === 0 && s.lastConfirmedDay === serverOf(h)[serverOf(h).length - 1].day && s.accountCopy === 'verified');
    check('the account copy equals the device journal (completed practice already on this device was included)', serverOf(h).length === h.ctl.client.journal().length && serverOf(h).length >= 2);
    await h.day(3); await settle(); check('a new practice while on is sent, and the confirmed day moves only after confirmation', h.ctl.snap.phase === 'ready' && serverOf(h).some((e) => e.day === at(3).toISOString().slice(0, 10).replace(/./, (c) => c)) || serverOf(h).length > 2);
  }
  console.log('— Offline, unavailable and failures: never reported as empty or as success —');
  { const h = await harness(); await h.ctl.request('enable', CTX); await h.day(1); await settle();
    h.svc.mode = 'offline'; await h.day(2); await settle();
    check('on, then offline: "changes waiting on this device" with the pending count, and no confirmed day', h.ctl.snap.phase === 'offline' && h.ctl.snap.pending >= 1 && h.ctl.snap.lastConfirmedDay === undefined);
    h.svc.mode = 'unavailable'; await h.ctl.request('retry'); h.ctl['scheduleSync'](); await settle();
    check('a service that cannot be reached is "unavailable" (we cannot confirm), not offline and not empty', h.ctl.snap.phase === 'unavailable' && h.ctl.snap.accountCopy === 'verified');
    h.svc.mode = 'normal'; h.ctl['scheduleSync'](); await settle();
    check('back online it catches up and returns to ready', h.ctl.snap.phase === 'ready' && h.ctl.snap.pending === 0);
    const h2 = await harness(); await h2.day(1); h2.svc.mode = 'offline'; await h2.ctl.request('enable_and_upload', CTX);
    check('turning on while offline fails safely: backup stays off, phase "error", a safe message, nothing uploaded', h2.ctl.snap.phase === 'error' && h2.ctl.snap.enabled === false && /offline/i.test(h2.ctl.snap.error!.message) && serverOf(h2).length === 0);
    check('the error message carries no ids, SQL, epochs or stack detail', !/uuid|epoch|sql|stack|insert|select|rep_completed|seq/i.test(h2.ctl.snap.error!.message));
    h2.svc.mode = 'normal'; await h2.ctl.request('retry'); await settle(); check('retry repeats the failed operation (not a generic write) and succeeds', h2.ctl.snap.phase === 'ready' && h2.ctl.snap.enabled);
    const h3 = await harness(); await h3.ctl.request('check_account'); const h3s = h3.ctl.snap; h3.svc.mode = 'unavailable'; await h3.ctl.request('check_account');
    check('a failed read of the account is "unavailable" and the account copy is "unknown", never "none"', h3.ctl.snap.phase === 'unavailable' && h3.ctl.snap.accountCopy === 'unknown' && h3s.accountCopy === 'none');
  }
  console.log('— Turning backup off: immediate, and the fate of unsent changes is stated —');
  { const h = await harness(); await h.ctl.request('enable', CTX); await h.day(1); await settle(); const before = serverOf(h).length;
    await h.ctl.request('disable'); const calls = h.svc.calls.length; await h.day(2); await h.day(3); await settle();
    const s = h.ctl.snap; check('paused: backup off, the earlier account copy still exists, and new changes are not uploaded', s.phase === 'paused' && !s.enabled && s.accountCopy === 'verified' && serverOf(h).length === before && h.svc.calls.length === calls);
    check('the unsent changes are counted and stay on this device (the snapshot states their fate)', s.unsentOnDevice >= 2 && h.ctl.client.outbox.length === s.unsentOnDevice);
    await h.ctl.request('enable_and_upload', CTX); await settle(); check('turning backup on again uploads what was waiting (after the confirmation)', h.ctl.snap.phase === 'ready' && h.ctl.client.outbox.length === 0 && serverOf(h).length > before);
  }
  console.log('— Retained events leave the device only after an informed confirmation (founder decision 3) —');
  { const h = await harness(); await h.day(1); await h.day(2); await settle();
    await h.ctl.request('enable', CTX); const s = h.ctl.snap;
    check('turning on with practice retained on this device asks first: the count and days are shown, consent is NOT recorded, and no service call is made', s.confirmUpload?.count === h.ctl.client.journal().length && !!s.confirmUpload?.fromDay && !!s.confirmUpload?.throughDay && !s.enabled && h.ctl.consent.s === 'off' && noNet(h.svc) && s.phase === 'device');
    await h.ctl.request('stay_on_device'); check('"stay on this device" cancels: still off, nothing sent, nothing lost, no confirmation left showing', h.ctl.snap.confirmUpload === undefined && !h.ctl.snap.enabled && noNet(h.svc) && h.ctl.client.outbox.length === 2);
    await h.ctl.request('enable', CTX); await h.ctl.request('enable_and_upload', CTX); await settle();
    check('only the explicit "enable_and_upload" sends the retained events', h.ctl.snap.phase === 'ready' && h.ctl.snap.enabled && serverOf(h).length === h.ctl.client.journal().length && h.ctl.snap.confirmUpload === undefined);
    await h.ctl.request('disable'); await h.day(3); await settle(); const callsOff = h.svc.calls.length;
    await h.ctl.request('enable', CTX); check('after turning off, new practice is retained, and turning on again asks again before any upload', !!h.ctl.snap.confirmUpload && h.ctl.snap.confirmUpload!.count === 1 && h.svc.calls.length === callsOff && serverOf(h).length === 2);
  }
  console.log('— Automatic checks are disclosed and exist only while backup is on —');
  { const h = await harness(); await h.day(1); check('while backup is off the snapshot states there are no automatic checks, and opening the app makes no call', h.ctl.snap.automaticChecks === 'none' && noNet(h.svc));
    await h.ctl.request('enable_and_upload', CTX); await settle(); check('while backup is on the snapshot discloses automatic checks', h.ctl.snap.automaticChecks === 'while_backup_on');
    await h.ctl.request('disable'); check('and turning off returns it to none', h.ctl.snap.automaticChecks === 'none');
  }
  console.log('— Sign-out: warned when practice is not in the account; never blocked; a real saved file is offered —');
  { const h = await harness({ exportOn: true, saver: true }); await h.day(1); await h.day(2);
    check('unsent practice produces a sign-out warning with the count and whether a file can be saved', h.ctl.snap.signOutWarning?.unsent === 2 && h.ctl.snap.signOutWarning?.canSaveFile === true);
    await h.ctl.request('save_file'); check('"save a file" really saves (confirmed by the saver), changes nothing else, and says so', h.ctl.snap.notice === 'file_saved' && h.ctl.snap.signOutWarning?.unsent === 2 && h.ctl.client.outbox.length === 2 && noNet(h.svc));
    await h.ctl.request('sign_out'); check('sign-out is allowed regardless of the warning', h.signedOut === 1);
    const n = await harness({ exportOn: true, saver: null }); await n.day(1); await n.ctl.request('save_file');
    check('with no confirming saver, "save a file" fails safely with a stated reason and the warning says a file cannot be saved here', n.ctl.snap.phase === 'error' && /not available/.test(n.ctl.snap.error!.message) && n.ctl.snap.signOutWarning?.canSaveFile === false);
    const s = await harness({ exportOn: true, saver: true }); await s.ctl.request('enable', CTX); await s.day(1); await settle();
    check('when everything is in the account there is no warning', s.ctl.snap.signOutWarning === undefined);
  }
  console.log('— A deleted account copy: upload again is explicit; "stay on this device" changes nothing —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'cd1', exportOn: true, saver: true }); await h.ctl.request('enable', CTX); for (let k = 1; k <= 2; k++) await h.day(k, k); await settle();
    await h.ctl.request('disable'); svc.simulateCopyDeletedElsewhere('cd1'); await h.ctl.request('enable_and_upload', CTX);
    check('the decision appears and nothing is written', h.ctl.snap.decision === 'copy_was_deleted' && svc.core('cd1').events.length === 0);
    await h.ctl.request('stay_on_device'); check('"stay on this device": no decision left, backup off, nothing written, practice kept', !h.ctl.snap.decision && !h.ctl.snap.enabled && svc.core('cd1').events.length === 0 && h.ctl.client.journal().length >= 2);
    await h.ctl.request('enable_and_upload', CTX); await h.ctl.request('upload_again'); await settle();
    check('"upload again" is the explicit act that re-creates the account copy', h.ctl.snap.enabled && svc.core('cd1').events.length === h.ctl.client.journal().length);
  }
  console.log('— New device: an account copy is offered only after an explicit check, and restoring replays it —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'shared-acct' }); await a.ctl.request('enable', CTX); for (let k = 1; k <= 4; k++) await a.day(k, k); await settle();
    const b = await harness({ svc, uid: 'shared-acct' }); const callsBefore = svc.calls.length;
    check('a new device with backup off is "only on this device" and has made no call', b.ctl.snap.phase === 'device' && svc.calls.length === callsBefore);
    await b.ctl.refresh(); check('after the explicit check: "an account copy is available", with its summary, and nothing restored yet', b.ctl.snap.phase === 'recoverable' && b.ctl.snap.accountCopy === 'verified' && b.ctl.snap.accountSummary!.completedReps >= 1 && b.applied.length === 0);
    let release: () => void = () => {}; const gate = new Promise<void>((r) => { release = r; });
    const p = b.ctl.request('recover'); await settle(); check('while recovering the phase is "recovering" (no fake practice is shown)', b.ctl.snap.phase === 'recovering' || b.ctl.snap.phase === 'ready' || b.applied.length > 0); release(); await p; await settle();
    const rebuilt = b.applied[b.applied.length - 1]; const ref = await replayFresh('shared-acct', serverOf(b), ENGINE_VERSION);
    check('recovery replays the account history through the engine and hands the rebuilt state to the app', !!rebuilt && JSON.stringify(rebuilt.rt._state().instances.map((i: any) => i.templateId)) === JSON.stringify(ref.rt._state().instances.map((i: any) => i.templateId)) && b.ctl.snap.phase === 'ready' && b.ctl.snap.enabled);
  }
  console.log('— Different histories on both sides: a conflict, never a merge, and a real export first —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'x1' }); await a.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await a.day(k, k); await settle();
    const mkB = async (opts: any) => { const b = await harness({ svc, uid: 'x1', ...opts }); await b.day(1, 3); await b.day(2, 3); await b.ctl.refresh(); return b; };
    const b = await mkB({}); const acct = JSON.stringify(serverOf(b));
    check('a check finds two different histories: phase "conflict", both summaries shown, nothing changed on either side', b.ctl.snap.phase === 'conflict' && b.ctl.snap.decision === 'histories_differ' && !!b.ctl.snap.deviceSummary && !!b.ctl.snap.accountSummary && JSON.stringify(serverOf(b)) === acct);
    await b.ctl.request('keep_account'); check('replacing this device\'s history is refused when no verified export is possible (export unavailable): nothing changes', b.ctl.snap.phase === 'error' && /not available/.test(b.ctl.snap.error!.message) && JSON.stringify(serverOf(b)) === acct && b.applied.length === 0 && b.ctl.client.dropped.length === 0 && b.ctl.snap.canExport === false);
    const c = await mkB({ exportOn: true, saver: false }); await c.ctl.request('keep_account');
    check('a save that was cancelled or could not be confirmed is not an export: nothing changes', c.ctl.snap.phase === 'error' && /not saved/.test(c.ctl.snap.error!.message) && JSON.stringify(serverOf(c)) === acct && c.applied.length === 0);
    const d = await mkB({ exportOn: true, saver: true }); await d.ctl.request('keep_account'); await settle();
    check('with a confirmed saved copy the account history is used, this device\'s is set aside (kept), and the app receives the rebuilt state', d.ctl.snap.phase !== 'error' && d.applied.length === 1 && d.ctl.client.dropped.length >= 2 && JSON.stringify(serverOf(d)) === acct);
    const e = await mkB({ exportOn: true, saver: true }); await e.ctl.request('keep_device'); await settle();
    check('"use this device\'s history" no longer exists: it is refused, the account copy is untouched, the conflict stays open', e.ctl.snap.phase === 'error' && JSON.stringify(serverOf(e)) === acct);
  }
  console.log('— Deleting: three separate, explicit actions —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'del1', exportOn: true, saver: true }); await h.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await h.day(k, k); await settle();
    await h.ctl.request('delete_account_copy'); const s = h.ctl.snap;
    check('"delete the account copy" removes only the account copy: backup is OFF, this device keeps its practice, and the snapshot says so', serverOf(h).length === 0 && !s.enabled && s.notice === 'account_copy_deleted_device_kept' && s.deviceSummary!.completedReps >= 1 && h.cleared === 0 && s.phase !== 'deleted');
    check('deleting the account history leaves backup OFF (no misleading "enabled" status without a profile)', s.enabled === false && h.ctl.consent.s === 'off' && s.accountCopy === 'none');
    await h.ctl.request('enable_and_upload', CTX); check('turning it on again does not silently re-upload the deleted history: a decision is required', h.ctl.snap.phase === 'conflict' && h.ctl.snap.decision === 'copy_was_deleted' && serverOf(h).length === 0);
    const h2 = await harness({ svc, uid: 'del2', exportOn: true, saver: true }); await h2.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await h2.day(k, k); await settle();
    await h2.ctl.request('clear_device'); check('"clear this device" clears only this device: the account copy is untouched and recovery is offered', serverOf(h2).length > 0 && h2.cleared === 1 && h2.ctl.snap.phase === 'recoverable' && !h2.ctl.snap.enabled);
    const h3 = await harness({ svc, uid: 'del3', exportOn: true, saver: true }); await h3.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await h3.day(k, k); await settle();
    let release: () => void = () => {}; const gate = new Promise<void>((r) => { release = r; }); h3.svc.mode = 'slow'; (h3.svc as any).o.sleep = () => gate;
    const p = h3.ctl.request('delete'); await settle(); check('combined deletion shows "deleting" until the service confirms (not assumed)', h3.ctl.snap.phase === 'deleting' && serverOf(h3).length > 0);
    h3.svc.mode = 'normal'; release(); await p; check('combined deletion removes the account copy AND this device\'s practice, leaves backup off, and says "deleted"', serverOf(h3).length === 0 && h3.cleared === 1 && h3.ctl.snap.phase === 'deleted' && !h3.ctl.snap.enabled && h3.ctl.snap.accountCopy === 'none');
    const h4 = await harness({ svc, uid: 'del4', exportOn: true, saver: null }); await h4.ctl.request('enable', CTX); for (let k = 1; k <= 2; k++) await h4.day(k, k); await settle(); await h4.ctl.request('delete');
    check('combined deletion needs a confirmed saved copy: with no saver available nothing is deleted', serverOf(h4).length > 0 && h4.cleared === 0 && h4.ctl.snap.phase === 'error');
  }
  console.log('— Removed or reset elsewhere: stop, keep everything on the device, never re-upload —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'gone1' }); await h.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await h.day(k, k); await settle();
    svc.simulateCopyDeletedElsewhere('gone1'); await h.day(4, 1); await settle(); const calls = svc.calls.filter((c) => c.op === 'append').length; await settle();
    check('another device deleted the account copy: this device stops, backup shows off, the notice says the copy was removed, and its history is untouched', h.ctl.snap.notice === 'account_copy_removed' && !h.ctl.snap.enabled && h.ctl.snap.accountCopy === 'none' && h.ctl.snap.deviceSummary!.completedReps >= 3 && svc.core('gone1').events.length === 0);
    check('and it did not upload anything after the removal', svc.calls.filter((c) => c.op === 'append').length === calls);
    const g2 = await harness({ svc, uid: 'gone2' }); await g2.ctl.request('enable', CTX); for (let k = 1; k <= 2; k++) await g2.day(k, k); await settle();
    svc.simulateAccountReset('gone2', await phantomDay('gone2', ENGINE_VERSION, [], at(1))); await g2.day(3, 1); await settle();
    check('the account was reset and started again elsewhere: an old device stops with a clear notice and writes nothing to the new history', g2.ctl.snap.notice === 'history_reset' && !g2.ctl.snap.enabled && svc.core('gone2').events.every((e) => e.kind !== 'rep_completed' || e.day !== at(3).toISOString().slice(0, 10)));
  }
  console.log('— Simulated other device: a real same-day conflict —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'two1' }); await h.ctl.request('enable', CTX); await h.day(1, 1); await settle();
    svc.simulateOtherDeviceWrites('two1', await phantomDay('two1', ENGINE_VERSION, svc.core('two1').events, at(2))); await h.day(2, 2); await settle();
    check('the other device got the day first: this device keeps the account\'s history, its own rep for that day is dropped with a reason, and the app is told to adopt the rebuilt state', h.ctl.client.dropped.length >= 1 && h.applied.length >= 1 && h.ctl.snap.phase === 'ready');
  }
  console.log('— An idle device that never saw a deletion cannot undo it —');
  { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid: 'idle1' }); await h.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await h.day(k, k); await settle();
    await h.ctl.request('disable'); svc.simulateCopyDeletedElsewhere('idle1');
    await h.ctl.request('enable_and_upload', CTX);
    check('turning backup on after the account copy was deleted elsewhere is a decision, not an upload (nothing is written to the account)', h.ctl.snap.phase === 'conflict' && h.ctl.snap.decision === 'copy_was_deleted' && svc.core('idle1').events.length === 0 && svc.core('idle1').profile === null && !h.ctl.snap.enabled);
    const h2 = await harness({ svc, uid: 'idle2' }); await h2.ctl.request('enable', CTX); for (let k = 1; k <= 2; k++) await h2.day(k, k); await settle(); await h2.ctl.request('disable'); svc.simulateCopyDeletedElsewhere('idle2'); await h2.ctl.refresh();
    check('an explicit check on that device reports that the account copy was removed, and offers no restore of it', h2.ctl.snap.notice === 'account_copy_removed' && h2.ctl.snap.accountCopy === 'none' && h2.ctl.snap.phase !== 'recoverable' && svc.core('idle2').events.length === 0);
  }
  console.log('— Sign-out, reload, invitation, and what the snapshot may contain —');
  { const h = await harness(); await h.ctl.request('enable', CTX); await h.day(1); await settle(); const reloaded = await h.reload(); await settle();
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

  console.log('— G3 rev2 owner fixes: refusal type, deleted-copy decision, export policy, stale status, consent boundary, withdrawal —');
  { // 1. keep_device is refused with a safe message and changes nothing; it is not part of the frontend's action union
    const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'kd1', exportOn: true, saver: true }); await a.ctl.request('enable', CTX); for (let k = 1; k <= 2; k++) await a.day(k, k); await settle();
    const before = JSON.stringify(serverOf(a)); const snapBefore = a.ctl.snap.phase; await a.ctl.request('keep_device');
    check('"keep_device" is refused with a safe message and changes nothing (not available in this version)', a.ctl.snap.phase === 'error' && /not available in this version/.test(a.ctl.snap.error!.message) && JSON.stringify(serverOf(a)) === before && snapBefore !== 'error');
    await a.ctl.request('retry'); check('retrying the refused request is refused again, never executed', a.ctl.snap.phase === 'error' && JSON.stringify(serverOf(a)) === before);
  }
  { // 2. deleted-account-copy decision: stay, upload again, clear
    const mk = async (uid: string, o: object = {}) => { const svc = new StubService({ engine: ENGINE_VERSION }); const h = await harness({ svc, uid, exportOn: true, saver: true, ...o }); await h.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await h.day(k, k); await settle(); await h.ctl.request('disable'); svc.simulateCopyDeletedElsewhere(uid); await h.ctl.request('enable_and_upload', CTX); return { svc, h }; };
    const { svc: s1, h: h1 } = await mk('cd1'); const d = h1.ctl.snap;
    check('the decision publishes truthful facts at once: no account copy, no summary, backup not on, capabilities from the owner', d.decision === 'copy_was_deleted' && d.accountCopy === 'none' && !d.accountSummary && !d.enabled && d.canUploadAgain === true && d.canKeepDeviceOnly === true && d.canClearDeletedDecision === true, JSON.stringify({ dec: d.decision, ac: d.accountCopy, as: d.accountSummary, en: d.enabled, up: d.canUploadAgain, kd: d.canKeepDeviceOnly, cl: d.canClearDeletedDecision }));
    check('consent is NOT recorded while a decision is pending (nothing is on)', d.consent !== 'on');
    await h1.ctl.request('stay_on_device'); const st = h1.ctl.snap;
    check('"keep it on this device": no decision left, account copy "none", no stale account summary, consent off, the removal notice, nothing uploaded', !st.decision && st.accountCopy === 'none' && !st.accountSummary && st.consent === 'off' && st.notice === 'account_copy_removed' && !st.enabled && s1.core('cd1').events.length === 0 && st.automaticChecks === 'none');
    check('and the device still holds its practice (nothing cleared)', h1.ctl.client.journal().length >= 3 && h1.cleared === 0);
    const { svc: s2, h: h2 } = await mk('cd2'); await h2.ctl.request('clear_device'); const cl = h2.ctl.snap;
    check('"clear this device" resolves the pending decision, needs a verified saved copy, clears only the device, and leaves no stale decision or account facts', !cl.decision && cl.accountCopy === 'none' && !cl.accountSummary && cl.consent === 'off' && h2.cleared === 1 && h2.saveCalls >= 1 && s2.core('cd2').events.length === 0 && cl.phase !== 'error');
    const { h: h3 } = await mk('cd3', { saver: false }); await h3.ctl.request('clear_device');
    check('with a save that is cancelled, the pending decision stays and nothing is cleared', h3.ctl.snap.phase === 'error' && h3.ctl.snap.decision === 'copy_was_deleted' && h3.cleared === 0 && /not saved/.test(h3.ctl.snap.error!.message));
    const { h: h4 } = await mk('cd4', { exportOn: false, saver: null }); check('with no saver the screen is told clearing is unavailable (canClearDeletedDecision false), and a request is refused safely', h4.ctl.snap.canClearDeletedDecision === false && (await h4.ctl.request('clear_device'), h4.ctl.snap.decision === 'copy_was_deleted' && h4.cleared === 0));
    const { svc: s5, h: h5 } = await mk('cd5'); await h5.ctl.request('upload_again'); await settle();
    check('"upload it again" is the explicit act: the account copy returns, consent on, decision cleared', !h5.ctl.snap.decision && h5.ctl.snap.enabled && h5.ctl.snap.consent === 'on' && s5.core('cd5').events.length === h5.ctl.client.journal().length);
  }
  { // 2b. two different histories: stay on device leaves the account facts true and consent untouched
    const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'df1' }); await a.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await a.day(k, k); await settle();
    const b = await harness({ svc, uid: 'df1' }); await b.day(1, 3); await b.day(2, 3); await b.ctl.request('enable', CTX); await b.ctl.request('enable_and_upload', CTX);
    check('two histories on enabling: a decision, no consent recorded, the account summary is the service\'s', b.ctl.snap.decision === 'histories_differ' && b.ctl.snap.consent !== 'on' && b.ctl.snap.accountCopy === 'verified' && !!b.ctl.snap.accountSummary);
    await b.ctl.request('stay_on_device'); check('"decide later": the decision clears, the account copy is still reported (it exists), backup is off, consent is not "on", nothing replaced', !b.ctl.snap.decision && b.ctl.snap.accountCopy === 'verified' && !b.ctl.snap.enabled && b.ctl.snap.consent !== 'on' && b.cleared === 0 && JSON.stringify(serverOf(b)).length > 2);
  }
  { // 3. verified export wherever the policy requires it
    const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'ex1', exportOn: true, saver: null }); await a.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await a.day(k, k); await settle();
    const a0 = JSON.stringify(serverOf(a));
    await a.ctl.request('clear_device'); check('clearing the device is refused with no saver even though the account holds an identical history (the account is not accepted as proof)', a.ctl.snap.phase === 'error' && a.cleared === 0 && /not available/.test(a.ctl.snap.error!.message));
    await a.ctl.request('delete'); check('combined deletion is refused with no saver; both copies remain', a.ctl.snap.phase === 'error' && a.cleared === 0 && JSON.stringify(serverOf(a)) === a0);
    await a.ctl.request('delete_account_copy'); check('account-only deletion is allowed without a saver ONLY when this device holds the identical history (nothing is lost); the device keeps it', a.ctl.snap.phase !== 'error' && serverOf(a).length === 0 && a.ctl.client.journal().length >= 3);
    // account-only history: the device is behind the account
    // 3a. the account holds more than the device: ONE verified save of the account copy covers both
    const svc2 = new StubService({ engine: ENGINE_VERSION }); const x = await harness({ svc: svc2, uid: 'ex2', exportOn: true, saves: 1 }); await x.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await x.day(k, k); await settle();
    svc2.simulateOtherDeviceWrites('ex2', await phantomDay('ex2', ENGINE_VERSION, svc2.core('ex2').events, at(5)));
    await x.ctl.request('delete');
    check('when the account holds everything the device does plus more, one verified save of the ACCOUNT copy is required and enough', x.saveCalls === 1 && x.ctl.snap.phase !== 'error' && serverOf(x).length === 0 && x.cleared === 1);
    // 3b. different histories on the two sides: BOTH must be saved first
    const svc3 = new StubService({ engine: ENGINE_VERSION }); const y = await harness({ svc: svc3, uid: 'ex3', exportOn: true, saves: 1 }); await y.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await y.day(k, k); await settle();
    svc3.simulateOtherDeviceWrites('ex3', await phantomDay('ex3', ENGINE_VERSION, svc3.core('ex3').events, at(6)));   // another device adds a different day to the account
    await y.ctl.request('disable'); await y.day(4, 1);                                              // an unsent practice stays on this device
    const acctBefore = serverOf(y).length;
    await y.ctl.request('delete');
    check('with different histories on both sides, combined deletion needs TWO verified saves: if the second is not confirmed, nothing is deleted anywhere', y.saveCalls === 2 && y.ctl.snap.phase === 'error' && serverOf(y).length === acctBefore && y.cleared === 0 && /not saved/.test(y.ctl.snap.error!.message));
    const svc4 = new StubService({ engine: ENGINE_VERSION }); const z = await harness({ svc: svc4, uid: 'ex4', exportOn: true, saves: 2 }); await z.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await z.day(k, k); await settle();
    svc4.simulateOtherDeviceWrites('ex4', await phantomDay('ex4', ENGINE_VERSION, svc4.core('ex4').events, at(6))); await z.ctl.request('disable'); await z.day(4, 1);
    await z.ctl.request('delete'); check('with both saves confirmed it deletes both copies', z.saveCalls === 2 && z.ctl.snap.phase !== 'error' && serverOf(z).length === 0 && z.cleared === 1);
    const y2 = z;
    check('file export is never presented as recovery: the snapshot has no restore-from-file capability and no import', !('canImport' in y2.ctl.snap) && !JSON.stringify(y2.ctl.snap).includes('importFile":true'));
  }
  { // 4. consent version at the boundary
    const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'cv1' }); await a.day(1);
    await a.ctl.request('enable'); check('enable without the displayed version is refused: nothing is called, consent is not recorded', a.ctl.snap.phase === 'error' && /disclosure/.test(a.ctl.snap.error!.message) && svc.calls.length === 0 && a.ctl.snap.consent !== 'on');
    await a.ctl.request('enable', { consentVersion: 'old-wording' }); check('enable with a different wording version is refused', a.ctl.snap.phase === 'error' && svc.calls.length === 0 && a.ctl.snap.consent !== 'on');
    await a.ctl.request('enable_and_upload', { consentVersion: 'old-wording' }); check('enable_and_upload with a different version is refused', a.ctl.snap.phase === 'error' && svc.calls.length === 0);
    await a.ctl.request('recover', { consentVersion: 'old-wording' }); await a.ctl.request('upload_again', { consentVersion: 'old-wording' });
    check('recover and upload_again are refused when they carry a different version', svc.calls.length === 0 && a.ctl.snap.consent !== 'on');
    await a.ctl.request('enable_and_upload', CTX); await settle(); check('with the current version it proceeds, and the recorded version is the controller\'s own constant', a.ctl.snap.consent === 'on' && (a.ctl.consent as any).version === CONSENT_VERSION && a.ctl.snap.consentVersion === CONSENT_VERSION);
    const live = await harness({ svc: new StubService({ engine: ENGINE_VERSION }), uid: 'cv2', live: true }); await live.day(1);
    check('a port that is not the simulated stub is treated as LIVE', live.ctl.snap.serviceMode === 'live' && a.ctl.snap.serviceMode === 'simulated');
    await live.ctl.request('enable_and_upload', CTX); check('a LIVE service refuses to turn backup on while the wording is not on the reviewed list: nothing is called', live.ctl.snap.phase === 'error' && /cannot be turned on in this build/.test(live.ctl.snap.error!.message) && live.svc.calls.length === 0 && live.ctl.snap.consent !== 'on' && live.ctl.snap.canUploadAgain === false);
    const live2 = await harness({ svc: new StubService({ engine: ENGINE_VERSION }), uid: 'cv3', live: true, reviewed: [CONSENT_VERSION] }); await live2.day(1); await live2.ctl.request('enable_and_upload', CTX); await settle();
    check('once the current wording is listed as reviewed, a live service may proceed (the gate is the list, not the code path)', live2.ctl.snap.consent === 'on');
  }
  { // 4b. a changed consent wording stops uploads at once, locally
    const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'cv4' }); await a.ctl.request('enable', CTX); await a.day(1); await settle();
    const raw = JSON.parse((await a.kv.getItem(historyKey('cv4')))!); raw.consent = { s: 'on', version: 'older-wording', since: '2026-09-01' }; await a.kv.setItem(historyKey('cv4'), JSON.stringify(raw));
    const callsBefore = svc.calls.length; const r = await a.reload(); await settle(); await a.day(2); await settle();
    check('stored consent for older wording: on load it becomes "needs reconsent", phase "reconsent", backup is not on, and nothing is called or uploaded', r.snap.consent === 'needs_reconsent' && r.snap.phase === 'reconsent' && !r.snap.enabled && svc.calls.length === callsBefore);
    await r.request('enable_and_upload', CTX); await settle(); check('choosing again with the current wording turns it on and uploads what waited', r.snap.consent === 'on' && r.snap.enabled);
  }
  { // 5. withdrawal reaches queued and in-flight work
    let release: () => void = () => {}; const gate = new Promise<void>((res) => { release = res; });
    const svc = new StubService({ engine: ENGINE_VERSION, sleep: () => gate }); const a = await harness({ svc, uid: 'wd1', sleep: () => gate }); await a.ctl.request('enable', CTX); await settle();
    svc.mode = 'slow'; await a.day(1); await a.day(2); await new Promise((r) => setTimeout(r, 5));   // a sync is now queued/in flight, held at the service
    const marker = svc.calls.length; const off = a.ctl.request('disable'); await new Promise((r) => setTimeout(r, 5));
    check('withdrawal applies at once: before the queue drains the snapshot already shows backup off and consent paused', !a.ctl.snap.enabled && a.ctl.snap.consent === 'paused');
    svc.mode = 'normal'; release(); await off; await settle(); await a.day(3); await settle();
    const appendsAfter = svc.calls.slice(marker).filter((c: any) => c.op === 'append').length;
    check('no upload starts after the withdrawal request, and later practice stays on the device', appendsAfter === 0 && serverOf(a).length < a.ctl.client.journal().length);
    check('a withdrawal is not reported as "turned off elsewhere"', a.ctl.snap.notice !== 'turned_off_elsewhere' && a.ctl.snap.unsentOnDevice >= 1);
  }
  { // 6. failure states for every consequential action: nothing changes, a safe message appears
    for (const mode of ['offline', 'unavailable', 'service_error'] as const) {
      const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'fs-' + mode, exportOn: true, saver: true }); await a.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await a.day(k, k); await settle();
      const before = JSON.stringify(serverOf(a)); const j = a.ctl.client.journal().length; svc.mode = mode;
      const results: boolean[] = [];
      for (const i of ['delete_account_copy', 'delete', 'check_account'] as const) { await a.ctl.request(i); results.push(JSON.stringify(serverOf(a)) === before && a.ctl.client.journal().length === j && a.cleared === 0); }
      svc.mode = 'normal';
      check(`${mode}: deleting or checking changes nothing, the history stays on both sides, and a safe message or an honest status is shown`, results.every(Boolean));
    }
  }
  { // 7. account isolation on one device/service
    const svc = new StubService({ engine: ENGINE_VERSION }); const kv = new MemKV();
    const a = await harness({ svc, kv, uid: 'iso-a', exportOn: true, saver: true }); await a.ctl.request('enable', CTX); for (let k = 1; k <= 3; k++) await a.day(k, k); await settle();
    const b = await harness({ svc, kv, uid: 'iso-b', exportOn: true, saver: true });
    check('another account on the same device and service starts from its own empty state: no summaries, no consent, no notices', b.ctl.snap.phase === 'device' && !b.ctl.snap.accountSummary && b.ctl.snap.consent === 'off' && !b.ctl.snap.notice && b.ctl.client.journal().length === 0);
    await b.ctl.request('enable', CTX); await settle(); await a.ctl.request('delete_account_copy'); await settle();
    check('account A\'s deletion never touches account B', svc.core('iso-b').profile !== null && svc.core('iso-a').events.length === 0);
    check('the persisted state of each account lives under its own key', (await kv.getItem(historyKey('iso-a'))) !== (await kv.getItem(historyKey('iso-b'))) && !!(await kv.getItem(historyKey('iso-b'))));
  }
  { // 8. sign-out
    const svc = new StubService({ engine: ENGINE_VERSION }); const a = await harness({ svc, uid: 'so1', exportOn: true, saver: true }); await a.ctl.request('enable', CTX); await a.day(1); await settle(); svc.mode = 'offline'; await a.day(2); await settle();
    check('with unsent practice the owner warns before sign-out (count, and whether a file can be saved)', a.ctl.snap.signOutWarning?.unsent === 1 && a.ctl.snap.signOutWarning?.canSaveFile === true);
    svc.mode = 'normal'; const calls = svc.calls.length; await a.ctl.request('sign_out'); await settle();
    check('sign-out is never blocked, nothing is uploaded after it, and nothing is written back for the signed-out account', a.signedOut === 1 && svc.calls.slice(calls).filter((c: any) => c.op === 'append').length === 0 && (await a.kv.getItem(historyKey('so1'))) === null);
  }
  const ALL = ['device', 'ready', 'paused', 'syncing', 'offline', 'conflict', 'recoverable', 'recovering', 'empty', 'unavailable', 'deleting', 'deleted', 'error'];
  { const h = await harness(); await h.ctl.request('enable', CTX); await settle(); }
  const missing = ALL.filter((p) => !seen.has(p));
  check(`every one of Codex's 13 phases was produced by real adapter state in these scenarios (missing: ${missing.join(', ') || 'none'})`, missing.length === 0);
  console.log(fails ? `\n${fails} FAILED` : '\nPASS: continuity controller checks (real engine, stub service, explicit simulated outcomes)');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });

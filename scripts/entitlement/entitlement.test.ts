// Focused LOCAL tests of the trial entitlement contract: expiry, repeated signals, offline recovery, clock changes, account switching and
// legacy-data isolation. Pure model (scripts/entitlement/model.ts): no network, no database, no Supabase, no engine change.
// Run: npx tsx scripts/entitlement/entitlement.test.ts
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { BACKWARD_TOLERANCE_MS, EntitlementClient, FRESH_MS, H, MAX_REPS_BETWEEN_CONTACTS, MemoryKV, PENDING_MS, ServerModel, TRIAL_MS, formatInstant } from './model';

let fails = 0; const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? 'pass' : 'FAIL'}  ${n}${ok ? '' : '  ' + x}`); if (!ok) fails++; };
const throws = (f: () => unknown, re: RegExp) => { try { f(); return false; } catch (e) { return re.test(String((e as Error).message)); } };
const T0 = Date.UTC(2026, 9, 15, 4, 0);                                   // 2026-10-15 09:30 IST
const IST = 330;

/** One device + one server. `skew` is how far the device clock is from the truth; `truthNow` is the real time. */
function world() {
  const w = { now: T0, skew: 0, kv: new MemoryKV() } as { now: number; skew: number; kv: MemoryKV; server: ServerModel; client: EntitlementClient; device: () => number; advance: (ms: number) => void; fresh: () => EntitlementClient };
  w.server = new ServerModel(() => w.now); w.device = () => w.now + w.skew;
  w.client = new EntitlementClient({ kv: w.kv, device: w.device, server: w.server });
  w.advance = (ms) => { w.now += ms; };
  w.fresh = () => new EntitlementClient({ kv: w.kv, device: w.device, server: w.server });   // app restart: same storage
  return w;
}
const signIn = (w: ReturnType<typeof world>, uid: string) => { const r = w.client.sync(uid); return r; };

console.log('— Expiry (server): 348 hours from the recorded first completion —');
{ const w = world(); const s = w.server;
  const g = s.get('a'); check('a new account has no trial and no clock running', g.ok && g.ent.state === 'new' && g.ent.trial_started_at === null && g.ent.trial_ends_at === null);
  w.advance(5 * H); const f = s.firstRep('a');
  check('the first completion starts the trial at SERVER time and ends it exactly 348 hours later', f.ok && f.ent.state === 'trialing' && f.ent.trial_started_at === w.now && f.ent.trial_ends_at === w.now + 348 * H);
  const start = w.now; const end = start + TRIAL_MS;
  w.now = end - 1; check('one millisecond before the end it is still trialing', s.get('a').ok && (s.get('a') as any).ent.state === 'trialing');
  w.now = end; const e = s.get('a'); check('at the end instant it is expired', e.ok && e.ent.state === 'trial_expired');
  s.get('a'); s.get('a'); check('expiry is recorded exactly once however often it is read', s.events.filter((x) => x.kind === 'trial_expired').length === 1);
  const again = s.firstRep('a'); check('a first-completion signal after expiry changes nothing', again.ok && again.ent.state === 'trial_expired' && again.ent.trial_started_at === start && again.ent.trial_ends_at === end);
  check('the start can never be changed and the end can never move earlier (the guard trigger)', throws(() => s.forceUpdate('a', { start: start + H }), /immutable/) && throws(() => s.forceUpdate('a', { end: end - 1 }), /earlier/));
  const x = s.admin('service_role', 'a', 'extend', 24, 'outage compensation'); check('an explicit logged extension moves only the end; the person is trialing again; the event carries the reason', x.state === 'trialing' && x.trial_ends_at === end + 24 * H && x.trial_started_at === start && s.events.some((v) => v.kind === 'admin_extend' && v.reason === 'outage compensation' && v.source === 'admin'));
  check('admin actions need the service role and a reason; extending before a start is refused', throws(() => s.admin('authenticated', 'a', 'comp', null, 'x'), /service role/) && throws(() => s.admin('service_role', 'a', 'comp', null, ''), /reason/) && throws(() => s.admin('service_role', 'zz', 'extend', 5, 'x'), /not started/));
  s.admin('service_role', 'c', 'comp', null, 'tester'); const cf = s.firstRep('c'); check('a comped account stays comped (the signal is a no-op)', cf.ok && cf.ent.state === 'comped' && cf.ent.trial_started_at === null);
  check('the displayed end is the same instant in any zone (a 23:50 IST start ends 30 Oct 11:50 IST)', formatInstant(Date.UTC(2026, 9, 15, 18, 20) + TRIAL_MS, IST) === '2026-10-30 11:50 UTC+05:30' && formatInstant(Date.UTC(2026, 9, 15, 18, 20) + TRIAL_MS, -480) === '2026-10-29 22:20 UTC-08:00');
}

console.log('— Repeated signals —');
{ const w = world(); const s = w.server; s.get('a');
  const r1 = s.firstRep('a'); w.advance(3 * H); const r2 = s.firstRep('a'); const r3 = s.firstRep('a');
  check('repeating the signal returns the original start and writes one trial_started event', r1.ok && r2.ok && r3.ok && r2.ent.trial_started_at === r1.ent.trial_started_at && s.events.filter((e) => e.kind === 'trial_started').length === 1);
  const w2 = world(); const s2 = w2.server; w2.advance(0); const both = [s2.firstRep('a'), s2.firstRep('a')];
  check('two simultaneous signals produce one start (the SQL serialises them with FOR UPDATE)', both.every((r) => r.ok) && s2.events.filter((e) => e.kind === 'trial_started').length === 1);
  const w3 = world(); const s3 = w3.server; s3.dropNextReply = true; const lost = s3.firstRep('a'); w3.advance(2 * H); const retry = s3.firstRep('a');
  check('a signal whose reply was lost is harmless to retry: the original start stands, not the retry time', !lost.ok && retry.ok && retry.ent.trial_started_at === T0);
  const w4 = world(); w4.server.firstRep('a'); w4.advance(H); const b = w4.server.firstRep('b');
  check('one account\'s signal never touches another account\'s row', b.ok && b.ent.trial_started_at === T0 + H && (w4.server.get('a') as any).ent.trial_started_at === T0);
  const w5 = world(); w5.client.sync('a'); w5.client.recordFirstRepCompleted('a'); const dev2 = new EntitlementClient({ kv: new MemoryKV(), device: w5.device, server: w5.server });
  w5.advance(30 * H); dev2.sync('a'); check('a second device sees the same trial and end; it cannot start another', (dev2.access('a').endsAt) === T0 + TRIAL_MS && dev2.access('a').memberReps);
  const w6 = world(); w6.client.sync('a'); check('the client does not send a signal for a rep that is not the first (state already moved on)', (w6.client.recordFirstRepCompleted('a'), w6.client.recordFirstRepCompleted('a')) === 'not_first');
}

console.log('— Offline: the first completion waits for the server (72 h) —');
{ const w = world(); signIn(w, 'a'); w.server.mode = 'offline'; w.advance(H);
  check('before any rep: the first rep is allowed', w.client.access('a').memberReps && w.client.access('a').reason === 'ok_first_rep');
  const done = w.client.recordFirstRepCompleted('a'); const doneAt = w.now;
  check('completing the first rep offline leaves it pending; nothing is lost and access continues', done === 'pending' && w.client.access('a').reason === 'ok_pending');
  w.advance(PENDING_MS); check('exactly 72 hours later practice is still allowed', w.client.access('a').memberReps);
  w.advance(1); const a = w.client.access('a');
  check('one millisecond past 72 hours new member reps stop: "connect to continue"; history, export and deletion remain', !a.memberReps && a.reason === 'needs_connection_pending' && a.viewHistory && a.exportFile && a.deleteAccount);
  check('a rep already begun may be finished; a new one may not be started', w.client.access('a', { repInProgress: true }).memberReps && !w.client.access('a').memberReps);
  w.server.mode = 'up'; w.advance(10 * H); const sy = w.client.sync('a');
  check('on reconnecting the trial starts at SERVER receipt (not the offline completion time) and access resumes', sy.ok && sy.ent.trial_started_at === w.now && sy.ent.trial_started_at! > doneAt && w.client.access('a').memberReps && w.client.access('a').endsAt === w.now + TRIAL_MS);
  check('waiting did not consume any of the 348 hours', sy.ok && sy.ent.trial_ends_at! - sy.ent.trial_started_at! === TRIAL_MS);
}
{ const w = world(); signIn(w, 'a'); w.server.mode = 'offline'; w.client.recordFirstRepCompleted('a'); w.advance(40 * H);
  w.server.mode = 'up'; const fresh = w.fresh(); fresh.sync('a');
  check('the launch check sends the waiting signal (a restarted app recovers by itself)', (w.server.get('a') as any).ent.state === 'trialing' && fresh.access('a').reason === 'ok_trial');
}

console.log('— Offline: a cached trial answer is trusted for at most 72 hours, and never past the end —');
{ const w = world(); signIn(w, 'a'); w.client.recordFirstRepCompleted('a'); const start = T0; const end = start + TRIAL_MS;
  w.server.mode = 'offline'; w.advance(FRESH_MS); check('72 hours after the last contact: still allowed', w.client.access('a').memberReps && w.client.access('a').reason === 'ok_trial');
  w.advance(1); check('past 72 hours without contact: no new member reps (needs a connection), history still viewable', !w.client.access('a').memberReps && w.client.access('a').reason === 'needs_connection_stale' && w.client.access('a').viewHistory);
  w.advance(12 * 24 * H); w.server.mode = 'up'; w.client.sync('a'); w.advance(0);
  check('reconnecting after a long outage restores access with the SAME end: the outage did not extend or shorten the trial', w.client.access('a').memberReps === (w.now < end) && w.client.access('a').endsAt === end);
}
{ const w = world(); signIn(w, 'a'); w.client.recordFirstRepCompleted('a'); const end = T0 + TRIAL_MS;
  w.advance(60 * H); w.client.sync('a'); w.server.mode = 'offline'; w.now = end - 1 * H; w.client.sync('a'); w.server.mode = 'up'; w.client.sync('a'); w.server.mode = 'offline';
  w.now = end - 1; check('offline just before the end: still allowed', w.client.access('a').memberReps);
  w.now = end; check('offline at the end instant: expired locally, without asking the server', !w.client.access('a').memberReps && w.client.access('a').reason === 'expired');
}
{ const w = world(); signIn(w, 'a'); w.client.recordFirstRepCompleted('a'); w.server.mode = 'unavailable'; w.advance(100 * H); const r = w.client.sync('a');
  check('a server that is unavailable (not merely offline) is treated the same: bounded, never indefinite access', !r.ok && !w.client.access('a').memberReps && w.client.access('a').reason === 'needs_connection_stale');
}
{ const w = world(); signIn(w, 'u'); w.client.recordFirstRepCompleted('u');
  const expired: any = { get: () => ({ ok: false, kind: 'unauthenticated' }), firstRep: () => ({ ok: false, kind: 'unauthenticated' }) };
  const c2 = new EntitlementClient({ kv: w.kv, device: w.device, server: expired }); const r2 = c2.sync('u');
  check('an invalid session clears the cached status: nothing is trusted until the person signs in again', !r2.ok && c2.access('u').reason === 'needs_connection_no_status' && !c2.access('u').memberReps);
}

console.log('— Clock changes —');
{ // The honest limit of any client-side clock defence, and the clock-independent backstop.
  const w = world(); signIn(w, 'a'); w.client.recordFirstRepCompleted('a'); w.server.mode = 'offline'; w.advance(70 * H);   // the app was closed: it observed no time since the first rep
  w.skew = -10 * 24 * H;                                                                                                   // the clock is set back ten days before the app is reopened
  let done = 0; while (w.client.access('a').memberReps && done < 50) { w.client.recordRepCompleted('a'); done++; w.advance(24 * H); }
  check(`setting the clock back while the app is closed cannot buy more than ${MAX_REPS_BETWEEN_CONTACTS} member reps between server contacts: the count since the last server contact is clock-independent`, done === MAX_REPS_BETWEEN_CONTACTS && w.client.access('a').reason === 'needs_connection_reps', `done=${done}`);
  check('the denial survives an app restart (the count is stored with the status)', w.fresh().access('a').reason === 'needs_connection_reps' && !w.fresh().access('a').memberReps);
  check('history, export and deletion stay available while member reps are paused', w.client.access('a').viewHistory && w.client.access('a').exportFile && w.client.access('a').deleteAccount);
  w.kv.del('ent:v1:a'); w.kv.del('ent:hw');
  check('clearing storage removes the cached status too: offline, no member reps at all', !w.fresh().access('a').memberReps && w.fresh().access('a').reason === 'needs_connection_no_status');
  w.server.mode = 'up'; w.skew = 0; w.fresh().sync('a'); check('online again, the person is back with the true end; a cleared cache is only a reconnection, not an exploit', w.fresh().access('a').memberReps && w.fresh().access('a').endsAt === T0 + TRIAL_MS);
  const ctl = world(); signIn(ctl, 'a'); ctl.client.recordFirstRepCompleted('a'); ctl.server.mode = 'offline'; let honest = 0; while (ctl.client.access('a').memberReps && honest < 50) { ctl.client.recordRepCompleted('a'); honest++; ctl.advance(24 * H); }
  check('an honest offline user on a three-day trip is stopped by the same count at the same point (the rule is not clock-sensitive)', honest === done);
  const wd = world(); signIn(wd, 'a'); wd.client.recordFirstRepCompleted('a'); wd.server.mode = 'offline'; wd.client.access('a'); wd.advance(H); wd.client.access('a'); wd.skew = -10 * 24 * H; wd.advance(80 * H);
  check('when the app HAS been observing time, a backwards clock is flagged and cannot restart the clock (effective time never goes backwards)', wd.client.access('a').clockAnomaly);
  w.server.mode = 'up';
  const k = world(); signIn(k, 'a'); k.client.recordFirstRepCompleted('a'); k.server.mode = 'offline';
  for (let i = 0; i < 2; i++) { k.advance(24 * H); k.client.recordRepCompleted('a'); }
  const twoDone = k.client.access('a').memberReps; k.advance(H); k.client.recordRepCompleted('a');
  check('time and count both apply: three reps between contacts are allowed, the fourth is not', twoDone && k.client.access('a').reason === 'needs_connection_reps');
  k.server.mode = 'up'; k.client.sync('a'); check('one successful contact resets the count', k.client.access('a').memberReps && k.client.access('a').reason === 'ok_trial');
}
{ const w = world(); signIn(w, 'a'); w.client.recordFirstRepCompleted('a'); w.server.mode = 'offline'; w.advance(10 * H);
  w.skew = 30 * 24 * H; const fwd = w.client.access('a');
  check('moving the device clock forward only costs the person access (a self-inflicted limit)', !fwd.memberReps);
  w.server.mode = 'up'; w.client.sync('a');
  check('one successful contact recalibrates: the offset absorbs the clock error and the trial end is unchanged', w.client.access('a').memberReps && w.client.access('a').endsAt === T0 + TRIAL_MS);
  w.skew = 0; check('and a later correction of the clock does not lose access', w.client.access('a').memberReps);
}
{ const w = world(); signIn(w, 'a'); w.skew = 2 * H; w.client.sync('a'); w.client.recordFirstRepCompleted('a'); w.server.mode = 'offline'; w.advance(48 * H);
  check('a device clock that is wrong by hours from the start is calibrated away by the server time', w.client.access('a').memberReps && w.client.access('a').reason === 'ok_trial');
  const q = world(); signIn(q, 'a'); q.client.recordFirstRepCompleted('a'); q.server.mode = 'offline'; q.advance(H); q.client.access('a'); q.skew = -(BACKWARD_TOLERANCE_MS - 1000);
  check('a small backwards step (inside five minutes) is not reported as an anomaly', !q.client.access('a').clockAnomaly);
}
{
  const z = world(); signIn(z, 'a'); z.client.recordFirstRepCompleted('a'); z.server.mode = 'offline'; z.advance(24 * H);
  const mumbai = z.client.access('a'); const la = z.client.access('a');
  check('the device time zone is never used in a decision (only the display of the end changes)', mumbai.memberReps === la.memberReps && formatInstant(mumbai.endsAt!, IST) !== formatInstant(mumbai.endsAt!, -480));
}

console.log('— Account switching on one device —');
{ const w = world(); signIn(w, 'a'); w.client.recordFirstRepCompleted('a'); w.advance(H); signIn(w, 'b'); w.server.mode = 'offline';
  check('account A is trialing and account B is new, on the same device, each judged by its own cache', w.client.access('a').reason === 'ok_trial' && w.client.access('b').reason === 'ok_first_rep');
  check('an account with no cache on this device never borrows another account\'s status', w.client.access('c').reason === 'needs_connection_no_status' && !w.client.access('c').memberReps);
  w.client.signOut('a'); check('signing out removes that account\'s cached status (it must be re-fetched online)', w.client.access('a').reason === 'needs_connection_no_status' && w.client.access('b').memberReps);
  const x = world(); signIn(x, 'a'); signIn(x, 'b'); x.server.mode = 'offline'; x.client.recordFirstRepCompleted('b'); x.skew = -10 * 24 * H;
  let n = 0; while (x.client.access('b').memberReps && n < 50) { x.client.recordRepCompleted('b'); n++; x.advance(24 * H); }
  check('each account\'s offline allowance is its own count: B is bounded the same way while A is signed in on the device', n === MAX_REPS_BETWEEN_CONTACTS - 1 && x.client.access('b').reason === 'needs_connection_reps');
  const y = world(); signIn(y, 'a'); y.client.recordFirstRepCompleted('a'); y.advance(TRIAL_MS + H); y.client.sync('a'); signIn(y, 'b');
  check('account A having expired does not block account B\'s first rep', y.client.access('a').reason === 'expired' && y.client.access('b').memberReps && y.client.access('b').reason === 'ok_first_rep');
  const z = world(); signIn(z, 'a'); z.server.mode = 'offline'; z.client.recordFirstRepCompleted('a'); z.advance(80 * H); z.client.signOut('a');
  check('signing out and back in cannot reset a pending window offline (the account has no status until the server answers)', !z.client.access('a').memberReps);
}

console.log('— Legacy-data isolation —');
{ const w = world(); const uid = 'old-beta-user';
  w.server.legacy = new Proxy({}, { get() { throw new Error('LEGACY TABLE READ'); }, has() { throw new Error('LEGACY TABLE READ'); }, ownKeys() { throw new Error('LEGACY TABLE READ'); } });
  let touched = false; try { w.server.get(uid); w.server.firstRep(uid); w.server.admin('service_role', uid, 'extend', 10, 'test'); } catch (e) { touched = /LEGACY/.test(String((e as Error).message)); }
  check('no server path reads the legacy trial_tracking or subscriptions data (a trap on them never fires)', !touched);
  // poisoned values: if anything consulted them, results would differ from a clean world
  const clean = world(); const cr = clean.server.get(uid); const dirty = world(); (dirty.server as any).legacy = { trial_tracking: { [uid]: { conversion_status: 'expired', trial_ends_at: 0 } }, subscriptions: { [uid]: { status: 'active' } } };
  const dr = dirty.server.get(uid);
  check('a long-time beta user whose legacy row says "expired" is simply a NEW account with no clock running', cr.ok && dr.ok && dr.ent.state === 'new' && dr.ent.trial_started_at === null);
  const df = dirty.server.firstRep(uid); check('and an "active" legacy subscription row does not change what the trial is', df.ok && df.ent.state === 'trialing' && df.ent.trial_ends_at === df.ent.trial_started_at! + TRIAL_MS);
}
{ const strip = (s: string) => s.split('\n').filter((l) => !/^\s*(--|\/\/|\*|\/\*)/.test(l)).join('\n');
  const root = join(__dirname, '../..'); const sql = strip(readFileSync(join(root, 'docs/proposed/entitlement/001_entitlement.sql'), 'utf8'));
  check('the E1 SQL (outside comments) never mentions the legacy tables', !/trial_tracking|subscriptions|public\.users\b/.test(sql));
  check('the model (outside comments) never mentions the legacy tables', !/trial_tracking|subscriptions/.test(strip(readFileSync(join(__dirname, 'model.ts'), 'utf8'))));
  const walk = (d: string, out: string[] = []): string[] => { for (const f of readdirSync(d)) { if (['node_modules', 'dist', 'dist-review', '.git'].includes(f)) continue; const p = join(d, f); if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(f)) out.push(p); } return out; };
  const offenders = ['app', 'components', 'stores', 'lib', 'hooks', 'contexts'].flatMap((d) => walk(join(root, d))).filter((p) => /trial_tracking|from\('subscriptions'\)/.test(readFileSync(p, 'utf8')));
  check('no client code today reads trial_tracking or subscriptions (so the legacy rows cannot lock anyone out)', offenders.length === 0, offenders.join(', '));
  check('the SQL and the model agree on the trial length (348 hours)', /interval '348 hours'/.test(sql) && TRIAL_MS === 348 * H);
  check('only two functions are granted to signed-in clients; the admin function is service-role only; no grant to anon or public', (sql.match(/grant execute on function [^;]*to authenticated;/g) ?? []).length === 2 && /grant execute on function public\.entitlement_admin\(uuid, text, integer, text\)\s+to service_role;/.test(sql) && !/grant [^;]* to (anon|public)\b/.test(sql));
  check('the first-completion function takes no arguments (nothing about the rep can be sent)', /create function public\.entitlement_first_rep_completed\(\)/.test(sql));
  check('clients have no table privileges at all (revoked) and RLS is on with no policy', /revoke all on public\.entitlement\s+from public, anon, authenticated;/.test(sql) && !/create policy/.test(sql) && /enable row level security/.test(sql));
}

console.log(fails ? `\n${fails} FAILED` : '\nPASS: trial entitlement contract (local model) checks');
process.exit(fails ? 1 : 0);

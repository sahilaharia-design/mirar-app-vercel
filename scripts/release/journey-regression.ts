// Critical customer-journey regression runner (docs/release/LAUNCH_MVP_MATRIX.md §4). Read-only: runs the automated local suites that guard
// each case and lists every case that is NOT yet automated, with its severity and blocker, so "green" can never be read as "launch-ready".
// Run: npx tsx scripts/release/journey-regression.ts        (exit 1 if any automated case fails)
import { spawnSync } from 'child_process';

type Sev = 'P0' | 'P1' | 'P2';
interface Case { id: string; title: string; sev: Sev; auto?: string[]; scope?: string; open?: string }
const CASES: Case[] = [
  // ── automated today (local; simulated services where noted)
  { id: 'CJ-01', title: 'Cross-account isolation on one device (sign-out, switch, no inherited state) — store level', sev: 'P0', auto: ['scripts/runtime/account-isolation.test.ts'], scope: 'local; real two-inbox run on the real-auth build NOT done', open: 'CJ-01R real two-account run' },
  { id: 'CJ-02', title: 'Repeated question prevented; skipped/left practices recorded; easier mode as designed (S1a)', sev: 'P1', auto: ['scripts/runtime/persist-on-serve.test.ts'], scope: 'local; S1a unmerged' },
  { id: 'CJ-03', title: 'Trial starts only on a completed ENGINE rep (not pilot, abandoned or safety-stopped); per-account; offline-pending', sev: 'P0', auto: ['scripts/entitlement/host.test.ts'], scope: 'local; flag default off; server SQL not applied anywhere' },
  { id: 'CJ-04', title: 'Entitlement client equals the spec; expiry, offline allowances, clock tamper, repeated signals', sev: 'P0', auto: ['scripts/entitlement/entitlement.test.ts', 'scripts/entitlement/client-port.test.ts'], scope: 'local model' },
  { id: 'CJ-05', title: 'Multi-device history restore (journal → replay → adopt), consent, conflicts, offline', sev: 'P1', auto: ['scripts/runtime/backup.test.ts', 'scripts/runtime/backup-sync.test.ts', 'scripts/runtime/continuity.test.ts'], scope: 'SIMULATED service and in-memory PostgreSQL; hosted run NOT done', open: 'CJ-05H hosted two-device restore' },
  { id: 'CJ-06', title: 'Pilot sessions: resume, leave, safety halt, no typed text kept, record truthfulness', sev: 'P1', auto: ['scripts/runtime/pilots.test.ts'], scope: 'local' },
  { id: 'CJ-07', title: 'Engine, correction rules, runtime, Mirror contract and receipt invariants', sev: 'P0', auto: ['scripts/sim/suite.ts', 'scripts/sim/correction-suite.ts', 'scripts/runtime/runtime.test.ts', 'scripts/runtime/mirror.test.ts', 'scripts/runtime/mirror-contract.test.ts', 'scripts/runtime/receipt.test.ts'], scope: 'local' },
  // ── not automated yet (listed so they cannot be forgotten)
  { id: 'CJ-08', title: 'Auth expiry mid-session: practice not lost, re-auth returns to the same place', sev: 'P1', open: 'needs real-auth staging run; harness not written' },
  { id: 'CJ-09', title: 'Poor connectivity on a real phone (slow 3G, offline mid-rep, offline first rep)', sev: 'P1', open: 'manual on device; entitlement offline rules covered locally by CJ-04' },
  { id: 'CJ-10', title: 'Mobile: 320/390/768 layouts, keyboard-only, screen reader on every paid-path screen', sev: 'P1', open: 'paid-path screens (L5, B4) do not exist yet' },
  { id: 'CJ-11', title: 'Payment webhook delay: access follows the webhook only; return URL alone grants nothing', sev: 'P0', open: 'billing (B1) not built' },
  { id: 'CJ-12', title: 'Double charge: duplicate/replayed webhook and double-tap Subscribe change nothing', sev: 'P0', open: 'billing (B1) not built' },
  { id: 'CJ-13', title: 'Forged / stale webhook rejected; secrets absent from every bundle', sev: 'P0', open: 'billing (B1) not built; bundle scan exists in preflight' },
  { id: 'CJ-14', title: 'Expired trial: history, Mirror, export, delete work; new rep and pilot refused with plain copy', sev: 'P0', open: 'client rule tested (CJ-04); expired-state UI (L5) not built' },
  { id: 'CJ-15', title: 'Cancel (app and UPI app), failed renewal, grace, lapse, resubscribe without a second trial', sev: 'P0', open: 'billing not built' },
  { id: 'CJ-16', title: 'Account deletion with an active subscription cancels it first; all server rows removed', sev: 'P0', open: 'billing and hosted deletion not built' },
  { id: 'CJ-17', title: 'Real 14-day trial on a staging account, plus backdated-fixture expiry', sev: 'P0', open: 'needs E2 on a staging project (D2); cannot be compressed' },
  { id: 'CJ-18', title: 'Reminder consent and opt-out (only if reminders ship)', sev: 'P2', open: 'reminders are post-launch; existing function not assumed live' },
];

const run = (f: string) => { const r = spawnSync('npx', ['tsx', f], { encoding: 'utf8' }); const out = (r.stdout ?? '') + (r.stderr ?? ''); return { ok: r.status === 0 && !/^FAIL/m.test(out), fails: (out.match(/^FAIL/gm) ?? []).length, passes: (out.match(/^pass/gim) ?? []).length }; };

let autoFail = 0; const rows: string[] = []; let openP0 = 0, openP1 = 0;
for (const c of CASES) {
  let state = 'NOT AUTOMATED'; let detail = c.open ?? '';
  if (c.auto) {
    const rs = c.auto.map(run); const ok = rs.every((r) => r.ok);
    state = ok ? 'PASS' : 'FAIL'; if (!ok) autoFail++;
    detail = `${rs.reduce((a, r) => a + r.passes, 0)} checks; ${c.scope ?? ''}`;
  }
  const hasOpen = !!c.open;
  if (hasOpen || state === 'FAIL') { if (c.sev === 'P0') openP0++; if (c.sev === 'P1') openP1++; }
  rows.push(`${c.id.padEnd(6)} ${c.sev}  ${state.padEnd(14)} ${c.title}\n${' '.repeat(26)}${detail}${hasOpen && c.auto ? `  | still open: ${c.open}` : ''}`);
}
console.log(rows.join('\n'));
const unauto = CASES.filter((c) => !c.auto).length;
console.log(`\nautomated cases failing: ${autoFail}`);
console.log(`cases with an open (unautomated or unverified) part: P0 ${openP0}, P1 ${openP1}; ${unauto} cases have no automation yet`);
console.log('A green run proves only the automated local cases. Public paid launch requires every P0/P1 case closed with evidence (LAUNCH_MVP_MATRIX.md §5).');
process.exit(autoFail ? 1 : 0);

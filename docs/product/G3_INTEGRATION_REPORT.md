# G3 revision 2: unified integration report

**Date:** 18 October 2026. **Branch:** `mirar-g3-rev2-integration` (from the owner baseline `a9627e0`, merged with Codex's PR #5 using a no-fast-forward merge so dependency history is preserved: frontend `d86015d`, validation `065952b`, plus its earlier dependency merges). Nothing was applied to Supabase, production or any real account.

## 1. Simulated versus genuinely persisted (read this first)
| Capability | State |
|---|---|
| Account backup, recovery, "backed up" status, last confirmed day, deletion of an account copy, upload again, conflict resolution | **Simulated.** An in-memory stub service (`StubService`); reload resets it. The UI banner reads "LOCAL-ONLY PREVIEW · Service responses below are simulated. No real account backup or recovery takes place." Zero requests to Supabase were observed in the hosted run |
| Device journal of structured practice events; consent and sync state | **Persisted on the device only** (browser storage under a per-account key; cleared at sign-out). This is the only persistence |
| File export | **Real, flag-gated** (verified save through the browser file picker, where it exists). Not a backup. **Import does not exist** |
| Trial entitlement | Not part of G3; contract and SQL exist, nothing applied |
| Anything stored in an account on a server | **Nothing.** No migration, table, row or upload |
The controller labels itself: a port without the stub marker is treated as **live** and refuses every consent-bearing action unless the wording version is on a reviewed list (empty today). A live service therefore cannot be switched on by wiring alone.

## 2. Owner-side issues from Codex's handoff, and what changed
| # | Issue | Resolution | Evidence |
|---|---|---|---|
| 1 | `keep_device` refusal type | `RefusedIntent = 'keep_device'` in the owner `AnyIntent`; the controller refuses it with a safe message and changes nothing; retry refuses again; not in the frontend union | `continuity.test.ts`; `tsc` clean (the two reported errors are gone) |
| 2 | Deleted-account-copy decision | `stay_on_device`, `upload_again` (explicit) and `clear_device` all resolve the pending decision. Clearing needs a verified saved copy of this device's history and uses the sync client's decision API; the snapshot publishes `canUploadAgain`, `canKeepDeviceOnly`, `canClearDeletedDecision` truthfully | tests: stay, upload again, clear, cancelled save keeps the decision, no saver blocks safely |
| 3 | Verified export where policy requires it | **Clear device now always needs a verified save** (the "account already has it" exemption is removed). **Combined deletion** saves every history it would destroy: the device journal, and/or the account copy when it holds something the device does not (one save when one covers the other, two when they differ), re-checked against a fresh read; a missing second save deletes nothing. Account-only deletion without a save is allowed only when this device holds the identical history | tests with scripted savers (0, 1, 2 confirmed saves) |
| 4 | Stale status after "keep on device" | After `copy_was_deleted` + stay/clear: `accountCopy: none`, no account summary, consent off, `account_copy_removed` notice. After two histories + stay: account copy still reported (it exists), backup off, consent **not** "on". Consent is no longer recorded while a decision is pending; a deleted copy no longer shows "0 completed" | tests; hosted check |
| 5 | Consent version and withdrawal at the controller boundary | `request(intent, {consentVersion})`: `enable` and `enable_and_upload` must carry the current version; `recover`/`upload_again` must match it when they carry one; the recorded version is the controller's own constant; a live service needs the version on the reviewed list. A stored older wording becomes `needs_reconsent` on load (phase `reconsent`), uploads stop locally with no network call. **Withdrawal is applied before the queue**: `disable` and `sign_out` pause the client immediately, so a queued or in-flight sync cannot upload after the request; a withdrawal is not mislabelled "turned off elsewhere" | tests incl. a queued sync held at the service while `disable` is requested |
| 6 | Isolation, notices, failures, sign-out, consequential actions | Per-account keys; another account on the same device and service starts empty and is unaffected by A's deletion; every notice is produced by a tested scenario; offline, unavailable and service-error leave deletion/check requests with no change; sign-out is never blocked, warns with the count and whether a file can be saved, uploads nothing afterwards and writes nothing back | tests; hosted sign-out removed all history/pilot/practice keys |
Two small edits to Codex's host (`ContinuityHosts.tsx`): it now forwards the consent context to the controller and publishes the owner's own capability flags instead of forcing `canUploadAgain`/`canKeepDeviceOnly` to true. No screens, copy or styles were changed.

## 3. Test and build results
`npm`-level preflight (`scripts/release/preflight-app.sh`) **PASS**: working tree clean, branch contains `origin/main`, production env check, TypeScript, pilots, account isolation, backup, backup-sync, continuity (now with the revision-2 scenarios), entitlement model (63), engine and correction suites, runtime, mirror, mirror-contract, receipt, production-equivalent web export, bundle scan (only the anon key; **no** continuity, simulated-service or pilot strings, including the new revision-2 strings), engine and runtime byte-identical to `mirar-integration`.

## 4. Hosted validation (two review aliases, protected, demo auth, simulated service)
`mirar-g3-integrated-preview` (export unavailable) and `mirar-g3-integrated-export-preview` (export capability on). Observed in the browser:
- The simulated-service label appears on Today and on every history screen; the stub panel states "NO NETWORK · RELOAD RESETS"; **0 requests to Supabase**.
- Default "Only on this device"; opening history makes **no** account read ("Nothing is checked unless you ask"); an explicit "Check for a backed-up copy" is the only read.
- Invitation after the first completed rep; consent screen → "Turn on backup" showed the retained-records confirmation (count and date range) and uploaded **nothing** until "Back up these and turn on"; "Keep them on this device" changed nothing.
- After confirming, "Backed up to my account" appears **with** the simulated banner above it and "Account copy on the stub: 1".
- Another device deleting the copy, then an explicit check: "The account copy was removed. Backup is off; this device kept its practice." Turning on again showed the deleted-copy decision with no account summary and nothing uploaded; "Keep it only on this device" left a truthful off state.
- Sign-out screen warned "1 changes are not confirmed… will be cleared"; sign-out cleared all device keys and returned to login.
- Export alias: "Clear device history" states a verified saved file is required and its button is disabled until acknowledged; "Save a copy, then clear this device" is enabled for the deleted-copy decision.
- axe: **0 violations, 0 incomplete** and no horizontal overflow, with all targets ≥ 44 px, on overview, consent, retained-upload confirm, ready, turn-off, delete-account-copy, delete-both, account-removed and copy-was-deleted at 320 px; the decision screen at 390 px; Today and history at 1440 px.
Not done: a real file save (the native picker cannot be driven here; covered by the scripted saver in tests), two real inboxes, native screen readers, 768/1024 widths, Hindi/Gujarati.

## 5. Observations for Codex (no redesign requested)
1. "Backed up to my account" is Codex's status title; under the simulated banner it is acceptable, but a "(simulated)" suffix would remove any doubt in review builds.
2. `recover` and `upload_again` screens should send `{consentVersion}` like the enable screens; the controller accepts them without it today but validates it when present.
3. The deleted-copy screen's line "Clearing this pending decision is awaiting the controller connection" is obsolete now that `canClearDeletedDecision` is published.
4. The merge brought in Codex's review harness and validation images unchanged.

## 6. Remaining blockers (unchanged and new)
Real account backup stays blocked: G4, qualified privacy/legal review, retention wording, no provider backups on Free, import not built. Release blockers still open: historical admin-log gap, real two-inbox isolation run, safety/helpline sign-off, human pilot testing, native screen readers and Hindi/Gujarati typography, Codex's final confirmation of this integrated build. v2 production promotion stays blocked.

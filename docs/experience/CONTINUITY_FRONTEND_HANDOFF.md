# G3 continuity — final frontend reconciliation, revision 2

15 October 2026. Runtime dependency: `mirar-continuity-g3`, `e494540` (including owner revision `0e45176`); initial request `5dcd3ab`. The later remote documentation-only `e54b409` does not change this runtime. This handoff supersedes earlier prototype and initial-G3 binding instructions. PR #5 and `codex/mirar-continuity-experience` remain the single frontend workstream.

## Integration

Merge the existing PR into G3, preserving dependency merges `6b90044` and `2ad12e9`. Do not cherry-pick only the final revision-2 delta without its earlier frontend changes. No new design direction or public deployment. `lib/`, `stores/`, `app/`, authentication, SQL, persistence, evidence, engine, artwork and tokens are unchanged relative to the authoritative G3 dependency. Claude owns behavioral, security and release approval.

`ContinuityHosts.tsx` adapts the real controller snapshot to the existing `ContinuityPort`; no component calls SyncClient directly or assigns a successful outcome. The temporary `InterimControls.tsx` is removed, with its supported operations incorporated into Aperture Today/Mirror/Me/history. Owner service acknowledgment, errors and notices remain authoritative.

## All nine initial requests

| Item | Integrated frontend behavior |
| --- | --- |
| Separate deletion | Account-only, device-only and explicit combined controls each have distinct consequences and acknowledgment. Account-only completion uses the owner notice and says the device was kept. Final destructive buttons require a saver; actual verified export remains an owner obligation. |
| Errors | Safe `error.message` in an alert; Try again uses `retry`. Neither a click nor a resolved promise implies success. Refused/cancelled saves never become completion. |
| Unsent disclosure | Pending on-state changes and unsent off-state changes remain distinct. Turn-off explains retained local changes. `server_flag_pending` states service confirmation is missing. Sign-out uses the owner's `signOutWarning` with a safe fallback. |
| Save-first conflict | No silent overwrite. Keep account requires confirmed saved device history; without a saver it is unavailable. Revision 2 removes account replacement completely. Decide later uses the owner's `stay_on_device`. |
| Deleted account copy | Separate `copy_was_deleted` language, explicit `upload_again` confirmation or `stay_on_device`. Both now use actual revision-2 dispatch. Clearing that pending decision remains unavailable pending the owner fix below. |
| Notices | All supplied notices, including `file_saved`, are rendered. File saved says nothing else changed. No invented operation receipts. |
| Scope | Engine history only. Look Again, Attend, unfinished practice and offers stay on the device, including during recovery. |
| Account checking | Navigation never invokes refresh. Explicit Check asks the service. `automaticChecks` explains checks on app open/after changes while backup is on, or no checks unless requested while off. |
| Retention | Readable PROVISIONAL wording remains visible; provider retention, timing and access guarantees are not asserted. No legal placeholder is substituted. |

## Revision-2 contract reconciliation

- `keep_device` is removed from frontend actions, screens and copy. No account-replacement affordance remains.
- `confirmUpload` displays count and date range before retained choices upload. Count is **structured event records**, not completed practices. Equal choices back them up explicitly (`enable_and_upload`) or keep them here (`stay_on_device`). Initial `enable` alone does not upload retained records. Reviewed wording/version is checked in the frontend before either consent action.
- `save_file` is available independently when the owner exposes `canExport`. An unsent sign-out offers Save a file first where supported, without forcing backup. Saving returns to history with actual `file_saved`; it never automatically signs out. Sign-out and Cancel remain available without a saver.
- Import is absent, as revision 2 requires. No disabled import affordance.
- Error metadata permits owner legacy-refusal intent strings, but that metadata cannot be dispatched through the frontend action union.

## Truthfulness and account boundaries

Every G3 port is marked `serviceMode:'simulated'`. Today/Mirror/Me and consequence screens visibly explain local-only review, simulated responses and no real account backup/recovery. Missing service mode never implies a live service. Last-confirmed day appears only for enabled + ready + verified + zero pending. Frontend never fabricates restored, deleted, backed-up or saved states.

Recovery in this owner runtime also enables future backup. Confirmation therefore says Restore and turn on backup. This is not presented as a read-only restore. Prior frontend promises to the contrary are retired.

The host requires authenticated UID, continuity-store UID and controller host UID to match before showing a port. Dispatch rechecks current identity/controller. Different-account loading cannot render prior account continuity. Me has direct Sign out → `/continuity?intent=signout`; Cancel makes no sign-out call. `intent` avoids React Navigation's reserved `screen` parameter. Review service controls live inside the settings scroll flow and cannot cover mobile consequence buttons.

## Exact owner integration requirements / remaining gates

1. **Compile blocker:** `lib/innerRep/backup/continuity.ts:22` must retain `'keep_device'` in owner `ExtendedIntent`/`AnyIntent` solely for the existing explicit refusal at line 105. The frontend union must not regain it. Current typecheck has exactly two errors: controller case line 105 and refusal test `scripts/runtime/continuity.test.ts:129`. Add the literal to the owner alias; no behavior change. Frontend did not edit these files. PR comment: https://github.com/sahilaharia-design/mirar-app-vercel/pull/5#issuecomment-6189547668.
2. **Deleted-copy clear:** generic `doClearDevice` leaves the private pending decision. Resolve via the owner's decision API with verified export and publish `canClearDeletedDecision:true` only after this works. Until then the UI blocks this action; it never reports the decision resolved.
3. **Verified export before every destructive action:** owner account-only deletion and safe-in-account device clearing still skip export in some cases. Saver availability is not saved proof. Reconcile with the explicit v1 policy. Combined deletion must also protect account-only history, not export only the local journal.
4. **Deleted-copy stay-local facts:** `doStayOnDevice` clears the pending decision but retains `accountCopy/accountSummary` from the earlier check. After a `copy_was_deleted` decision, publish truthful missing/unknown account facts and a suitable notice; otherwise general privacy/sign-out text may imply a deleted account copy still exists. Correct the owner snapshot, not a guessed React override. Check consent/automatic-check disclosure agrees with effective off-state too.
5. **Consent/version and withdrawal:** controller request accepts only intent. Validate reviewed consent versions at the owner boundary, and verify queued/background writes obey withdrawal. Frontend context checks are not security enforcement.
6. **Real release gates:** actual confirmed file-picker save/cancel, two real-account isolation, real service acknowledgment/recovery, security and qualified disclosures remain unverified. Provider Free-plan limitations documented in the owner's newer docs remain binding. G3 simulation must not be activated as account backup for real users.

## Validation and reproduction

`review/G3ContinuityReview.tsx` mounts actual controller, engine, recorder and replay with MemKV/StubService. Synthetic states run real operations. The saver is explicitly scripted and writes no filesystem file. No network account or browser storage writes occur in that harness. The historical manual fixture is no longer mounted.

Revision-2 evidence is in `continuity-validation/g3-rev2/`; earlier `g3/` evidence is historical and not counted again. Run static `npm run visual:build`, serve `dist-review`, then `scripts/frontend/verify-continuity-g3.py` with matrix, functional and revision2 modes. Use `AGENT_BROWSER`, `MIRAR_G3_URL`, `MIRAR_G3_DIR`, `MIRAR_G3_SESSION` as documented in the script. `verify-continuity-g3-app.py` tests actual compiled Expo hosts and routes, not just standalone components.

No production deployment, Supabase change, new preview or runtime modification accompanies this handoff.

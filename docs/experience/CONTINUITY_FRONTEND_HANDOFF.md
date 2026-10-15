# G3 continuity — final frontend reconciliation

15 October 2026. Authoritative runtime: `mirar-continuity-g3` **`5dcd3ab`**. Read `CONTINUITY_G3_UI_CHANGE_REQUESTS.md` completely, plus `ContinuityController`, the host, export verification, sync decisions and controller tests. This handoff supersedes the earlier prototype/type-mapping instructions on PR #5; Git retains those iterations and their evidence.

## Integration boundary

The existing `codex/mirar-continuity-experience` branch and PR #5 are preserved. Merge commit `6b90044` brings the authoritative G3 dependency into that branch without editing its runtime. PR #5 should target `mirar-continuity-g3` so the review is a **frontend-only delta**. No creative branch or production merge/deployment.

`lib/`, `stores/`, `app/`, schema/SQL, engine, evidence, auth and persistence must remain byte-identical to `5dcd3ab`. Only presentation, frontend host wiring, review harness, frontend validation and this handoff change. Claude remains the runtime/security/release owner.

## Nine requested items

| Request | Frontend reconciliation |
| --- | --- |
| 1. Separate deletion | Three named controls and consequence screens: Delete my backed-up practice → `delete_account_copy`; Clear practice on this device → `clear_device`; Delete account and device history → `delete`. The combined `deleted` state says both were removed and backup is off. Account-only success is the supplied `account_copy_deleted_device_kept` notice, never the combined success copy. All require explicit acknowledgment. All three final actions are blocked when `canExport` is false under the owner's v1 export rule. |
| 2. Errors | Safe `snapshot.error.message` is shown verbatim as text in an alert, with Try again → `retry`. No raw intent/code/id displayed. A failure or cancelled save is never rendered as completion. |
| 3. Unsent changes | `pending` describes on-state waiting; `unsentOnDevice` describes off-state local changes. The turn-off screen states that off-state changes stay here and upload only after backup is turned on again. `server_flag_pending` states local uploads stopped but the service flag is not yet confirmed. Sign-out uses both counts. |
| 4. Save-first conflicts | With no export capability, no replacement choice is offered in the conflict panel: explanation + Decide later. With capability, both choices have a separate confirmation. Keep account saves the **device** history first, then sets it aside/keeps it locally. Keep device saves the **account** history first. The UI sends the owner intent; owner verifies the actual file before mutation. Capability is never described as a saved file. Import stays disabled. |
| 5. Deleted-copy decision | Dedicated `copy_was_deleted` composition, not “two histories” or automatic restore. It describes explicit re-upload, device-only keeping, and save-first clearing. Confirmation/intent types exist. **Execution remains blocked at 5dcd3ab:** owner controller dispatch does not expose the first two operations, and general clear does not resolve the pending decision. Host defaults capabilities to false until owner supplies real bindings. Nothing is marked resolved or uploaded on click. |
| 6. Notices | All five notices rendered in status: account copy removed; history reset elsewhere; turned off elsewhere; account-only deletion/device kept; server flag pending. Quiet text, not warning badges. |
| 7. Scope | Today/Mirror/Me, settings and every consequence screen explicitly state engine-only backup; Look Again, Attend, unfinished practice and offers stay device-only. Recovery does not imply their restoration. |
| 8. Explicit account read | Removed `controller.refresh()` from the history-screen opening effect. Visible Check for a backed-up copy → `check_account` explains the read. Merely navigating Today/Mirror/Me/history while off makes no service read. Review verifies actual zero-call behavior. |
| 9. Retention | Visible PROVISIONAL / pending qualified review, no verified retention window, no deletion timing or exclusive-access promise. Owner `deletionDisclosure` appears as provisional copy, never final legal text. |

### Acknowledgment and recovery

The actual G3 controller snapshot is the only source of outcomes. The UI never sets ready/restored/deleted optimistically. Confirmed day appears only with enabled + ready + verified account copy + zero pending.

G3's `recover` calls `doEnable`: recovery **also turns backup on**. This is stated before the person's explicit confirmation (“Restore and turn on backup”). The earlier prototype's read-only-restore promise is removed rather than hiding actual behavior. Qualified consent wording/version validation remains an owner gate; frontend captures the displayed version, but `controller.request()` at G3 has no version argument to reject stale consent itself.

Every G3 port is explicitly marked `serviceMode:'simulated'`. Status on Today/Mirror/Me and every settings/confirmation screen visibly says **local-only preview; responses are simulated; no real account backup or recovery**. Missing service mode also defaults to a non-live disclosure. The owner must not set live mode until there is a verified real service. The review file saver is scripted, explicitly labelled and writes no filesystem file; no genuine file-save usability result is claimed.

## Frontend host and Me

`ContinuityHosts.tsx` enriches G3 snapshots with the owner's current consent/version. It handles decline through the existing `dismissInvitation()` method. It does not invoke SyncClient directly.

The host renders no port unless authenticated UID, continuity-store UID and controller host UID match. Action handlers check the live auth/controller again; previous-account closures are ignored. Loading a new account does not render the retained account's status, notices or choices. The load effect reevaluates when the controller/store UID changes, avoiding a permanently blank view after an in-flight different-account load. No auth/store behavior is edited.

Me retains a **direct Sign out** button. It opens `/continuity?intent=signout`, using the same consequence-aware confirmation; users do not have to discover sign-out inside general history settings. The route uses `intent`, not React Navigation’s reserved `screen` parameter; changed parameters reset the presentation screen/acknowledgment. The review service panel now lives inside the settings scroll flow (as an optional review-only slot), so it cannot cover confirmation buttons at 320px. Its named region provides an accessibility landmark. Cancel never dispatches sign-out. Controller disposal and store-level account isolation remain Claude's responsibility; two real inboxes were not used in this review.

## Remaining owner bindings / release blockers

1. **`copy_was_deleted` dispatch:** SyncClient supports `resolve({upload_again:{confirm:true}})` and `resolve({stay_on_device:true})`; ContinuityController.dispatch at `5dcd3ab` has neither public intent. Add `upload_again` / `stay_on_device`, with consent/persist/publish behavior and actual acknowledgment. Publish `canUploadAgain` / `canKeepDeviceOnly` only when supported. Frontend passes them through, otherwise keeps the controls visibly unavailable.
2. **Clear that pending decision:** general `clearDevice()` clears histories but leaves private pendingReason/pendingRemote. Wire the deleted-copy clear through the owner's decision resolution, including verified device export, and publish `canClearDeletedDecision:true` only then. The frontend otherwise blocks clearing from that decision. Do not have React reach into the client.
3. **Strict v1 export policy:** doDeleteAccountCopy currently skips export when account and local match; doClearDevice skips it when an account read proves local engine history is copied. The latest user decision says verified export before **any** destructive action. Reconcile these shortcuts in the owner controller. Frontend blocks all destructive confirmations without export capability; this is not proof that the owner actually saved a file. Do not enable user-facing release based on capability alone.
4. **Combined history coverage:** doDeleteBoth verifies/export-saves only the local journal. Protect/account for any account-only history before deleting both copies; a local export is not a saved account history when they differ. The frontend cannot establish identity from counts.
5. **Consent/context:** current owner request accepts intent only. Reject stale reviewed consent versions at the owner boundary. Verify queued/background writes stop according to the agreed withdrawal semantics; foreground/busy fields currently include background copying, so the exact effect of a queued turn-off request remains an owner concern.
6. **Conflict result with backup initially off:** a choice reached by explicit `check_account` can replace/adopt history while consent remains off. Browser observed successful file confirmation/replacement returning phase device, enabled false. UI correctly preserves the supplied off state instead of inventing ready. Confirm this one-time-operation behavior or publish explicit new consent/operation facts if another behavior is intended.
7. **Meaningful completion facts:** add explicit operation acknowledgment notices if a success should describe more than the returned scope/state. Promise resolution alone is not proof (controller catches failures); UI uses snapshot errors/notices. Lost responses stay unconfirmed until reconciled.
8. **Real files and privacy gates:** manual confirmed browser save, cancellation, import disabled, provider retention/access review, two real-account auth isolation and real service data remain release-owner gates. No Supabase work or production activation is authorized by this UI patch.

## Validation surface

The same `?continuity` review now uses **actual ContinuityController + actual engine/recorder/replay**, MemKV and StubService, rather than manually setting presentation success. Synthetic scenarios produce all thirteen G3 phases, notices, unavailable/safe errors, cancelled saves and both conflict paths. They are visibly labelled, resettable, no network/account/FS writes. The prior manual component fixture file is retained only as historical source and no longer mounted.

`review/G3ContinuityReview.tsx` and `scripts/frontend/verify-continuity-g3.py` are review-only, not app routes. Build the review and test a static build to avoid development hot-reload resets. Existing Today/Mirror/Me components remain the actual surfaces. Evidence under `docs/experience/continuity-validation/g3/` records scope and limitations; no controller success is fabricated to fill gaps above.

# Privacy-controlled continuity · Aperture frontend prototype

15 October 2026. Base: `mirar-unified-final` at `0411346`. Builds on the approved Today fix and final reconciliation; no new creative world. Read completely: `DURABLE_HISTORY_DECISION_MEMO.md`, `OPTION_B_BACKUP_PLAN.md`, `REAL_AUTH_TEST_RECORD.md`. User now authorizes Option B frontend design/prototype, not a schema, retention change or production release.

## What can be reviewed

Run `npm run visual:review -- --port 5196`, open `http://127.0.0.1:5196/?continuity`.

This uses the **actual** DailyInnerRep, MirrorExperience and MeExperience components. A real frozen runtime runs the Daily Inner Rep in a private in-memory KV, so completing a practice changes Today and the Mirror truthfully within the review session. There is no account auth, database, network backup, browser practice storage or real restoration. Reload resets the review. The simulator banner never disappears. No production route imports the simulator or continuity components.

1. Today → Begin → complete an actual rep. An optional post-practice invitation appears below the practice, not before it. “Not now” dismisses it in memory.
2. Manage practice history → Back up my practice → compare device/account choices → Not now or Turn on backup. Neither is preselected; neither is visually promoted over the other. Turning on emits a request only.
3. Choose **Simulate acknowledgment**, then **Simulate confirmed completion** to review a confirmed backup. Failure preserves the previous state. These are review controls, never user-facing service behavior.
4. Review states opens explicit fictional snapshots for device, ready, paused, syncing, offline, conflict, recovery available/in progress, empty, unavailable, deleting, deleted and error. Nothing is silently injected into Mirror history. Simulated recovery confirmation explicitly says no fictional practice was inserted.
5. Visit Today, Mirror and Me with any state. History status is below Today's main practice; Mirror keeps practice facts/readings separate. Me is the control point.
6. Conflict → inspect both summaries → review account/device replacement → acknowledge which history is removed → confirm. Decide later is available. File export is disabled because no approved export capability exists.
7. Turn off backup is distinct from deletion. Deletion explains account + local scope, loss of Today/Mirror history and account survival, requires an acknowledgment, waits for confirmation and exposes failure/retry. Sign-out describes verified, unknown and waiting changes separately; Cancel is immediate.

## Component integration

- `components/continuity/contract.ts`: **proposed frontend types**, not Claude-approved backend contracts. `ContinuityPort` = authoritative snapshot + `request(intent)`. Request is not success; no UI writes a store or speculates about a service acknowledgment.
- `ContinuityStatus`: small factual status, last **service-confirmed calendar day**, pending count, always-visible scope and Manage action. No progress meter, timing loop or backup percentage.
- `ContinuitySettings`: account consent, scope/disclosure, recovery, conflict, turn-off, delete and sign-out review screens. These are ordinary navigable pages, not fake modal dialogs. Page changes reset the scroll surface and focus the heading; buttons are standard keyboard/touch controls. Pending operations disable repeated consequential actions.
- `BackupInvitation`: optional post-completion entry. **Production adapter owns first completed rep eligibility, dismissal and 30-day suppression**; the review remembers dismissal only for its lifetime. Never block practice or re-ask after every rep.
- Existing components gain optional `continuity` presentation slots and `privacyNotice` overrides. Me also accepts `historyControls` to replace its local-only sign-out area. Defaults preserve the reconciled app. Supply all state-aware notices together; do not mount a backup-enabled status alongside the old device-only disclosure.
- `review/ContinuityReview.tsx`: simulator + private memory runtime. Never import from `app/`, stores or service code.

## Exact owner adapter requirements

Claude owns architecture, security, authentication, persistence, replay, identity isolation and integration. Adapt these presentation types to the real contract rather than implementing a second service.

| Input / intent | Required real behavior before publishing the next snapshot |
| --- | --- |
| `enabled` | Actual consent value. False by default; sign-in alone cannot enable it. Keep previous value on failure. |
| `accountCopy` | `verified` only after an authorized, successful account read/write. `unknown` for an unverified response; never convert connectivity failure to empty. `none` means confirmed absent, not never checked. |
| `phase=ready` | Scope is confirmed backed up; no pending writes. Do not emit while offline, unresolved, replaying or merely queued. |
| `lastConfirmedDay`, `pending` | Actual confirmed day and queued count, excluding free text. Never use a UI timer or click time as evidence. |
| `scope` | `engine_only` until pilot history is independently approved, implemented and verified. If expanded, engine and pilot source planes still stay separate. Unfinished sessions remain device-only in this prototype's scope. |
| `enable` | Explicit consent, reviewed disclosure, authenticated identity; inspect local/account histories. If account empty, import completed supported device history idempotently; if both exist publish conflict. Do not mark ready on opt-in. |
| `disable` | Stop new writes only after acknowledgment; retain old account copy. UI must still state that copy exists. Owner must define and disclose queued-event policy before release. |
| `retry` | Retry the failed operation, not a generic write. Preserve snapshot/consent on request failure; include operation identity and safe human-readable errors in final adapter. No raw IDs/SQL/security errors in UI. |
| `recover` | Offer only after confirming supported account history exists and local is empty; both-present goes to conflict. Fetch/replay/version-check and publish the actual new Today/Mirror atomically; never show fake practice during loading. |
| conflict summaries | Owner-verified completed Daily Inner Rep counts and through-days for each copy. Missing summaries disable replacement; never infer they have the same contents from counts. Preview summaries are fictional. |
| `keep_account` / `keep_device` | Explicit reviewed replacement; revision check again at confirmation. No auto-merge. Account is the memo's recommended default, but this UI requires an explicit final action. Stale revision returns conflict, not success. Same-day concurrent rep conflict also needs the truthful Today result and safe preservation/export of rejected local work. |
| `export_then_account` | Must produce and verify an actual usable file **before** replacing local history. Disabled in this prototype. No download promise or fake export. |
| `delete` | **Proposed combined account + this-device scope** shown explicitly. Clear/rebuild visible history only after the service confirms deletion and local clearing. Propagate deletion generation/revocation to other devices so old caches cannot republish it. Return actual consent value; UI does not assume deletion toggled backup. |
| `sign_out` | Recheck pending changes immediately before dispatch; warn if unconfirmed. Call existing sign-out/clearing owner action once. Preserve confirmed account copy, clear local practice, all in-memory stores and device-only pilots, isolate next account. Do not clear merely on opening or cancelling confirmation. |
| `deletionDisclosure` | Qualified, plan-verified provider backup-removal window and access wording. Review uses explicit pending wording. Production consent/delete must remain gated until verified. No claim “only you can ever read it,” instantaneous provider-backup erasure, or end-to-end encryption. |

The frontend has no database, sync queue, export, identity verification or migration code. No new package or framework upgrade. No changes under `lib/`, `stores/`, `app/`, auth or canonical assets.

## Product differences requiring a decision

1. **Deletion scope:** memo §5 removes account history and clears local; plan §6 says local clearing “on request.” Prototype makes the combined scope explicit and requires confirmation. Do not wire a cloud-only deletion action beneath it. If cloud-only is approved, revise copy, prevent old local history from being reuploaded and provide separate local controls.
2. **Deletion vs consent:** plan says deleting must not silently turn off, yet deleting the profile row removes `sync_enabled`. Prototype renders the owner's returned consent value and supports either on/off after deletion; simulator keeps it unchanged. Claude must reconcile this architecture/product difference before shipping. With backup still on, new practice starts a new history and this is stated plainly.
3. **Pilot release scope:** engine-first is the conservative review default, not a claim that product approved scope. Pilots remain device-only; sign-out warns about them. Never imply a restored account means restored pilot history.
4. **Turn off with queued changes:** specify whether queued events stop or finish before off. No silent upload after withdrawal; disclose actual policy. Must not lose existing device practice.
5. **Conflict semantics:** wholesale replacement is the memo proposal, not a frontend license to discard history. Owner must approve precisely which revisions/day conflicts are replaceable, export availability, and multi-device invalidation. Until then, review only and keep conflict choices unavailable in real builds.
6. **Privacy wording:** final stored-field whitelist, staff/support access, infrastructure logs, backup window and deletion retention require qualified review. “Structured” does not mean non-sensitive. Optional words still go through the existing safety check; we do not claim no text ever leaves the browser.
7. **Unfinished practice / set-aside offers:** account backup must not imply full draft or pilot recovery. The supported scope, retained limits and version compatibility must be supplied in the actual recovery contract.

No new Mirror evidence, personal causal claim, continuity-based insight, score, assessment or anxiety prompt is introduced. Backup preserves source material; it is not evidence that a person improved.

## Validation

See `continuity-validation/README.md` and JSON evidence. Browser testing covers the review boundary only: UI intent → explicit simulated acknowledgment → snapshot rendering. API/database/security/replay and two-real-account restoration are not implemented or claimed. Physical-device and native screen-reader evaluation, privacy review and Claude's final live integration tests remain required.

### Disclosure integration inventory (required before enabling the real feature)

Inject one authoritative continuity host into all three component slots and their privacy notices together. Also update `PrivacyExperience.tsx`, `PracticeIntroduction.tsx`, entry and any public disclosure that promises exclusively local storage before enabling real account backup. This prototype deliberately does not overwrite the current production promise while production is still local-only. The review's Privacy entry opens the complete history/settings disclosure. Preserve official legal destinations; do not fabricate new legal pages. Test enabled, off-with-retained-copy, device-only and unavailable across every surface. Bind request errors, operation IDs, stale revisions and retry identity in the owner adapter; these are not implemented as persistence in the presentation contract.

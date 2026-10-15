# Continuity frontend integration handoff

15 October 2026. **Preserve PR #5 / Aperture; no redesign.** This revision supersedes the combined-deletion and unresolved-scope recommendations in the original prototype handoff (source `a5a60bd`, evidence `d2c56c6`). Original work and evidence remain in Git history and `continuity-validation/`.

Reviewed completely: Claude's `docs/product/OPTION_B_IMPLEMENTATION_SPEC.md`, `docs/experience/BACKUP_EXPERIENCE_BRIEF.md`, and actual `lib/innerRep/backup/{view,consent,sync}.ts` on `mirar-option-b-prototype` at **`6d9239b7643773dee1729052ac135d0e9cefa90b`**. The memo and plan were previously read completely. Claude's implementation spec is the latest runtime source; latest user decisions override older memo/brief proposals. No backup runtime, SQL, auth, store, replay or network code has been imported or modified on this frontend branch.

## Approved decisions reflected

- Optional, off by default. A complete product without opting in. Sign-in never enables backup.
- **Engine history first.** `scope` now accepts only `engine_only`. Look Again, Attend and unfinished drafts remain device-local. Abandoned rep **events** are distinct from restoring unfinished draft answers.
- Turning off stops new uploads and keeps the earlier account copy. No last-backed-up date is shown while off.
- **Account deletion and device clearing are separate.** Account deletion removes the account copy/profile and returns consent to off; device practice remains. Clear device history separately explains local engine/pilot/draft loss and does not delete the account. No combined action is offered.
- Conflict never silently replaces history. Both summaries and an explicit choice are required. Keeping the account log leaves excluded local entries separately on the device, as Claude's `dropped` model specifies.
- Export/import is desired but **all file controls stay disabled**, even though `BackupView.actions` currently permits files. Serializing a string is not verified file delivery, import validation and safe application.
- Clicks emit requests. Only authoritative acknowledgment changes backup/recovery/deletion facts. Legal, access and provider-retention wording remains visibly provisional in the prototype.

## Compatibility changes made

`components/continuity/contract.ts` remains the **presentation model**, not a second service or a replacement for Claude's types. Claude should bind it from the actual read model plus host operation facts in the unified local-only integration.

| Claude source | Presentation mapping / change |
| --- | --- |
| `ConsentState.s` | Required `consent` union: off, declined, on, paused, needs_reconsent. Re-consent has its own state and review action, not a silent on toggle. |
| `mayOfferCard` | Required input; parent uses it to gate the post-rep invitation. Not now emits `decline`; Claude owns the 30-day quiet period. No frontend persistence or clock-based consent implementation. |
| `BackupView.actions` | Required action flags with matching names, plus host capabilities `recover`, `clearDevice`, `retry`, `signOut`. Unsupported/missing host capabilities must be false. Recheck flags at final confirmation, not just when opening it. |
| `health=waiting/offline` | syncing/offline presentation; copy states waiting changes are unconfirmed. Turn off remains possible when its flag permits. Sign-out is never blocked merely because changes are waiting; Wait while it finishes returns to status without claiming completion. |
| `lastBackedUpDay` | `lastConfirmedDay` shown **only** enabled + ready + zero pending + verified account copy. Suppressed in paused, offline, removed, re-consent and every other state. Do not fill it from click time. |
| `health=needs_attention`, `dropped` | `kept_local` state and neutral day/reason list. No red/error framing. Safe reason enum; no raw engine exception strings or personal payloads in UI. Counts are structured entries, not practice-progress scores. |
| `decision_required`, ConnectOutcome counts | Conflict summaries use **events**, not completed reps. Optional through-day must be service supplied. Zero counts do not establish identical histories. Replacement disabled without both summaries and chooseHistory capability. |
| `server_copy_removed` | account_removed: backup off, device copy remains, no automatic re-upload. A successful explicit account deletion has equivalent consequences and its own acknowledgment state. |
| `deleteServerCopy()` | `delete` means account-only. Receipt of request or loading does not clear Today/Mirror. Confirmed account deletion leaves review engine memory unchanged; `clear_device` is a separate confirmed action. |
| Connect/restore/rebuild | recoverable/recovering/restored require host facts described below; never derived from `up_to_date`. Restored wording: “Your supported account history is available on this device.” No achievement/score. |
| Stored fields | Disclosure now reflects the actual closed-ID event contract: completed/abandoned records, exercise/frame/context/domain IDs, structured answers and day, verdict/correction. Authored commitment labels/status are rebuilt; no separate label text or seed storage claim. No free text or safety-stop events. |

`fileTransferVerified` is deliberately the literal `false` in this presentation version. No code path enables export/import. A future verified file integration needs an explicit contract change and testing.

## Incompatibilities / owner fixes required

These are source-review findings, **not** independently modified runtime behavior or claims that Claude's full security tests were rerun.

1. **Account presence and acknowledgment are missing from BackupView.** `health=up_to_date` can be computed from consent on + zero waiting even before a successful account read/write (the function uses consent state, not `ClientFacts.enabled`, for `on`). It is not proof a real backup exists. The adapter must supply `accountCopy: verified | none | unknown` from a successful authorized service observation; `none` must never mean a failed check. Need explicit operation pending/error/completed facts, supported scope, device-empty status, recovery capability, safe errors and retry operation identity. Do not infer these in React.
2. **Restore currently happens inside `SyncClient.connect()`.** Empty-local and remote-prefix branches assign remote history and return `mode:'restore', rebuilt:true`. The approved experience asks before restoring. On sign-in use a non-adopting preflight; invoke adopt/replay/rebuild only after the Restore click and service acknowledgment. Metadata alone must not replace the visible runtime. The same method enables a missing/paused profile, so it cannot serve as a read-only restore while backup is off: recovery must preserve consent and never silently resume uploads. Connect's upload paths can also return connected after `sync()` skipped offline; `connected` alone is not backup completion.
3. **Paused is conflated with removed.** `sync()` maps `!st || !st.enabled` to skipped server_copy_removed. An existing disabled profile is not evidence account events were deleted. Distinguish paused on another device from genuinely missing/deleted account copy before publishing the removed state. If the fact is unknown, show unavailable rather than deleted.
4. **Conflict freshness needs an owner guard.** `resolve()` reads the captured pendingRemote. The keep-device path calls deleteAll/enable without a final compare against the summary/revision the person approved. Re-read/version-check at confirmation; new remote history must return a fresh decision. Never treat approval of an old summary as approval to replace newer account choices. Keep chooseHistory false until the owner guarantees this. The frontend does not implement conflict policy.
5. **Dropped detail is not in BackupView.** It exposes a count/actions only; list entries come from the owner host. Map raw reasons to `day_already_recorded`, `history_changed`, `account_chosen`, `unspecified`, with calendar days only. Preserve excluded entries while file export remains unavailable; do not promise an export has happened.
6. **Manual device clearing has no current SyncClient public operation.** Host owns engine state, pilot stores, recorder journal/outbox/dropped data and in-memory caches. Publish clearDevice capability only after all intended local copies can be cleared without deleting the account copy or silently republishing old local data. Specify whether consent remains, and require an explicit later recovery rather than immediately undoing the person's clear action. Frontend only emits clear_device.
7. **Turn-off and consent acknowledgment must be atomic at the owner boundary.** Stop scheduling new uploads on withdrawal; handle any in-flight request and queued events explicitly. On failure show actual remaining consent/state, not a successful off state. The UI captures the displayed `consentVersion` when consent opens and sends it with enable; changed/missing versions disable submission until the screen is reviewed again. Reject stale versions again in the owner adapter. Record the actual consent version/day and apply decline quieting with Claude's consent reducer; no local UI claim of legal acceptance.
8. **File feature and retention remain gated.** Backend exportJournal/importJournal are not completed browser file operations. Do not enable them from permissive view flags. Do not reuse the literal placeholder inside DELETE_COPY as final legal language. Qualified access, logs, retention and provider-backup review remains required.

## Exact integration contract for Claude

- `ContinuityPort.snapshot` is a publication of **known facts** from the approved backup read model plus operation host, not component-owned state. `request(intent)` records an intent; owner handles pending, failure and confirmation. Catch service errors and republish; do not throw unhandled errors into the UI. A lost response does not prove the write/delete failed: publish unknown/unavailable and reconcile before asserting presence, absence or retrying replacement. Waiting/offline copy means unconfirmed, not proof that no event reached the account.
- `enable` / `decline` / `disable` map to current-version consent operations. Accepted consent does not itself prove the account history is uploaded. Re-consent must not resume until current wording is explicitly accepted.
- `recover` is user-authorized read-only adoption + replay, followed by one actual Today/Mirror refresh. Preserve the supplied consent setting; recovery is not opt-in to new uploads. On drift/incompatible version preserve the device and show refusal/unavailable; never offer a working export until verified.
- `keep_account` maps to resolve keep_account with truthful local-only retained entries; `keep_device` maps to explicit confirmed replacement **after** freshness validation. `export_then_account` remains unreachable while file controls are disabled.
- `delete` maps only to account deletion; off after confirmed deletion, local preserved. `clear_device` is a separate owner host action. No silent combined operation.
- `sign_out` rechecks waiting/excluded entries, clears local copies via existing owner logic and preserves actual confirmed account history. Cancel/Wait/Review backup first do not call sign-out, discard or change consent. Final sign-out stays available while waiting unless a separate operation is already in flight.
- `retry` repeats the failed owner operation with its identity/revision; it must not turn a failed restore/delete into a generic upload.
- Host capability flags for consent, replacement, recovery and deletion must be reevaluated between opening and confirmation. Sign-out itself remains the release owner's existing operation. `requestPending` means a foreground submitted control request, not ordinary background copying; a background upload must not lock sign-out.

### Actual surfaces and disclosures

The existing optional slots in DailyInnerRep, MirrorExperience and MeExperience remain unchanged. Inject one host and consistent privacy notices across them. The review uses the actual daily engine with memory-only KV, never fictional restored practice. Production routes still do not import this prototype.

Before enabling any real backup, update PrivacyExperience, PracticeIntroduction, entry/public beta disclosures and the existing local-only Me sign-out area together. Preserve official legal destinations. Never display “practice stays only here” alongside an enabled account backup. Pilot source planes/evidence remain distinct and device-local. No extra insight, causal claim, progress score, streak or fixed-duration program is introduced.

## Local review / validation

Continue the **same** review surface: `npm run visual:review -- --port 5196`, `http://127.0.0.1:5196/?continuity`. Review controls are labelled simulated; no new hosted preview, network, Supabase, auth or durable storage. Existing PR #5 and branch `codex/mirar-continuity-experience` are retained. Claude owns the unified local-only adapter, not another parallel frontend integration branch.

Current checks: `python3 scripts/frontend/verify-continuity.py matrix` , `functional` and `consent`, using AGENT_BROWSER if not on PATH and a fresh MIRAR_CONTINUITY_DIR. Current contract-alignment evidence is recorded separately from the original 144-audit prototype evidence in `continuity-validation/contract-alignment/`. No staging service/security/replay, physical-device or human-comprehension verification is claimed.

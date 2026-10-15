# Change requests for Codex: continuity UI after the G1 decisions and the G3 integration (revision 2, 15 October: founder product decisions applied)

**From:** Claude. **Date:** 15 October 2026. Your PR #5 frontend is integrated unchanged behind `EXPO_PUBLIC_HISTORY_SYNC=1` (default off) and runs against the real controller (`lib/innerRep/backup/continuity.ts`) with a stub service. It works end to end. The founder's G1 decisions require these presentation changes **before** any user-facing build. I have not edited your files except mounting them; the adapter already supports everything below.

Hosted preview (protected): `https://mirar-continuity-preview.vercel.app` (export unavailable, the safe default) and `https://mirar-continuity-export-preview.vercel.app` (`EXPO_PUBLIC_HISTORY_EXPORT=1`, for manual testing of the real file save in Chrome). Both use demo authentication and a **simulated** service (panel at the bottom of the history screen; reload resets it). Ask me for fresh share links.

## Required
1. **Split deletion into separate, explicit actions** (G1). Today the UI has one "Delete" that clears account **and** device. Offer: **(a) Delete my backed-up practice** (removes only the account copy; backup becomes **off**; this device keeps its practice; intent `delete_account_copy`; snapshot `notice: 'account_copy_deleted_device_kept'`), **(b) Clear practice on this device** (device only; the account copy stays and recovery is offered; intent `clear_device`), and **(c) an explicitly labelled combined deletion** (intent `delete`). Each has its own screen and consequence copy. Deleting the account copy **turns backup off**: the "deleted" copy must not say backup remains on (the snapshot reports `enabled:false`).
2. **Show the reason when something is not done.** `snapshot.error.message` carries a safe, human-readable reason (offline, service unreachable, "saving a copy is not available so this cannot be done safely", "the copy was not saved"). The current screens show only "That change was not completed". Render it, with Try again. Never render raw ids or codes (none are provided).
3. **Turn-off screen states the fate of unsent changes.** Use `snapshot.unsentOnDevice` and `notice: 'server_flag_pending'`: changes made while backup is off stay on this device and are uploaded only if backup is turned on again; if the service could not be told immediately, say so.
4. **Conflict choices must say a saved copy comes first.** `keep_account` and `keep_device` now require a **confirmed saved file** before anything changes. If `snapshot.canExport` is false, say that saving a copy is unavailable here and that nothing can be replaced, and offer only "Decide later". For `keep_device` the saved copy is of the **account's** history; for `keep_account` it is of **this device's**. Describe "use the account's history" as *setting this device's history aside, kept on this device*, not deleting it.
5. **New decision: `snapshot.decision === 'copy_was_deleted'`** (phase `conflict`). The account copy was deleted (here or elsewhere) while this device still holds the history. Three choices: *Upload it again* (explicit confirmation), *Keep it only on this device* (backup stays off), *Clear this device* (needs a saved file). Not an automatic restore and not an error.
6. **Render `snapshot.notice`**: `account_copy_removed`, `history_reset` ("the account history was started again elsewhere; this device stopped and kept its practice"), `turned_off_elsewhere`, `account_copy_deleted_device_kept`, `server_flag_pending`. Quiet, factual, one line.
7. **Scope disclosure** on every surface: `pilotHistory` and `unfinishedPracticeAndOffers` are `'device_only'`; a restored account must never imply restored Look Again/Attend history.
8. **Explicit read.** Opening the history screen is what triggers the one allowed read of the account (`refresh()`); with backup off the app otherwise makes no service call. Please add a visible, plain "Check for a backed-up copy" control and say what it does, so the read is the person's act and not a side effect of navigation (I currently call it on screen open as a stopgap).
9. **Do not promise retention.** `deletionDisclosure` is an explicit placeholder; keep your "no timing or exclusive-access guarantee" lines until the review is done.

## Please check
10. After a sign-out the history screen must not flash prior-account state (the controller is disposed and nothing is written back).
11. Axe, 320/390/768/1024/1440, keyboard, reduced motion for each new screen and every phase in `continuity.test.ts` (all 13 phases are produced by real adapter state).
12. Me: with `historyControls` supplied, sign-out lives inside the history screen. Confirm that is where a person expects it, or tell me what field you need to keep a direct Me sign-out.

## Contract additions (additive; nothing removed)
Intents `check_account`, `delete_account_copy`, `clear_device`. Snapshot fields `notice`, `decision`, `unsentOnDevice`, `error {intent, message}`, `pilotHistory`, `unfinishedPracticeAndOffers`. Types: `lib/innerRep/backup/continuity.ts` (`ContinuitySnapshotX`, `AnyIntent`).


## Revision 2: founder decisions of 15 October and the controller changes that carry them
All additive except the removal of `keep_device`. Types: `lib/innerRep/backup/continuity.ts`. Tests: `scripts/runtime/continuity.test.ts`.

**R1. Remove "use this device's history (replaces the account's)".** It no longer exists. The controller refuses `keep_device` with an error and changes nothing. Conflict (`histories_differ`) offers only: *use the account's history* (`keep_account` / `export_then_account`, needs a confirmed saved file, sets this device's history aside as kept-on-device), *Decide later* (`stay_on_device`, backup stays off, nothing changes). Please remove replacement copy and the confirmation checkbox for it.

**R2. Visible "Check for a backed-up copy" (replaces request 8's stopgap).** I removed the automatic read on opening the screen. Intent `check_account` is now only sent when the person presses a plain control that says what it does ("Looks for a backed-up copy in your account. Changes nothing."). The stub review panel still has its own button for testing.

**R3. Automatic checks are disclosed.** `snapshot.automaticChecks` is `'none'` while backup is off and `'while_backup_on'` when on. When on, say in one line that Mirar checks your account copy when the app opens and after changes, to keep both consistent. When off, say that nothing is checked unless you ask.

**R4. Turning on with retained practice needs a confirmation.** When `enable` is requested and practice is retained on this device (made before consent, or while backup was off), the controller makes no service call and publishes `snapshot.confirmUpload = { count, fromDay, throughDay }` (phase unchanged). Show: "Turning on will back up N completed practices from <fromDay> to <throughDay> that are currently only on this device." Buttons: **Back up these and turn on** (intent `enable_and_upload`) and **Keep them on this device** (intent `stay_on_device`, equal weight). You may fold this into the consent screen: if the consent screen shows the count and says this, it may send `enable_and_upload` directly. There is no "upload only new ones" option: skipping events would break exact replay.

**R5. `copy_was_deleted` choices now have intents** (request 5): *Upload it again* = `upload_again` (explicit), *Keep it only on this device* = `stay_on_device`, *Clear this device* = `clear_device` (needs a saved file).

**R6. Sign-out warning.** `snapshot.signOutWarning = { unsent, canSaveFile }` is present when signing out would remove practice that is not in the account. Say so plainly with the count; if `canSaveFile`, offer **Save a file first** (intent `save_file`, result `notice: 'file_saved'`), then **Sign out** and **Cancel**. Never block sign-out. If `canSaveFile` is false say a file cannot be saved here. Keep "Signing out removes your practice from this device."

**R7. Export is a priority.** `save_file` saves a verified file of this device's history on its own, without changing anything else. Offer it from the history screen when `canExport`. Import stays absent: do not show any import control.

**R8. Notice added:** `file_saved` ("A copy of your history was saved. Nothing else changed.").

**R9. Contract:** `ContinuityIntent` still contains `keep_device` in `components/continuity/contract.ts`. Please remove it from the union when you update the UI; the adapter's `AnyIntent` keeps it only to refuse it.

## Status
Nothing above is in a Codex file. The preview built from this branch shows the existing UI plus these snapshot fields; screens for R1–R8 are Codex's to build. Until then the hosted review build behaves safely (conflict offers keep_account only if exports exist; the old keep_device button errors with a message).

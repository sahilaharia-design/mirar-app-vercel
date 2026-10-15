# Brief for Codex: the "Back up my practice" experience

**From:** Claude (runtime, privacy, security, release). **To:** Codex (experience and frontend). **Date:** 15 October 2026. **Status:** design brief; nothing here is shippable until the approval gates in `docs/product/OPTION_B_IMPLEMENTATION_SPEC.md` §12 are passed. You can design and build against the contract below with a **stub** port (no network, no Supabase). I will wire the real port only after separate approvals.

## 1. The outcome
Someone can keep their emotional-fitness practice across sign-out, a cleared browser, and a new device, **only if they choose to**, and can see, pause, export and delete it at any time. It must feel like **continuity that belongs to them**, not monitoring, not a score, not a streak to protect, and not a program with an end.

## 2. Non-negotiable constraints (these are product and privacy rules, not preferences)
1. **Off by default.** Sign-in never turns it on. "Not now" has equal visual weight to "Turn on" and is respected for 30 days (the state machine enforces it).
2. **Say only what is true.** Structured choices and calendar days are stored; **nothing typed, no time of day, no location, no device id.** Do not write "encrypted", "private", "secure", "safe" or "only you can ever see this" as absolutes: the wording must be reviewed by a qualified person before use (spec §9), and it cannot yet promise how long provider backups persist.
3. **Turning off and deleting are different acts with different consequences**, with separate controls and separate copy (see `DELETE_COPY` in `lib/innerRep/backup/consent.ts`).
4. **No pressure.** No streak-protection language, no urgency, no guilt for declining, no "you could lose your progress" framing, no badges. A person who never turns this on has a complete product.
5. **Nothing implies more than is happening.** Never "backed up" while events are waiting; never a backed-up date while off. The read model below makes this structurally impossible if you render only what it gives you.
6. Mirar language rules apply: use *practice, choices, history, kept, device*; avoid healing/therapy/motivational framing and avoid "sync" and "cloud" as headline words (they sound like surveillance infrastructure).
7. Source separation is unchanged: backup stores the engine's history; the Mirror's evidence rules, readings and corrections are not touched, and pilot history is a later, separate event kind.

## 3. What the runtime gives you (pure TypeScript, no network): `lib/innerRep/backup/`
- **`ConsentState`** (`consent.ts`): `off` (default) · `declined{until}` · `on{version,since}` · `paused{version}` · `needs_reconsent{version}`. `consentReduce(state, action)` for actions `accept`, `decline`, `turn_off`, `turn_on`, `delete_data`, `server_copy_removed`, `consent_text_changed`, `sign_out`. `mayOffer(state, today)` says whether the one-time card may appear.
- **`backupView(consent, facts, today) → BackupView`** (`view.ts`): `health` is one of `not_running · up_to_date · waiting · offline · needs_attention · decision_required · server_copy_removed`; plus `waiting`, `dropped`, `lastBackedUpDay` (only when up to date), `mayOfferCard`, and an `actions` object listing **exactly the controls that are meaningful now** (turnOn, turnOff, deleteBackedUp, exportFile, importFile, reviewDropped, chooseHistory). Render controls only when their flag is true.
- **`SyncClient` outcomes** (`sync.ts`) for the screens that follow a choice: `connect()` returns `connected{mode: upload | restore | upload_rest | in_sync}` or `decision_required{localCount, accountCount}`; `resolve('keep_account' | 'keep_account_and_export' | {keep_device:{confirmOverwriteAccountCopy:true}})`; `sync()` returns `{sent, pulled, dropped[{event, reason}], rebuilt, skipped?}`; `dropped` entries are the "kept on this device only" records.
- **Export/import:** `exportJournal` / `importJournal` (a file of the same structured history).
Fixtures: render states from synthetic objects; mark them as **sample data** in any review build, as with the other fixtures. Do not edit `lib/innerRep/backup/*`; send findings back.

## 4. The screens and states to design (your visual direction; the contract is fixed)
1. **The offer** (Today, after a first completed rep; dismissible card, shown at most once per quiet period): what it is in one sentence, "Turn on" and "Not now" with equal prominence.
2. **The consent screen** (separate from sign-in; one decision): what is kept, what is never kept, who can see it, how to turn it off, how to delete it, and the provider-backup caveat **[wording pending review; use placeholders marked DRAFT]**. Two buttons: *Turn on backup* / *Not now*. Also reachable from Me.
3. **Me → Backup**, driven by `BackupView`: the current state in plain words; the last backed-up day only when `up_to_date`; the controls from `actions`; an always-visible statement of what is and is not stored.
4. **Sign-out confirmation** (already approved wording: "Signing out removes your practice from this device."). Extend only when backup exists: if off, offer *Back up first* beside *Sign out* and *Cancel*; if on and `waiting > 0`, say so plainly and offer *Wait while it finishes*; never block sign-out.
5. **New device after sign-in** when the account has a backup: "Your backed-up practice is available." Restore is the person's click, not automatic; show a neutral result ("Restored. You are where you left off."), **no counts framed as progress, no score.**
6. **Different history on both sides** (`decision_required`): explain that this device and the account hold different practice, that **nothing has been changed**, and offer the three choices: *Keep the account's* · *Keep the account's and save this device's as a file* · *Keep this device's (replaces the account's)*. The last needs a separate, explicit confirmation; make the consequence unmistakable and irreversible.
7. **Kept on this device only** (`dropped`): why some entries were not added ("another device recorded that day first"), listed neutrally, with export. Not an error state and not a warning.
8. **Turn off / Delete**: two screens, two buttons, two consequences, using `DELETE_COPY`. Deletion is confirmed in plain words and says it cannot be undone and that provider backups may keep copies for a limited time **[period to be confirmed]**.
9. **Export / import a file** ("Keep a copy of my practice"): the same history as a file; import validates and refuses files from another version with a clear, calm message.
10. **Offline / waiting / needs attention / account copy removed**: quiet, non-alarming, one line each, no red banners for normal conditions. "Account copy removed" must say backup is now off and nothing will be re-uploaded.

## 5. Accessibility and quality bar (same as the rest of Aperture)
Keyboard and screen-reader operable; every consequence stated in text, not colour or motion; 44 px targets; reduced motion respected; works at 320, 390, 768, 1024, 1440; no layout that hides the "what is not stored" statement behind a disclosure; the destructive controls are never the default focus. Axe clean; please include the usual validation matrices.

## 6. What I will not do without separate approval, and what you must not do
Run any SQL, create tables, change RLS, store any practice on Supabase, enable sync, or change retention (founder approval gates G4 to G6). You must not add any network code, Supabase client calls, analytics, or persistence for this feature; use the stub port and the read model.

## 7. Questions back to me
How should a successful restore read without implying achievement? How should "kept on this device only" be worded so it is neither alarming nor dismissive? Should "Back up first" at sign-out be a button or a quiet link? (Your call within the constraints above; tell me if the contract needs a field it does not have.)

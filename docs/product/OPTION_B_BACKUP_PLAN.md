# Option B: opt-in "Back up my practice": implementation and consent plan

**Status: approved in principle for design, privacy review and a staging proposal ONLY (14 October 2026).** This document authorizes nothing else. **Not done and not authorized:** executing SQL, creating tables, changing RLS, storing any personal practice on Supabase, enabling sync, or any change to retention. Each of those needs its own explicit approval (the ladder in §8). It builds on, and does not replace, `DURABLE_HISTORY_DECISION_MEMO.md` (the memo's schema, RLS, replay and test plan stand; this adds the consent flow and the concrete minimisation and disclosure decisions the memo left open).

**Why this exists (the evidence).** The 14 October real-auth test showed that sign-out, correctly, erases the device's practice: the Mirror is empty and today's rep is offered again (`REAL_AUTH_TEST_RECORD.md`). Authentication works; continuity does not exist across sign-out, a cleared browser, or a second device. That is the cost the memo describes in §2–§3.

## 1. Principles (non-negotiable, from the product and the memo)
1. **Off by default; the person decides, and can reverse it.** Sign-in never turns it on. Local stays the source of truth until opt-in.
2. **Structured only, minimal.** No free text, ever (the runtime already has no text field). No timestamps finer than the calendar day. No analytics reads.
3. **Owner-only.** Only the signed-in person's account can read or write their rows. No routine staff access.
4. **Deletable.** A first-class "Delete my backed-up practice" that really deletes.
5. **Honest scope.** Pilot records, engine history and Mirror readings are described as what they are: your own choices, kept so you can come back to them. Nothing is described as an assessment.

## 2. What would be stored (and what would not): data minimisation
| Stored (structured) | Not stored |
|---|---|
| Per completed engine rep: calendar day, template id, frame, bound domain (if any), wording variant, the authored option ids chosen, unknown/skip markers | Anything typed (optional words are discarded today and stay discarded) |
| Commitment: authored label id/text, timeframe, calendar due date, status events | Time of day, device id, IP address, user agent, location |
| Feedback on a reading: value (Accurate / Partly / No / Not sure) and the structured correction reason | The wording of readings beyond the engine's own id and tier (text is re-derived by the engine on replay) |
| Pilot records (own event kinds, **later**, after the engine's): situation id, reading id, certainty and re-rating, alternatives chosen (ids), placements and "when" ids, hold outcome, status (completed/left) | Pilot camera sentences; crisis-check inputs; anything from a halted safety session |
| A random per-user seed and the engine version | Email in any practice row (the account owns rows by `auth.uid()`; analytics, if any, use `mirar_id`, never email) |

Even without text, "domain: partner, day X" says something about a life: it is sensitive. The disclosure says so.

## 3. Consent flow (what the person sees)
- **Where it appears:** (a) Me → "Back up my practice", off, with the plain explanation; (b) once, after the person's first completed rep on a device, a quiet optional card, never a blocker, dismissible, not re-asked for 30 days; (c) at sign-out: the approved confirmation already says "Signing out removes your practice from this device." and, **only once Option B exists**, adds "Back up first" beside Cancel.
- **The consent screen** (separate from sign-in, one decision, two buttons: "Turn on backup" / "Not now"), plain language (drafted in §7, needs qualified review before use). Shows exactly what is stored and not stored (§2), who can read it ("only you"), how to delete it, and the backup-retention caveat.
- **Withdrawal:** "Turn off backup" stops new writes; a separate "Delete my backed-up practice" deletes server data. The two are different buttons with different, stated consequences. Turning off does not silently delete; deleting does not silently turn off.

## 4. Account isolation
- Row ownership by `auth.uid()`; owner-only select/insert; no client update; delete only through the delete function; no cross-user policy; no public grants (verify the live project's grants directly, as the memo warns; do not assume).
- Client: the loader already resets all in-memory state per user and sign-out drops it; both are covered by `scripts/runtime/account-isolation.test.ts`. The cloud path would add: events are fetched only after `auth.uid()` is known; a mismatch between the signed-in user and a cached snapshot discards the snapshot.
- **Tests required before any real data:** two real staging accounts (A cannot read, insert for, or delete B); the whitelist function rejects any unknown payload key; a sentinel typed into every optional field never appears in any table, log or network payload; account deletion cascades.

## 5. Conflict handling
- **One completed rep per user per calendar day, across devices:** the unique `(user_id, day)` index lets the first win; the second device refreshes to "done today". This also closes today's repeat-after-sign-out gap.
- **Feedback and commitment status** are commutative events applied in `seq` order; last user action wins per commitment.
- **Offline:** events queue on the device and flush on reconnect; if the day was already taken, the later rep is dropped with a plain message and kept locally for export.
- **First opt-in (local data exists, server empty):** offer "Back up what's on this device" (idempotent import by instance id and day). **Both exist:** never auto-merge; ask: keep this device's, keep the account's, or keep the account's and export this device's as a file; default the account's. **Never overwrite silently.**
- **Engine version changes:** events pin `engine_version`; state is rebuilt only under the version that produced it or by an explicit, tested migration.

## 6. Deletion and retention
- **Retention:** until the person deletes it or deletes the account. Day-level dates only.
- **Delete my backed-up practice:** removes all events and the profile row, clears the local copy on request, irreversible, confirmed in plain words, verified by a query returning zero rows and a second device being unable to restore.
- **Backups:** the managed provider may retain deleted data for its backup window. **That window must be verified against the current plan before any wording is written;** it is deliberately not asserted here. The same applies to the log-retention question that is still open for the admin-endpoint review.
- Retention changes beyond this (for example auto-expiry) are a separate approval.

## 7. Draft disclosure (for qualified review; not for use until reviewed)
> **Back up my practice (off by default).** If you turn this on, Mirar keeps a copy of your practice in your account so it is still there if you sign out, clear your browser, or use another device.
> **What is kept:** the choices you make (which options you picked, the day, any intention you chose to carry, and how you respond to a reading). **What is never kept:** anything you type, the time of day, or your location.
> **Who can see it:** only you, signed in to your account.
> **Control:** you can turn this off at any time, and you can delete everything we have kept. Deleting is permanent. Copies in the provider's backups may remain for a limited time before they are removed [period to be confirmed before release].
> This is a record of your own choices. It is not an assessment of you.

## 8. Approval ladder (nothing proceeds without the next explicit yes)
1. **Now (done):** approval in principle for design, privacy review and a staging proposal.
2. **Next, from you:** approve this consent flow and the minimisation table in §2 (or amend them); decide whether pilot records are in the first release or follow the engine.
3. **Then:** qualified review of the disclosure and the retention and backup statements; verification of the plan's backup and log-retention windows.
4. **Then, separately:** approval of an exact **staging-only** migration file (I will show the SQL for approval; I will not run it), a feature flag `EXPO_PUBLIC_HISTORY_SYNC` (default off) and the per-user `sync_enabled`, and the test run in §4 and the memo §6 against two real staging accounts.
5. **Only after all of the above:** a separate production decision, together with the other release gates.

## 9. What I need to decide the next step
- Is the §2 minimisation acceptable, in particular **domain** and **commitment labels** being stored? (Narrower option: store option ids only and omit bound domain; costs some Mirror fidelity.)
- Pilots in the first release, or engine first?
- Is a **file export/import** ("Keep a copy of my practice") wanted as an interim, server-free option?
- Who performs the privacy and legal review?

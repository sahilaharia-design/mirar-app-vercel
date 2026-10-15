# Trial entitlement contract: v1.0 (final for approval)

**Date:** 15 October 2026. **Status:** the founder's decisions of 15 October (later) are applied. **Nothing here is implemented.** No migration, no function, no table, no payment code, no email, no production change. The frozen engine and Codex's continuity work are untouched. Implementation needs the separate approvals in section 13.
**Executable specification:** `scripts/entitlement/model.ts` with focused local tests `scripts/entitlement/entitlement.test.ts` (63 checks, all passing, pure in-memory). The exact server proposal is `docs/product/E1_ENTITLEMENT_PROPOSAL.md` and `docs/proposed/entitlement/`.
**Mission anchor:** everyday emotional and mental hygiene leading to better emotional fitness. The trial exists so a person can find out, honestly, whether a daily practice is worth keeping.

## 1. Decisions of record (founder)
1. **Length: 348 hours** from the server-recorded first completed Daily Inner Rep (336 h + a 12 h courtesy). The expiry is **disclosed and displayed accurately** (exact local time, section 6).
2. **Start:** only after the first successfully completed rep, never at signup.
3. **Server-authoritative timing.** The device clock decides nothing that matters; it is used only inside bounded offline allowances (section 5).
4. **Bounded offline experience** with the precise rules in section 5 (72 h and 3 reps), clock-tamper protection, and defined behaviour when the server is unavailable beyond the allowance.
5. **Notices:** in-app day-7 and day-12 first; email later, only when transactional email, communication rules and reviewed copy exist. No duplicates, no pressure.
6. **Expiry:** the person keeps account access, available history, export and deletion; new member reps need an active subscription.
7. **Beta users** receive the standard new 14-day trial that begins only after their first completed v2 rep. No automatic billing, no bulk resets, no reliance on legacy trial rows.
8. **First-completion signal:** minimal and authenticated, no answers and no emotional content; approved **in principle**. Final disclosure and any live storage need separate approval.
9. **Eligibility is per account**, determined by the account's own server row. No aggressive email normalisation, no invasive anti-abuse tracking, unless a need is demonstrated (section 10).
10. **Evidence thresholds are never changed** to make the Mirror appear more often.

## 2. The timing rule
`trial_ends_at = trial_started_at + 348 hours`, both set once by the database clock when the first-completion signal is first accepted. Comparison of rules (4,032 modelled cases each, `docs/sim/trial-timing.md`): local-calendar-day + 12 h loses a practice day in 1.9% of cases and needs a stored time zone; exactly 336 h in 7.0% (15.8% after a 13.5 h westward move, 0% without travel); **336 h + 12 h in 0.1%, with no time zone**. Test vectors (India time): 15 Oct 07:10 → 29 Oct 19:10; 15 Oct 23:50 → 30 Oct 11:50; 16 Oct 00:05 → 30 Oct 12:05. The day-7 notice window opens at +168 h and the day-12 window at +288 h.

## 3. States and what each allows
| State | Meaning | New member rep | See history and Mirror | Export file | Delete account | Membership page |
|---|---|---|---|---|---|---|
| `new` | Account exists; first rep not yet completed | **yes (the first rep)** | n/a | yes | yes | information only |
| `trialing` | `now < trial_ends_at` | yes (within the offline allowance if offline) | yes | yes | yes | yes |
| `trial_expired` | trial over, no subscription | **no** | **yes** | **yes** | **yes** | yes: the price once; Continue and Not now carry equal weight |
| `comped` | explicit, logged founder grant | yes | yes | yes | yes | yes |
| billing states | defined by the billing contract | per that contract | yes | yes | yes | yes |
A rep begun before expiry may be finished. Viewing history, export and deletion are **never** gated. No state change is silent: the server records an event and the app tells the person.

## 4. The first-completion signal
- **When:** the moment a rep is completed (`complete()` succeeded and the engine marked it completed). Not on opening, not on an abandoned or skipped rep, not on a safety stop. Only when the cached state is `new`.
- **What is sent:** an authenticated call with **no arguments**: no answers, no template, no duration, no device, no client time. The server stamps its own clock. Nothing about the practice can be carried by the call (the function takes no parameters).
- **Idempotent:** the first accepted call sets the start and end; later calls return the same values and change nothing. A retry after a lost reply is harmless (tested).
- **Disclosure (DRAFT, needs qualified review before use):** *"To run your 14-day trial, Mirar records the moment you finish your first practice. It does not record what you chose."* This is the one practice-derived fact the server holds.

## 5. Offline and server-unavailable rules (precise)
Parameters (constants in the model and the client): **PENDING 72 h**, **FRESH 72 h**, **MAX REPS BETWEEN CONTACTS 3**, **BACKWARD TOLERANCE 5 min**. A **contact** is a successful answer from `entitlement_get` or `entitlement_first_rep_completed`. Practice is already stored on the device; these rules only decide whether a **new member rep may be started**.

**Device-side facts kept per account** (cached on the device; nothing else about practice): `state`, `trial_started_at`, `trial_ends_at`, `server_now` at the last contact (`anchorServer`), `offset = server_now − device clock at that contact`, `pending` (device time of an unconfirmed first completion, if any), `repsSince` (member reps completed since the last contact). **Per device:** a high-water mark of the device clock (`hw`), shared by all accounts.

**Effective time.** `t = max(device clock, hw)`; the stored `hw` is updated every time the app reads the clock, so `t` never goes backwards. Estimated server time `est = t + offset`.

**Decision for a new member rep (checked in this order):**
| # | Condition | Result |
|---|---|---|
| 1 | No cached status for this account (never fetched, signed out, storage cleared, invalid session) | **Not allowed**: "connect to continue" (`needs_connection_no_status`) |
| 2 | A first completion is waiting for the server (`pending`) and `t − pending > 72 h` | Not allowed (`needs_connection_pending`) |
| 3 | `pending` waiting, within 72 h, and `repsSince < 3` | Allowed (`ok_pending`) |
| 4 | Pending allowed by time but `repsSince ≥ 3` | Not allowed (`needs_connection_reps`) |
| 5 | State `new` (first rep not yet done) | Allowed (`ok_first_rep`) |
| 6 | State `trialing` and `est ≥ trial_ends_at` | **Expired locally**, even offline (`expired`). The cached end is the end; the allowance never extends it |
| 7 | State `trialing`, `est − anchorServer > 72 h` | Not allowed (`needs_connection_stale`) |
| 8 | State `trialing`, fresh, but `repsSince ≥ 3` | Not allowed (`needs_connection_reps`) |
| 9 | State `trialing`, not expired, fresh, `repsSince < 3` | Allowed (`ok_trial`) |
| 10 | State `trial_expired` | Not allowed (`expired`) |
| 11 | State `comped` | Same freshness and count rules as 7 to 9 |
| 12 | Any "Not allowed" while a rep is already in progress | The rep in progress may be finished; no new one may start |
View history, export and deletion are available in **every** row.

**Transitions.**
- *Sign-in / launch / daily / "check my membership"* → `entitlement_get` (or the waiting first-completion signal first). Success replaces the cache, resets `repsSince` to 0, recomputes `offset`, and resets `hw` to the device clock. The server's answer always wins (a trial started on another device, a comp, an extension, an expiry).
- *First rep completed* → state `new`: mark `pending`, count the rep, send the signal. Success: the cache becomes `trialing` with the **server's receipt time** as the start (waiting never consumes trial time). Failure: stays pending; retried at launch and on every reconnect.
- *Each later completed member rep* → `repsSince += 1`.
- *Invalid or signed-out session* → the cache is deleted; nothing is trusted until the person signs in again online.
- *Sign-out* → that account's cache is deleted; `hw` stays.
- *Account switch* → each account is judged only by its own cache; an account with no cache gets nothing from another's.

**When the server is unavailable beyond the allowance** (device offline, or our service down or paused): rows 2, 4, 7, 8 apply. The person keeps their history, Mirror, export and deletion and sees one calm line: *"Connect to continue your practice. Your history is safe on this device."* (copy to be reviewed; "safe" will be replaced by a verified phrase). **Nothing is extended automatically**, because an automatic extension would make an outage a loophole and an unbounded one would make the trial indefinite. If the outage is ours, the remedy is an **explicit, logged** extension by the founder (`entitlement_admin('extend', …)`), after which the person sees it in the app.

**Clock-tamper protection (layers, and the honest limit).**
1. *Calibration:* a wrong device clock, early or late by hours or days, is absorbed by `offset` at the first contact (tested).
2. *High-water mark:* while the app observes time, `t` cannot go backwards; a backwards step beyond 5 minutes is flagged but never rewinds the trial (tested).
3. *Count backstop (clock-independent):* at most **3 member reps between two server contacts**, whatever the clock says. This is what bounds a person who sets the clock back while the app is closed, when no observation could catch it (tested: they get at most 3 reps, across restarts).
4. *Cleared storage:* removes the cache as well, so there is **no** status to exploit offline (tested).
5. *Forward jumps* only shorten the allowance; one contact restores it with the true end (tested).
6. *Every contact* re-anchors time from the server.
7. *The server decides:* the trial end is a fixed instant in the database. Nothing a device does changes it.
**Honest limit.** This is a soft paywall around a local product. A determined person who stays offline permanently, clears nothing, and keeps manipulating the clock can complete 3 member reps per connection and no more; reconnecting returns them to the true end. Sign-in itself needs a connection, so a normal web visit contacts the server at every launch.

**Repeated or indefinite access considered.** Repeating the first rep after clearing storage and signing in again does not restart a trial that the server has started; if it never started, the loop requires wiping the practice history every time, which defeats the product. A new account is a new trial (section 10). Multiple devices share one server clock and one end. An automatic outage extension does not exist.

## 6. Notices (in-app first; email later)
| Notice | Window | Rules |
|---|---|---|
| Trial started | on server confirmation | Shows the **exact end time in the person's local zone** (for example "until Thursday 30 October, 11:50"), that no card was asked for, and what happens at the end. The same time appears on the membership page, computed from `trial_ends_at` only |
| Day-7 checkpoint | opens at +168 h, shown at most once per device, available afterwards on the membership page | Factual: the end date; a plain count of completed days from the device's own history; history, export and deletion stay available; no encouragement quotas |
| Day-12 notice | opens at +288 h, once per device | Factual: the date it ends; what stays available; what continuing costs, once; Continue and Not now carry equal weight |
| Expired | at `trial_ends_at` | The expired state itself (section 3); no banner stack |
Never: countdown timers, "last chance", loss or guilt language, streak language, repeated nagging, dark-pattern defaults. **Duplicates:** each notice appears once per device (device-local mark). A second device may show it once more; that is accepted until email exists, when a server-side "sent" mark becomes necessary anyway. **Email** day-7/day-12 messages are a later, separately approved piece (transactional-email contract, reviewed copy, recipients, opt-out rules).

## 7. Server data and security model (proposal in E1)
- `entitlement` (one row per account): `state` ∈ new, trialing, trial_expired, comped; `trial_started_at`, `trial_ends_at`; `cohort` ∈ standard, internal; `version`. `entitlement_event` (append-only audit, no free-form data). Both reference `auth.users` and are deleted with the account.
- **Clients have no table privileges.** They may call exactly two functions: `entitlement_get()` and `entitlement_first_rep_completed()` (no arguments). Admin actions are `entitlement_admin(...)`, **service role only**, with a mandatory reason. RLS is enabled with no policies as defence in depth.
- Database triggers keep `trial_started_at` immutable and forbid moving `trial_ends_at` earlier. Time comes only from the database clock.
- **No scheduled job:** expiry is evaluated and recorded lazily on read.
- **Legacy `trial_tracking` and `subscriptions` are never read, written or referenced.** (A separate, optional change, E1b, would make their owner-write policies read-only; see the proposal.)

## 8. Expiry experience
Account access, history, Mirror, export and deletion stay; no new member reps; the price shown once without pressure; reactivation returns the person directly with no second trial; a plain note that history lives on this device and how to save it. Details: `TRIAL_LENGTH_EVALUATION.md`.

## 9. Standalone value (the answer to "only 17% see a reading")
Evidence thresholds stay as they are. The trial stands on: a closing built only from the session's own answers (designed, to be verified/built); today's receipt (built); a factual Mirror history with an honest sparse state (read model built; copy with Codex); one truthful "what Mirar will remember" line after a rep (to specify); follow-through on commitments and events (engine built); a practice-days count without a streak (built). **Do not show how close a person is to a reading** (it would invite steering their answers and break the independence the evidence rules protect). Readings appear only when there is enough of their own evidence; many people will not see one for weeks, and the copy says so honestly.

## 10. Eligibility and abuse
Per account. A person who creates another account with another address gets another trial; the cost to us is nil (the engine is local and the free tier carries it). **No email-alias normalisation, no hashing of addresses, no device fingerprinting.** Revisit only on **demonstrated need**: after launch, once a month, look at aggregate counts only (accounts created, trials started, subscriptions started, per week); if a review of support and billing evidence shows repeat-trial use that materially affects revenue, bring a proportionate proposal for approval. Nothing is collected for this purpose now.

## 11. Existing beta users
The standard new trial, starting only at their first completed v2 rep; no automatic billing (no payment instrument exists), no bulk reset or backfill, legacy trial rows ignored and tested as ignored. Details and options: `docs/product/BETA_USER_TRANSITION.md`.

## 12. Tests (all local)
`scripts/entitlement/entitlement.test.ts`, 63 checks: **expiry** (exact 348 h, millisecond boundaries, single recording, post-expiry signal, immutability, admin extension and comp, zone-independent display); **repeated signals** (idempotence, simultaneous calls, lost reply, other accounts, a second device); **offline recovery** (pending 72 h to the millisecond, server-receipt start, reconnect, launch retry, cached freshness, never past the end, unavailable vs offline, invalid session); **clock changes** (set back while closed, restart, cleared storage, forward jump and correction, wrong clock calibrated, small steps, zone independence, the 3-rep backstop); **account switching** (separate caches, no borrowing, sign-out, expired A vs new B, per-account bounds); **legacy isolation** (a trap on the legacy data never fires, poisoned legacy rows change nothing, static scans of the SQL, the model and the client code). `scripts/entitlement/entitlement-sql.test.ts` is written but **not run** (E1 not approved); it must be run on a throwaway in-memory Postgres first and then on a real Postgres 17.

## 13. Approvals and boundaries
Approving this contract does not approve execution of anything. Separate gates, none requested here: **E1** review and approve the exact SQL text and the local dry-run on a throwaway in-memory database (`E1_ENTITLEMENT_PROPOSAL.md`); **E1b** (optional) the legacy owner-write policy change; **E2** apply to a staging project with test accounts only; **E3** privacy and first-completion disclosure text after qualified review; **E4** client work (Claude data layer, Codex presentation); **E5** production. G4 (backup storage) stays blocked and independent. Payment, Cashfree, email sending and Supabase configuration remain untouched.

## 14. Decisions still open
1. Exact copy of the end-time display, the notices and the "connect to continue" line (with Codex; legal review of the first-completion disclosure).
2. Whether the three constants (72 h, 72 h, 3 reps) are acceptable (recommended as written; they are constants, easy to change before E4).
3. Whether to approve E1b.
4. Notice recipients and rules for the later email stage.

# Trial entitlement contract: DRAFT v0.1 for founder approval

**Date:** 15 October 2026. **Status: DRAFT. Nothing here is implemented.** No migration, no function, no table, no payment code, no production change. The frozen engine is untouched; Codex's continuity work is untouched. Implementation needs the separate approvals in section 13.
**Mission anchor:** everyday emotional and mental hygiene leading to better emotional fitness. The trial exists so a person can find out, honestly, whether a daily practice is worth keeping.

## 1. Approved product rules (founder, 15 October)
1. A **14-day free trial** with complete access to the supported membership experience.
2. The trial **starts only after the first successfully completed Daily Inner Rep**, never at signup.
3. Timing is **server-authoritative** (rule chosen in section 2).
4. At expiry the person keeps **account access, supported available history, export and deletion**. New member reps require an active subscription.
5. A gentle **day-7 checkpoint** and **day-12 expiry notice**; no guilt, artificial urgency or pressure.
6. A minimal **first-rep-completed signal** is approved in principle for entitlement, subject to privacy disclosure and separately approved database/security work.
7. Existing beta users are never silently reset or charged (section 11, `BETA_USER_TRANSITION.md`).
8. Evidence thresholds are **not** changed to make the Mirror appear more often.

## 2. Timing rule: comparison and recommendation
Compared by `scripts/sim/trial-timing.ts` (generated: `docs/sim/trial-timing.md`): 4,032 cases per rule (24 start hours x 24 habit hours x 7 travel scenarios). A habitual practitioner completes one rep per device-local calendar date; 14 reps is the fair baseline.

| Rule | Mean reps | Day lost (<14 reps) | Needs stored time zone | Moving parts |
|---|---|---|---|---|
| A. End of local day 14 + 12 h | 14.26 | 1.9% | **yes** (zone at start, calendar math) | zone, midnight rule, courtesy |
| **B. 336 hours exactly** | 14.24 | **7.0%** (15.8% for a move 13.5 h west, 1.7% London, 0% no travel) | no | one constant |
| **B+. 336 hours + fixed 12 h** | 14.74 | **0.1%** | no | two constants, one sum |
| C. Local day 14, no courtesy | 13.76 | 26.3% | yes | zone, midnight rule |

Without travel, **no rule loses a day** (every rule gave 14 or more). Day losses appear only when the device's time zone moves west during the trial, because the device's calendar date then arrives later in absolute time. The 12-hour courtesy covers every modelled move except a rare extreme.

**Recommendation: B+. `trial_ends_at = first_rep_completed_at + 348 hours`** (14 days plus a fixed 12-hour courtesy), computed on the server from the database clock.
- Least complex: one instant, no time zone stored or interpreted, no calendar arithmetic, no DST edge (India has none, but travellers do).
- Predictable: the person can be told one exact end time. Day-7 note at +168 h; day-12 note at +288 h; both are simple additions.
- Fair: 0.1% of modelled cases lose a day; the cost is a bonus day for some people (mean 14.74 reps), which is harmless: the trial has no marginal cost.
- Honest to describe: "Your 14 days run until <exact time in your local zone>. We add 12 hours so a late start or travel never costs you a day."
- If you prefer **exactly 336 hours**, it is equally simple; the price is a lost practice day for about 7% of the modelled mix and 16% of far-west travellers. I do not recommend it, but it is a legitimate choice if the promise "exactly 14 x 24 hours" is valued more.

Test vectors (IST start → B+ end): 2026-10-15 07:10 → 2026-10-29 19:10; 2026-10-15 23:50 → 2026-10-30 11:50; 2026-10-16 00:05 → 2026-10-30 12:05. The device clock never decides anything.

## 3. States and what each allows
| State | Meaning | Start a new member rep | See history and Mirror | Export file | Delete account | Membership page |
|---|---|---|---|---|---|---|
| `new` | Signed in, first rep not yet completed | **yes (the first rep)** | n/a | yes | yes | read-only info |
| `trialing` | `now < trial_ends_at` | yes | yes | yes | yes | yes |
| `trial_expired` | trial over, no subscription | **no** | **yes** | **yes** | **yes** | yes (price once, Continue / Not now, equal weight) |
| `active` | paid (defined later by the billing contract) | yes | yes | yes | yes | yes |
| `past_due`, `cancel_pending`, `lapsed` | billing states (billing contract) | per that contract | yes | yes | yes | yes |
| `comped` | explicit founder grant (testers, partners), recorded | yes | yes | yes | yes | yes |

Rules: a rep begun before expiry may be finished; viewing history is never gated; export and deletion are never gated; a state change is never silent (an `entitlement_event` is written and the person is told in-app). Billing states are placeholders so the interface does not change when payment is added.

## 4. The first-rep-completed signal
- **When:** the moment the first rep is completed (`complete()` succeeded and the engine marked it completed; an abandoned or skipped rep does not count; a safety stop never counts). Not on tapping "Begin".
- **What the client sends:** an authenticated request with **no body** (the user is the JWT subject). **Nothing about the rep: no id, template, answers, duration or device.** The server stamps `now()` from the database clock.
- **Idempotent:** the first accepted call sets `trial_started_at`, `trial_ends_at` and writes an event; later calls return the existing values and change nothing. A retry after a network failure is safe.
- **Offline or failed:** the practice is already stored on the device, so nothing is lost. The client retries with backoff and on every launch. Meanwhile the app shows "Your 14 days begin once this is confirmed" and allows practice in state `start_pending` for up to **72 hours** (a decision, section 12); after that it asks for a connection. The trial start is the server's receipt time, which can only favour the person.
- **Disclosure:** this is the only practice-derived fact the server holds: the date and time of the first completed rep. The privacy page and the first-rep moment must say so plainly (DRAFT, counsel to review): *"To run your 14-day trial, Mirar records when you finish your first practice. It does not record what you chose."*
- **Abuse limits:** authenticated only; rate-limited per user; no effect after the first success; no client-supplied time is trusted.

## 5. Reading entitlement (client)
- On launch and at most daily, the client calls a read-only function (`get_entitlement`) that returns the person's own row only: `state`, `trial_started_at`, `trial_ends_at`, `now` (server), and later `paid_through`.
- The client caches the answer with its fetch time. **Offline grace:** a cached `trialing`/`active` answer is honoured until its end plus 72 hours without contact (a decision). Expiry is judged against `trial_ends_at` using the **server `now` offset recorded at fetch** so a changed device clock cannot extend it beyond the grace.
- This is a **soft paywall** by design (section 6.5 of the masterplan): the engine and practice run locally. Do not market anything as locked. No signed token is needed for v1.

## 6. Notices (service messages, not marketing)
| Notice | When | Content rule |
|---|---|---|
| Trial started | on server confirmation | In-app: exact end time in the person's local zone; what happens at the end; no card was asked for |
| Day-7 checkpoint | +168 h (in-app on next open; one email only if the person has an email and has not opted out of non-essential mail) | In-app: a plain count of completed days, computed on the device from the person's own history. Email: the trial dates and a link only (the server knows no practice counts). Factual, no encouragement quotas |
| Day-12 notice | +288 h | Factual: the date it ends, that history, export and deletion stay available, what continuing costs once, equal "Continue" and "Not now" |
| Expired | at `trial_ends_at` | In-app on next open: what remains; no email unless the person opted in |
Never: countdown timers, "last chance", loss language, streak language, repeated reminders. At most one email per notice. Email send itself is a separate approved piece (masterplan section 16).

## 7. Server data (draft; NOT applied; exact SQL will be shown for approval first)
- `entitlement`: `user_id` PK, `state`, `trial_started_at`, `trial_ends_at`, `start_source` ('first_rep'), `cohort` ('standard' | 'beta' | 'internal'), `updated_at`, `version`. Created lazily by `get_entitlement()` or on first sign-in, never by a client write.
- `entitlement_event`: append-only (`user_id`, `kind`, `at`, `source` ('system' | 'admin' | 'billing'), small whitelisted `detail`). Every state change and every admin action writes one.
- `trial_claim`: `email_key` (hash of the normalised email: lower-case, plus-tags removed, Gmail dots removed) → `user_id`, so one trial per person-address. Normalisation is deterministic and unit-tested.
- RLS: owners may `select` their own rows only; **no client insert, update or delete on any of these**. Writes happen only inside `security definer` functions (`record_first_rep_completed()`, later billing functions) or the service role. `trial_started_at` cannot change once set except by an explicit admin event.
- **Legacy `trial_tracking` and `subscriptions` are never read by the new gate.** Their owner-writable policies must be removed (separate approved change) because they are a self-grant hazard.
- Time source: database `now()` only.

## 8. Expiry experience (summary of the approved rule 4)
Account access, history and Mirror visible, export and deletion available, no new member reps, price shown once without pressure, reactivation without a second trial. A short, plain note that history is on this device and how to save it. Details: `TRIAL_LENGTH_EVALUATION.md`.

## 9. Standalone value (the answer to "only 17% see a reading")
Evidence thresholds stay as they are. The trial must stand on three things the product can deliver without a reading. These are requirements for Claude (read models) and Codex (presentation); none changes the engine.

| Layer | Requirement | Acceptance | Status today |
|---|---|---|---|
| Immediate rep experience | Every rep ends with a closing built **only from that session's own answers**, correct for "I don't know", declines and "nothing today" | A matrix of answer cases each produce a non-generic, non-inferential close; zero claims about the person | Designed in `MIRAR_VALUE_AND_RUNTIME_CONTRACT.md` §4; closing is generic in the staged build, to be verified |
| Today's receipt | The exact response is shown and survives reload | Receipt equals stored answers | **Built and tested** (`runtime/receipt.ts`) |
| Factual Mirror history | The Mirror shows what the person said, what they practised, what Mirar has not been told, commitments carried; labelled factual, with a plain line that readings appear only when there is enough of their own evidence and that many people will not see one for weeks | Mirror "sparse" state reads as honest and useful, not empty or broken | Read model built (`mirror-contract.ts`); copy and sparse-state design with Codex |
| Meaningful follow-through | After a rep, one truthful "what Mirar will remember / ask about next" line; commitments and events followed up within the engine's budgets | Line appears only when something is actually stored; follow-up occurs on schedule in tests | Engine follow-through built; the after-rep line and Today cue to be specified |
| Practice rhythm without gamification | Practice days this month as a descriptive count, no streak | Count equals completed local dates | `practiceDaysThisMonth()` built |

**A caution that protects the evidence.** Do not tell people how close they are to a reading ("Work has come up 2 times, 3 needed"): doing so would invite them to steer their answers and would break the independence the evidence rules protect. Say only that readings appear when enough of their own evidence exists. The engine's refusal reasons stay internal.

## 10. Test plan (local first; no network)
1. **Pure-model tests (extend `trial-timing.ts` into a test file when approved):** B+ end instant for 24 start hours; day-7 and day-12 instants; idempotent start; clock-skew cases (device clock forward and back changes nothing); offline grace edges; mid-rep expiry; email normalisation vectors (dots, plus tags, case, Unicode, Gmail vs non-Gmail).
2. **Legacy isolation test:** the gate never reads `trial_tracking` or `subscriptions` (static check plus a test with poisoned legacy values).
3. **Local database tests on in-memory Postgres 17 (same method as the backup SQL), before any staging:** owner-only `select`; every client write refused; `record_first_rep_completed()` idempotent and bound to `auth.uid()`; `trial_started_at` immutability; event append; default-privilege hazard (revoke by name, as found in the backup work).
4. **Two-account isolation:** user A cannot read or influence user B's entitlement.
5. **Staging only after approval:** real-browser run of the three flows (first rep → trial start; offline start; expiry), and a day-7/day-12 timeline with the clock accelerated on the server side (never the device clock).
6. **Accessibility and mobile** for every state screen (Codex).

## 11. Existing beta users
See `docs/product/BETA_USER_TRANSITION.md`. In one line: nobody's state changes until they themselves complete a first rep on the new product; nobody is charged because no payment instrument exists until they choose to add one; any exception is an explicit, logged founder action.

## 12. Decisions still needed
1. **B+ (348 h) versus exactly 336 h** (section 2). Recommended: B+.
2. Offline allowances: 72 hours in `start_pending`, and 72 hours of cached-status grace. Recommended as written.
3. Whether the day-7 and day-12 emails go to everyone with an email or only to those who opted into non-essential mail (counsel).
4. Whether `trial_claim` abuse limiting by normalised email is wanted at launch (recommended; cheap; privacy-neutral because it stores a hash).
5. Beta handling options (A, B, C in the transition doc).
6. Wording of the first-rep disclosure (counsel).

## 13. Approvals and boundaries
This contract needs your approval; then, as **separate** gates, none of which is requested now: **E1** the exact entitlement SQL shown for approval and run first on a local Postgres 17; **E2** staging application of that SQL with test accounts only; **E3** privacy-policy and first-rep disclosure text after qualified review; **E4** any client change (Codex presentation, Claude data layer); **E5** production activation. G4 (backup storage) stays blocked and is independent. Payment collection, the Cashfree contract and transactional email are separate contracts.

## 14. Out of scope here
Cashfree integration and subscription states beyond the placeholders, email sending, pricing and GST, Look Again and Attend entitlement, cross-device history, language.

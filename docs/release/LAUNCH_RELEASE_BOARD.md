# Mirar commercial launch: release board (execution plan)

> Journey matrix, communications matrix, regression suite, severity gate, scope classification and the live dashboard are in [LAUNCH_MVP_MATRIX.md](LAUNCH_MVP_MATRIX.md). This file keeps the decisions, designs and backlog IDs.

Date 2026-10-23. Owner: Claude (integration and release lead). Branch `mirar-launch-execution` (not merged, not pushed beyond the branch). Nothing here applies anything to Supabase, billing, hosting or production.

**Locked direction (founder):** 14-day no-card trial; 348-hour entitlement starting at the server-recorded first completed engine rep; one plan, ₹199/month, no annual; no charge at trial end without explicit subscription consent; no streaks, comparative scores, fabricated insights or pressure; frozen engine unchanged unless approved; the 12-person study is optional (targeted acceptance tests instead).

Status words used throughout. **Implemented** = code exists. **Mocked** = behaves via a stub or fixture. **Local-tested** = automated tests pass here. **Staged** = running on a hosted staging build. **Production-ready** = all of the above plus the release gates. Planning documents count for none of them.

---

## 1. Bottom line

1. **The product core is further along than the commercial wrapper.** Engine, runtime, pilots, backup/continuity client logic and the entitlement SQL are implemented and locally tested. **Nothing commercial exists in running form:** no entitlement client wiring, no billing code, no Cashfree account, no hosted continuity, no payoff screen, no reminders, no support channel. Production is still v1.
2. **Four decisions block coding or release and are yours** (section 3): the engine's forced-depth behaviour (D1), the Supabase plan and a separate staging project (D2), subscribe-during-trial and refund rules (D3), and which hosted-continuity scope ships (D6).
3. **A finding that conflicts with the locked principle "no forced depth":** the frozen engine, by its own simulation, serves a heavier template by day 4 in 60% of runs and asks the open question `probe_anchor` on rep 5 in 98% (`FIRST_14_DAYS_EXPERIENCE_AUDIT.md`). The host cannot change this; only an approved engine change can (A9 depth ceiling, A10 probe gating).
4. **Safe coding done this turn** (isolated, reversible, unwired): the async entitlement client `lib/entitlement/client.ts`, differential-tested against the executable spec (400 random runs, 9,050 compared outputs, 0 differences), and a frozen-engine guard `scripts/release/engine-freeze-check.sh` (wired into preflight; `lib/innerRep/v2` is byte-identical to `inner-rep-engine-v2.0.1-correction-fix`).

---

## 2. Reconciliation of authoritative branches

All six code/doc branches form **one linear chain**, verified with `git merge-base --is-ancestor` (each tip contains the previous): `mirar-g3-rev2-integration` → `mirar-first14-audit` → `mirar-value-realignment` → `mirar-realignment-reconciliation` → `mirar-s1a-persist-on-serve` → `mirar-launch-execution`. The chain is 91 commits ahead of `origin/main` (production, v1). **No merge has been performed.**

| Item | Where | Tip | Contents | Status | Proposed handling |
|---|---|---|---|---|---|
| Frozen engine v2.0.1 | `lib/innerRep/v2`, tag `inner-rep-engine-v2.0.1-correction-fix` | in the chain | 23 templates, `decide`, evidence thresholds, correction rules | Local-tested; staged (unified staging); **not production** | Unchanged. Guard added (L0) |
| G3 continuity integration (Codex PR #5 + owner fixes) | `mirar-g3-rev2-integration` | `48f3051` | UI and client logic against a **simulated** service; E1 SQL tests | Local-tested; staged with simulated service | Base of the chain |
| E1 entitlement SQL | `docs/proposed/entitlement/*.sql` | in chain | server functions, triggers, audit | **Drafted, tested on disposable DBs only (166 checks); applied nowhere** | Needs E2 on a staging project |
| Entitlement spec model | `scripts/entitlement/model.ts` | in chain | executable contract (63 checks) | Local-tested | Source of truth for the client |
| Entitlement client | `lib/entitlement/client.ts` | `041b063` | async port of the spec | **Implemented, local-tested, unwired** | Wire in L3 |
| First-14-days audit | `mirar-first14-audit` | `a089b6c` | read-only simulation + findings | Docs/sim | Informs D1 |
| Value realignment spec | `mirar-value-realignment` | `e277ce4` | contracts, change map (P/R/C/E classes) | **Planning only** | Basis for R1, P1 |
| Reconciliation | `mirar-realignment-reconciliation` | `d2baf06` | persist-trigger evaluation, Supabase grant compatibility, runbook §6, `grant-regime-check.ts` | Local-tested | Basis for S1a and migration plan |
| S1a persist-on-serve | `mirar-s1a-persist-on-serve` | `bd179ce` | host helper, store wiring, replay alignment | **Implemented, local-tested (37 checks + 13 suites); unmerged; not staged** | Review, then merge; is **R2** in the spec |
| Codex PR #6 | `codex/mirar-everyday-practice-exploration` | `705b90c` | `explorations/everyday` only (+ `.gitignore`): Message (mocked), Attention (real Attend runtime, guided, in memory), Reply (mocked) | Prototype; protected Vercel preview; **not in the app** | Do not merge as is. Path-disjoint, so merging is safe, but it is not product code. Port the guided Attend presentation into `PilotPractice` (task L9) |
| Study materials | `mirar-validation-study-prep` | `322d1e8` | docs only | Optional | Not a launch gate |

**Proposed merge order (needs your approval, one step at a time):** (1) the chain up to `mirar-launch-execution` into an integration branch cut from `origin/main`; (2) re-run preflight on the launch build profile (L0c); (3) staging deploy (approval); (4) production only after the §11 blockers are closed and §12 passes.

---

## 3. Decisions and approvals required (nothing proceeds on these without you)

| ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| **D1** | Forced depth in the frozen engine. Options: (a) launch on v2.0.1 as is; (b) approve **A9** (user-stated depth ceiling, default light) + **A10** (probe gating) as engine v2.1 behind the byte-identity rule; (c) A1 cold-start only | **(b)**, A9 + A10 only, A11 and A3/A8 after launch. Without it, "no forced depth" is not true of the product | Launch claim, L10 |
| **D2** | Supabase plan and topology. The Free plan has no backups, a 7-day inactivity pause and 1-day logs. The project topology (is staging a separate project from production?) is **not recorded anywhere I can find** | Create a **separate staging project** (Free plan allows it) before any hosted work. Move the production project to Pro before charging anyone (spending approval; order of ₹2,000 a month, verify current price) | E2, G4, billing, any hosted staging change |
| **D3** | Subscribing before the trial ends, and refunds. Cashfree must confirm whether a first-charge date and an authorisation amount are possible | Default: **subscribe at any time; billing starts when you subscribe; the page says so plainly.** Refund SOP written by you and a payments reviewer before sandbox ends | Billing UI, B-track |
| **D4** | Practice formats in the paid build: engine rep (default), Look Again, Attend. Message and Reply stay out of launch | Confirm. Each added format is a new pilot (new types, steps, records, tests): about 6 to 8 days each | Catalog |
| **D5** | First session is an engine rep; pilot completions do not start the trial | Confirm (section 7) | Trial wiring |
| **D6** | Hosted continuity scope: approve Option B (opt-in backup + restore on new device) for launch, or ship with "history lives on this device" and export only | Approve G4 to a staging project first; ship only if restore passes §12 section D | G4, L7 |
| **D7** | Qualified reviewers: privacy/DPDP and policy pages, crisis wording, payments/GST (a CA). None is appointed | Appoint early; these are the longest external lead times | Release gates P1, F1, B1 |
| **D8** | Start Cashfree onboarding (documents, written answers to the 12 questions in the masterplan §11) | Start now; it is the longest external dependency. No cost known to me | B-track |
| **D9** | Launch build profile: pilots and history sync are currently **excluded** from production-equivalent builds and preflight fails if their strings appear | Switch the profile deliberately (L0c); production flags are a change I will not make without approval | Everything staged |

Also open, lower urgency: E1b (read-only legacy `subscriptions`/`trial_tracking` policies), deletion of unused legacy functions, the historical log review, the pending `daily-reminder` deploy.

---

## 4. Status ledger (what is real)

| Area | Implemented | Mocked | Local-tested | Staged | Production-ready |
|---|---|---|---|---|---|
| Engine v2.0.1, runtime, receipt, Mirror contract | Yes | | Yes (85/17/18 and suites) | Yes (unified staging) | **No** (prod is v1) |
| Persist-on-serve (S1a) | Yes | | Yes | No | No (unmerged) |
| Pilots Look Again, Attend (runtime + Aperture UI) | Yes | | Yes | Yes | No (flag off in prod profile) |
| Guided Attention presentation (PR #6) | Prototype | Message, Reply are mocked | Codex checks | Protected preview | No |
| Honest Mirror payoff screen (R1/P1) | No | | | | No |
| Entitlement SQL (E1) | Draft | | Yes, disposable DBs | **No** | No |
| Entitlement client | Yes (unwired) | | Yes | No | No |
| Trial notices, membership page, expired state UI | No | | | | No |
| Billing (Cashfree), webhooks, ledger, cancel | **No** | | | | No |
| Hosted continuity (Option B) | Client logic | **Service is a stub / in-memory** | Yes, plus 433 grant assertions | No | No (G4 blocked) |
| Import / restore on a new device | **No** | | | | No |
| File export | Yes | | Yes | Yes | Not recovery |
| Auth (magic link) | Yes | | | Real-auth staging PASS 14 Oct | v1 in prod |
| Account isolation (sign-out, switch) | Yes | | Yes (store level) | Real two-inbox run **not done** | No |
| Landing | v1 | | | Preview | v1 live |
| Transactional email, reminders, support inbox, policy pages for payment | No | | | | No |
| Security remediation | Partly done (see §11) | | | | Open items |

---

## 5. Prioritised backlog

Effort is engineer-days for me or Codex as marked, a planning estimate. "Ext" = external lead time I cannot estimate. Every acceptance criterion is binary.

### Track 0: baseline (start immediately)
| ID | Task | Owner | Depends | Effort | Acceptance |
|---|---|---|---|---|---|
| L0 | Frozen-engine guard in preflight | Claude | none | done | `scripts/release/engine-freeze-check.sh` prints PASS and preflight lists it |
| L0b | Integration branch cut from `origin/main` with the chain, one approved merge at a time | Claude | your approval | 0.5 | `git merge-base --is-ancestor origin/main <branch>` true; preflight PASS |
| L0c | Launch build profile: define production flags (pilots on, history sync per D6), replace the "pilot strings must be absent" preflight scan with "only intended flags present" | Claude | D9 | 1 | Preflight passes on the launch profile; bundle contains only the anon key; no fixtures or review states |

### Track 1: entitlement and trial (contract preserved, nothing relaxed)
| ID | Task | Owner | Depends | Effort | Acceptance |
|---|---|---|---|---|---|
| L2a | Async entitlement client | Claude | none | done | Differential test 0 diffs; constants equal the spec |
| L3 | Host wiring behind `EXPO_PUBLIC_ENTITLEMENT` (default off): store, `sync` on sign-in/launch/foreground, gate engine rep and pilot starts, call `recordFirstRepCompleted` only after a successful engine `complete`, `recordRepCompleted` for later reps and pilots, `signOut` on sign-out; mock port | Claude | L2a | 3 | Account-isolation test extended: switching accounts never shares state; a safety stop, abandoned rep and pilot completion never start the trial; flag off ⇒ behaviour identical to today |
| L4 | RPC port (`entitlement_get`, `entitlement_first_rep_completed`) | Claude | D2, E2 | 1 | Calls succeed against staging with a test account; no arguments sent on the second call; anon key only in the bundle |
| E2 | Apply E1 SQL to the **staging project** with test accounts | Claude (you approve) | D2 | 1 | `grant-regime-check.ts` green on legacy, new and strict regimes; clients have no table privileges; both RPCs callable by an authenticated user only |
| L5 | Entitlement UI: trial-started with exact local end time, day-7/day-12 notices once per device, membership page, expired state | Codex | L3, copy approved | 4 to 5 | Copy contains no countdown, "last chance", streak or loss language; Continue and Not now equal weight; axe clean at 320/390/768/1024/1440 |
| L5b | Disclosure copy for the first-completion signal | You + reviewer | D7 | Ext | Reviewer sign-off recorded |

### Track 2: practice quality (what makes it worth ₹199)
| ID | Task | Owner | Depends | Effort | Acceptance |
|---|---|---|---|---|---|
| S1a-R | Independent review, then merge of persist-on-serve | You / reviewer | none | 0.5 | Review recorded; merged; replay test still fails without the replay line (mutation check) |
| L6 | `payoffFor(receipt, templateId)` + family overlay for the 23 templates, swap-test suite (spec R1) | Claude | none | 6 to 10 | Payoff text differs when answers differ on all 23 templates; "I don't know" has a payoff; zero forbidden words; receipt identical after reload; engine freeze check PASS |
| L6b | Payoff, shelf and counter presentation (spec P1); unobtrusive counters, no prominent tally, no depth setting until A9 exists | Codex | L6 | 4 to 6 | No streak or score string in the bundle; counters hidden on first run |
| L9 | Port the guided Attention presentation from PR #6 into the app's `PilotPractice` over the existing pilot runtime; keep the own-afternoon wording | Codex | PR #6 review | 2 | Attend runtime files unchanged; pilots suite passes; no free text field |
| L10 | A9 + A10 engine change if D1 = (b): depth attribute on templates, user ceiling default light, probe gated | Claude | **D1**, separate approval | 8 to 12, plus 3 revalidation | With the option at maximum the simulator trace for 21 profiles × 20 seeds equals v2.0.1; 85/17/18 suites and the 420-run sweep pass; day-4 heavy exposure and rep-5 probe fall under thresholds you set in advance |
| L11 | Shelf offer rules (section 6) | Claude | L0c | 1.5 | Property tests: never the same pilot twice in a row after a completion, never after a safety stop or in ease mode, at most one offer a day |

### Track 3: billing (Cashfree monthly recurring). Design in section 9.
| ID | Task | Owner | Depends | Effort | Acceptance |
|---|---|---|---|---|---|
| B0 | Cashfree onboarding and written answers | You | D8 | Ext | Account approved for Subscriptions with UPI AutoPay/cards/eNACH; 12 questions answered in writing |
| B1 | Billing schema + functions, written against Cashfree's documented webhook contract; tested on disposable PostgreSQL with a **mock gateway** | Claude | D3 | 6 to 8 | Webhook replay/duplicate/out-of-order/forged-signature tests pass; derived access state equals the table in §9.5; Oct-30 grant check green |
| B2 | Sandbox integration | Claude | B0, E2, D2 | 4 to 5 | The §9.6 sandbox matrix is all green with a recorded run |
| B3 | Reconciliation job and report | Claude | B2 | 2 | Ledger reproduced from gateway data with zero differences on a seeded month |
| B4 | Billing UI: subscribe (full terms above the button), status, cancel | Codex | B1 | 3 to 4 | Recurring-charge statement shown before consent; cancel is one screen with one confirm; no dark patterns |
| B5 | Refund/cancellation SOP, support inbox with owner and response target | You | D3 | Ext | Written SOP; inbox live |

### Track 4: hosted continuity, account isolation and recovery (design in §10)
| ID | Task | Owner | Depends | Effort | Acceptance |
|---|---|---|---|---|---|
| G4a | Apply Option B SQL to the staging project | Claude (you approve) | D2, D6 | 1 | Grant-regime check green; 433 assertions rerun on the hosted schema |
| L7a | Real service port (RPC) replacing the stub | Claude | G4a | 3 | Sync suite runs against the hosted staging project with 2 devices |
| L7b | Restore on a new device: sign in → pull → `replayFresh` → adopt, with the consent-version gate | Claude + Codex | L7a | 3 | A second device shows the same Mirror and Today state as the first; deleted copy flows follow the G3 decisions |
| L7c | Delete-all and export-before-destructive paths hosted | Claude | L7a | 1.5 | Delete removes every row for the account (checked server-side) |

### Track 5: release gates and operations
| ID | Task | Owner | Depends | Effort | Acceptance |
|---|---|---|---|---|---|
| R1 | Security close-out: historical log review, retire unused no-auth functions, E1b decision, secrets only in provider stores | You + Claude | none | 1 + Ext | Items in §11 marked done with evidence |
| R2 | Privacy policy, terms, refund, grievance, pricing and contact pages; DPDP notice | You + reviewer | D7 | Ext | Reviewer sign-off; each statement matches runtime (claim-by-claim sheet) |
| R3 | Monitoring, incident procedure, rollback rehearsal | Claude + You | staging | 2 | A rollback drill record |
| R4 | Crisis wording and detector scope sign-off | You + reviewer | D7 | Ext | Sign-off recorded |
| R5 | Accessibility pass on every paid-path screen | Codex + Claude | L5, B4 | 2 | Axe clean + manual keyboard/mobile checks at five widths |
| R6 | Staging acceptance run (§12) | Claude + You | all above | 3 + 14 calendar days | Every box in §12 ticked with evidence |

**Critical path:** Cashfree onboarding (B0, external), reviewer appointment (D7, external), the separate staging project (D2), and the **real 14-day trial run** (it cannot be compressed; start it the day E2 is applied).

**Order I recommend:** L0c → S1a-R → L3 → D2/E2/L4 → L6 → B1 in parallel with L5 → G4a/L7 → B2 → R-track → R6.

---

## 6. Smallest safe daily catalog and sequencing

**Launch catalog (three formats, all already real):**
| # | Format | Source | Role | Trial effect |
|---|---|---|---|---|
| C1 | **Daily engine rep**, 23 templates across six capacities, the engine's own selection and variety guards | frozen engine | The daily default; the only thing the engine chooses | Completion starts the trial (first only) |
| C2 | **Look Again** (4 situations; weigh, see three readings, re-weigh) | pilot runtime | Optional, person-initiated | None |
| C3 | **Attend** (give each pull one place; own-afternoon wording; guided presentation) | pilot runtime | Optional, person-initiated | None |

Message and Reply are **not** in the launch catalog: they are mocked prototypes. Adding either means a new `PilotId`, step machine, record and read-model types, and tests (≈6 to 8 days each).

**Honest limit.** Without an engine change, variety of format comes from the optional shelf; the daily rep is always a one-tap structured question, with variety in content. A genuinely varied daily practice needs A8 (Attend as a selectable rep) plus an amendment to the trial trigger. That is a post-launch increment and needs your approval.

**Sequencing rules (host level, no engine change):**
1. The engine alone picks today's rep. The host never overrides it.
2. After an engine rep is completed, the shelf may offer **one** optional format. Never before the engine rep on a `new` account unless the person opens the shelf themselves.
3. Rotation: offer the format the person has not done most recently; never offer the format completed today; no offer after a safety stop, an unanswered run ("ease"/"simplify"), or an unfinished pilot (resume instead).
4. **No repetition pressure:** a pilot may be repeated only by the person's choice; the shelf never shows a count-down, a streak or a "you haven't tried".
5. **No unsupported evidence:** pilot data never feeds the engine or the engine's Mirror (A7 stays deferred). The pilot Mirror plane is separate and shows a cross-session count only after 3 completed sessions of the same exercise with the same kind of answer (existing rule).
6. **No forced depth:** the shelf offers the light form first; heavier readings and the words step are always the person's act. Engine depth is governed by D1.
7. Counters are small and secondary; no tally on first run.

---

## 7. First-session entries reconciled with the trial-start contract

Rule: **the trial clock starts only when the server accepts the no-argument first-completion call after a successful engine `complete`.** Nothing else starts it.

| Entry | What happens | Trial | Required handling |
|---|---|---|---|
| E1 Signup → onboarding → Today → engine rep (default, candidate A) | rep completes | **Starts** | L3 hook after `complete` success |
| E2 Curiosity entry: shelf or direct pilot first | pilot completes | **Does not start** | Today's engine rep stays open and is offered once, without pressure. No gate in state `new` (pilots are device-local, cost nothing) |
| E3 Abandoned or left-unopened first rep | S1a records it; ease mode may follow | Does not start | Entitlement not called |
| E4 Safety stop on the first rep | nothing stored, no persistence for that day | Does not start | `discardForSafety` path must not call the entitlement hook (test) |
| E5 Offline first rep | completed locally, signal pending | Starts at server confirmation; ≤72 h pending, ≤3 reps | Existing client rules; notice says the time is confirmed on connection |
| E6 Existing beta user | standard new trial at first v2 rep; legacy rows ignored | Starts at first v2 rep | Test that legacy `trial_tracking` is never read |
| E7 Sign in on a second device | `sync` first; server already `trialing` | Already running | The second device's first rep must not restart or re-signal |
| E8 Reinstall / cleared storage | server state wins | Unchanged | `sync` on launch rebuilds the cache |
| E9 Account switch on one device | per-account cache; shared clock high-water mark | Per account | Extend `account-isolation.test.ts` |
| E10 Account deleted then recreated | new row | New trial (per-account eligibility, accepted) | Abuse review after launch, aggregate counts only |
| E11 Pilot after expiry | pilots are member practice | Denied with the same read-only state | Gate pilot start with `access()` |

After expiry: view history and Mirror, export, delete, membership page. No new engine rep and no pilot. A rep begun before expiry may be finished.

---

## 8. Runtime contracts to build (reuse before inventing)

| # | Contract | Reuses | New code |
|---|---|---|---|
| RC1 | **Entitlement store**: `useEntitlementStore { access, endsAt, lastSync, sync(), gate() }` over `EntitlementClient`, port = two RPCs | `lib/entitlement/client.ts` | store + RPC port (L3, L4) |
| RC2 | **Practice registry**: `PracticeKind { id, family, doesStartTrial, memberGated, savesToHistory }` for `engine_rep \| look_again \| attend`; single source for hosts | `PilotId`, `PilotSession` | ≈60 lines + tests |
| RC3 | **Payoff**: `payoffFor(receipt, templateId) → RepValue` (spec R1) | pilot `RepValue` shape | L6 |
| RC4 | **Shelf offer**: `shelfOffer(history, today, flags) → PilotId \| null` (pure) | pilot store records | L11 |
| RC5 | **Persist-on-serve** | `recordServed` | done (S1a) |
| RC6 | **Billing port**: `BillingPort { startSubscribe(consentVersion) → {url}; cancel(); status() }`; status flows into entitlement; no payment data in the app | edge functions | B1, B4 |
| RC7 | **Continuity port** | existing `ServerPort` in `backup/sync.ts`, `ConsentState`, `replayFresh`, `SyncClient` | RPC implementation (L7a) |
| RC8 | **Prototype → product (Attention)**: PR #6 presentation over `PilotSession('attend')`, passing the pilot store's `prior` records (the prototype passes `prior: []`) so the pilot Mirror plane keeps working | Aperture `PilotPractice` | L9 |

---

## 9. Entitlements and billing: complete design (Cashfree monthly recurring)

### 9.1 Principles
Trial and payment are separate records ([PAID_SAFEGUARDS_AND_RECOVERY.md](../product/PAID_SAFEGUARDS_AND_RECOVERY.md)). The server holds the truth; the client honours a short-lived cache (the contract's 72 h / 3-rep rules). No card at signup; the trial creates **no** Cashfree object. Nothing is ever charged without the person pressing Subscribe on a screen that states the recurring charge.

### 9.2 Data (proposed migration `B1`, not drafted into the repo yet; every table has explicit grants and no client privileges, per the 30 Oct rule)
- `billing_subscription(id, user_id → auth.users on delete cascade, cf_subscription_id unique, plan_code 'mirar_monthly_199', state, paid_through, cancel_requested_at, consent_version, consent_at, created_at, updated_at, version)`.
- `billing_event(id, cf_event_key unique, user_id, kind, received_at, applied)`; idempotency key from event type + subscription id + payment id/event time (exact fields per Cashfree's answer to Q6).
- `billing_payment(cf_payment_id unique, subscription_id, amount_paise, status, paid_at, refund_status)`.
- Stored: ids, states, amounts, dates, consent version. **Never** card, UPI or bank details. On account deletion the subscription is cancelled first, then user-linked rows are removed; the payment ledger is kept **pseudonymised** only if the CA/reviewer says Indian record-keeping requires it (decision R2).
- `entitlement_get()` is extended (migration E6) to derive the access state from `entitlement` + `billing_subscription`. The client never writes either.

### 9.3 Edge functions (service-role secrets in provider stores only)
| Function | Caller | Does |
|---|---|---|
| `billing-create-subscription` | authenticated user | Requires the consent version; creates the Cashfree subscription; returns the hosted authorisation URL; idempotent per user and plan (double-tap safe) |
| `billing-webhook` | Cashfree | Verifies the signature on the **raw** body (scheme per Cashfree answer), rejects stale timestamps, inserts `billing_event` first (unique key), then **fetches authoritative state from Cashfree** rather than trusting payload order, applies a monotonic transition, returns 2xx only after the durable write |
| `billing-cancel` | authenticated user | Calls Cashfree cancel; state `cancel_pending`; access continues to `paid_through` |
| `billing-reconcile` | scheduled/manual | Compares Cashfree subscription and payment lists to the ledger; reports differences; repairs only by re-fetching authoritative state |

The return URL after authorisation grants **nothing**; only the verified webhook (or reconcile) changes entitlement.

### 9.4 Flow
1. Day 0 to 14: trial; no price pressure. Day-12 notice shows the price once.
2. Membership page and expired state show ₹199/month, with **Subscribe** and **Not now** equal in weight (D3 covers subscribing before expiry).
3. Subscribe screen states, above the button: amount, monthly auto-renewal, how to cancel (in app and in the UPI app), and the data stored. Consent version and time are written server-side.
4. Hosted Cashfree authorisation (UPI AutoPay / card / eNACH). Mirar never sees instrument data.
5. Webhook → `active`, `paid_through`. Renewal debits follow; pre-debit notice rules per Cashfree/RBI answers (Q4).
6. Failure → `grace` (proposed 5 days, to be aligned with Cashfree's retry window, Q5). Member practice continues; a factual note appears; no pressure copy. After grace → `lapsed`, which behaves like the expired trial.
7. Cancel (app or UPI app) → `cancel_pending`, access to `paid_through`, then `lapsed`. No further debit. Re-subscribing returns the person directly; no second trial.
8. Refunds follow the SOP (B5); the webhook records refund status; the access effect is stated in the SOP.

### 9.5 Derived access (one table, the unit under test)
| Server facts | Access state | New member rep | History, Mirror, export, delete |
|---|---|---|---|
| no first rep | `new` | yes (first rep) | yes |
| first rep, `now < trial_ends_at`, no active subscription | `trialing` | yes (within offline allowance) | yes |
| `now ≥ trial_ends_at`, no active subscription | `trial_expired` | no | yes |
| `active`, `now ≤ paid_through` | `active` | yes | yes |
| payment failed, within grace | `grace` | yes | yes |
| `cancel_pending`, `now ≤ paid_through` | `cancel_scheduled` | yes | yes |
| grace over, cancelled and past `paid_through`, or lapsed | `lapsed` | no | yes |
| founder grant | `comped` | yes | yes |

### 9.6 Sandbox test matrix (all must pass before any live key)
Subscribe success (UPI); authorisation fails or is abandoned; payment failure then recovery within grace; failure past grace; cancel in app; cancel in the UPI app; duplicate webhook; out-of-order webhooks; forged signature; stale timestamp; return URL without webhook; double-tap Subscribe; two devices; account deletion while active; refund; reconcile after a missed webhook; timezone at month boundaries.

### 9.7 Open questions that only Cashfree can answer
The 12 questions in masterplan §11: eligibility, category, trial/first-charge date and authorisation amount, mandate limits and pre-debit rules, failure retries, webhook signature/retries/idempotency, sandbox, refunds, settlement, fees, hosted checkout, data retention. **I have not assumed any of them.** The webhook handler is written to the documented event names and will be adjusted to the written answers.

---

## 10. Hosted continuity, account isolation and recovery: complete design

**Current fact.** Sign-out deletes every local `mirar_inner_rep_v2*` and pilot key by design (`REAL_AUTH_TEST_RECORD.md`). Without hosted continuity a paying member loses their history on sign-out, device change or cleared storage. File export is not recovery.

**Design (Option B, already specified and mostly built):** opt-in, explicit consent with a version gate; an append-only structured event journal (template id, day, structured answers; **no free text**); batched append with an epoch; server rules that reject malformed or non-contiguous batches; restore = pull journal → `replayFresh` (engine-versioned) → adopt on the device. S1a is required so replay matches live state.
- **Built:** event schema and validator, recorder, replay, `SyncClient`, consent state machine, stub service, SQL drafts (`docs/proposed/option-b`), tests.
- **Not built:** hosted RPC port (L7a), restore host flow (L7b), hosted delete-all (L7c), staging application (G4a).
- **Storage (estimate, not measured):** about 100 bytes per event, ~3 events a day ≈ 107 KB per user-year; the Free 500 MB would hold thousands of user-years. Capacity is not the constraint; **durability** is (no backups on Free, D2).
- **Account isolation:** keys are per account; the entitlement high-water mark is device-wide by design; sign-out clears the account's cache. Store-level isolation is tested; the **real two-inbox run on the real-auth build is not done** (acceptance §12 section B).
- **Recovery matrix to test:** lose device, cleared storage, second device, offline for 5 days, token expiry, deleted account, consent withdrawn, epoch mismatch, engine-version mismatch on replay.
- **Promises I cannot make** until Pro and restore are proven: guaranteed recovery, uptime, retention periods beyond reviewer-approved text.

---

## 11. Remaining release blockers

| Area | Blocker | Status |
|---|---|---|
| Security | Historical log review for the period when `admin-user-list` and `admin-analytics` were reachable | Open (yours, dashboard) |
| Security | Legacy service-role functions flagged, unprobed; some still in the repo tree | Open |
| Security | Legacy `subscriptions`/`trial_tracking` owner-writable policies (E1b) | Local test only; not applied |
| Security | `trial-lifecycle` function scheduler unverified; scheduled nudges may still send email | Open |
| Security | Webhook signature, idempotency, secret storage | Not built |
| Privacy | DPDP notice, consent text, retention, deletion timing, cross-border (Seoul region), age gate | No reviewer |
| Privacy | First-completion signal disclosure text | Draft, needs review |
| Safety | Crisis detector is not clinically validated; helpline numbers were checked against Tele-MANAS 14416 / 1800-891-4416 and 112 but wording needs sign-off; "not therapy" wording across funnel | Open |
| Accessibility | Axe clean on staged screens; **no** native screen-reader, switch or forced-colours testing; paid-path screens do not exist yet | Open |
| Financial / compliance | Cashfree approval; GST position; invoicing; refund and cancellation terms; consumer-law disclosures; RBI recurring-payment rules via the gateway | Open |
| Operations | Support inbox with owner and response target; monitoring; incident and rollback drills | Not started |
| Language | English only; Hindi/Gujarati not promised | Decision stands |
| Product | Forced depth in the frozen engine (D1) | **Needs your decision** |
| Product | Payoff screen (the completion is currently an echo) | Not built |

---

## 12. Integrated staging acceptance checklist

Environment: a **separate staging Supabase project** (D2), staging Vercel build on the launch profile, Cashfree sandbox keys only, two real inboxes you control, one phone and one laptop. Evidence for each box goes into `docs/release/staging-acceptance/` (screenshots, command output, no tokens or personal data).

**A. Baseline**
- [ ] Preflight PASS on the launch profile, including freeze guard and all suites.
- [ ] Bundle scan: anon key only; no service key, fixtures, review states or simulator strings.
- [ ] Supabase grant-regime check green for legacy, new and strict regimes on the staging schema.

**B. Multi-account (run on the real-auth build)**
- [ ] Account A: sign up, finish a first rep → trial starts; the end time shown equals `trial_ends_at` in the local zone.
- [ ] Account B on the same browser after A signs out: sees none of A's history, Mirror, drafts, entitlement or pilot records.
- [ ] A signs in on a second device: trial already running, no second start, history restored if continuity is on.
- [ ] A and B interleaved sign-in/out five times: no cross-account state.

**C. Multi-day (calendar days, not simulated)**
- [ ] Days 1 to 3 on two accounts: no repeated question after a left rep (S1a); abandoned reps recorded; ease mode behaves as designed.
- [ ] Day 7 and day 12 notices appear once per device, factual, no countdown.
- [ ] A rep completed offline and synced later; pending ≤72 h respected.
- [ ] Device clock set backwards and forwards: no extension, no early lockout.
- [ ] Expiry: reached with a backdated staging fixture row (service-role insert; the SQL's immutability triggers forbid moving an end earlier, so fixtures must be inserted, not updated) and, in parallel, **one real account run for the full 14 days**.
- [ ] Expired: history, Mirror, export and delete work; new rep and pilot are refused with a plain explanation.

**D. Continuity and recovery**
- [ ] Opt in, practice for three days, clear storage, sign in: state restored and equal to before.
- [ ] Withdraw consent: upload stops; delete-all removes every server row for the account (verified by query).
- [ ] Export before a destructive action follows the G3 policy.

**E. Billing (sandbox)**
- [ ] Every row of §9.6 passes with a recorded run.
- [ ] A forged webhook changes nothing; a replayed webhook changes nothing.
- [ ] Reconcile reports zero differences after the run.
- [ ] Deleting an account with an active subscription cancels it first.

**F. Safety, privacy, accessibility**
- [ ] A crisis phrase halts the exercise with the resource panel and stores nothing.
- [ ] Network log: no answer content, no free text and no analytics sent from the practice screens.
- [ ] Keyboard-only completion of signup, first rep, subscribe and cancel; axe clean at 320/390/768/1024/1440.
- [ ] Every policy statement matches observed behaviour (claim-by-claim sheet).

**G. Rollback**
- [ ] Rollback drill executed and timed; flags off restores v1 behaviour.

---

## 13. Supabase 30 October table-grants compatibility (kept in the migration plan)

Applies to every migration from here on (E1, E6/B1 billing, Option B): new `public` tables get no automatic Data API grants for existing projects from 30 Oct 2026, so each migration must (1) grant explicitly and minimally; (2) give clients no table privileges where RPC-only access is intended; (3) state `EXECUTE` on functions explicitly; (4) avoid broad example grants on private tables; (5) pass `scripts/release/grant-regime-check.ts` on legacy, new and strict regimes plus a fresh `supabase db reset` parity run (RELEASE_RUNBOOK §6). `service_role` behaviour is regime-dependent and must be granted explicitly where a function relies on it. Run before E2, G4a, B1 and E6.

---

## 14. First safe coding tasks

| # | Task | State |
|---|---|---|
| 1 | Async entitlement client + differential test | **Done** (`041b063`) |
| 2 | Frozen-engine guard in preflight | **Done** (`041b063`) |
| 3 | L0c launch build profile and preflight rewrite | Next (needs D9) |
| 4 | L3 entitlement store wiring behind a default-off flag, with mock port and isolation tests | **Done** (see LAUNCH_MVP_MATRIX.md §1) |
| 5 | RC2 practice registry + L11 shelf offer rules with property tests | **Done** |
| 6 | L6 `payoffFor` + swap-test suite | Next, isolated, largest |
| 7 | B1 billing schema and webhook handler against a mock gateway on a disposable database | After D3 |

Nothing in 3 to 7 touches the frozen engine, Supabase, billing activation, G3 or production.

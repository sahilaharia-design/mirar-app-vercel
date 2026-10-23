# Mirar launch MVP: journey matrix, communications, regression suite, severity, scope and dashboard

Date 2026-10-24. Extends [LAUNCH_RELEASE_BOARD.md](LAUNCH_RELEASE_BOARD.md) (decisions D1 to D9, designs, backlog IDs); nothing there is replaced. Branch `mirar-launch-execution`. Commercial model: 14-day no-card trial on the 348-hour contract, then an optional ₹199/month subscription, monthly only, **no charge merely because the trial ends**.

**Status vocabulary.** *Built* = code exists. *Mocked* = stub or simulated service. *Local* = automated tests pass here. *Staged* = running on a hosted staging build. *Prod* = in the live product after the release gates. Plans and documents count for none of these. Today **nothing in the paid journey is Prod**; production is still v1.

---

## 1. Milestones implemented since the board

| Milestone | What exists | Evidence |
|---|---|---|
| L2a Entitlement client | `lib/entitlement/client.ts`, async, constants from the contract | 400 random runs vs the spec, 0 differences |
| L0 Engine freeze guard | `scripts/release/engine-freeze-check.sh`, in preflight | `lib/innerRep/v2` byte-identical to `inner-rep-engine-v2.0.1-correction-fix` |
| L4 (port half) RPC port | `lib/entitlement/rpc-port.ts` maps the two RPCs of the E1 SQL; rejects malformed replies; no arguments sent | 5 mapping checks |
| L3 Entitlement store + wiring | `stores/entitlement-store.ts`; hooks in the engine store (complete, load, sign-out) and the pilot store (completed session). **Default off** (`EXPO_PUBLIC_ENTITLEMENT`), inert when off | 23 checks through the real stores; a mutation (pilot calling the trial hook) makes two checks fail |
| RC2 + L11 Practice registry and shelf rules | `lib/innerRep/practice-registry.ts`; pure functions | 2,000-history property test: never repeats the most recent or a same-day format |
| Journey regression runner | `scripts/release/journey-regression.ts` | Runs 18 cases: 7 automated pass; 11 listed as not automated with severity |
| Found and fixed | S1a had made `pilots.test.ts` red once `serve.ts` was committed (it passed earlier only because the file was untracked); my first fix then contained a syntax slip. Both fixed; the S1a branch carries the fix (`5f69bff`) | pilots suite 87/87; full local suite green |

Not wired into any screen: there is **no UI** for the trial end time, notices, the expired state or Subscribe. That is Codex work (L5, B4) and the store exposes what it needs (`access`, `endsAt`, `refresh`, `sync`).

---

## 2. Customer-journey acceptance matrix

Severity = what it is if this transition is broken at launch (definitions in §5). Owner: **C** Claude, **X** Codex, **F** founder, **R** qualified reviewer, **G** Cashfree. "Test" ids refer to the regression runner (CJ-nn) or the staging checklist in the board §12.

| # | Transition | Status today | Happy path | Failure path | Owner | Test required | Sev. | Evidence of completion |
|---|---|---|---|---|---|---|---|---|
| J1 | Discovery → landing | v1 landing live; copy is beta/28-day era | Visitor understands one daily practice, 14-day free trial, ₹199/month, no card | Page claims anything untrue (device-only, no analytics, no AI) | F + X | Claim-by-claim sheet | P1 | Signed sheet; landing rebuilt and previewed |
| J2 | Landing → sign-up | Built (magic link); real-auth staging PASS 14 Oct; production domain redirect not verified | Enters email, gets link | Wrong/expired link, rate limit, link opens other browser | C | Real-auth run on production-profile staging | P1 | Test record + redirect list shows the launch domain |
| J3 | Email verification delivery | Built; sender is Supabase's default (see §3) | Link arrives in under a minute, lands signed in | Not delivered, spam-foldered, throttled | C + F | Delivery test to 3 providers; custom sender verified | **P0** (nobody can join) | Delivery log, SPF/DKIM pass |
| J4 | Auth callback → onboarding → Today | Built (v2 staged) | Lands on Today with one rep | Callback error, session lost | C | CJ-08, real-auth run | P1 | Run record |
| J5 | First practice completes → trial starts | Client built, wired, **default off**; server SQL **not applied** | Server stamps start; end exactly 348 h later; exact local end time shown | Offline: pending ≤72 h; abandoned or safety stop: no start; pilot: no start | C | CJ-03, CJ-04, E2 on staging, CJ-17 | **P0** | Hosted run: server row `trialing`, event log has one `trial_started` |
| J6 | Completion → payoff | Built as an **echo only**; payoff (R1/P1) not built | Closing differs by answer and says what was done | Echo, empty or untrue statement | C + X | Swap test on 23 templates | P1 (value) | Test output; Codex screens |
| J7 | Next-day repeat practice | Built (S1a, unmerged) | New exercise, no repeat of a left question | Same question again; stale Today after midnight | C | CJ-02 | P1 | Suite green on merged branch |
| J8 | Skipped days, return after absence | Built (S1a, ease mode) | Gentle return; no guilt copy | Streak/"you missed" language; heavier exercise on return | C + X | CJ-02 + copy scan | P1 | Copy scan clean |
| J9 | Optional extra practice (shelf) | Built (pilots); shelf rules built, not shown in UI | One optional format after today's rep | Offered after safety stop or in ease mode; repeats | C | Shelf property test; UI check | P2 | Test + screens |
| J10 | Day-7 and day-12 notices | Not built (L5) | Factual, once per device, equal-weight Continue/Not now | Countdown, "last chance", duplicates | X + C | Copy scan + one-per-device test | P1 | Screens + test |
| J11 | Trial ends → expired state | Client rule built and tested; **UI not built** | History, Mirror, export, delete stay; new rep/pilot refused with a plain explanation; price shown once | Locked out of history; silent block | C + X | CJ-14, CJ-17 | **P0** | Staged account at 348 h |
| J12 | Subscribe ₹199/month | **Not built** | Terms above button; Cashfree hosted authorisation; webhook → active | Abandoned/failed authorisation leaves no access change; double tap | C + X + G | CJ-11, CJ-12, sandbox matrix | **P0** | Sandbox run record |
| J13 | First payment + receipt | Not built | Receipt/confirmation sent | Paid but not activated; activated but not paid | C | CJ-11, reconcile | **P0** | Reconcile report, zero differences |
| J14 | Monthly renewal | Not built | Debit succeeds, paid-through extends | Silent double debit; missed webhook | C + G | CJ-12, reconcile | **P0** | Sandbox renewals |
| J15 | Renewal fails → grace → lapse | Not built | Factual note; practice continues in grace; lapse behaves like expiry | Instant lockout; endless grace | C + F | Sandbox failure matrix | **P0** | Run record |
| J16 | Cancel (app or UPI app) | Not built | One screen, one confirm; access to paid-through; no more debits | Cancel does nothing; debit after cancel | C + X + G | CJ-15 | **P0** | Sandbox run + ledger |
| J17 | Refund | Not built; SOP missing | Per SOP; webhook recorded | Refund without ledger entry | F + C | Sandbox refund | P1 | SOP + run |
| J18 | Resubscribe after lapse | Not built | Returns directly, no second trial | Second trial granted | C | CJ-15 | P1 | Run record |
| J19 | Sign out / sign in, same device | Built | Local copy cleared by design; history returns only if backup is on | Another account sees prior data | C | CJ-01, CJ-01R | **P0** | Real two-inbox run |
| J20 | New device / lost device recovery | Client logic built (simulated service); hosted **not built**; restore flow **not built** | Sign in → history restored | History gone for a paying member | C + X | CJ-05, CJ-05H, board §12-D | **P1** (P0 if the product promises recovery) | Hosted two-device run |
| J21 | Lost email access | **Not designed** (magic link only) | Support-assisted email change after identity checks | Account unrecoverable or taken over | F + C | Support runbook rehearsal | P1 | Runbook + drill |
| J22 | Support contact | **Does not exist** | Monitored inbox, response target, FAQ | No reply to a billing problem | F | Send-and-answer drill | **P1** (gate: operational support contact) | Inbox, owner and target recorded |
| J23 | Export | Built (file) | Download of structured data | Export misdescribed as recovery | C | Export test + copy | P2 | Test |
| J24 | Delete account | Local clearing built; hosted delete not built | Subscription cancelled first, then all rows removed | Active subscription keeps charging; rows remain | C | CJ-16 | **P0** | Server query shows no rows; Cashfree shows cancelled |
| J25 | Poor connectivity / auth expiry mid-rep | Offline rules built; auth-expiry behaviour untested | Rep completes locally; sync later | Rep lost; trial start lost | C | CJ-09, CJ-08 | P1 | Device run |

---

## 3. Communications matrix

**Required** = the product is not safely sellable without it. **Optional** = engagement or convenience. Sender reality: Supabase's built-in authentication email sender is meant for testing and is rate-limited; **a custom sender (SMTP) on a domain with SPF/DKIM is needed for production** (verify current limits before relying on this statement). Brevo is already in the stack; plan limits and cost are **not verified** and nothing is bought here.

| # | Message | Class | Trigger | Channel | Status | Owner | Blocker | Test |
|---|---|---|---|---|---|---|---|---|
| C1 | Email verification / sign-in link | **Required** | Sign-up, sign-in | Auth email | Works in staging with default sender | C + F | Custom sender and domain authentication (D11) | J3 delivery test |
| C2 | Trial started (end time, no card asked, what happens at the end) | **Required, in app** | Server confirms first rep | In app | Not built (L5) | X + C | L5 | Screen + exact-time test |
| C3 | Day-7 checkpoint | **Required, in app** | +168 h | In app, once per device | Not built | X | L5 | One-per-device test |
| C4 | Day-12 notice with price once | **Required, in app** | +288 h | In app | Not built | X | L5 | Copy scan |
| C5 | Trial-start / trial-ending **email** | Optional | same triggers | Email | Not built; contract defers email | F | Email contract + reviewed copy | Later |
| C6 | Subscription confirmation + payment receipt/invoice | **Required** | Webhook success | Email + in-app status | Not built | C | B1; GST/invoice position from the CA; who sends (Cashfree vs us) per Q-list | Sandbox |
| C7 | Pre-debit notice before each renewal | **Required** by recurring-payment rules | Before each debit | Gateway/bank/UPI app or email | Who sends: **unknown until Cashfree answers (Q4)** | G + C | B0 | Sandbox |
| C8 | Payment failed | **Required** | Failed/on-hold webhook | In app + email | Not built | C + X | B1, grace length (D3) | Sandbox |
| C9 | Renewal succeeded | **Required** | Webhook | Receipt | Not built | C | B1 | Sandbox |
| C10 | Cancellation confirmed (access until date) | **Required** | Cancel | In app + email | Not built | C + X | B1 | Sandbox |
| C11 | Refund update | **Required** | Refund webhook | Email | Not built | C | SOP (B5) | Sandbox |
| C12 | Account deletion confirmation | **Required** | Deletion | Email | Not built | C | Hosted deletion | J24 |
| C13 | Email-change / security notice | **Required** when email change exists | Change request | Email | Auth provider default | C | J21 design | Drill |
| C14 | Restore complete / backup status | Required in app, optional by email | Restore | In app | Not built | X | L7b | J20 |
| C15 | Support auto-acknowledgement | Optional | Inbound mail | Email | Not built | F | J22 | Drill |
| C16 | **Daily check-in reminder** | **Optional engagement** | User opt-in, chosen time | Not decided (email, web push, WhatsApp) | **Do not assume it works.** The repo has `daily-reminder`, `email-nudge`, `whatsapp-nudge` functions from v1; four v1 cron jobs were paused on 13 Oct; scheduled nudges "may still be sending" is an open item; none is built for v2 | F | Consent screen, opt-out, a verified reliable channel, no pressure copy; **post-launch** | Consent/opt-out/idempotency tests |
| C17 | Win-back or promotional email | Post-launch, not planned | n/a | n/a | n/a | n/a | n/a | n/a |

**Rule.** No engagement message of any kind (including C16) before the required set is delivered and tested. Reminder copy must not use streaks, guilt or countdowns. **First action: confirm that no legacy nudge function can email current users** (open security item) before any real user is invited.

---

## 4. Critical user-journey regression suite

Runner: `npx tsx scripts/release/journey-regression.ts` (read-only; exit 1 if an automated case fails). Today: **7 automated cases pass (≈640 checks); 11 cases are not automated and are printed with severity and blocker.** A green exit does **not** mean launch-ready.

| Case | Covers | Automated now | Still required before launch |
|---|---|---|---|
| CJ-01 | Cross-account isolation | Store level | **CJ-01R** two real inboxes on the real-auth build (P0) |
| CJ-02 | Repeated questions; skipped and left practices; easier mode | Yes (S1a) | Merge + rerun |
| CJ-03 | Trial trigger rules | Yes | Hosted rerun after E2 |
| CJ-04 | Expiry, offline, clock tamper, repeated signals | Yes (model + client) | Hosted rerun |
| CJ-05 | Multi-device restore | Simulated service | **CJ-05H** hosted two devices |
| CJ-06 | Pilot sessions | Yes | none |
| CJ-07 | Engine/Mirror/receipt invariants | Yes | none |
| CJ-08 | Auth expiry mid-session | No | Real-auth harness |
| CJ-09 | Poor connectivity on a phone | No | Manual device run |
| CJ-10 | Mobile and accessibility on paid-path screens | No | After L5/B4 exist |
| CJ-11 to CJ-16 | Webhook delay, double charge, forged webhook, expired state, cancel/failed renewal, deletion with active subscription | No | After B1 (mock gateway first, then sandbox) |
| CJ-17 | Real 14-day trial + backdated expiry | No | After E2 on a staging project; start the 14-day clock first |
| CJ-18 | Reminder consent/opt-out | No | Only if reminders ship |

Every new defect found gets a case before the fix is merged.

---

## 5. Severity and the public-launch gate

| Level | Definition | Examples here |
|---|---|---|
| **P0** | Security, financial, privacy, data-loss or critical access failure | Cross-account data leak; charge without consent; double charge; webhook forgery accepted; paid user locked out; trial never starts or never ends; email never arrives; secret in a bundle; deletion leaves a live subscription |
| **P1** | Major customer-journey failure | Repeated question; history gone for a paying member; no support reply; cancel path unclear; notice shows a wrong end time; crisis panel missing |
| **P2** | Noncritical functional or UX defect | Awkward copy; shelf offers a format a day late; export label unclear |
| **P3** | Cosmetic or future enhancement | Spacing, illustration, extra formats |

**Public paid launch requires, all true:** zero known open P0/P1 defects; every P0/P1 journey case in §2/§4 closed with its evidence; documented test records; monitoring that alerts someone (webhook failures, edge-function errors, sign-in failures); a rehearsed rollback; an operational support contact with an owner and response target; the board's section 11 blockers closed or accepted in writing. **This does not claim the software is bug-free.** Known P2/P3 defects ship with a list.

---

## 6. Feature scope

| Feature | Class | Why / condition |
|---|---|---|
| Sign-up/sign-in by magic link on a production domain, custom email sender | **Must** | J2, J3, C1 |
| First rep → trial start (server-stamped, 348 h), exact end time shown | **Must** | Locked contract |
| Entitlement gating, expired read-only state, history/export/delete never gated | **Must** | Contract §3 |
| In-app trial notices (start, day 7, day 12) | **Must** | Contract §6 |
| Subscribe, renew, cancel, failed-payment grace, lapse, resubscribe (Cashfree monthly) | **Must** | The revenue path |
| Webhook ledger, idempotency, reconciliation | **Must** | No double charges or ghost access |
| Payment receipts and required transactional messages (C6 to C12) | **Must** | Financial and consumer trust |
| Persist-on-serve (S1a) | **Must** | Fixes the repeated-question defect |
| Payoff screen (R1/P1), minimal version for the 23 templates | **Must** (confirm D10) | The completion is currently an echo; the audit's core value finding |
| Engine depth ceiling + probe gating (A9, A10) | **Must if** "no forced depth" is claimed publicly, **otherwise drop the claim** | D1 |
| Hosted backup and restore on a new device (Option B) | **Must for a paid launch unless D6 chooses export-only with honest copy** | Sign-out clears local history |
| Export (file) and account deletion incl. cancelling a live subscription | **Must** | Privacy, financial |
| Support inbox, FAQ, refund SOP, policy pages (privacy, terms, refund, grievance, pricing, contact) | **Must** | Gate: support contact; reviewer sign-off |
| Crisis panel and wording sign-off | **Must** | Safety |
| Aggregate counts only (accounts, trials, subscriptions per week) | **Must**, minimal | Contract §10 |
| Monitoring + alerts, rollback rehearsal, support runbook (comp/extend by service role with reason) | **Must** | Gate |
| Look Again and Attend pilots on the shelf | Optional launch enhancement | Built and tested; ship only if acceptance is green, otherwise flag off |
| Shelf rotation rules in the UI | Optional launch enhancement | Rules built |
| Guided Attention presentation port (L9) | Optional launch enhancement | Codex prototype, runtime unchanged |
| Trial-ending email (C5), support auto-reply | Optional launch enhancement | After required messages |
| **Daily reminders** | **Post-launch** | Needs consent, opt-out, channel, reliability proof |
| Message and Reply practices; varied daily catalog; A3, A8, A11 | Post-launch | Needs approvals and new runtime |
| Hindi/Gujarati | Post-launch | Only after native review |
| Annual plan, coupons, referral | Not planned | Founder decision |
| 12-person study | Not a gate | Optional; targeted acceptance tests instead |

---

## 7. Release dashboard

State: **Done** · **Ready** (no blocker, I can start) · **Needs decision** · **Needs approval** (hosted/spend/merge) · **External** · **Blocked** (by dependency). "Actual blocker" names the real constraint.

| ID | Task | Owner | State | Depends on | Acceptance test | Actual blocker |
|---|---|---|---|---|---|---|
| L0 | Engine freeze guard | C | **Done** | none | `engine-freeze-check.sh` PASS | none |
| L2a | Entitlement client | C | **Done** | none | `client-port.test.ts` 0 diffs | none |
| L3 | Entitlement store + hooks (flag off) | C | **Done** | L2a | `host.test.ts` 23 checks | none |
| L4a | RPC port | C | **Done** | L2a | mapping checks | none |
| L11/RC2 | Registry + shelf rules | C | **Done** | none | property test | UI to show it is Codex's (L6b) |
| RJ | Journey regression runner | C | **Done** | none | runs; 7 pass | none |
| S1a-R | Review and merge persist-on-serve | F/reviewer | **Needs approval** | none | review recorded; suites green post-merge | merge is yours |
| L0b | Integration branch from `origin/main` | C | **Needs approval** | S1a-R | preflight PASS | merge approval |
| L0c | Launch build profile + preflight rewrite | C | **Needs decision** | D9 | preflight PASS on the profile | which flags are on in production |
| D1 | Engine depth decision | F | **Needs decision** | none | decision recorded | none |
| L10 | A9 + A10 engine change (v2.1, separately versioned) | C | **Blocked** | D1 | byte-identity at maximum setting; suites; sweep | D1 |
| D2 | Separate Supabase staging project; Pro before charging | F | **Needs decision / spend** | none | project exists; plan recorded | spend + decision |
| E2 | Apply E1 SQL to staging | C | **Blocked** | D2 | grant-regime check green; both RPCs callable | D2 |
| L4b | Point port at staging; set flag in staging only | C | **Blocked** | E2 | CJ-03/04 rerun hosted | E2 |
| CJ-17 | Start the real 14-day trial account | C + F | **Blocked** | E2 | row at 348 h expires | E2; calendar time |
| L5 | Trial notices, membership page, expired state | X | **Ready** (copy review pending) | L3 done | screens, copy scan, axe | Codex scheduling; legal copy for disclosure |
| L6 | `payoffFor` + swap tests | C | **Ready** (confirm D10) | none | swap test on 23 templates | D10 confirmation |
| L6b | Payoff/shelf/counter UI | X | **Blocked** | L6 | no streak/score strings | L6 |
| L9 | Guided Attention into `PilotPractice` | X | **Ready** | PR #6 review | pilots suite green | none |
| D3 | Subscribe-during-trial, grace length, refund rules | F | **Needs decision** | Cashfree answers | decisions recorded | Cashfree Q3/Q5 |
| D8/B0 | Cashfree onboarding and written answers | F | **External** | none | account approved; 12 answers | Cashfree lead time unknown |
| B1 | Billing schema + functions on a mock gateway | C | **Ready to draft** (after D3 for terms) | D3 | CJ-11 to CJ-16 on mock | none for the mock |
| B2 | Sandbox integration | C | **Blocked** | B0, E2 | sandbox matrix green | B0, D2 |
| B3 | Reconciliation | C | **Blocked** | B2 | zero differences | B2 |
| B4 | Billing UI | X | **Blocked** | B1 | terms above button; one-screen cancel | B1 |
| B5 | Refund/cancellation SOP; support inbox with owner and target | F | **Ready** (founder) | none | SOP + drill | needs you |
| D11/C1 | Custom email sender + domain authentication | F + C | **Needs decision / maybe spend** | none | 3-provider delivery test | provider choice, domain access |
| C6 to C12 | Transactional messages | C | **Blocked** | B1, C1 | sandbox delivery | B1, C1, CA on invoices |
| G4a | Option B SQL on staging | C | **Blocked** | D2, D6 | 433 grant assertions hosted | D2, D6 |
| L7a/b/c | Hosted port, restore flow, hosted delete | C + X | **Blocked** | G4a | CJ-05H two devices | G4a |
| R1 | Security close-out (log review, legacy functions, nudges off, E1b) | F + C | **Ready** | none | board §11 items evidenced | dashboard actions are yours |
| R2 | Policy pages and DPDP notice | F + reviewer | **External** | D7 | reviewer sign-off | no reviewer appointed |
| R3 | Monitoring, alerts, rollback drill | C + F | **Blocked** | staging | drill record | staging; tool choice may involve cost |
| R4 | Crisis wording sign-off | F + reviewer | **External** | D7 | sign-off | no reviewer |
| R5 | Accessibility pass on paid screens | X + C | **Blocked** | L5, B4 | axe + keyboard at 5 widths | screens |
| R6 | Full staging acceptance (board §12) | C + F | **Blocked** | all above | every box evidenced | everything above |

**Critical path today:** D2 → E2 → CJ-17 (14 calendar days) in parallel with D8 → B0 → B2; reviewer appointment (D7) and D1 decide scope. **What I can start now without any approval:** L6 (after you confirm D10), B1 on a mock gateway, the support/comp runbook, copy scans, and Codex can start L5 and L9.

---

## 8. New decisions raised here
- **D10** Confirm the payoff screen (minimal) is MVP-must.
- **D11** Email sender: which provider and domain authentication for production (spend unknown, none committed).
- Everything else is D1 to D9 in the board.

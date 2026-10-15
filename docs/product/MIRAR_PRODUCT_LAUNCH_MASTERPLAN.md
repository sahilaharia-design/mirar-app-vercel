# Mirar: product launch masterplan (India-first paid web product)

**Author:** Claude (engineering, release, privacy/security). **Date:** 15 October 2026. **Status:** audit and plan only. Nothing in this document is implemented, approved, deployed or purchased.
**Principle:** premium product quality, bootstrapped operating cost, everyday emotional and mental hygiene leading to better emotional fitness.

## 0. How to read this
- **Evidence rule.** "Status" is what I found in the real repository and the live services on 15 October, not what a plan says. A passing unit test is recorded as "tested", never as "production-ready". Categories: **Functional** (works for a real user in production today), **Partial**, **Simulated** (works only against a stub or in staging), **Legacy** (exists in production for the retired v1 product), **Missing**, **Blocked** (waiting on a decision or approval).
- **What is in production today.** `mirar-app.vercel.app` is still the **v1** check-in app (cycle-based, server-side check-ins). The **v2** product (Daily Inner Rep, Honest Mirror, Look Again, Attend, history continuity) exists only on login-protected staging and its promotion is blocked. `mirar.life` is the new Aperture landing (static) plus legal pages; its main call to action opens `mirar-app.vercel.app/try`.
- **Unverified items** are marked *unverified*. Where I could not read a dashboard (auth settings, secrets, DNS, mail, Vercel plan) I say so rather than assume.
- **Prices, fees and legal thresholds** below are either from public provider pages read on 15 October or marked *to confirm*. I have not invented numbers. No effectiveness, clinical benefit or user-validation claim is made anywhere.

---

## 1. Executive summary

| Question | Answer |
|---|---|
| Is there a product people could pay for today? | Not yet. v2 is a credible, carefully built core but it is unpromoted, unvalidated with people, English-only, device-local, and has no sign-up-to-subscription path at all. |
| What exists that is genuinely valuable? | A deterministic, explainable daily practice engine (frozen, heavily tested), an evidence-bounded Honest Mirror with a correction loop, India-appropriate crisis resources, a privacy-first architecture, and a landing/legal baseline rewritten for the current product. |
| What is completely absent? | Any billing or entitlement system, any transactional email beyond the platform sign-in link, reminders in v2, account deletion self-service, support tooling, monitoring, Hindi/Gujarati for v2, and any human evidence that the practice or the Mirror is useful. |
| What is risky already? | Production still runs the v1 stack with eight legacy service-role functions that trust a caller-supplied user id (documented, deletion not yet approved); `subscriptions` and `trial_tracking` tables exist with owner-writable policies (a trap for any future paywall); the historical admin-exposure window cannot be audited; Supabase Free has no backups, can pause, and keeps 1 day of logs. |
| Shipping scope | One membership: v2 Daily Inner Rep + Honest Mirror, sign-in by emailed link, 7-day trial without payment details, Cashfree subscription, in-app cancel, honest device-local history with file export, opt-in email reminder, support address, Privacy/Terms/Refund pages, minimal monitoring. Pilots, cross-device backup, Hindi/Gujarati and annual-plan polish follow in the order of section 7. |

---

## 2. Part 1: close-out of the G2 decisions (done in this pass)

| Item | Result | Where |
|---|---|---|
| Review packet ready, no reviewer, no sharing | Packet marked "not authorized for external sharing" | `docs/privacy-review/OPTION_B_REVIEW_PACKET.md` |
| Supabase Pro deferred; what we cannot promise | Table of features we must not promise or release under Free limits | `docs/privacy-review/G2_PROVIDER_VERIFICATION.md` (appendix) and section 9 below |
| Historical admin-endpoint log gap | Evidence, alternatives and residual risk written; no "no exposure" claim | `docs/release/HISTORICAL_LOG_GAP.md` |
| G4 and real account-history storage | Remain blocked | this plan, gate list |
| Production and Supabase configuration | Unchanged | verified: no deploy to production, no Supabase write, no setting changed |

## 3. G3 status (for the integration report Codex's work will trigger)
- **Baseline:** `mirar-continuity-g3`, tested, preserved. Everything it shows about continuity is **simulated**: an in-memory stub service with explicit outcomes. **No account history has ever been persisted anywhere**, no SQL has been run, no table exists. The next integration report must keep two headings: *Simulated (stub, review build)* and *Actually persisted (nothing, until G4)*.
- **Waiting on Codex:** revision 2 of `docs/experience/CONTINUITY_G3_UI_CHANGE_REQUESTS.md` (R1 to R9 plus the original nine). I have not redesigned those screens. `InterimControls.tsx` is a placeholder Codex replaces.
- **On receipt:** merge Codex's commits into a new integration branch (not into the tested one), re-run the full preflight, axe/320/390/1440, verify R1 to R9 against the snapshot fields, re-deploy the two review aliases, and report simulated vs persisted separately.

---

## 4. Part 3 audit: what is real (17 areas)

Legend for the owner column: **C** Claude, **X** Codex, **F** founder.

### 4.1 Landing, positioning, SEO, conversion
| Finding | Evidence | Status |
|---|---|---|
| New Aperture landing is live at `mirar.life` (HTTP 200), static build, no analytics, no cookies | `mirar-landing` commit `fc91151`; `curl` 200 | Functional |
| Main CTA goes to `mirar-app.vercel.app/try` (an anonymous sample), not to sign-up or a price | `BeginCTA.tsx` | Functional, but no path to trial or membership |
| Page title and description exist; `robots.txt` and `sitemap.xml` return **404**; no structured data; no per-page social previews beyond the default | `curl`; `app/layout.tsx` | Partial |
| No pricing, no "what you get", no FAQ, no support or refund link on the landing | file listing; legal pages only | Missing |
| CTA click tracking calls exist but analytics was removed, so conversion is **unmeasured** | `CtaLink.tsx`, legal-flags doc | Missing |
| Waitlist route posts to a Google Apps Script URL | `app/api/waitlist/route.ts` | Legacy; whether live is *unverified* |
| Domain `mirar.life` is the brand, the app lives on a `vercel.app` subdomain | CTA URL | Partial: a paid product needs the app on a first-party domain (for trust, cookies/session, email links) |

### 4.2 Sign-up, login, onboarding, sessions, recovery
| Finding | Evidence | Status |
|---|---|---|
| Email magic-link sign-in via Supabase Auth; Google/Apple handlers exist in the store, not offered in the login screen as far as I could read | `stores/auth-store.ts`, `app/(auth)/login.tsx` | Functional (email link); real first-time and returning sign-in passed in the owner's test on `mirar-unified-real` |
| Sign-in email is sent by the platform; custom sender/SMTP **unverified**. Free-plan platform email is intended for testing and limited in volume (provider documentation; current limits not re-read) | not readable without the dashboard | Unknown, **P0 to verify** |
| Redirect URLs: production and the approved staging entry exist; no vanity domain | prior approved change | Partial |
| Account recovery = request another link; no passwords, no recovery email problem unless the mailbox is lost | design | Functional, simple. Changing email: **Missing** |
| Sign-out clears the practice on the device by design | v2 store | Functional, **a retention and refund risk** (section 9) |
| Onboarding creates a user row, random Mirar id, a legacy cycle row | `onboarding.tsx` | Legacy shape; works |
| No self-service account deletion; the legal pages say "email info@mirar.life" | `app/privacy`, legal pages | Partial (manual) |
| Session handling uses the Supabase client; no "sign out everywhere" | code | Partial |

### 4.3 First Daily Inner Rep, ongoing practice, Honest Mirror (v2, staging only)
| Finding | Evidence | Status |
|---|---|---|
| 23 authored templates over six areas plus lens frames and continuity reps; thresholds are explicitly "provisional design guesses" | `lib/innerRep/v2/config.ts`, `templates.ts` | Tested on synthetic users only (78-assertion suite, 400-run sweep); **no human validation** |
| Simulated first exact repeat of a template around day 18 | `docs/V2_SIMULATION_REPORT.md` | Hypothesis, synthetic |
| Honest Mirror speaks only when evidence thresholds are met (for example, at least three independent observations over at least three distinct days, with hedged wording tiers), accepts "No / Partly / Unsure" corrections with structured reasons, and suppresses or qualifies a rejected reading | `evidence.ts`, `insights.ts`, correction suite | Functional in staging, tested; credibility with people **unmeasured** |
| Receipts (exact count and basis for a reading) | `runtime/receipt.ts` | Functional in staging |
| Crisis language check with India resources (112, Tele-MANAS 14416) | `safety.ts` | Functional in staging; **not clinically validated, Roman-script patterns only, no Devanagari/Gujarati**; wording needs sign-off |
| Frozen engine `inner-rep-engine-v2.0.1-correction-fix` | verified byte-identical | Functional |
| English only | `locales` have no v2 strings for hi/gu | Missing for an India-first launch |
| No reminders, no installable-app behaviour verified, no offline story verified | grep | Missing / *unverified* |

### 4.4 Look Again and Attend
| Finding | Evidence | Status |
|---|---|---|
| Look Again (31 data entries: situations, readings, alternatives) and Attend (15) exist behind `EXPO_PUBLIC_PILOTS=1` with their own device-only store and a source-separated Mirror section | `lib/innerRep/pilots/*` | Simulated/staging only; approved for staging usability testing only |
| No comprehension or usefulness testing with real people; no effect on engine evidence by design | `docs/product/PILOT_CONTRACTS.md` | **Not ready for paying users.** A5, A6, A7, A8 not approved/deferred |
| Pilot history is device-only and is not in any export | continuity code | Partial |

### 4.5 Practice history, recovery, deletion, privacy
| Finding | Evidence | Status |
|---|---|---|
| History is device-local; cleared at sign-out; lost if the browser data is cleared | `inner-rep-v2-store.ts` | Functional **and a product risk** |
| Optional history backup (Option B) has a full design, SQL draft, replay engine, and a simulated service; **not applied**; G4 blocked | branch `mirar-continuity-g3`, packet | Simulated only |
| File export verified-save works only with the File System Access picker (Chromium desktop); other browsers cannot confirm a save, so export is unavailable there | `export.ts` | Partial |
| Import not built | by decision | Missing |
| Server holds email, Mirar id, language, join date, legacy rows; v1 users may still have old answers/notes on the server | legal flags doc | Functional; legacy data cleanup **unplanned** |
| Deletion = email request, manual | legal pages | Partial; no timeline promised, no staffing confirmed |

### 4.6 Seven-day trial architecture
| Finding | Evidence | Status |
|---|---|---|
| `trial_tracking` table and a `trial-lifecycle` function exist from the retired lifelong-engine design: **14-day default**, `trial_active` and `conversion_status` text | `005_lifelong_system.sql`, `trial-lifecycle/index.ts` | Legacy scaffold, nothing in the app reads it, **not a trial** |
| `trial-lifecycle` is deployed, gated only by an optional `CRON_SECRET` header (its presence was read back as set on 14 October) | function list, remediation doc | Legacy |
| The table policy is `FOR ALL USING (user_id = auth.uid())` which lets a signed-in user **edit their own trial row** | migration `005` | **Hazard**: unusable as an entitlement source |
| Eligibility rules, abuse handling, expiry behaviour | none | Missing |

### 4.7 Cashfree subscriptions, UPI AutoPay, webhooks, mandate states, reconciliation
| Finding | Evidence | Status |
|---|---|---|
| No payment code, no gateway account in the repo, no checkout, no webhook, no ledger | grep for cashfree/razorpay/stripe in code returns nothing; `subscriptions.provider` comment says `'stripe'` | **Missing** |
| `subscriptions` table is a stub (status in active/cancelled/past_due/trialing; owner-writable policy) | `005` | Legacy, hazard as above |
| Cashfree facts read from its public docs on 15 October: Subscriptions supports cards, eNACH, UPI Autopay and physical NACH; periodic and on-demand plans; webhook events include `SUBSCRIPTION_STATUS_CHANGED` (ACTIVE, ON_HOLD, COMPLETED, CANCELLED, EXPIRED, BANK_APPROVAL_PENDING), `SUBSCRIPTION_AUTH_STATUS`, `SUBSCRIPTION_PAYMENT_NOTIFICATION_INITIATED`, `SUBSCRIPTION_PAYMENT_SUCCESS`, `SUBSCRIPTION_PAYMENT_FAILED`, `SUBSCRIPTION_PAYMENT_CANCELLED`, `SUBSCRIPTION_REFUND_STATUS`, `SUBSCRIPTION_CARD_EXPIRY_REMINDER` | public docs | Reference only. Signature scheme, retries, idempotency, trial/authorisation-amount mechanics and settlement were **not** in the pages I read: questions in section 11 |

### 4.8 Server-authoritative entitlements
| Finding | Evidence | Status |
|---|---|---|
| Nothing gates access; production is free beta | code | Missing |
| **Design constraint:** the engine and all practice run in the browser by design (privacy). A determined user can bypass any client check; the only server-enforced asset would be an account-bound service. So entitlement is "server-authoritative record, client-honoured" (a signed, short-lived status the app checks at launch and daily, with an offline grace), not DRM | architecture | Design decision for the founder (section 12) |

### 4.9 Trial expiry, failure, renewal, cancellation, refunds, reactivation
All **Missing**. States and rules proposed in section 6.3.

### 4.10 Transactional email
| Finding | Evidence | Status |
|---|---|---|
| Sign-in link: platform sender, content and rate limits *unverified* | needs dashboard | Unknown, P0 |
| Brevo account exists (free: 300 emails/day per the repo's setup note); sender domain `mirar.life` authentication (SPF/DKIM/DMARC) *unverified*; `email-nudge` and `whatsapp-nudge` functions are in the repo but **not deployed** | `EMAIL_NUDGE_SETUP.md`, function list | Partial / unverified |
| Whether hourly cron jobs from migrations 009/014/016 are still active is *unverified* (the remediation doc asks the owner to check `cron.job` names and active only) | remediation doc §8 | Open |
| Welcome, trial, billing, expiry, cancellation, account-change mail | none | Missing |

### 4.11 Optional practice reminders
| Finding | Evidence | Status |
|---|---|---|
| v1 push reminders (`daily-reminder`) are cycle-based and use native push tokens; the web app has no push | function code | Legacy, unusable for v2 |
| Morning email nudge: consent card `MorningNudgeCard`, per-user hour, function not deployed | repo | v1 UI; not in v2 |
| Time zones: day boundaries are the device's local calendar day; the nudge function used an hour column | code | Partial |
| v2 reminder preference, channel and consent | none | Missing |

### 4.12 Support, FAQ, contact
Only `info@mirar.life` appears; who reads it and its service level are *unverified*. No FAQ, no help page, no in-app contact, no issue tracker, no templates. **Missing.**

### 4.13 Policies, safety, Indian compliance
| Finding | Status |
|---|---|
| Privacy, Terms, Cookies rewritten 12 Oct for the **free beta**, with open owner confirmations (older server data, who sends email, other emails, deletion process) and a "free, with advance notice before any charge" line | Partial; **must be rewritten for payment** |
| No Refund/Cancellation policy, no grievance officer, no business identity block (proprietor name, address), no GST information | Missing |
| Safety copy verified for resources; detector not validated; clinician/founder sign-off not done | Blocked on sign-off |
| Indian dependencies (for counsel/CA to confirm; I have not verified current dates or thresholds): data-protection law and its rules, consumer-protection e-commerce disclosures, GST registration and invoicing, RBI recurring-payment rules (handled by the gateway but they shape the UX and notices), advertising-claims standards for health-adjacent wording, trademark clearance for the name | Missing / to confirm |

### 4.14 Analytics, conversion and retention measurement
None in the landing or app, by decision ("no trackers"). Therefore **no funnel, conversion or retention numbers exist**. A minimal, privacy-conscious design is in section 6.6. Missing.

### 4.15 Monitoring, error handling, backups, incident response, deploy, rollback
| Finding | Status |
|---|---|
| Release runbook, preflight script (tests, bundle checks), public-bundle checker, Vercel promote/rollback by alias | Functional (manual) |
| No error reporting, no uptime monitor, no alerting, no status page | Missing |
| Supabase Free: no backups, may pause after 7 days of low activity, 1-day logs | Constraint (G2) |
| Incident response plan, on-call, breach procedure | Missing |
| Legacy: 12 functions ACTIVE on 15 October including the eight with no caller authentication (listed in `SECURITY_REMEDIATION.md` §7); `CLEANUP_PLAN.md` deletes them after v2 promotion because v1 production still calls `process-checkin` and `select-daily-question` | Open, approval pending |

### 4.16 Language, mobile, accessibility
| Finding | Status |
|---|---|
| English only for v2; Hindi and Gujarati exist for v1 strings only | Missing for India-first |
| Aperture UI validated at 320/390/768/1024/1440 with axe (0 violations on checked screens), keyboard and reduced motion on documented screens | Functional on checked screens; native screen readers and Hindi/Gujarati typography not tested |
| Web only; installability/PWA and offline behaviour *unverified* | Unknown |

### 4.17 Running costs and free-tier limits (see section 10)

---

## 5. Customer lifecycle map (target)

```
Discover (mirar.life, search, word of mouth)
  → Try (anonymous sample, no account)
  → Sign up (email link; consent to terms/privacy; age check)
  → First Daily Inner Rep (no paywall; ~2 to 3 minutes)
  → Days 1 to 7: TRIAL (no payment details). Optional reminder opt-in. Honest Mirror speaks when evidence allows
  → Day 5 or 6: gentle, factual trial-end notice (what happens, what it costs, how to keep or leave)
  → Choose: Start membership (Cashfree checkout, UPI AutoPay or card) | Do nothing
  → Trial ends: expired, read-only (own history visible and exportable), no new reps
  → ACTIVE: renews monthly/annually; pre-debit notice by the gateway; receipt email
  → Payment failure: grace window, calm notice, retry by gateway, then lapsed (read-only)
  → Cancel (in-app, one step): stays active to period end; confirmation email
  → Refund request: policy-based, support-handled, reflected in entitlement
  → Reactivate: same account, history intact if still on device or file
  → Leave: export file, delete account (self-service or support within a stated period)
```

## 6. Minimum viable paid product (shipping scope)

### 6.1 In scope (one membership, no tiers)
1. v2 Daily Inner Rep and Honest Mirror (promoted after the existing release blockers clear).
2. Email-link account; legal acceptance; minimum age check.
3. 7-day trial, no payment details.
4. Cashfree subscription (monthly ₹199, yearly ₹1,499; *proposed, not final*), UPI AutoPay first.
5. Server-recorded membership state written only by verified webhooks; client reads it.
6. In-app membership page: status, next date, cancel, receipts, support link.
7. Honest, device-local history with a plain statement of what that means, the verified file export where supported, and delete-account.
8. Opt-in email reminder (single daily mail at a chosen time; unsubscribe link).
9. Transactional mail for: sign-in, welcome, trial-ending, payment receipt, payment failed, renewal notice (only where the gateway does not already send the regulated pre-debit notice), cancellation confirmation, expiry, account deletion confirmation.
10. Privacy Policy, Terms, Refund and Cancellation policy, safety statement, grievance contact, business identity.
11. Minimal monitoring and a support inbox with templates.

### 6.2 Explicitly out of the first paid release
Look Again and Attend (until human-tested), account backup and cross-device sync (G4 blocked, no Pro), Hindi/Gujarati (P1 right after launch), import, native apps, additional tiers, coupons, referral, group/corporate plans, international payments, push notifications, AI features.

### 6.3 Entitlement state machine (proposal)
`none → trialing(7d) → [active | expired]`; `active → past_due(grace N days) → [active | lapsed]`; `active → cancel_requested(until period end) → expired`; `any → refunded/revoked`; `expired|lapsed → active (reactivation, no second trial)`.
Data (design only, nothing created): a `membership` row per user readable by its owner, **writable only by the service role**; an append-only `billing_event` table keyed by the gateway's event id for idempotency; a `mandate` record (state, method, max amount, next debit). All client write policies on the legacy `subscriptions` and `trial_tracking` tables must be removed before any of this goes live.

### 6.4 Trial eligibility (proposal, founder decision)
One trial per verified email address after normalising aliases (case, plus-tags, dots for Gmail); trial starts when the first Daily Inner Rep is completed (so a signup that never practises is not burned); trial length in calendar days in the user's local day boundary, stored as an absolute UTC end; returning after expiry gets no second trial; existing beta users get a defined grandfather rule (decision). Abuse by creating new emails is acknowledged and accepted at this price; mitigations are rate limits and a disposable-domain list, not device fingerprinting (privacy).

### 6.5 Honest limits of a client-side product
Practice and the engine run in the browser. A technically determined person can run the app without paying. The enforcement we can offer is the signed status check, the absence of server-side Mirror services to steal, and the convenience of keeping their account valid. We accept that trade for privacy and cost. Do not market anything as "locked".

### 6.6 Minimal privacy-conscious measurement (proposal)
Server-side only, no cookies, no third-party scripts, no practice content: counts of sign-ups, first reps completed, trial starts, Mirror readings shown (count), subscriptions started, cancelled, failed, refunded; day-7 and day-30 returns as `distinct mirar_id` activity flags derived from membership and a coarse `last_active_day`; landing visits via first-party server logs or a cookie-free counter. Requires a disclosure update and a founder decision (section 12).

---

## 7. Dependency-aware critical path

Legend: ☐ not started. Owner C/X/F. Gates are in section 8.

**Phase A: stabilise and decide (no spend, no external change)**
A1 ☐ F: decisions in section 12 (pricing incl. GST, trial rules, grandfathering, expired behaviour, reminder scope, Vercel plan).
A2 ☐ C: legacy function cleanup plan reconfirmed against v2 promotion order (approval required, see `CLEANUP_PLAN.md`).
A3 ☐ F+C: `cron.job` active list, auth email/SMTP settings and secrets presence read back (read-only, founder runs, counts/names only).
A4 ☐ C: HISTORICAL_LOG_GAP cheap checks (items 2 to 4).
A5 ☐ C: written specs: entitlement data model, webhook handler, trial rules, email catalogue, reconciliation procedure (documents only).

**Phase B: the v2 product becomes promotable**
B1 ☐ F: two-inbox account-isolation run on `mirar-unified-real`.
B2 ☐ F+qualified person: safety and helpline copy sign-off, crisis detector scope decision (including non-Roman scripts).
B3 ☐ F+people: small human test of first-session value and Mirror credibility (section 13). No efficacy claims.
B4 ☐ X: final unified confirmation; R1 to R9 continuity screens (not needed for paid MVP; backup stays off).
B5 ☐ C: promote v2 per runbook **after** B1 to B3, with rollback; then delete the legacy functions with approval.

**Phase C: identity and plumbing**
C1 ☐ C+F: first-party app domain (for example `app.mirar.life`), session/cookie and redirect updates (auth-config change needs explicit approval).
C2 ☐ C+F: Brevo domain authentication (SPF, DKIM, DMARC) for `mirar.life`; custom SMTP for auth mail (auth-config approval).
C3 ☐ C: monitoring and error reporting on free tiers; incident/runbook docs.

**Phase D: money (needs Cashfree approval and explicit approvals for every DB change)**
D1 ☐ F: Cashfree application; sandbox credentials delivered to the founder's own secret store (never in chat).
D2 ☐ C: migration proposal for `membership`, `billing_event`, `mandate` and removal of owner-write policies on legacy tables (exact SQL shown first; approval per gate; **not G4**, a separate gate).
D3 ☐ C: webhook receiver (signature verified, idempotent), checkout session creation, return handler, daily reconciliation job; sandbox only.
D4 ☐ X: paywall, trial, membership, receipts, failure and expiry screens (section 14).
D5 ☐ C: full lifecycle test matrix in sandbox: auth success/failure, first debit, renewal, failure, retry, cancel, refund, duplicate and out-of-order webhooks, replayed webhook, clock edges, timezone edges.

**Phase E: trust and operations**
E1 ☐ F+counsel: Privacy, Terms, Refund/Cancellation, grievance officer, business identity, notices; DPDP/consumer/GST review.
E2 ☐ C+X: support page/FAQ, templates; deletion and export flows.
E3 ☐ C: opt-in reminder via Brevo (consent, unsubscribe, time zone handling).
E4 ☐ F: CA/GST registration decision and invoicing process.

**Phase F: launch**
F1 ☐ closed paid pilot (small, known people, real money, real refund path), F2 ☐ go/no-go against section 8, F3 ☐ India launch, F4 ☐ Hindi/Gujarati, then pilots, then backup (only after Pro is justified).

**Critical path:** A1 → (B1, B2, B3) → B5 → C1/C2 → D1 → D2 → D3 → D5, with D4/E1/E2 in parallel; paid pilot cannot start before D5 and E1 and B5.

---

## 8. Release gates

| Gate | Must be true | Verification |
|---|---|---|
| **S1 Security** | Legacy functions with no caller authentication removed or authenticated; legacy `subscriptions`/`trial_tracking` owner-write policies removed; webhook endpoint verifies signatures and is idempotent; service secrets only in provider stores; two-account isolation passes in a real browser; no credentials in any bundle | preflight, bundle checker, isolation run, webhook replay tests |
| **S2 Historical** | Admin exposure gap documented, cheap checks done, residual risk accepted in writing | `HISTORICAL_LOG_GAP.md` |
| **P1 Privacy/legal** | Qualified review of consent, payment-data handling, retention, deletion, cross-border (Seoul), age; policies match behaviour | reviewer sign-off |
| **P2 Disclosure accuracy** | Every statement on the site (device-only, no analytics, no AI, deletion process) matches what runs | claim-by-claim test sheet |
| **F1 Safety** | Crisis copy and detector scope signed off; "not therapy" wording in funnel, trial and marketing | sign-off |
| **F2 Usefulness** | Small human test completed and reviewed; paid scope adjusted to its findings | test report |
| **B1 Billing** | Sandbox lifecycle matrix green; reconciliation reproduces ledger from gateway data; refund and cancel paths verified end to end | test record |
| **O1 Operations** | Monitoring, support inbox with owner and response target, incident procedure, rollback rehearsed | drill record |
| **A1 Accessibility/mobile** | Axe clean and manual keyboard/mobile checks on every paid-path screen at 320/390/768/1024/1440 | validation matrix |
| **L1 Language** | English is complete; Hindi/Gujarati promised only when reviewed by a native reader | review |

---

## 9. Under current infrastructure: what we cannot responsibly promise

No guarantee of backup, restore or recovery; no uptime or response promises; no cross-device continuity as a paid benefit; no deletion-timing or retention periods beyond what the reviewer approves; no "your data is safe/private/encrypted" absolutes; no reminders that claim to be reliable; no history of pilots or unfinished practice in any export; no claim of clinical benefit, therapy, diagnosis, or measured outcomes. The paid copy must say plainly: *your practice lives on this device; clearing the browser or signing out removes it; you can save a file.* This is a **retention risk**, not just a disclosure: a customer losing months of history is the likeliest refund and one-star event. Mitigation inside Free limits: a visible, repeatable "save a copy" prompt where the picker exists; a clear sign-out warning (built); a periodic "last saved" indicator.

---

## 10. Costs (what I could verify, what I could not)

| Item | One-time | Recurring | Evidence / note |
|---|---|---|---|
| Supabase | none | **₹0 (Free)** | Pro deferred. Free: no backups, 7-day inactivity pausing, 1-day logs, 500 MB DB (pricing page). |
| Vercel | none | **Possibly $20/month per member (Pro)** | The plan was not readable. Vercel's Hobby plan is described in its terms as for personal, non-commercial use; a paid product likely needs Pro. *To confirm in the Vercel dashboard.* |
| Domain `mirar.life` | already held | annual renewal (amount not read) | |
| Brevo | none | ₹0 up to 300 emails/day (repo note) | Enough for transactional mail at launch scale; confirm plan terms. |
| Cashfree | possible onboarding/setup fee: **ask** | per-transaction fee, possibly a per-mandate or subscription fee: **ask**; GST on fees | Not read. Section 11. |
| GST | CA fee; registration if required | return filing cost | Thresholds *to confirm with a CA*; assume 18% GST on subscription unless told otherwise (price inclusive/exclusive is a decision). |
| Legal review | quote needed | periodic | Not estimated. |
| Monitoring | none | ₹0 on free tiers (error reporting, uptime check) | Verify limits when chosen. |
| Support inbox | none | ₹0 if existing mailbox | Hosting of `info@mirar.life` *unverified*. |
| Anthropic/AI | none | none | The Mirror is deterministic; no model calls in v2. (Legacy v1 `generate-mirror-insight` calls a model; goes with the legacy cleanup.) |

**Illustrative break-even (assumptions flagged).** At ₹199 including 18% GST the net before gateway fees is about ₹168.6. If gateway fees were about 2% plus GST (assumption, not Cashfree's quote), about ₹4 more goes, leaving roughly ₹164. If Vercel Pro (about $20, roughly ₹1,700 at an assumed exchange rate) is the only fixed cost, about 11 monthly members cover it; the annual plan nets about ₹1,271 before fees per member. These are arithmetic on assumptions to be replaced by real quotes; they are not forecasts of demand.

---

## 11. Cashfree onboarding questions and integration prerequisites

**Ask Cashfree (written answers):**
1. Is an Indian sole proprietorship eligible for Subscriptions with UPI AutoPay, cards and eNACH? Which documents (PAN, bank, address proof, GST optional?) and how long does approval take?
2. Is a mental-wellness/self-reflection subscription an accepted category, or restricted/high-risk? What website and policy pages are required before approval (pricing, contact, refund, grievance)?
3. How is a **free trial without payment details** handled: do we create the subscription only when the customer chooses to pay? Is there a first-charge-date option, and is an authorisation amount (for example a small refundable debit) required to register a UPI AutoPay mandate?
4. Mandate limits and rules: maximum per-debit amount without extra authentication, pre-debit notification (who sends it, what text, lead time), customer-side cancellation through the UPI app and the webhook that follows, annual plans and yearly mandates.
5. Failed payments: retry schedule, number of retries, how `ON_HOLD` and `SUBSCRIPTION_PAYMENT_FAILED` relate, what we should show during a grace window.
6. Webhooks: signature header and algorithm, retry policy and duration, ordering guarantees, idempotency keys (`cf_subscription_id`, `payment_id`, `event_time`), IP allow-listing, test tools.
7. Sandbox: availability, test UPI IDs/cards, simulating failures and cancellations.
8. Refunds: full/partial, timeline, whether the gateway fee is refunded, the `SUBSCRIPTION_REFUND_STATUS` flow, effect on the mandate.
9. Settlement: cycle, reports and an API/CSV for reconciliation by payment id, fee and GST breakdown, handling of failed payouts.
10. Fees: setup, per-transaction (UPI, card, eNACH), per-mandate, refunds, chargebacks, GST invoices for fees.
11. Hosted checkout vs embedded: what keeps us out of card-data scope; return/redirect URL handling; support for a first-party domain.
12. Data: where customer data is stored, what we may keep (we want only ids and states), retention.

**Prerequisites on our side:** a first-party domain; policy pages live; business identity block; a founder-owned secret store (Vercel/Supabase project secrets, never chat); sandbox keys only until D5 passes; a written support/refund SOP; GST/CA position; the legacy owner-write policies removed; the entitlement design above approved.

---

## 12. Decisions requiring the founder

1. Final prices, whether they include GST, and whether the annual plan is shown from day one.
2. Trial rules: start at signup or first rep; length 7 days (see risk R1 below); grandfathering of existing beta users; behaviour after expiry (recommended: read-only history and export, no new reps).
3. Whether Look Again and Attend are in the first paid release (recommended: no, until human-tested).
4. Reminder scope: email only for launch (recommended) and the default time.
5. Vercel plan (confirm and accept Pro if required).
6. First-party app domain and permission to change auth redirect/sender settings when the time comes.
7. Minimal analytics design and disclosure (section 6.6).
8. Support: who answers, hours, response target, tool (shared inbox first).
9. Deletion SLA and refund policy terms (period, pro-rating, annual-plan rules).
10. Appointment of the privacy/legal reviewer and a CA; budget range.
11. Legacy cleanup: approve deletion of the legacy functions after v2 promotion (existing proposal).
12. Language order after launch: Hindi, then Gujarati, with native reviewers.
13. Whether to run a closed paid pilot before public launch (recommended).

---

## 13. Part 5: commercial-value assessment

**Central question: why would someone pay every month and keep paying?**

### Supported by the code
- **A real point of difference.** The Mirror makes claims only when the evidence rules are met, shows its basis, accepts correction, and goes quiet when corrected. It is rule-based, not a language model, so it cannot flatter or invent. That is an integrity advantage in a market full of vague positivity. (`evidence.ts`, `insights.ts`, receipts, correction suite.)
- **Continuity that most trackers lack.** Mirar remembers commitments, upcoming events and open threads and follows up within budgets, without becoming a reminder app. (`config.ts` commitment and thread rules.)
- **Care for the person.** Intensity limits after heavy reps, "I don't know" and "skip" are first-class, rest and ease rules, a crisis check with India resources, no streak-shaming.
- **Privacy that can be explained.** Practice stays on the device; words typed in optional steps are not stored; no trackers.
- **Variety by design.** 23 templates over six areas, repeat windows, lenses.

### Weaknesses the code makes visible
- **First-session value is mostly the experience of the rep itself.** The Mirror deliberately says nothing early (a day-1 "convergence insight" was treated as a defect). If the first rep does not feel useful by itself, a 7-day trial may expire before the first reading. The synthetic simulations show a handful of readings by about two weeks; that is a model of my own invented users, not evidence about people.
- **Daily variety is finite.** Synthetic first exact repeats occur around day 18. After a month, templates recur; authored content depth is the main cost of a long subscription.
- **No visible progress loop by design.** No streaks, scores or badges is the right ethics but leaves the retention burden on usefulness and on gentle reminders, which v2 does not have.
- **Device-local history.** The most likely reason for churn and refund requests is losing history, or never being able to see it across devices.
- **English only** for a first launch in India.
- **Pilots unproven.** Look Again and Attend look careful but have had no human comprehension or usefulness testing.
- **No outcomes.** Nothing measures whether people feel better, and we must not claim they do.

### Hypotheses that need human testing (not facts)
1. A new person understands what Mirar is and does within the first rep.
2. A person finds the daily rep worth 2 to 3 minutes for at least 3 weeks.
3. People find the first Mirror reading accurate-feeling, understandable, and worth returning for.
4. The correction ("No / Partly") makes people trust the Mirror more, not less.
5. The reminder (email) brings people back without irritation.
6. People will pay ₹199/month for this; 7 days is enough to decide; annual at ₹1,499 is attractive.
7. Losing device history is rare enough for launch, or common enough to need backup first.
8. Hindi/Gujarati materially change adoption.

**Minimum honest test (proposed, small, consented, privacy-preserving):** 8 to 12 people, 14 days, 5-minute weekly interviews, observed first session, Likert items on clarity and usefulness, notes on moments of confusion, no health claims, results reported as findings about those people only.

### Differentiation, stated carefully
Versus mood trackers (Daylio-style), Mirar is an evidence-bounded reading with a basis you can inspect. Versus AI companions, it is deterministic and private. Versus meditation or therapy apps, it makes no clinical claims and is a daily practice with memory. These are positioning statements supported by the architecture; whether customers value them enough to pay is untested.

### Paid-retention risks (ranked)
R1 trial too short for the first Mirror reading; R2 history loss; R3 content repetition after month one; R4 no reminders; R5 English only; R6 Mirror too quiet early; R7 trust damage from any billing error; R8 guilt-free design leaves no habit hook. Each has a measurable proxy in section 6.6 once measurement exists.

---

## 14. Exact Codex frontend requirements for a future coordinated assignment
(Do not start until the founder approves scope and Claude publishes the entitlement/billing contract. Codex designs; Claude owns data and billing logic. No dark patterns.)

1. **Landing:** pricing section (₹199/month, ₹1,499/year, GST wording), "what you get" and "what we do not do" in plain language, FAQ, support/refund/grievance links, working primary CTA to sign-up, SEO metadata, `robots`/`sitemap` pages, social previews, accessible at 320 to 1440.
2. **Sign-up/sign-in:** age and terms acceptance, email-link sent/expired/error states, recovery path, first-party domain.
3. **Onboarding to first rep:** under two minutes, explains what Mirar notices and when ("a reading appears when there is enough of your own evidence"), no promises of outcomes.
4. **Trial surface:** calm, non-pressuring status (day n of 7), what happens at the end, no countdown theatre.
5. **Membership page:** state, price, next date, payment method type, cancel (one step, honest confirmation), receipts, reactivate, support, delete account, export file.
6. **States to design with equal care:** trialing, trial ending, expired (read-only), payment pending, payment failed (grace), active, cancelled-until-period-end, refunded, lapsed, offline/unavailable. Every state names what the person can still do.
7. **Checkout handoff and return:** hosted gateway redirect, return handler with "confirming" state that never says "paid" until the server says so, failure and cancel returns.
8. **Reminder preference:** opt-in, time, time zone, how to stop; shown at a calm moment, never before the first rep.
9. **Sign-out and history safety:** the built warnings, "save a copy" prompt where available, honest note where not; restore-from-file stays out until import exists.
10. **Support/FAQ and legal pages:** consistent navigation, last-updated dates, refund and cancellation summary, safety/helplines page.
11. **Language:** Hindi and Gujarati layout readiness (typography, line breaks) even if copy follows later; no text baked into images.
12. **Accessibility:** keyboard and screen-reader flows for every paid-path screen; axe clean; reduced motion; 44 px targets; no colour-only meaning; validation matrices.
13. **Content ownership:** Codex proposes copy for review; legal and safety wording is final only after the qualified review.

---

## 15. Per-requirement register (concise)

Columns: **ID**; **Customer outcome**; **P**; **Status (evidence)**; **Owner**; **Depends on**; **Acceptance**; **Verification**; **Costs (one-time / recurring)**; **Release blocker**.

| ID | Customer outcome | P | Status | Owner | Depends | Acceptance | Verification | Cost | Blocks |
|---|---|---|---|---|---|---|---|---|---|
| L1 | Understands what Mirar is and trusts it before signing up | P0 | Partial: landing live, no price/FAQ | X, F | A1 | Pricing, FAQ, trust copy, working CTA | Content review, link check, axe | none / none | Yes (policy pages must match) |
| L2 | Finds Mirar by search; shares it with a good preview | P1 | Partial: title/OG only; robots/sitemap 404 | X, C | L1 | robots, sitemap, metadata, per-page OG | Search-console-style checks, curl | none / none | No |
| L3 | Conversion and funnel visible to the founder | P1 | Missing | C, F | A1 decision | Cookie-free counts of visit, signup, first rep, trial, paid | Dashboard matches test traffic | none / ₹0 | No |
| A1 | Gets in with one email link, reliably | P0 | Partial: works in test; sender/limits unverified | C, F | C1/C2 | Link arrives from mirar.life within 1 min, no rate-limit failure at launch volume | Test inboxes at 3 providers; rate test | none / ₹0 (Brevo SMTP) | Yes |
| A2 | Can recover and change email | P1 | Partial (recovery via link; change missing) | C, X | A1 | Email change with confirmation | Test | none / ₹0 | No |
| A3 | Can see and delete my account | P0 | Partial: manual by email | C, X, F | counsel (P1 gate) | Self-service or SLA-backed deletion with confirmation mail | End-to-end test; data check | none / ₹0 | Yes |
| A4 | Never sees someone else's data | P0 | Tested; real two-inbox run pending | F, C | none | Two-account isolation passes in a real browser | Run record | none / ₹0 | Yes |
| P1 | First rep is useful and clear | P0 | Staging only; untested with people | C, X, F | B3 | Human test report; no blocker issues | Test report | ₹0 / ₹0 | Yes |
| P2 | Daily practice stays varied and safe | P0 | Tested synthetically | C | frozen engine | Content depth plan; intensity rules intact | Suite, sweep | none / ₹0 | Yes (depth plan) |
| P3 | Mirror readings are honest and correctable | P0 | Tested; credibility untested | C | P1 | Evidence rules intact; correction works; human review of tone | Suites, human test | none / ₹0 | Yes |
| P4 | Safety: crisis language handled | P0 | Verified resources; detector not validated | F, C, qualified person | none | Sign-off; scope decision for non-Roman scripts | Sign-off record | none / ₹0 | Yes |
| P5 | Look Again / Attend help | P2 | Staging only; untested | C, X | A5/A8 decisions, human tests | Not in first paid release | Test report later | none / ₹0 | No |
| H1 | Knows exactly where my history lives | P0 | Functional + warnings built | X, C | none | Plain copy in funnel and Me; sign-out warning; save-a-copy where available | Copy audit; browser matrix | none / ₹0 | Yes |
| H2 | Can keep a copy of my practice | P1 | Partial: Chromium desktop only | C, X | none | Export on supported browsers; clear unsupported message | Browser matrix | none / ₹0 | No |
| H3 | Cross-device history | P2 | Simulated only; G4 blocked | C | Pro decision, legal review, G4 | Not promised | n/a | Pro $25/mo later / n/a | No (not sold) |
| T1 | Trial that is clear and fair | P0 | Missing (legacy scaffold unusable) | C, X, F | A1 decisions | 7-day trial per rules in 6.4; one per person; server record | Test matrix incl. timezone/clock edges | none / ₹0 | Yes |
| T2 | Told before the trial ends | P0 | Missing | C, X | E-mail arch | Notice on day 5/6, in-app and email, factual | Sandbox timeline test | none / ₹0 | Yes |
| B1 | Pays easily by UPI AutoPay or card | P0 | Missing | C, X, F | D1, S1 | Sandbox lifecycle green | Test record | setup fee ask / % per txn ask | Yes |
| B2 | Never charged wrongly; receipts | P0 | Missing | C | B1 | Webhook idempotent; reconcile to gateway daily; receipts mailed | Replay/out-of-order tests, reconciliation run | none / ₹0 | Yes |
| B3 | Can cancel in one step | P0 | Missing | C, X | B1 | Cancel in-app; active to period end; confirmation mail | Test | none / ₹0 | Yes |
| B4 | Fair handling of failed payment | P0 | Missing | C, X | B1 | Grace window; calm notices; lapse to read-only | Test | none / ₹0 | Yes |
| B5 | Refund path that works | P0 | Missing | F, C | policy | Refund SOP; webhook `SUBSCRIPTION_REFUND_STATUS` handled | Sandbox refund test | gateway fee ask / ₹0 | Yes |
| B6 | Reactivate without losing anything | P1 | Missing | C, X | B1 | Same account, history intact, no second trial | Test | none / ₹0 | No |
| E1 | Access matches membership | P0 | Missing | C | B1 | Signed short-lived status; offline grace; read-only after expiry | Test; tamper tests | none / ₹0 | Yes |
| E2 | No one can grant themselves access | P0 | **Hazard present** (owner-write policies on legacy tables) | C | approval | Policies removed; service-role-only writes | Policy review; attempted self-write test | none / ₹0 | Yes |
| M1 | Receives clear email at key moments | P0 | Missing beyond sign-in | C | C2 | Catalogue in 16 sent from verified domain | Delivery/spam tests | none / ₹0 | Yes |
| M2 | Gentle optional reminder | P1 | Missing (v1 pieces unusable) | C, X | M1 | Opt-in, time, time zone, unsubscribe; no reminder if already practised | Time-zone tests | none / ₹0 (300/day) | No (recommended for retention) |
| S1 | Gets help from a human | P0 | Missing | F, C | none | Support inbox with owner, SLA, templates, FAQ | Test ticket | none / ₹0 | Yes |
| G1 | Policies match reality | P0 | Partial: beta-era; must change for payment | F, counsel, C | P1 gate | Privacy, Terms, Refund, identity, grievance | Claim-by-claim sheet | counsel quote / periodic | Yes |
| G2 | Business is compliant | P0 | Missing | F, CA | A1 | GST decision, invoicing, registered details | CA sign-off | CA fee / returns | Yes |
| O1 | Product stays up; problems are seen | P0 | Missing | C | none | Uptime and error alerts; runbook; rollback rehearsal | Drill | none / ₹0 (free tiers) | Yes |
| O2 | Account email works at scale | P0 | Unverified | C, F | A1 | Rate limits understood | Load/rate test | none / ₹0 | Yes |
| O3 | Platform does not go to sleep | P1 | Constraint on Free | C | none | Documented keep-warm or accepted risk; unavailable state is calm | Observation | none / ₹0 | No |
| O4 | Legacy attack surface removed | P0 | Open (eight no-auth functions ACTIVE; deletion unapproved) | C, F | v2 promotion | Functions removed or authenticated | `functions list`, probes (status only) | none / ₹0 | Yes |
| O5 | Past exposure understood | P0 | Open (log gap) | C, F | none | Cheap checks done; residual risk accepted in writing | `HISTORICAL_LOG_GAP.md` | none / ₹0 | Yes |
| Q1 | Mobile and accessible | P0 | Checked on Aperture screens | X, C | none | Paid-path screens axe clean at five widths; manual keyboard | Matrix | none / ₹0 | Yes |
| Q2 | Use it in my language | P1 | v2 English only | X, F | native reviewers | Hindi next, Gujarati after | Native review | translator fee / ₹0 | No |
| V1 | Pays because it helps | P0 | Hypothesis | F | P1 test | Findings recorded; no efficacy claims | Test report | participant costs / ₹0 | Yes |
| V2 | Fair price | P1 | Hypothesis | F | V1 | Price tested with the pilot cohort | Pilot conversion | none / ₹0 | No |

---

## 16. Essential transactional email and notification architecture

**Sender and domain:** one verified sending domain (`mirar.life`) with SPF, DKIM and DMARC; separate subdomain for transactional if volume grows. Auth mail through custom SMTP (Brevo) so deliverability and rate limits are ours, not the platform default (auth-config approval needed).

**Catalogue (each: trigger, recipient, content rule, owner):**
| Mail | Trigger | Rule |
|---|---|---|
| Sign-in link | user request | Plain, expiry stated, no marketing |
| Welcome | first sign-in | What Mirar is, how to practise, support link; no hype |
| Trial started | first rep completes | End date in local time, what happens at the end |
| Trial ending | day 5 or 6 | Factual; price; how to continue or let it end |
| Trial ended | expiry | What is still available (history, export) |
| Payment receipt | `PAYMENT_SUCCESS` | Amount, GST, period, invoice link |
| Payment failed | `PAYMENT_FAILED` | What happened, retry, how to fix, grace end |
| Pre-debit notice | gateway-sent | Do not duplicate unless required; reconcile wording |
| Cancellation confirmed | cancel | Access until date; how to return |
| Membership ended | expiry | Same as trial ended, plus export |
| Refund processed | refund final | Amount, timeline |
| Account change / deletion confirmation | event | Security-relevant; no marketing |
| Practice reminder (optional) | schedule | One per day max, only if opted in and not yet practised; unsubscribe |

**Notification channels:** email only at launch; in-app banners for state changes; no push; WhatsApp parked (cost and consent).
**Reliability:** queue table with idempotency key per mail; sender function retries; no mail on webhook replays; log only ids and status (no practice content); bounces/complaints suppress further sends.
**Time zones:** store the person's IANA zone at opt-in; schedule in UTC; day boundaries follow that zone; trial end shown in local time.

---

## 17. Highest-risk gaps (ranked)
1. No billing or entitlement system exists; the legacy tables are owner-writable.
2. Production still runs unauthenticated legacy functions; v2 not promoted; deletion needs approval and ordering.
3. The v2 product has never been used by real people; the paid promise rests on hypotheses.
4. Device-local history with no backup under Free limits invites the most damaging customer experience (loss) and refunds.
5. Account email delivery and rate limits are unverified; if sign-in mail fails, nobody can start.
6. Policies, grievance, business identity and tax position are not ready for money.
7. No monitoring or incident process; Free project can pause.
8. Historical admin exposure cannot be audited.
9. English only for an India-first launch; reminders absent.

## 18. What can be done now at no extra monthly cost
Documents and specs (entitlement, webhook, trial, email, reconciliation); the human test protocol; read-only checks the founder can run (cron names, auth settings presence, SMTP configured or not, secrets presence); Brevo domain authentication; free-tier monitoring; landing SEO, pricing and FAQ copy (Codex, with review); support SOP and templates; a local sandbox simulator for the billing state machine (like the continuity stub) to test the entitlement logic before any gateway account exists; CA and counsel conversations; the Cashfree application (cost: ask).

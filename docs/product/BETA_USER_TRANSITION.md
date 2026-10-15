# Existing beta users: transition plan (decided 15 October, later)

**Date:** 15 October 2026. **Decision (founder):** existing beta users receive the **standard new 14-day trial (348 hours)**, beginning only after their first completed v2 Inner Rep; no automatic billing, no bulk resets, no reliance on legacy trial rows. This is Option 1 below. **Status:** plan only; nothing is implemented. **Rules (founder):** do not silently reset or charge anyone. I cannot see user records, so every count below is unknown; the founder runs the read-only counts listed in section 6.

## 1. Who "existing beta users" are
| Group | Where they exist | Notes |
|---|---|---|
| A. Accounts created in the v1 beta (production Supabase) | `users` / auth records; v1 server-side check-ins and any notes | The only people production can affect. Count unknown. |
| B. Waitlist sign-ups (not accounts) | Apps Script sheet (whether live is unverified) | Never had an account; they follow the normal path. |
| C. Founder, testers, staging accounts | Staging and `mirar-unified-real` test sign-ins | Internal cohort; separate handling. |
| D. People with morning-email or WhatsApp opt-ins from the v1 features | `users` columns for nudge consent (WhatsApp number stored if given) | Consent was for a different feature; not reusable for new mail. |

## 2. Guarantees (structural, not just promises)
1. **No charge is possible without the person's own action.** No payment instrument, mandate or card exists for anyone; the trial asks for none. Charging requires the person to complete a checkout.
2. **No silent reset or conversion.** Nothing about an account's entitlement changes until that person completes their first rep on the new product. Rows are created lazily; there is **no bulk backfill** that starts clocks.
3. **The legacy trial tables are ignored.** Every v1 account may have a legacy `trial_tracking` row (a 14-day trial from the day it was created, `conversion_status` 'trial' or 'expired') and a `subscriptions` row. Reading them would make long-time users look expired and lock them out silently. The new gate never reads them (tested). They are archived or dropped only under a separate approval.
4. **Any exception is explicit.** A founder grant (`comped`) or trial correction is an `entitlement_event` with `source: admin`, who/when/why, visible to the person in-app.
5. **Nothing is reset behind someone's back.** A trial that has started is displayed with its end time and cannot be restarted.

## 3. Options considered for group A (Option 1 chosen)
| Option | What happens | Pros | Cons |
|---|---|---|---|
| **1. Standard path (recommended)** | v2 is a new product: the 14-day trial starts at their first completed v2 rep, like anyone's. A clear notice explains the change. | Simplest; one rule; fair; cheapest; nothing to maintain | No special recognition of early supporters |
| 2. Standard trial + "founding member" price lock | As 1, plus a promise of a held price if they subscribe within a window | Rewards early users | Creates a long-lived promise (terms, GST, support); needs counsel and a cohort flag |
| 3. Longer first period for beta users | e.g. 30 days instead of 14 | Generous | A second rule to build, test and explain; more complexity in a bootstrapped build |
Chosen: Option 1; if recognition is wanted, a one-time discount code issued later at the gateway (no engine or entitlement change). All options keep the guarantees above.

## 4. Notices
- **In-app, at first sign-in after promotion (always):** what changed, that no card is needed, that the trial starts when they finish their first practice and lasts 14 days (plus the courtesy), what happens at the end, and how to delete their account or old data.
- **One email before promotion to group A accounts (separate approval):** a service-change notice, not marketing. Content: v1 is being replaced; what stays or goes; no payment is requested; how to leave; the legacy-data offer. Who receives it (all accounts, or those active in the last N days) is a decision; I recommend active accounts only plus an in-app notice for the rest. Send from the verified domain once email is set up, after the privacy review. Lead time before promotion: recommend 14 days.
- **Group D:** their old nudge consent covered a feature that no longer exists; do not send reminders to them without a fresh, explicit opt-in in the new product. Decide separately whether to purge stored WhatsApp numbers (personal data for a parked feature).

## 5. Data they already have
- **v1 server-side answers and notes** stay legacy: not shown, not used by v2, not imported. Offer deletion. The privacy page already says earlier-version data may still exist.
- **Device-local data from the v1 app** is not migrated (v2 starts fresh on first rep). Say so in the notice.
- **Same sign-in:** same email, same account; no new sign-up.

## 6. Read-only checks the founder (or I, with approval) can run before any notice
Counts only, no emails or content: number of accounts; number created before the v2 beta cutover (7 Oct); number active in the last 30/90 days; number with a legacy `trial_tracking` row in each status; number with email-nudge or WhatsApp opt-in; whether `trial-lifecycle` is scheduled (`cron.job` names only). These determine who gets a notice and whether any legacy row is already marked expired.

## 7. Edge cases
| Case | Handling |
|---|---|
| Beta user completes their first rep on the new product | Trial starts like anyone's |
| Beta user who already used the staging build with the same email | Staging has its own storage and no entitlement; counts as a new start in production |
| Two accounts, one person | Eligibility is **per account**: another address is another account and another trial. No alias normalisation or tracking (founder decision); revisit only on demonstrated need (contract §10) |
| Account deleted and recreated | A new account is a new trial; deleting removes the entitlement row and events (cascade). Accepted; revisit only on demonstrated need |
| Internal and tester accounts | `comped`/`internal`, logged; never counted in conversion metrics |
| Someone asks for more time | Explicit logged admin extension; never a hidden reset |

# G2: read-only verification of the Supabase project (evidence and open questions)

**Date:** 15 October 2026. **Method:** read-only. Supabase CLI metadata commands (`projects list`, `backups list`), two dashboard pages read in the founder's signed-in browser (organisation Billing; project Database → Backups), and the provider's public pricing and documentation pages. **Not done:** no credentials displayed or copied, no table, function, auth, secret, log or user-data page opened, no SQL, no setting changed, no plan or spend-cap change. The Chrome tab was closed afterwards.

## Evidence
| Question | Finding | Source | Confidence |
|---|---|---|---|
| Plan | **Free.** Spend cap **enabled** ("projects could become unresponsive or enter read-only mode if you exceed the included quota"). No invoices, so never paid. | Dashboard → Organisation → Billing | Verified (today) |
| Region | **ap-northeast-2 (Seoul, South Korea).** Postgres engine **17** (17.6.1), status ACTIVE_HEALTHY, release channel GA | CLI `projects list` | Verified (today) |
| Provider backups | **None on this plan.** CLI: `backups: []`, `pitr_enabled: false`. Dashboard: "Free Plan does not include project backups. Upgrade to the Pro Plan for up to 7 days of scheduled backups." | CLI + Dashboard → Database → Backups | Verified (today) |
| Inactivity pausing | Free projects "are paused after 1 week of inactivity"; "may pause applications … that exhibit low activity in a 7-day period"; paid plans are not paused for inactivity | Provider pricing page and production-readiness guide (public docs) | Documented, not observed on this project |
| What pausing does to data and how long a paused project can be restored | **Not established.** The pages I read do not state it | none | **Unresolved** |
| Log retention | Free: **1 day** (API and database logs); Pro: 7 days | Provider pricing page | Documented |
| Database size | Free: 500 MB per project (Pro: 8 GB). This project's current size **not read** (it would have meant opening usage or table pages) | pricing page | Unresolved for sizing, not a concern at this volume (see below) |
| Project count | The same organisation holds a second, unrelated project (Siddhi Art Jewelry). The Free plan's active-project allowance is not verified, so whether a separate staging project is possible without paying is **unresolved** | CLI `projects list` | Unresolved |

## What this means
1. **Backups and deletion.** With no provider backups, deleting an account copy leaves no provider backup copy of it. That is better for erasure and worse for durability. Note for the reviewer: this fact changes the day the plan changes. If the project moves to Pro, backups for up to 7 days appear and the deletion disclosure must change. No timing statement is made now.
2. **Durability.** Without backups, a provider incident, a bad migration or an accidental delete cannot be recovered from a provider backup. For a feature whose promise is *continuity*, that is the main plan-related weakness. Mitigation available at no cost: the verified export (device file) is a person-held copy; a nightly logical dump is not set up and would itself need privacy review.
3. **Pausing.** A paused project makes sign-in and backup unavailable. The app already shows "Backup cannot be checked" and keeps practice on the device, never "empty". Whether a 7-day lull is plausible depends on beta activity; sign-in and the daily beta emails currently make it unlikely, but it is a risk for a quiet period. It also affects Mirar's current login, independent of this feature.
4. **Logs.** One-day retention means the dashboard cannot answer the historical admin-endpoint log review for anything older than a day. That separate release blocker therefore needs a different evidence source (for example an earlier export or provider support) or an explicit decision to accept the gap. It is not made worse by this feature.
5. **Region.** Data would sit in South Korea. Cross-border transfer and notice are questions for the reviewer (packet §9).
6. **Postgres version.** My SQL tests ran on Postgres 16.4 (in-memory). The project runs 17. Before any G4, the migration must be exercised on 17 (a throwaway local Postgres 17, not this project).

## Is an upgrade necessary? (verified answer so far)
- **Not necessary to finish review and local work.** Nothing needs the plan until G4.
- **Likely worth it before real user history is stored** because of: no backups (durability), pausing, and one-day logs. These are the three facts you asked me to verify; all three are weak on Free.
- **Possibly needed earlier** if a separate staging project is wanted and the Free allowance is exhausted (unresolved).
- A cost of "from $25/month" is the provider's published starting price for Pro; I have not checked exact billing for this organisation. **No purchase or change has been made or requested.**

## Unresolved questions (to resolve at dashboard level or with provider support, read-only)
1. What exactly happens to data and to restorability when the project is paused, and for how long can it be restored?
2. Is a second Free project allowed in this organisation for staging, or does the current second project use the allowance?
3. Current database size and request volume (to confirm headroom; likely trivial).
4. Provider processing terms: data-processing agreement, sub-processors, any transfer mechanism for Seoul hosting.
5. Whether the provider keeps any copy of deleted rows beyond backups (for example write-ahead log segments) and for how long. Not stated in the pages I read.
6. Which of the provider's own administrators can access project data and under what policy (for the "who can see it" disclosure).

## Decision of 15 October (later): Supabase Pro is deferred
Development continues on the Free plan. Consequences, so nothing is promised that the platform cannot carry:

| We must **not** promise or release (under the Free plan) | Why |
|---|---|
| "Your practice is safe / backed up" as a guarantee, or restore after a provider incident | No provider backups; a bad migration or an incident is unrecoverable from the provider |
| Account-history backup for real people (G4 stays blocked) | Durability, review and consent gates are not met |
| Availability or uptime commitments of any kind | Free projects can be paused after 7 days of low activity; no SLA |
| Fast investigation of incidents or abuse | 1 day of log retention |
| Retention or deletion-timing statements | Provider facts and legal review are not complete |
| Cross-device continuity as a paid benefit | Practice is device-local; the only protection is a person-held file, which works only where the confirming save picker exists |
| Reminders that depend on the project being awake | A paused project sends nothing; see the masterplan |

What can still be responsibly offered: device-local practice with a clear statement that clearing the browser or signing out removes it, the verified file export (where available), and honest copy about both.

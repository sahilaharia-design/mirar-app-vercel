# Paid-product safeguards: export versus recovery, and durable payment and entitlement records

**Date:** 18 October 2026. **Status:** analysis and proposal only. Nothing is implemented; Cashfree is not integrated; Supabase and production are untouched.

## 1. The gap between file export and recovery (flag for paying customers)
| Capability | What exists | What it is not |
|---|---|---|
| Verified file export | Built, tested, flag-gated (`EXPO_PUBLIC_HISTORY_EXPORT`). It re-reads and validates the file and requires a confirming saver. The only confirming saver is the browser File System Access picker (`showSaveFilePicker`) | Not a backup. A file the person must keep safe |
| Import / restore from a file | **Not built.** `importJournal` exists as a validator only; no screen, no replay-into-app path, no conflict handling, no tests of restoring a real device | Nothing can be restored from the file today |
| Account backup | Simulated only (in-memory stub); G4 blocked; Supabase Free has no provider backups | Not available to anyone |
So a paying customer who clears their browser, changes phone, or signs out has **no recovery path at all today**, and a saved file would not help them.
**Reach.** The picker is not offered by every browser. As I understand it, it is a desktop-Chromium feature and is absent on Android Chrome, iOS and Firefox. I have **not** verified this on real devices. For an India-first, mobile-heavy audience that likely means *export is unavailable for most users*, so the controls that require a verified export (clearing the device, combined deletion) are also unavailable to them, and they rely on sign-out clearing the device without export.
**Rules until recovery exists:**
1. Never describe the file as "backup", "restore" or "safe copy". Say "a readable copy of your history" and, where unavailable, say plainly it cannot be saved here.
2. Paid copy states: *your practice lives on this device; clearing the browser or signing out removes it*.
3. **P0 decision before the first charge:** either (a) build and test import (restore into an empty device, conflict handling, replay equality with the engine, malicious-file refusal, real-device test), or (b) ship without any recovery promise and with the sign-out and storage warnings. Option (b) is a refund and churn risk; option (a) is the smaller, cheaper fix than paid backup.
4. Import is approved in principle, disabled until implemented and tested (founder, 15 October).

## 2. Keep trial and paid records separate
| Record | Role | Loss means | Recoverable from |
|---|---|---|---|
| `entitlement` (E1, trial) | Trial clock and comps | A running trial restarts at worst | Audit events; manual admin extension |
| **Future `membership`** (paid) | What the person has paid for and until when | A paying person is locked out or a lapsed person has access | **Cashfree**, the system of record |
| Future `billing_event` (append-only) | Idempotent webhook ledger | Double-processing or gaps | Cashfree event/payment history |
Access is the **derived** answer `comped OR membership active OR trial active`, computed by a function; no table holds a single "has access" boolean that billing and trial both write.

## 3. Most economical responsible architecture for durable payment and entitlement recovery
Principle: **do not make Supabase Free the only copy of anything that costs a customer money.** Four layers, all at ₹0 of new recurring cost:
1. **Cashfree is the source of truth for payment state.** Create each subscription with the Mirar account id as the customer reference, so a membership can be rebuilt from the gateway alone (customer → subscriptions → payments → status). The `membership` table is a cache of that, never the only record.
2. **Idempotent, ordered webhook handling plus a daily reconciliation job.** Each event is keyed by the gateway's own ids and stored once; a daily job compares every non-terminal local membership with the gateway's API and repairs differences (and records the repair). This also detects missed webhooks.
3. **Rebuild procedure (documented and rehearsed before launch):** if the membership table is lost or wrong, run reconciliation across all gateway customers to recreate rows, then re-derive access. Expected cost: minutes, no data loss for paid status. The trial table is recreated as `new` (acceptable; a minority may get a new trial, and the audit log can limit it).
4. **A small second copy outside Supabase, minimal and free:** an append-only ledger of *billing events only* (event id, account id, plan, amount, status, timestamps; no email, no practice data) mirrored to a founder-owned free store (for example a private Google Sheet via the existing Apps Script habit, or a private repository file). It exists for audit, tax and dispute reconstruction, not for serving access. It needs its own privacy line in the policy and counsel's view on the customer id it holds.
Add on a **trigger, not a date:** move the project to Supabase Pro (daily backups, longer logs, no pausing) when the first of these occurs: paying members exceed a number the founder sets (I suggest a few dozen, where monthly revenue is several times the ~$25 cost), or any customer-visible durability promise is wanted. Until then the above is the responsible minimum.
**Also needed regardless of plan:** the paid entitlement read must fail *safe and calm*: if Supabase is paused or down, a paying person keeps cached access within a bounded allowance (the same 72 h / 3-rep model, with a longer paid-period allowance to be decided) and history/export/deletion stay available; no paying person is silently locked out by our outage.

## 4. What this means for scope
- Export is a priority but **not** a substitute for recovery; do not market it as one.
- Import (or an explicit "no recovery" product statement) is a launch gate for charging.
- No paid-membership storage in the E1 tables; billing gets its own contract, its own migration approval, and the reconciliation job before any real payment.

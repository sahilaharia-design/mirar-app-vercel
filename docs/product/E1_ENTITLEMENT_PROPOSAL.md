# E1 implementation proposal: server-authoritative trial entitlement

**Date:** 15 October 2026; updated 18 October. **Status: PROPOSAL. Nothing has been applied to Supabase or any persistent database.** On the founder's 17 October approval the SQL was run on disposable local databases only (in-memory PGlite 16.4 and a throwaway native PostgreSQL 17.5): 166 checks pass. One amendment was made (audit event on admin-created rows); see `docs/product/E1_LOCAL_SQL_RESULTS.md` for targets, commands, results and the diff. The contract it implements is `docs/product/TRIAL_ENTITLEMENT_CONTRACT.md` v1.0. The reference model that mirrors its logic passes 63 local checks (`scripts/entitlement/entitlement.test.ts`), but a model passing is not the SQL passing.

## 1. What E1 is, and what approving it means
**E1 = approval of the exact SQL text below and permission to run it, for the first time, on a throwaway in-memory Postgres** (using `scripts/entitlement/entitlement-sql.test.ts`, already written and unrun), then on a real local Postgres 17. **It does not approve applying anything to Supabase** (that is E2, a separate approval with test accounts only), any client change (E4), disclosure text (E3) or production (E5). Until you say E1 is approved I will not run the SQL anywhere.

## 2. Files
| File | Purpose | Applied? |
|---|---|---|
| `docs/proposed/entitlement/001_entitlement.sql` | Creates two tables, one trigger, five functions, and all privileges | **No** |
| `docs/proposed/entitlement/002_rollback.sql` | Removes exactly what 001 creates | **No** |
| `docs/proposed/entitlement/003_legacy_self_grant_PROPOSAL_ONLY.sql` | **E1b**, optional and separate: makes the legacy `trial_tracking` and `subscriptions` policies read-only for clients | **No**, and not part of E1 |
| `scripts/entitlement/entitlement-sql.test.ts` | 22 checks to run on the throwaway database after E1 approval | **Not run** |
All live outside `supabase/migrations` so no tool applies them by accident.

## 3. Objects created (all in `public`; nothing existing is altered)
- **`entitlement`** (one row per account): `user_id` (PK, references `auth.users` ON DELETE CASCADE), `state` (new | trialing | trial_expired | comped), `cohort` (standard | internal), `trial_started_at`, `trial_ends_at`, `version`, timestamps. Constraints: start and end are both set or both null; `trial_ends_at ≥ trial_started_at + 348 hours`; `trialing` and `trial_expired` need a start; `new` has none.
- **`entitlement_event`** (append-only audit): `kind` (created | trial_started | trial_expired | admin_comp | admin_uncomp | admin_extend), `source` (system | admin), optional `hours` (1 to 8760) and `reason` (up to 200 characters; **required** for admin events). No free-form JSON, no practice content, no IP, no device data.
- **Trigger `entitlement_guard`** (update only): `trial_started_at` is immutable once set; `trial_ends_at` can never move earlier; `version` and `updated_at` maintained.
- **Functions** (all `SECURITY DEFINER` where they write, `search_path` fixed to empty, every reference schema-qualified, time only from `now()`):
  - `entitlement_get()` → jsonb: creates the caller's row if missing (event `created`), records expiry once (event `trial_expired`), returns state, the two instants, the server clock and version.
  - `entitlement_first_rep_completed()` → jsonb: **no arguments**; starts the trial only from `new`; idempotent.
  - `entitlement_admin(user, action, hours, reason)` → jsonb: `comp`, `uncomp`, `extend`; **service role only**; reason mandatory.
  - `entitlement_json(row)` and `entitlement_guard()`: internal, executable by no client role.

## 4. Security model
| Threat | Control |
|---|---|
| A client edits its own entitlement | No table privileges for `anon`, `authenticated` or `public`; RLS enabled with no policies; writes only inside definer functions |
| A client starts a trial early, late, twice, or for someone else | The function takes no arguments, uses `auth.uid()` only, stamps the database clock, and is idempotent; `trial_started_at` is immutable |
| A client sends practice content with the signal | The function has no parameters; there is nowhere to put it |
| Anonymous or logged-out calls | `anon` has no execute privilege; both client functions raise `not authenticated` if `auth.uid()` is null |
| Default-privilege hazard (Supabase grants EXECUTE on new functions to client roles; found while testing the backup draft) | Every function is revoked **by name** from `public`, `anon`, `authenticated` and `service_role`, then exactly the intended grants are made |
| A client calls the admin function | EXECUTE granted to `service_role` only, and the body also requires `auth.role() = 'service_role'` and a reason |
| Search-path hijack in definer functions | `set search_path = ''` and schema-qualified names throughout |
| Race between two simultaneous signals | `SELECT … FOR UPDATE` on the account's row inside the function |
| Moving the end earlier or rewriting the start (including by the owner) | Trigger refuses; check constraints refuse inconsistent rows |
| Someone else's row visible through a function | Functions read only `user_id = auth.uid()` |
| Legacy tables used as a source of truth | Not referenced by anything (static test); E1b separately removes their client write policies |
| Rate abuse of reads | Reads are cheap and write only on a state transition; there is no rate limit on Supabase Free, so this is accepted and monitored |
| Orphaned personal data after account deletion | Both tables cascade from `auth.users` |

**Why not `FORCE ROW LEVEL SECURITY`:** with no policies it would lock out the owner role the definer functions run as. Isolation here comes from the missing table privileges plus the function design, with RLS-on as a second layer.

## 5. What the app does with it (client, E4; not part of E1)
Calls `entitlement_get()` at sign-in, launch and at most daily, and `entitlement_first_rep_completed()` once when the first rep completes. Everything else (offline allowances, counts, notices) is the contract's client rules, specified by the tested model.

## 6. Data minimisation and retention
Stored per account: state, two timestamps, version, cohort, and at most a handful of audit events (created, trial_started, trial_expired, admin actions). No email, no content, no device information. Deleted with the account. The first-completion timestamp is the only practice-derived fact; its disclosure is E3.

## 7. Costs and platform fit
No recurring cost; no scheduled job (so nothing depends on cron, and nothing runs while the project is paused). Row size is negligible. **Free-plan constraints that matter:** if the project pauses or is down, `entitlement_get()` fails; the contract's bounded allowance (72 h and 3 reps) then applies and history/export/deletion stay available. No backups on Free: an entitlement row lost in an incident could not be restored from a provider backup, so it would be recreated as `new` (a person who had a running trial would restart it). That is the same durability limit documented in `G2_PROVIDER_VERIFICATION.md`; the audit events help reconstruct it manually. This is acceptable for a trial entitlement and **not** acceptable for paid-membership records, which the billing contract must address separately.

## 8. Verification plan after E1 approval (nothing run yet)
1. Run `entitlement-sql.test.ts` on the in-memory Postgres (PGlite, Postgres 16): privileges, behaviour, expiry with back-dated rows, immutability, constraints, admin, deletion cascade, rollback.
2. Re-run on a **real local Postgres 17** (the Supabase project is 17.6): syntax and behaviour parity, including `generated always as identity` and `auth.role()`.
3. Cross-check the SQL against the model's vectors: 348 h, boundary instants, idempotence.
4. Report results; only then request E2.
Open points to confirm read-only before E2: that `auth.role()` and `auth.uid()` behave as assumed in the project, that the `postgres` owner can execute the definer bodies (no `FORCE RLS`), and the legacy-table facts in section 9.

## 9. E1b (optional, separate): legacy self-grant policies
Migration 005 left `FOR ALL USING (user_id = auth.uid())` policies on `trial_tracking` and `subscriptions`. No client code in the repository references either table (a test asserts this), and the new gate never reads them, so this is not a hole in the new design. It is a trap for any future code that trusts them. E1b replaces both with select-only policies. **Before approving E1b** confirm (read-only) that no deployed client writes to them; the service role used by the legacy `trial-lifecycle` function bypasses RLS and is unaffected.

## 10. Rollback
`002_rollback.sql` drops the functions, then the tables (events first), then the trigger function. It deletes every entitlement row and event. It touches no legacy table. Before E5 a rollback rehearsal is part of the release gate.

## 11. What I need from you
- Say whether **E1 is approved** (the SQL text as written, and the first run on a throwaway in-memory database, then a local Postgres 17).
- Say whether **E1b** may be prepared for its own review.
- Confirm the three constants (72 h, 72 h, 3 reps) are acceptable.
Nothing else will happen until then. Cashfree, email sending, Supabase, production and Codex's continuity work remain untouched.

## 12. Supabase Data API grants (30 October 2026)
Compatible with no change: the tables have no client grants (revoked explicitly) and the two client functions are granted explicitly. Verified from an empty database under legacy, new and strict default-privilege regimes (`scripts/release/grant-regime-check.ts`, 433 assertions, PGlite 16 and native PostgreSQL 17.5, disposable). Checklist and the `service_role` note: `docs/release/RELEASE_RUNBOOK.md` §6. Nothing applied to Supabase.

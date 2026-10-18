# E1 local SQL validation: results (disposable databases only)

**Date:** 17–18 October 2026. **Scope approved by the founder:** test `docs/proposed/entitlement/001_entitlement.sql` and `002_rollback.sql` on disposable local databases only. **Supabase, production and every persistent database were not touched.** No connection string, `DATABASE_URL` or `SUPABASE_*` variable is read by the test.

## 1. Targets and the guard (reviewed before running)
| Target | What it is | Isolation |
|---|---|---|
| PGlite 0.2.17 | In-memory PostgreSQL **16.4** inside the test process | No files, no network, gone when the process ends |
| `embedded-postgres` 17.5.0-beta.15 | A real native PostgreSQL **17.5** started by the test | New temp data directory (`mirar-e1-pg17-*` under the OS temp dir), listening on **127.0.0.1 only**, random free port ≥ 20000, random superuser password that never leaves the process, database `mirar_e1_test_*`; cluster and directory destroyed in `finally` (verified: no postgres process and no leftover directory afterwards) |
`assertDisposable()` throws unless the target is one of those two shapes. Static guards in the test assert: no environment variable other than `PGLITE_DIR` and `PG17_DIR` is read; the SQL files contain no `DROP DATABASE`, `ALTER SYSTEM`, `CREATE EXTENSION`, `CREATE ROLE` or `\connect`; the rollback drops only `entitlement*` objects. The two packages were installed in a separate scratchpad directory outside the repository, not added to project dependencies.

## 2. Command
```bash
PGLITE_DIR=<scratch>/pglite PG17_DIR=<scratch>/pg17 npx tsx scripts/entitlement/entitlement-sql.test.ts
```
Each target is run twice: the migration owned by a **superuser**, and by a **non-superuser role without BYPASSRLS** (a stricter stand-in for a hosted project's owner). E1b (legacy-policy hardening) is exercised once per target on throwaway copies of the two legacy tables carrying the original migration-005 policies.

## 3. Result
**166 checks, 0 failures** across: PGlite superuser, PGlite non-superuser owner, native PostgreSQL 17.5 superuser, native 17.5 non-superuser owner, plus E1b on both targets. The 63-check reference model also still passes (`scripts/entitlement/entitlement.test.ts`).
| Area | Checked |
|---|---|
| Permissions | A full EXECUTE matrix (anon, authenticated, service_role × five functions) equals the design; no `PUBLIC` grant; no client privilege on either table; RLS on with no policy; definer functions have a fixed empty `search_path`; every direct table read/write by a client is refused; anon cannot call anything |
| Authentication context | No subject refused; subject read from PostgREST-style claims JSON and the legacy key; no parameter can name another user; a token that *claims* `service_role` but runs as `authenticated` cannot call admin; the `service_role` DB role without the claim is refused by the function body |
| Behaviour | New account has no clock; the first completion sets start and end exactly 348 h apart; server clock returned for calibration; repeats change nothing; poisoned legacy rows have no effect; the function takes no arguments |
| Concurrency (native only) | 16 simultaneous first-completion signals from one new account → no error, one start instant, one `trial_started`, one `created`; a creation race of 16 mixed reads/signals → one row, one event of each kind; 16 simultaneous reads after the end → expiry recorded exactly once |
| Expiry | Back-dated rows report `trial_expired` once; a real 3-second boundary flips from trialing to expired by the database clock; later signals change nothing |
| Integrity | Start immutable (even for the owner); end cannot move earlier; inconsistent rows refused by constraints |
| Admin | Extend/comp/uncomp work, need the service role and a reason, and log hours/reason; refused calls leave nothing behind |
| Differential vs model | 24 scripted operations give identical state, trial length and version on the SQL and the model; event sequences identical per account (after the fix below) |
| Deletion and rollback | Account deletion cascades both tables; re-running the create script fails loudly; rollback removes every object, leaves legacy tables alone, and can run twice |
| E1b | Before: a signed-in user can set their own subscription row to `active`. After: update/insert/delete refused, own rows still readable, other users' rows not readable, service role still writes, rollback restores the original behaviour |

## 4. Discrepancies found, and the amendments
1. **Audit gap in `entitlement_admin` (SQL amended).** An admin action on an account with no row created the row without a `created` event, unlike `entitlement_get` and `entitlement_first_rep_completed`. The differential test caught it on every target.
   ```diff
   @@ entitlement_admin
      insert into public.entitlement (user_id) values (p_user) on conflict (user_id) do nothing;
   +  if found then insert into public.entitlement_event (user_id, kind, source) values (p_user, 'created', 'system'); end if;
      select * into r from public.entitlement where user_id = p_user for update;
   ```
2. **Model was not atomic (model amended, not the SQL).** A refused admin `extend` before a start left a row and a `created` event in the model; in SQL the whole call rolls back. The model now validates before creating anything.
3. **Test-harness fixes only:** a leftover legacy JWT key leaked between sessions in the E1b suite; a failed multi-statement script left an aborted transaction. No SQL change.
No other discrepancy. The SQL needed no other change for PostgreSQL 17.5 (identity columns, `aclexplode`, `auth.role()` style functions all behaved).

## 5. Provisional constants
72 h pending, 72 h cached and 3 offline reps live only in the client reference model (`scripts/entitlement/model.ts`); **the SQL contains none of them**. They remain provisional and are unaffected by these results.

## 6. What this does not prove
- It ran on PostgreSQL 17.5, not the project's 17.6, and on an emulated Supabase surface (`auth.uid()`, `auth.role()`, `anon`/`authenticated`/`service_role`). Whether the hosted `postgres` owner and grants behave identically is confirmed only at E2.
- Single-machine concurrency (16 sessions) is not load testing.
- Nothing was applied to Supabase, so no migration-history, extension, PostgREST or dashboard behaviour was exercised.
E2 (staging with test accounts) remains a separate approval.

# Supabase remediation checklist (dashboard)

Project `jranpiyhluyuqigqfyhn`. Built from your read-only findings plus my independent code check. **I changed nothing and called nothing.** Perform these in the Supabase dashboard (SQL editor, Edge Functions, Authentication). Nothing here is destructive until the steps marked **[APPROVE]**.

**Rules for whoever executes this (including the browser extension):** never `select` the `command` column of `cron.job` or `cron.job_run_details.return_message`; never display, copy or log a secret value; generate any new secret inside the page and paste it straight into the dashboard field without echoing it. If any result ever shows a credential, stop, treat it as compromised, and tell me only that it happened.

## What changed in my inventory (reconciled to the 14 deployed functions)
- The repository has **16** functions (I said 17 earlier; that was a miscount). **14 are deployed.** Not deployed: `email-nudge` and `whatsapp-nudge`.
- So **no email or WhatsApp nudge can run**, and **`NUDGE_SECRET` being missing is irrelevant**: it is read only by those two functions, and none of the four active jobs calls them (confirm with the boolean query in step 2).
- My script's `delete` mode targets only `admin-analytics` and `admin-user-list`, both deployed. It is still correct. It does not touch jobs.
- The 8 flagged functions are all deployed. `send-notification` is **not** a webhook target (no webhooks exist) and no function or job in the repository calls it.

| Deployed function | Belongs to | Auth in code | Verdict |
|---|---|---|---|
| `admin-user-list`, `admin-analytics` | retired admin page | `ADMIN_SECRET` (secret leaked) | **Retire now** (step 6) |
| `trial-lifecycle` | v1 trials; sends nothing; touches `trial_tracking`, `user_state` | `CRON_SECRET` gate | Retire with its two jobs (later) |
| `daily-reminder` | v1 push reminders | **none** | Retire with its two jobs (later) |
| `send-notification` | v1 report flow (push and email to the user's own address) | none; needs a user id | Delete (later) |
| `process-checkin`, `select-daily-question` | v1 check-in entry points | JWT verified | Delete (later) |
| `generate-mirror-insight`, `update-identity-vector`, `check-unlocks`, `sync-user-state`, `generate-weekly-signal`, `generate-report`, `compute-stage-scores` | v1 pipeline | none; service role | Delete (later) |

All 14 have their source in the repository, so any deletion can be undone with `supabase functions deploy <name>`.

## The four active jobs (all v1)
| Job | Calls (by name) | v1 purpose | Recommendation |
|---|---|---|---|
| `mirar-trial-lifecycle` 00:05 UTC | `trial-lifecycle` | v1 trial counters | **Pause**, later remove |
| `trial-lifecycle-daily` 02:00 UTC | `trial-lifecycle` | same job, a **duplicate** | **Pause**, later remove |
| `daily-reminder-8am-utc` 08:00 UTC | `daily-reminder` | v1 "complete today's check-in" push | **Pause**, later remove |
| `daily-reminder` 13:30 UTC | `daily-reminder` | same, a **second daily push** with an **empty** Bearer header | **Pause**, later remove |

Why all four: v2 has no trials and no daily check-in. `daily-reminder` loops over every `cycles` row (v2 account setup still creates one) and treats anyone with no v1 `responses` today as "not done", so it would nudge anyone with a stored push token every day, twice. The web app registers no push tokens (it returns early on web), so only holders of tokens from older native builds could be reached. The empty Bearer header does not matter: the function has no auth gate and its JWT check is off, so it runs for anyone, with or without a header.

## A. URGENT CONTAINMENT (in this order)

**Step 1. Record, then pause. Reversible. Rotate nothing yet.**
Record (fingerprints only, no secrets):
```sql
select jobid, jobname, schedule, active, md5(command) as command_md5 from cron.job order by jobid;
```
Save the output as your configuration history. Then pause by name:
```sql
select cron.alter_job(jobid, active := false) from cron.job
where jobname in ('mirar-trial-lifecycle','trial-lifecycle-daily','daily-reminder','daily-reminder-8am-utc');
```
(Or Dashboard > Integrations > Cron > toggle each off.) Pausing keeps every definition, so it is fully reversible with `active := true`.
**Why first:** it stops the duplicate runs and any user pushes, and it removes every dependency on the old hardcoded values. After this, rotating a credential **cannot break an active job**.

**Step 2. Learn what kind of credential each job holds, without printing it.**
```sql
with t as (
  select jobname,
    (regexp_match(command, 'Bearer (eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)'))[1] as tok,
    command
  from cron.job
  where jobname in ('mirar-trial-lifecycle','trial-lifecycle-daily','daily-reminder','daily-reminder-8am-utc')
)
select jobname,
  tok is not null                         as has_jwt_bearer,
  case when tok is null then null else
    convert_from(decode(rpad(translate(split_part(tok,'.',2),'-_','+/'),
      ((length(split_part(tok,'.',2))+3)/4)*4,'='),'base64'),'utf8')::json ->> 'role' end as jwt_role,
  command ilike '%x-cron-secret%'         as uses_cron_secret_header,
  command ~ 'Bearer\s*[''"]'              as empty_bearer,
  command ~* 'sb_secret_'                 as has_new_secret_key,
  command ~* 'sb_publishable_'            as has_publishable_key,
  command ilike '%trial-lifecycle%'       as calls_trial,
  command ilike '%daily-reminder%'        as calls_reminder,
  command ilike '%nudge%'                 as calls_nudge,
  command ilike '%admin-%'                as calls_admin
from t;
```
This outputs only the word in `jwt_role` (`anon` or `service_role`) and true/false flags. Expect `calls_nudge = false` and `calls_admin = false` on every row.

**Step 3. Rotate by what step 2 found. Do only what applies.**
| Finding | What it means | Action | Impact |
|---|---|---|---|
| `jwt_role = anon` | the public key; not a secret | none | none |
| `uses_cron_secret_header = true` | the `CRON_SECRET` value is compromised | Edge Functions > Secrets: **replace** `CRON_SECRET` with a new random value | only `trial-lifecycle` reads it; its jobs are paused, so nothing breaks |
| `jwt_role = service_role` or `has_new_secret_key = true` | **critical:** a full-access database key was exposed | Settings > API Keys: **regenerate the secret / service-role key** (do not use "legacy JWT secret" rotation, see below). Then tell me. | Supabase supplies the key to Edge Functions itself, but check afterwards that a deployed function still starts. Anything of yours using the old key outside Supabase (none known) would break. The option exists only if the project has the newer API-key system; otherwise tell me before touching the JWT secret. |
| `empty_bearer = true` | an empty header, no credential at all | none (it only shows the function was open) | none |

**Do not rotate the legacy JWT secret** unless you must: it also changes the public `anon` key, which is built into the live app, so the app would stop working until its Vercel variable is updated and it is redeployed. I will do that redeploy if it ever becomes necessary.
If step 2 shows **service_role**, treat it as an incident: tell me, and also review who could have seen it.

**Step 4. [APPROVE] Rotate `ADMIN_SECRET`.** Edge Functions > Secrets: replace `ADMIN_SECRET` (do not delete it: the deployed admin code skips its check when the secret is unset). Confirm the entry shows "updated just now".

**Step 5. [APPROVE] Retire the admin functions.** Edge Functions > `admin-user-list` > delete; then `admin-analytics` > delete. Rotate before deleting, in that order. If a delete fails, stop: the functions stay gated by the new, unknown secret.

**Step 6. Verify (I do this; you only report you finished).** I probe both admin endpoints with no credential and a dummy credential and report status codes only. Expect **404** for both. I do not call any other function. For the jobs, run:
```sql
select jobname, active from cron.job order by jobname;
```
Expect `active = false` for all four. No function is triggered to test it.

## B. LATER CLEANUP (after A; each needs your approval; none urgent)
1. [APPROVE] Remove the paused jobs, so the old hardcoded values leave the database:
   `select cron.unschedule(jobname) from cron.job where jobname in ('mirar-trial-lifecycle','trial-lifecycle-daily','daily-reminder-8am-utc','daily-reminder');`
   (Keep the Step 1 fingerprint output as history. Do this only after Step 3.)
2. [APPROVE] Delete, in this order: `select-daily-question`, `process-checkin`; then `generate-mirror-insight`, `update-identity-vector`, `check-unlocks`, `sync-user-state`, `generate-weekly-signal`, `generate-report`; then `compute-stage-scores`, `send-notification`, `daily-reminder`, `trial-lifecycle`. Before this, in Logs, confirm none shows recent traffic. Callers go first so nothing triggers a downstream function mid-removal.
3. Do **not** create `NUDGE_SECRET` and do not redeploy the nudge functions.
4. If you ever want scheduled jobs again, create them with the secret in Supabase Vault, never hardcoded in the job.

## C. FIRST-TIME SIGNUP (real-auth staging)
**Exact callback path.** The web app asks for `<origin>/auth/callback`. For staging that is **`https://mirar-v2-review-real.vercel.app/auth/callback`** (from `stores/auth-store.ts`).
**Minimum change.** Authentication > URL Configuration > Redirect URLs: add exactly
`https://mirar-v2-review-real.vercel.app/auth/callback`
No wildcard. Leave the Site URL as `https://mirar-app.vercel.app`. Your current list (`mirar://`, `http://localhost:8081`, `https://mirar-app.vercel.app`) has no staging entry, so without this the link would fall back to the Site URL and open production's older build.
**Optional, recommended:** also add `https://mirar-app.vercel.app/auth/callback`. Your list holds the bare origin only, while the app requests `/auth/callback`; whether Supabase treats the bare entry as a match is not something I can confirm. The email link shows which URL Supabase accepted in its `redirect_to` parameter. If it shows the bare origin, production sign-in currently lands at the site root instead of the callback (it still works because the app also handles that), and the explicit entry makes the intended route work.
Then run the signup test (steps in `CLEANUP_PLAN.md` section 7, starting at `https://mirar-v2-review-real.vercel.app/login`). Only opening the email, clicking the link, and the later sign-in-again email need your inbox.

## D. Do messages or the Privacy page need a correction?
- **Email and WhatsApp:** none can be sent. Both nudge functions are not deployed, and none of the four jobs calls them. `trial-lifecycle` sends nothing.
- **Push:** only `daily-reminder`, to legacy native-app token holders, twice a day while the two jobs were active. Paused in Step 1.
- **`send-notification`** (push and email through a mail provider, to the user's own address) is not scheduled and has no webhook. It can only be triggered by a direct call that includes a user id.
- **Privacy page:** correct for web users as written. One small, optional factual refinement once the jobs are removed: mention that notification settings from earlier versions may also remain in older records. Not urgent; I will not change the live page until you ask.

## E. Production release stays blocked until
Step 3 and Steps 4 to 6 done and verified; the log review from `CLEANUP_PLAN.md` section 6 reported; the signup test passes on the real-auth staging build; Redirect URLs confirmed; `scripts/release/preflight-app.sh` passes. Rollback remains the current production deployment `mirar-7rphdq5qg-…`.

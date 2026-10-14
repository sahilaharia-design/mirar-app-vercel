# Supabase remediation checklist (dashboard)

Project `jranpiyhluyuqigqfyhn`. Built from your read-only findings plus my independent code check. **I changed nothing and called nothing.** Perform these in the Supabase dashboard (SQL editor, Edge Functions, Authentication). Nothing here is destructive until the steps marked **[APPROVE]**.

**Rules for whoever executes this (including the browser extension):** never `select` the `command` column of `cron.job` or `cron.job_run_details.return_message`; never display, copy or log a secret value; generate any new secret inside the page and paste it straight into the dashboard field without echoing it. If any result ever shows a credential, stop, treat it as compromised, and tell me only that it happened.

## Status (updated 14 October 2026; owner reports, with what I independently verified marked)

| Item | Status |
|---|---|
| Four v1 cron jobs paused (`active = false`, verified in SQL) | **Done** |
| Credential types classified: two cron-secret-header jobs, one empty-header job, one anon-key job; **no service-role JWT or sb_secret key** | **Done** (no database-wide key exposure from the jobs) |
| `CRON_SECRET` rotated (digest changed, CLI "Finished supabase secrets set"; `ADMIN_SECRET` and the other digests unchanged) | **Done**: the disclosed value is invalid |
| Rotate `ADMIN_SECRET` (current digest prefix `036a3a4aa35c`) | **Done** (owner via CLI; I read the digest prefix back with `supabase secrets list`: matches) |
| Retire `admin-user-list` and `admin-analytics` | **Done and verified by me**: POST and OPTIONS to both return **404** (no credential, dummy credential); `supabase functions list` shows exactly **12** ACTIVE functions and neither admin function |
| `CRON_SECRET` digest prefix `43b107c51abc` | **Verified** by read-back (unchanged since the first rotation) |
| Temporary plaintext secret files removed from the owner's Mac | Owner-reported; not verifiable by me |
| Review historical function logs (from 18 April 2026) | **Open: not possible from the CLI** (it has no hosted-log command). Owner runs the aggregate query in section F; coverage is limited by plan retention |
| Remove the paused jobs so the old hardcoded values leave the database | Later, with approval |
| First-time signup on the real-auth staging build, and returning login | **Open** |
| Redirect URL `https://mirar-unified-real.vercel.app/auth/callback` added (replaces the earlier `mirar-v2-review-real` entry as the real-auth staging target) | **Done 14 Oct (owner-approved; applied by Claude through the owner's signed-in dashboard, one entry only).** Verified after a fresh reload: 4 redirect entries (`mirar://`, `http://localhost:8081`, `https://mirar-app.vercel.app`, `https://mirar-unified-real.vercel.app/auth/callback`); Site URL unchanged `https://mirar-app.vercel.app`. No other setting touched. |

Production promotion of the v2 app stays blocked until the open items pass.

## What changed in my inventory (reconciled to the 14 deployed functions)
- The repository has **16** functions (I said 17 earlier; that was a miscount). **12 are deployed now** (14 before the two admin functions were deleted on 14 October). Not deployed: `email-nudge` and `whatsapp-nudge`.
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

## F. Historical log review (owner, in the dashboard; I cannot read hosted logs)
The CLI has no hosted-log command, and I will not extract the stored access token to call the Management API. Run in Dashboard > Logs > Edge Functions (Logs Explorer). Report only the numbers, never row contents.

1. **How far back the logs go** (this decides whether April 18 is covered):
```sql
select min(timestamp) as earliest, max(timestamp) as latest, count(*) as rows_total from function_edge_logs
```
2. **Aggregate of both admin endpoints** (a 200 means the correct secret was supplied; 404 after deletion is expected and harmless):
```sql
select
  r.pathname as path,
  count(*) as calls,
  countif(resp.status_code = 200) as ok_200,
  countif(resp.status_code = 401) as unauthorized_401,
  countif(resp.status_code >= 500) as errors_5xx,
  countif(resp.status_code = 404) as not_found_404,
  min(timestamp) as first_seen, max(timestamp) as last_seen
from function_edge_logs
cross join unnest(metadata) as m
cross join unnest(m.request) as r
cross join unnest(m.response) as resp
where r.pathname like '%admin-user-list%' or r.pathname like '%admin-analytics%'
group by path
```
3. **Only if `ok_200` is above 0:** list those rows (time, path, user agent, status; add the IP column only if you need it) and stop; do not paste addresses or emails to me. An unexplained 200 on `admin-user-list` means user emails and ids were returned: treat it as an incident and take advice on notification (a question for a qualified adviser, not for me).
4. Check whether a **log drain** or an earlier export exists (Dashboard > Project Settings > Log Drains); that is the only source that could cover dates beyond plan retention.

**How to report findings honestly.** Three separate statements: (a) the earliest log available; (b) what the logs show inside that window; (c) the dates before it, which are *unknown*, not clear. The old secret was in public browser bundles for months, so for any period without logs the safe assumption is that the endpoints could have been called successfully. Retention differs by plan; if the earliest row is much later than 18 April, April 18 to that date is unreviewable.

## G. Real-auth staging redirect (APPLIED 14 October with approval; kept here as the record)
Applied exactly as below and verified. Dashboard > Authentication > URL Configuration > **Redirect URLs** > Add URL, exactly:
```
https://mirar-unified-real.vercel.app/auth/callback
```
No wildcard. Do **not** change Site URL (stays `https://mirar-app.vercel.app`), providers, email templates, or any other setting. Existing entries stay. After the test, remove this entry if you prefer; production sign-in is unaffected either way.

**Why it is needed.** The web app asks Supabase to return to `<its own origin>/auth/callback` (`stores/auth-store.ts`). Without this entry Supabase falls back to the Site URL, so the email link would open production's older build instead of the staging build.
**What it does not do.** It does not open the staging build to the public: the alias remains Vercel-protected, so the person clicking the email link must also be signed in to Vercel in that browser, or they will see a Vercel login before the callback runs.

### Read-only state I verified (no email sent, nothing changed)
Public auth settings: email provider only; sign-up enabled; auto-confirm off. The staging build requests `https://mirar-unified-real.vercel.app/auth/callback` (from its own origin). `mirar-unified-real` is a real-auth build: no mock user, no fixture loader.

### Real-auth validation plan (after you approve and add the entry)
Run in your own browser (the link returns to the browser that opens it, so I cannot observe it in mine). I will not ask for the link or any token.
1. Open the protected alias (I supply a fresh share link) and choose Enter / sign in with an email you own. Check the email's link: its `redirect_to` should be the staging callback, not production.
2. Click it in the same browser: you should land signed in on Today (onboarding for a first-time account). Note any error screen.
3. Complete today's rep, open an extra practice (Look Again or Attend), reload, confirm the unfinished practice resumes without your words.
4. Sign out: pilot and engine device data should clear. Sign in again with the same email (returning login) and confirm a clean Today with no stale pilot records.
5. Tell me what you saw (screens and wording, no URLs containing tokens). I will compare with the expected behaviour and update the gate.

### Result (14 October 2026)
Owner tested first-time signup and returning login on `mirar-unified-real`: authentication **PASS**; continuity limitations and one fixed in-memory defect are recorded in `docs/release/REAL_AUTH_TEST_RECORD.md`.

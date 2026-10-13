# Security remediation status (12 October 2026)

No secret, token or user record appears in this document. Where I probed a live endpoint I discarded the response body and recorded only the HTTP status and byte count.

## 1. What I can and cannot do
I have **no authorized Supabase access** in this environment: no CLI, no access token, no Supabase connector. So I cannot deploy, delete, rotate or read logs there. I can (and did) probe public endpoints, and I wrote a script that performs the remediation in one run for the account owner. Everything marked **YOU** needs your Supabase login.

## 2. Verified function status (live, 12 October 2026)

| Function | Deployed | No credential | Wrong credential | Anon key only |
|---|---|---|---|---|
| `admin-analytics` | yes | 401, 24 bytes | 401, 24 bytes | 401, 24 bytes |
| `admin-user-list` | yes | 401, 24 bytes | 401, 24 bytes | 401, 24 bytes |

24 bytes is `{"error":"Unauthorized"}`. So the gate is currently **active**, which also proves `ADMIN_SECRET` is **set** right now (the deployed code skips its check when the secret is unset). Nothing was returned; no data left either function. I treated both as public throughout: they require no login (`verify_jwt = false`), and `admin-user-list` uses the service role, so the old secret is the only protection.

Method safety: a nonexistent function returns 404, so a 200 on a CORS preflight means "deployed". I preflighted only functions whose code returns before running any logic, and I did not call any scheduled or bulk-action function.

## 3. Is disabling them the safest immediate action?
Rotating alone invalidates the leaked value immediately and takes a minute. **Deleting** the two functions removes the privileged endpoint entirely. Nothing uses them: the admin page was removed from the app, and the live app calls no edge function at all (the legacy callers sit in screens that v2 never renders). My recommendation is **both, in this order: rotate, then delete.** If you want an operator dashboard later, redeploy the fail-closed versions already in this repository (`mirar-integration`).

The fail-closed fix is built, parses, and passes review of the diff: an unset secret now returns 401 instead of skipping the check, and the comparison is constant-time. It is not needed if you delete the functions.

## 4. Do it (YOU), about five minutes

One-time setup:
```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref jranpiyhluyuqigqfyhn
```
Then, from the repository root:
```bash
scripts/release/secure-edge-functions.sh delete      # recommended
# or: scripts/release/secure-edge-functions.sh redeploy
```
The script: prints the `ADMIN_SECRET` digest (a hash) before and after and stops if it did not change; sets a new random value through a private temp file so it never appears on the command line or in output; deletes (or redeploys fail-closed) the two functions; then repeats the missing-credential and wrong-credential tests and prints only status codes. Expected: `401` on every line after `redeploy`, `404` after `delete`. It also reports whether `CRON_SECRET` exists.

Dashboard alternative: Edge Functions > Secrets > replace `ADMIN_SECRET`; Edge Functions > the two functions > Delete.

## 5. Investigate historical access (YOU)
The old value was in public browser bundles for months, so assume it was known. Supabase dashboard > Logs > Edge Functions (or Logs Explorer). Retention depends on your plan, so the window may not reach back that far; record what it covers.

```sql
select
  datetime(timestamp) as at,
  r.method, r.pathname, resp.status_code,
  r.headers[offset(0)].x_real_ip as ip, r.headers[offset(0)].user_agent as ua
from function_edge_logs
cross join unnest(metadata) as m
cross join unnest(m.request) as r
cross join unnest(m.response) as resp
where r.pathname like '%admin-user-list%' or r.pathname like '%admin-analytics%'
order by timestamp desc
limit 500
```
(Adjust field names if your log schema differs.) Look for **status 200** calls from IP addresses or user agents you do not recognise, and for any spike. A 200 means the correct secret was supplied. `admin-user-list` returns per-user rows including email, so an unexplained 200 is an incident. If you find one, stop and tell me; whether notification is needed is a question for a qualified adviser. I have not read any log.

## 6. `trial-lifecycle` and `CRON_SECRET`
- **Same pattern.** It runs only `if (CRON_SECRET) { check }`, so with the secret unset it is open. It is deployed. It takes the default JWT check, which the public anon key satisfies, so anyone holding the anon key could trigger it if the secret is missing.
- **Impact is low.** By its own header it decrements trial counters for active trials idempotently ("safe to re-run"), and v2 has no trials.
- **I could not verify the scheduler, so I changed nothing in production and did not probe it.** Calling it to test could run the job. No migration in the repository schedules it, so it may be driven from a dashboard cron job or an external caller.
- **YOU:** run `supabase secrets list` (or look in Edge Functions > Secrets) and tell me only whether `CRON_SECRET` exists. In SQL, `select jobid, jobname, schedule, active from cron.job;` (do **not** select the `command` column in anything you share: it can contain credentials). If `CRON_SECRET` exists, the function is gated and no change is needed. If it does not, set one **and** make the scheduler send `x-cron-secret` before I give you a fail-closed version, or delete the function (v2 has no trials).

## 7. Wider finding (needs a decision, not an architecture audit)
Eight legacy functions use the service role and read a user id from the request body, with no explicit authentication in their code: `check-unlocks`, `compute-stage-scores`, `generate-mirror-insight`, `generate-report`, `generate-weekly-signal`, `sync-user-state`, `update-identity-vector`, `send-notification`. Most are deployed (CORS-preflight 200). I did not call any of them, so I cannot say whether they are exploitable, only that nothing in their code checks who is asking. **None is used by the v2 app.** The safest assessment-free action is to delete every legacy function v2 does not need once you confirm no scheduled job calls it. I can list exactly which are scheduled if you send me the `jobname, schedule, active` rows (not commands).

## 8. Scheduled nudges may still be sending email
The repository schedules hourly jobs for `email-nudge` (and earlier `daily-reminder`, `whatsapp-nudge`), which send morning emails through a third-party mail provider and WhatsApp. If any are still active, the new Privacy page (which says Mirar sends sign-in links) is incomplete, and those messages go to users who are now in a product that no longer has that feature. Check `cron.job` (names and `active` only). Tell me what is active and I will correct the legal pages, or you can disable the jobs.

## 9. Browser exposure (verified)
`python3 scripts/release/check-public-bundle.py https://mirar-app.vercel.app` and `... https://mirar.life` both pass: every key found decodes to role `anon`, and there is no admin, service-role, demo or simulator literal. Vercel Production variables are only the Supabase URL and anon key. Both stable review aliases are login-protected.

## 10. Status summary
| Item | Status |
|---|---|
| `CRON_SECRET` rotated; four v1 cron jobs paused; no service-role key found in any job (reported 13 Oct) | **Done** (see `SUPABASE_REMEDIATION_CHECKLIST.md`) |
| Functions currently reject missing, wrong and anon credentials | **Verified** |
| Old secret still valid | **Yes until you rotate** |
| Fail-closed fix built | **Done** (not deployed; needs your login) |
| Rotation and deletion | **Waiting on you** (script ready) |
| Historical access review | **Waiting on you** (query provided) |
| `trial-lifecycle` | Open pattern, low impact, **scheduler unverified**, unchanged |
| Legacy service-role functions | Flagged, unprobed, unused by v2 |
| Bundles expose only anon key | **Verified** |

# Supabase cleanup and signup verification plan

> **Superseded in part** by `SUPABASE_REMEDIATION_CHECKLIST.md`, which reconciles this plan to the observed dashboard state: 14 deployed functions (not 17; the repository holds 16), `email-nudge` and `whatsapp-nudge` not deployed, and four active v1 cron jobs holding hardcoded credentials. Where the two differ, the checklist wins.

Scope: only the Edge Functions and scheduled jobs that exist for this project (`jranpiyhluyuqigqfyhn`), plus the signup test. No secret, token or user record appears here. I called nothing destructive, deleted nothing, changed no job, and sent no email.

Legend: **[V]** verified by me from code, migrations or a safe probe. **[YOU]** needs your Supabase login or inbox. **[U]** unknown until you look.

## 1. Inventory and classification (17 functions in the repository)

"Deployed" comes from a CORS preflight (404 for a nonexistent function, 200 for a deployed one). Four functions have no safe preflight and I did **not** probe them.
Anything deployed that is **not** in the repository can only be found by `supabase functions list` (**[YOU]**, step 1 below).

| Function | Class | Evidence | Deployed | Auth in code | Flagged (8) |
|---|---|---|---|---|---|
| `admin-user-list` | Legacy, unused | no caller anywhere. Returns per-user email, Mirar ID, user ID, status text, streak, totals, trial fields | yes | `ADMIN_SECRET`, fails open if unset | |
| `admin-analytics` | Legacy, unused | no caller anywhere. Aggregate counts and retention by cohort (no email column found in its queries) | yes | `ADMIN_SECRET`, fails open if unset | |
| `process-checkin` | Legacy v1, entry point | called only by the v1 check-in store, which v2 never renders; **fans out to six functions below** | yes | JWT verified | |
| `select-daily-question` | Legacy v1 | called only by the v1 check-in store | yes | JWT verified | |
| `generate-mirror-insight` | Legacy v1, downstream | called only by `process-checkin` | yes | none; service role; JWT check off | **yes** |
| `update-identity-vector` | Legacy v1, downstream | called only by `process-checkin`; it calls `check-unlocks` | yes | none; service role; JWT check off | **yes** |
| `check-unlocks` | Legacy v1, downstream | called by `process-checkin` and `update-identity-vector` | yes | none; service role | **yes** |
| `sync-user-state` | Legacy v1, downstream | called only by `process-checkin` | yes | none; service role | **yes** |
| `generate-weekly-signal` | Legacy v1, downstream | called only by `process-checkin` | yes | none; service role | **yes** |
| `generate-report` | Legacy v1, downstream | called by `process-checkin` and v1 report screens (not rendered in v2) | yes | none; service role; JWT check off | **yes** |
| `compute-stage-scores` | Legacy, dev tool | called only by a development seeding script | yes | none; service role; JWT check off | **yes** |
| `send-notification` | **Unknown trigger** | header says "triggered on report generation"; no caller in the repository, so it may be a Database Webhook configured in the dashboard. Sends push and email through a mail provider | not probed | none; JWT check off | **yes** |
| `daily-reminder` | **Scheduled** | cron migrations 009/010, daily 08:00 UTC; **never unscheduled in any migration**, so it may still run. Sends push notifications | not probed | none; JWT check off | |
| `email-nudge` | **Scheduled** | cron migration 016, hourly at :30, emails users who opted in; also referenced by a v2-unrendered settings card | not probed | `NUDGE_SECRET`, **fails closed** | |
| `whatsapp-nudge` | Scheduled, likely retired | migration 014 scheduled it; migration 016 **unschedules** it and replaces it with email | not probed | `NUDGE_SECRET` | |
| `trial-lifecycle` | **Unknown scheduler** | no caller, not scheduled in any migration; header says a cron or external caller runs it daily; idempotent | yes | `CRON_SECRET`, **fails open if unset** | |

**Required by v2: none.** The live app bundle invokes no edge function. v2 only talks to Supabase Auth and the `users`/`cycles` account-setup rows.

The eight flagged functions are exactly the rows marked **yes**: they use the service role, take a user id from the request body, and check nothing about who is asking. Whether that is exploitable I have **not** tested and will not by calling them (guessing a user id would also touch real data).

## 2. What is safe to delete, and why

**Rule I applied.** A function is deletable only if (a) nothing in the app calls it, (b) no migration schedules it, (c) no other function calls it, **and** (d) the *live* project confirms the same: no cron job, no Database Webhook, no recent traffic. (a) to (c) are verified from the repository. (d) I cannot see, so it is **[YOU]**.

| Verdict | Functions | Basis |
|---|---|---|
| **Delete now** | `admin-user-list`, `admin-analytics` | (a)(b)(c) verified: no references of any kind. They are the only functions guarded by a secret that has been public. (d): no cron job in any migration calls them. A dashboard-configured Database Webhook could in principle send the header, so confirm with the two checks in section 5 before running the script. |
| **Delete after the live checks in section 5** | `process-checkin`, `select-daily-question`, then `generate-mirror-insight`, `update-identity-vector`, `check-unlocks`, `sync-user-state`, `generate-weekly-signal`, `generate-report`, `compute-stage-scores` | (a)(b)(c) hold. What I cannot rule out is traffic from an old cached v1 client, or a dashboard-only webhook. Delete callers first (`select-daily-question`, `process-checkin`), then the downstream six, so nothing is triggered mid-removal. |
| **Your decision, not a cleanup** | `daily-reminder`, `email-nudge`, `whatsapp-nudge` | These message real people. Deleting a function while its cron job still exists makes the job fail every run. Decide the product question first (are you still sending nudges?), then unschedule, then delete. |
| **Do not delete until answered** | `send-notification`, `trial-lifecycle` | Trigger or scheduler unknown. |

**Deletion is reversible.** Every function's source is in this repository, so `supabase functions deploy <name>` restores it. Secrets and data are untouched by deleting a function. The script also tries to download the deployed source first. The one thing it cannot restore is a function that exists only in the dashboard and not in the repository, so do not delete any name that `functions list` shows and the table above does not.

## 3. Review of `scripts/release/secure-edge-functions.sh`

Verified by **reading it and by running its control flow against a stub CLI** (no Supabase contact) for four scenarios, under macOS bash 3.2:

| Scenario | What the script did | Resulting state |
|---|---|---|
| All succeeds | rotated, deleted both, verified | clean |
| Setting the secret fails | stopped immediately; **no deletion attempted** | unchanged (old leaked secret still active, functions still gated) |
| Digest unchanged or unreadable | stopped; **no deletion attempted**; explains what to check | unchanged, or rotated-but-not-confirmed (still gated) |
| First deletion fails | rotated, then stopped after the first failure | **safer than before**: old secret dead, the remaining function gated by a value nobody knows |

**Why a partial failure cannot make things worse.** The order is rotate, confirm, then delete. Rotation only *replaces* the secret, it never unsets it, so the deployed "skip the check when unset" flaw is never triggered. Nothing deletes the secret. If deletion fails, the old value is already dead. Re-running is safe.
Two fixes made during this review: an empty-array error that macOS bash 3.2 would have hit in the verification step; and a confirmation prompt ("type YES") plus a read-only `inventory` mode.
**Not tested:** the real Supabase CLI's output format (the digest column parse) and `functions download`. If the parse fails, the script says so and stops before deleting.

## 4. Procedure, in order

**A. One-time setup [YOU]**
```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref jranpiyhluyuqigqfyhn
```

**B. Read-only inventory [YOU]. Changes nothing.**
```bash
scripts/release/secure-edge-functions.sh inventory
```
Gives you the real deployed function list (look for names not in section 1), secret **names and digests** (hashes), and whether `CRON_SECRET` is present.

**C. Check scheduled jobs and webhooks first [YOU]** (section 5). Needed only to confirm nothing depends on the two admin functions; takes two minutes.

**D. Contain: rotate and delete the two admin functions [YOU]**
```bash
scripts/release/secure-edge-functions.sh delete
```
Expect every verification line to read `status=404`. If anything stops, read the message; the state is always safe.

**E. Review historical access [YOU]** (section 6). Do this soon, but D first: containment before investigation.

**F. Legacy cleanup [YOU, later]** after the live checks: delete in the order given in section 2. I will provide a script for it once you send the section 5 results.

Already verified by me: the functions' current responses (401 for missing, wrong and anon credentials, on both admin functions); the dependency map; the script's control flow; the public bundles expose only the anon key.

## 5. Check `CRON_SECRET` and scheduled jobs without revealing anything

**Is `CRON_SECRET` set?** Run `scripts/release/secure-edge-functions.sh inventory`; it prints `CRON_SECRET: present` or `NOT SET` from the secret **names**. Or open Dashboard > Edge Functions > Secrets: names are listed and values are masked. Never reveal or copy a value. Check `NUDGE_SECRET` the same way, because `email-nudge` fails closed without it.

**List scheduled jobs by name and active flag only.** In the SQL editor:
```sql
select jobid, jobname, schedule, active from cron.job order by jobname;
```
Do **not** add `command` to this query or share it: the command text can contain a credential.

**Which function a job calls, as true/false only (no command text):**
```sql
select jobname, active,
  (command ilike '%trial-lifecycle%') as calls_trial_lifecycle,
  (command ilike '%daily-reminder%')  as calls_daily_reminder,
  (command ilike '%email-nudge%')     as calls_email_nudge,
  (command ilike '%whatsapp-nudge%')  as calls_whatsapp_nudge,
  (command ilike '%admin-%')          as calls_admin
from cron.job order by jobname;
```
Expect `calls_admin = false` on every row. Recent run outcomes, without output text:
```sql
select jobid, status, start_time from cron.job_run_details order by start_time desc limit 20;
```
**Database Webhooks** (the thing I cannot see): Dashboard > Database > Webhooks, names and target only. Or: `select hook_name from supabase_functions.hooks;`

**Send me:** only the `jobname, active` rows and the true/false columns, the list of Webhook names, and yes/no for `CRON_SECRET` and `NUDGE_SECRET`.

## 6. Could personal data have been exposed? Log window

- **`admin-user-list`: yes, personal data, if the secret was ever used by someone else.** It returns, for every user, the email address, Mirar ID, user ID, status text, streak and totals, and trial fields. This is the serious one.
- **`admin-analytics`:** aggregate counts and retention by cohort; no email column in its queries. Low.
- **The eight flagged functions:** they would need a specific user's id (a random UUID). The main route to those ids was `admin-user-list`. I found no evidence either way and did not test.
- **Exposure vectors for the old secret:** it was a public browser variable in every production bundle, and the old admin page was opened as `/admin?s=<secret>`, so it may also sit in browser history, shared links or referrers.
- **Window to review:** from **18 April 2026** (when the Vercel variable was created; the admin page is in the repository from 20 April) **to the moment you rotate**. Not to 8 October: removing the variable from new builds did not invalidate the old value.
- **Your logs may not reach back that far.** Retention depends on your plan. Record the earliest date the logs cover. Anything earlier cannot be proven clean, so treat that stretch as potentially exposed.

Query (Logs Explorer; adjust field names if your schema differs). It returns only time, method, path, status and the caller's address and user agent, no response bodies:
```sql
select datetime(timestamp) as at, r.method, r.pathname, resp.status_code,
  r.headers[offset(0)].x_real_ip as ip, r.headers[offset(0)].user_agent as ua
from function_edge_logs
cross join unnest(metadata) as m
cross join unnest(m.request) as r
cross join unnest(m.response) as resp
where r.pathname like '%admin-user-list%' or r.pathname like '%admin-analytics%'
order by timestamp desc limit 500
```
Read it for **status 200** (the right secret was supplied) from addresses or user agents that are not yours. Tell me only: the earliest log date, the count of 200s, and whether any caller is unfamiliar. Never paste addresses of real users. If you find unfamiliar 200s, stop and tell me; whether notification is needed is for a qualified adviser.

## 7. First-time signup checklist for `mirar-v2-review-real.vercel.app`

**Why configuration is needed.** A sign-in link returns to the address the visitor started from, and Supabase only honours it if that address is in the Redirect URLs allowlist; otherwise it falls back to the Site URL (production). So, **[YOU]** in Supabase > Authentication > URL Configuration:
- Site URL: leave as `https://mirar-app.vercel.app`.
- Redirect URLs: keep `https://mirar-app.vercel.app/**` and add `https://mirar-v2-review-real.vercel.app/**` (remove it after testing if you prefer; it is a login-protected address).
- Read me the current Site URL and Redirect URL list (not secret).

**Test (use a never-used address, a plus-address is fine; a private window; stay signed in to Vercel in that browser).**
1. **[Claude or you]** Open `https://mirar-v2-review-real.vercel.app/login`. (Start here, not at the landing: the landing's button goes to production.)
2. **[Claude or you]** Enter the new address, press **Send my sign-in link**. Expect the "sent" state. *No inbox needed.*
3. **[YOU, inbox]** Open the email (check spam). Note sender and subject. Hover the link: its host should be your Supabase project, and the return address should be `mirar-v2-review-real.vercel.app`.
4. **[YOU, inbox]** Click the link **in the same browser**. Expect: "preparing your account", then the introduction, then Today.
5. **[Claude or you]** Begin a rep, answer, read the closing; reload and confirm the closing persists; open The Mirror and Me.
6. **[Claude or you]** Sign out. Expect the entry screen.
7. **[YOU, inbox]** Request a new link for the same address and open it. Expect: straight to Today, **no introduction**, empty practice.
8. **[Claude or you]** Click the **first** link again. Expect: entry screen with "That link has expired or was already used."
9. **[YOU, Supabase login]** Confirm one new row under Authentication > Users and one in the `users` table. Delete the test account afterwards if you like.
10. Repeat 1 to 5 on your phone with a second new address.

Only steps 3, 4 and 7 need your inbox. Do not paste the sign-in link anywhere; it signs the holder in.

## 8. Prioritized checklist

**Urgent containment** (do now, in order)
1. [YOU] `scripts/release/secure-edge-functions.sh inventory`: confirm the real function list and `CRON_SECRET`/`NUDGE_SECRET` presence.
2. [YOU] Run the two `cron.job` queries and list Database Webhooks (section 5); confirm nothing calls an admin function.
3. [YOU] `scripts/release/secure-edge-functions.sh delete`: rotate, then delete the two admin functions; expect 404s.
4. [YOU] Review function logs from 18 April 2026 to now (section 6). Report earliest log date, count of 200s, anything unfamiliar.

**Safe legacy cleanup** (after 1 and 2)
5. [YOU] Send me the section 5 results. [Claude] I give you the ordered deletion script for the v1 pipeline.
6. [YOU, decision] Are you still sending reminder, email-nudge or WhatsApp messages? If not, unschedule the jobs, then delete those functions. If yes, tell me and I will correct the Privacy page.
7. [YOU] Answer `CRON_SECRET` (set or not) so `trial-lifecycle` can be gated or deleted without breaking a scheduler.
8. [YOU] Delete only function names that appear in section 1; investigate any other name first.

**Authentication verification**
9. [YOU] Add `https://mirar-v2-review-real.vercel.app/**` to Redirect URLs; send me Site URL and the list.
10. [YOU + Claude] Run the signup test (section 7); report pass or fail per step.

**Production release conditions** (all must hold; the cutover stays blocked until then)
- Admin secret rotated and both functions return 404 (or 401 if redeployed).
- Log review done and any unfamiliar access dealt with.
- First-time signup passes on the real-auth review build, and a returning login passes.
- Supabase Site URL and Redirect URLs confirmed to include the production address.
- `scripts/release/preflight-app.sh` returns PASS, and `check-public-bundle.py` passes on the live app.
- Rollback ready: current production `mirar-7rphdq5qg-…`, promote it to revert.

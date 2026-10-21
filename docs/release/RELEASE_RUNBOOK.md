# Mirar release runbook

Owner: Claude (release). Account owner actions are marked **YOU**. No secret value appears in this file or may be pasted into chat, tickets or commits.

## 1. Public release verification (12 October 2026)

| Check | Result |
|---|---|
| Fresh, no-cache requests to `https://mirar.life/` and `https://www.mirar.life/` | HTTP 200, title "Mirar — Daily emotional fitness", Aperture landing; **no redirect** |
| `/privacy`, `/terms`, `/cookies` on both hosts, cache-busted | HTTP 200, "Last updated: October 12, 2026"; none of the v1 phrases (drift, theme scores, Brevo, Google Analytics, cycle) |
| Aliases | `mirar.life`, `www.mirar.life`, `mirar-landing.vercel.app` all resolve to production deployment `mirar-landing-m2kbb91wn-…`; the domain belongs to project `mirar-landing` only |
| Conflicting rewrites / other hosts | `http://` and trailing-slash variants resolve to the same pages; `/privacy.html` and `/privacy-policy` are 404; no leftover redirect |
| CTA | The live bundle contains exactly one app URL, `https://mirar-app.vercel.app/login`; that route returns 200 |

A separate fetcher that still returned v1 text could not be reproduced. Every route I can reach serves the new pages, and the CDN age (about 17 minutes at the time of checking) matches the release, not an older deployment. The likely causes are a fetch made before the release on 12 October, or a third-party cache (a fetching service, search engine or archive) holding the old copy. If it recurs, send me the exact URL, time and the fetcher's headers.

## 2. Rotate `ADMIN_SECRET` (YOU)

**Why rotate, not just remove.** The old value shipped in public browser bundles for months, so it must be treated as known. Two edge functions accept it: `admin-analytics` and `admin-user-list` (the second returns per-user rows using the service role).

**Do not delete the secret.** In the currently deployed versions of those functions the check is `if (adminSecret) { … }`, so **an unset secret turns the check off and the endpoint opens to anyone.** The repository now fails closed (this branch, commit below), but until you deploy that, deleting the secret would make things worse.

### Steps
1. **Generate a new value locally** and put it straight into your password manager. Do not paste it anywhere else:
   ```bash
   openssl rand -base64 48 | pbcopy
   ```
2. **Note the old digest** (a hash, not the secret). With the Supabase CLI logged in and linked to the project:
   ```bash
   supabase secrets list
   ```
   Write down the `ADMIN_SECRET` digest.
3. **Set the new value.** Dashboard: your project → Edge Functions → Secrets → `ADMIN_SECRET` → replace → save. Or CLI (the value is never printed):
   ```bash
   supabase secrets set ADMIN_SECRET="$(openssl rand -base64 48)"
   ```
4. **Confirm it changed:** run `supabase secrets list` again. The `ADMIN_SECRET` digest must differ from step 2.
5. **Deploy the fail-closed versions** (from branch `mirar-integration` once merged) or, if nothing legitimate uses them, delete the functions:
   ```bash
   supabase functions deploy admin-analytics admin-user-list
   # or, if unused:
   supabase functions delete admin-analytics
   supabase functions delete admin-user-list
   ```
   The admin page that called them has been removed from the app, so nothing in the product depends on them.
6. **Do not touch `trial-lifecycle` yet.** It has the same fail-open pattern for `CRON_SECRET`. I left it unchanged because changing it would break the scheduled job if the scheduler does not send the header. Tell me whether `CRON_SECRET` is set and the scheduler sends `x-cron-secret`, and I will fix it the same way.
7. **Check whether it was used.** Supabase dashboard → Logs → Edge Functions: filter `admin-user-list` and `admin-analytics` over the past months. Unfamiliar callers or user agents mean user records (emails among them) may have been read; decide whether that needs notification.

### How to verify nothing privileged is browser-exposed
- **Unauthenticated calls are refused** (replace `<ref>` with your project reference; expect 401, or 404 if you deleted the functions):
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://<ref>.supabase.co/functions/v1/admin-user-list"
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "x-admin-secret: wrong" "https://<ref>.supabase.co/functions/v1/admin-user-list"
  ```
- **Public bundles contain only the anon key.** From the repository:
  ```bash
  python3 scripts/release/check-public-bundle.py https://mirar-app.vercel.app
  python3 scripts/release/check-public-bundle.py https://mirar.life
  ```
  Expect `RESULT: PASS` (every JWT has role `anon`; no admin or service-role literal). It never prints a token. On 12 October 2026 the live app and landing both pass.
- **Vercel Production variables** are only the Supabase URL and anon key: `vercel env ls` (Production rows).
- Anything beginning `EXPO_PUBLIC_` is public by design. Only the Supabase URL and anon key belong there.

## 3. First-time signup test with a new email (YOU)

Use an address that has **never** been used with Mirar. A plus-address such as `you+mirartest1@yourdomain.com` counts as new. Use a private window.

1. Open `https://mirar.life`. Click **Enter Mirar** or **Begin your practice**. **Check:** the address bar becomes `https://mirar-app.vercel.app/login`.
2. Type the new address; press **Send my sign-in link**. **Check:** a "sent" state appears (no error).
3. Open the email (check spam too). **Note** the sender and subject. **Check:** the message arrives within about a minute, and hovering the link shows a Supabase address that leads back to `mirar-app.vercel.app/auth/callback` (not `localhost`, not `mirar.life`).
4. Click the link **in the same browser**. **Expect, in order:** a short "preparing your account" screen, then the one-time introduction, then Today with **Begin**.
5. Press **Begin**, complete the rep, and read the closing. **Check:** the closing shows your exact response and no generic "notice later" line.
6. **Reload.** **Check:** the closing and your response are still there, and you are not sent back to the introduction.
7. Go to **Me → Sign out** (confirm). **Check:** you land on the entry screen.
8. Request a link again for the **same** address and open it. **Expect:** straight to Today, **no introduction**, and an empty practice (sign-out cleared this device).
9. Click the **first** link again. **Expect:** the entry screen with "That link has expired or was already used."
10. Repeat steps 1–6 on your phone with a second new address.

In the Supabase dashboard, confirm one new row in Authentication → Users and one in the `users` table, and that **Authentication → URL Configuration** lists `https://mirar-app.vercel.app` (Site URL) and `https://mirar-app.vercel.app/**` (Redirect URLs).

**Report back:** pass or fail for each step, the sender and subject line, and the link's host (never the link itself).

### 3a. Who does what in the signup test (so only the inbox steps need you)

| Step | Who | Needs your inbox? |
|---|---|---|
| Read Supabase Authentication > URL Configuration (Site URL, Redirect URLs) and tell me the values (they are not secret) | **YOU** | No (needs your Supabase login) |
| Add `https://mirar-v2-review-real.vercel.app/**` to Redirect URLs (see the note below) | **YOU** | No |
| Give me a never-used test address, or type it yourself | **YOU** | No |
| Open the landing, press the CTA, confirm the URL is `.../login`, type the address, press "Send my sign-in link", confirm the "sent" state | **Claude** (browser) or you | No |
| **Open the email** (check spam), confirm sender and subject, hover to read where the link points | **YOU** | **Yes** |
| **Click the link in the same browser** (or, if I am driving, copy it to that browser) | **YOU** | **Yes** |
| Watch the account screen, introduction, first rep, closing; reload; sign out; sign in again; click the first link again | Claude or you | Only to fetch the second email for the sign-in-again step |
| Check the new row in Authentication > Users and the `users` table | **YOU** | No (needs your Supabase login) |

**Which build to test.** Production (`mirar-app.vercel.app`) still runs the previous release, so testing there tests the old onboarding. To test the **new** integrated app with real sign-in before cutover, use `https://mirar-v2-review-real.vercel.app`. The sign-in link returns to whichever address the user started from, and Supabase only honours that if it is in Redirect URLs; otherwise it falls back to the Site URL (production). So add the review alias to Redirect URLs for the duration of the test, and remove it afterwards if you prefer. It is a login-protected address, not a public one.

**Do not paste the sign-in link into chat.** It signs the holder in. I only need its host and whether the page after clicking looked right.

## 4. Stable review environment (no expiring links)

Two fixed aliases on the existing `mirar-app` project, both **not production** and protected by Vercel login (you are signed in as the team owner, so just open them):

| Purpose | URL | What it is |
|---|---|---|
| Full experience with demo fixtures | `https://mirar-v2-review-demo.vercel.app` | Demo sign-in, review-states panel at `/states`. Never promoted. |
| Production-equivalent, real sign-in | `https://mirar-v2-review-real.vercel.app` | Exactly what production will run: real auth, no demo, no fixtures. |

Why this is safe for production: the demo build exists only as a Preview deployment with its flags set at build time. Production environment variables contain only the Supabase URL and anon key, and `scripts/release/preflight-app.sh` fails the release if that changes or if demo or simulator markers appear in the built bundle. To refresh the aliases after a new deploy: `vercel alias set <deployment-url> mirar-v2-review-demo.vercel.app` (and `-real`).

On a phone, open the same URL while signed in to Vercel in that browser, or add the page to your home screen after signing in once.

## 5. Production cutover plan (app) — do not run until section 2 and 3 are green

**Rollback chain** (corrected on 12 October; an earlier report named the wrong current deployment). Production deployments, newest first:
1. `mirar-7rphdq5qg-…` (git `main` `8850cfc`, created 7 Oct 15:03): **current, serving `mirar-app.vercel.app`.**
2. `mirar-jp40px6o1-…` (git, `11f6e33`)
3. `mirar-df5hgefky-…` (CLI, `11f6e33`)
4. `mirar-jg9sxe0v4-…` (pre-v2)

**Cutover** (pushing to `main` triggers a production build from git):
1. Gate: ADMIN_SECRET rotated and verified (section 2); first-time signup passed (section 3); legal review items acknowledged.
2. `scripts/release/preflight-app.sh` returns `PREFLIGHT: PASS` on `mirar-integration`.
3. Open `https://mirar-v2-review-real.vercel.app` and walk the journey once more.
4. Fast-forward `main` to `mirar-integration` and push (no force). Wait for the production deployment to become Ready.
5. Smoke test the public URL: landing → login → (existing account) Today → Begin → closing → reload → Mirror → Me → sign out; both viewports; `check-public-bundle.py https://mirar-app.vercel.app`; Vercel runtime logs clear.
6. **Rollback if anything serious appears:** promote `mirar-7rphdq5qg-…` (`vercel promote mirar-7rphdq5qg-sahilaharia-designs-projects.vercel.app` or the dashboard's "Promote to Production"). Nothing is deleted.

## 6. Supabase Data API grants: compatibility checklist (added 22 October 2026)
**What changes.** Supabase announced (discussion #45329, read 22 Oct 2026; **effective for existing projects on 30 October 2026**) that new tables in `public` will no longer receive automatic `select/insert/update/delete` grants for `anon`, `authenticated` and `service_role`. A missing grant returns `42501 permission denied`. **Existing tables keep their current grants**; row-level security is unchanged; only projects that use the Data API (supabase-js / `/rest/v1`) are affected; direct Postgres connections are not. The announcement does **not** describe `EXECUTE` privileges on functions; do not assume either way. The local CLI aid `auto_expose_new_tables` is scheduled for removal on the same date.

**Rules for every new table or function (G4 continuity, E1 entitlement, future billing)**
1. **Explicit, least-privilege grants in the same migration.** Never rely on a default. Private customer tables: no `anon` grant ever; clients get at most `select` (own rows, behind RLS); writes go only through `SECURITY DEFINER` functions.
2. **Functions are separate.** `EXECUTE` is revoked **by name** from `public`, `anon`, `authenticated` (and `service_role` where not needed), then granted to exactly the intended roles. Both drafts already do this.
3. **Never copy the announcement's broad example grants** (`select` to `anon`; `select, insert, update, delete` to `authenticated` and `service_role`) onto private customer tables. `scripts/release/grant-regime-check.ts` fails if a draft does.
4. **`service_role` is regime-dependent.** Under today's defaults it holds ALL on new tables; under the new behaviour it holds none. The drafts do not pin it (access is through definer functions). Any Edge Function that reads or writes a table through the Data API with the service key will need an explicit table grant **or**, preferably, a definer RPC. Billing/webhook design must decide this up front. Open option: add an explicit `revoke all … from service_role` to the E1 and Option B drafts so behaviour is identical in every regime (not applied; needs review).
5. **Fresh-database parity.** Migrations must succeed and produce identical privileges from an empty database (`supabase db reset`). Local proof: `PGLITE_DIR=… PG17_DIR=… npx tsx scripts/release/grant-regime-check.ts` installs both drafts from empty under **legacy**, **new** and **strict** (also no function defaults) regimes on in-memory PGlite 16 and a throwaway native PostgreSQL 17: **433 assertions, 6 fresh databases, all pass** (22 Oct 2026). At E2 repeat the privilege matrix query on staging after applying the SQL.
6. **Positive and negative tests per object:** the owner can; another user cannot; `anon` cannot; a direct client write fails; a client cannot execute internal helpers. Covered for the entitlement and Option B drafts by the script and by `scripts/entitlement/entitlement-sql.test.ts`.
7. **Read-only audit of existing tables (founder, counts only, no data):** list current table grants for `anon` and `authenticated` on the existing `public` tables (`information_schema.role_table_grants`). Existing legacy tables keep their broad grants on 30 October; E1b (read-only policies on `trial_tracking` and `subscriptions`) is unaffected but does not revoke those grants. Do not run Supabase's early opt-in SQL until this audit has been read.
8. **Applicability:** E1 entitlement: compatible, no change (tables have no client grants; two client functions granted explicitly). G4 continuity: compatible (explicit `select` to `authenticated` on three tables; no write grants). Billing: not yet designed; must follow rules 1–6.

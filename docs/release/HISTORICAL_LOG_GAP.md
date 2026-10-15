# Historical admin-endpoint exposure: the log gap, other evidence, and residual risk

**Date:** 15 October 2026. **Status:** open release blocker. **Method:** read-only (repository history, public documentation, provider plan facts from `docs/privacy-review/G2_PROVIDER_VERIFICATION.md`). No logs, user records or secrets were read. No conclusion below says "no exposure".

## 1. What is known
- Two privileged edge functions (`admin-user-list`, `admin-analytics`) could return user and usage data to a caller holding `ADMIN_SECRET`. The app once contained an admin page that obtained that secret in the browser, so the value was exposed to anyone who could load the public bundle (`docs/release/SECURITY_REMEDIATION.md`).
- Repository history: the admin page and the functions are present from the initial commit (**20 April 2026**); the public admin page was removed in the v2 beta cutover commit of **7 October 2026**; the secret was **rotated** and both functions **deleted** by the owner on **14 October 2026**; both now return 404 (verified).
- So the possible exposure window, from repository history alone, is up to roughly **20 April to 14 October 2026**. Whether the secret was in each deployed bundle for that whole period was not verified against Vercel's deployment history.
- The data those functions could return includes user emails and usage counts (the exact fields were not re-read here). Whether anyone used them is **unknown**.

## 2. Why the usual evidence is not available
| Source | Why it cannot settle the question |
|---|---|
| Supabase edge-function and API logs | The Free plan keeps **1 day** of logs (G2). Anything before about 14 October is gone. The Supabase CLI cannot read hosted logs. |
| Vercel request logs | Retention on the current plan is not verified; static bundle downloads would not show who later *used* the secret against Supabase anyway. |
| Absence of anomalies | Not evidence of absence: reading data leaves no trace in the tables. |

## 3. Alternative evidence that may still exist (read-only, owner-run where it needs a login)
1. **Supabase Auth audit entries** in the database (sign-in and token events): shows account activity, not function calls. Owner runs a query that returns counts only.
2. **Edge-function invocation metrics** in the dashboard (aggregate counts per day, if the plan keeps them): a spike on the two admin functions would be informative; a flat line is not proof.
3. **Provider support**: ask whether platform-level edge logs older than the dashboard window exist for these two functions for the period (a written answer is evidence either way).
4. **Vercel deployment history**: which production deployments contained the admin page (bounds the window; retrievable with the Vercel tools, read-only).
5. **Mail and platform notices**: any anomalous Brevo/Anthropic/Expo usage that the stolen secret could have driven (the admin functions did not call those; low value).
6. **The founder's own recollection** of who had the link or the secret.

## 4. Residual risk, stated plainly
- A third party who found the secret could have read the user list (emails, ids, counts) with no record that survives. Probability is unknown. Nothing here lowers it.
- Mirar's stored data is small (account email, random Mirar id, language, legacy cycle rows; no v2 practice content on the server), so impact is **personal-contact data of beta users**, not practice content. That is a reasoned limit, not a measurement.
- If any real payment or health-adjacent data is added later, an unquantified past exposure of the *list* does not change that, but a breach-notification question for the existing beta users should be put to the qualified reviewer (DPDP and any other regime that applies). I am not concluding that a notification duty exists.

## 5. Recommended handling (needs the founder's decision)
1. Do the cheap checks in section 3 (items 2, 3 and 4) and record the answers here.
2. Ask the qualified reviewer, when one is appointed, whether the beta users must be told; draft a plain notice in advance so the decision is not delayed.
3. Accept the evidential gap **explicitly** in the launch record if nothing better turns up, instead of treating the missing logs as clearance.
4. Going forward: a paid tier of logging is not required for this specific gap (it is historical), but any paid launch needs log retention long enough to investigate an incident (see masterplan, monitoring).

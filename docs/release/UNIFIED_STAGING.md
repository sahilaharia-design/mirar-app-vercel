# Unified staging: authoritative integrated build (14 October 2026)

**Branch `mirar-unified-final`.** Staging only. Not merged to `main`. PR #3 and PR #2 are not merged. Production, `mirar.life`, the frozen engine, Supabase configuration and the public landing are untouched.

## Which source revisions are in, and which are superseded
| Source | Revision | Status in the final build |
|---|---|---|
| Frozen engine + runtime adapter | `mirar-integration` `3dfebc3` | **Incorporated, unchanged** (diff against it is empty for `lib/innerRep/v2`, engine, evidence, catalog and `runtime/`). |
| My pilot runtime (step machines, session, store, read models, fixtures, tests) | `mirar-pilots` `8f30963` | **Incorporated.** Runtime-copy fixes added (below). |
| Codex Aperture expansion | `codex/mirar-aperture-expansion` `8e9fa11` | **Incorporated** (landing, Today, entry, completion, Mirror presentation). Its fictional `PracticePilots` is gone from the app and the review journey. |
| Codex real-pilot Aperture integration (PR #3) | `codex/mirar-pilot-aperture-integration` `85b3322` | **Incorporated and authoritative for pilot presentation:** `PilotPractice`, `PilotViews`, `PilotsScreen`, `PilotHosts`, the Today and Mirror slots, direct Attend placement, unfinished-draft guard. |
| My earlier unified build | `mirar-unified` `7cc38ac` | **Superseded in presentation** (`LivePilots.tsx`, `PilotMirrorSection.tsx`, the Attend board adapter `board.ts` and its tests, `session.clone/context` removed). **Kept:** fixtures need `PILOTS` and `REVIEW_STATES`; preflight pilot-string scan (extended); landing-preview alias/entry overrides; the A8 proposal; the journey script (rewritten). |
| Reconciliation | `988bc0b` merge, then docs and script commits | Deployed app code is `988bc0b`. |

Why Codex's Attend placement replaced mine: it never changes a person's choice on their behalf. The runtime's own reason is shown on the disabled "Attend to it now" tile instead of my auto-move to "left open". Both are valid; Codex's keeps the person in control and needs no extra adapter.

## Review URLs (login-protected; ask for a fresh share link)
| | URL |
|---|---|
| **Integrated app, demo auth (simulated sign-in)** | `https://mirar-unified-preview.vercel.app`, immutable `https://mirar-1do6dsr5q-sahilaharia-designs-projects.vercel.app` |
| Integrated app, real auth (same code; sign-in not yet verifiable) | `https://mirar-unified-real.vercel.app` |
| Landing preview (CTA goes to the demo app login) | `https://mirar-landing-unified-preview.vercel.app` (landing unchanged by PR #3; built from `mirar-unified`) |

Journey on the demo build: landing → Enter → Today (existing engine rep) → completion with both practices offered → Look Again → receipt → Attend → receipt → Today → Mirror (engine plane, then its own pilot plane) → return.

## The four runtime-copy findings (all fixed, with regression tests)
1. **Look Again** claimed "noting how certain it felt" / "checking that sentence" even when leaving before those steps. Now stated only when the step was answered.
2. **Attend** said each pull "has a place" after leaving mid-allocation or with unknown placements. Now: "N of the M", "part of what you named has a place", or "without placing any of it". It also no longer says "chose not to attend" before placement is complete.
3. **Attend, hard to tell** carried "nothing was pulling". Now: "it was hard to tell what was pulling at you"; "nothing pulling" still says so.
4. **Pilot Mirror state** used total sessions. Now `populated` only when a cross-session count can actually be shown; otherwise `sparse` with "A count across sessions needs 3 completed sessions of the same exercise with the same kind of answer. So far: Look Again N, Attend M."

No evidence semantics, eligibility, storage or the engine changed.

## Validation (`docs/release/unified-validation/results.json`)
- **Hosted journey, real app and real pilot sessions:** 32/32 checks, with a page reload between phases 2 and 3. Five defects were found in my *test script* (locators and assertions) and fixed; no product defect surfaced. Phases 3 and 4 were re-run from cleared storage.
- **Engine and runtime regression:** 85/85, 17/17, 18/18, 20/20, 8/8, 4/4. Pilot suite passes including 10 new checks for the findings; mutation checks on findings 1 and 4 fail as intended.
- **Accessibility:** axe 4.10.2 (WCAG 2.0/2.1 A and AA), 23 states at each of 1440, 390 and 320 = 69 scans: **0 violations, 0 incomplete**.
- **Responsive:** same 69 states: no horizontal overflow, no element past the viewport, no target under 44 px.
- **Privacy and safety:** typed words are in no draft, record or storage; a restored draft says words were not restored; a crisis phrase halts with no draft, no record, no typed text and no resume; starting the other practice never replaces an unfinished one.
- **Production-equivalent export (`--clear`):** none of the pilot or Aperture-pilot strings, no fixtures; anon-only JWT. Preflight scan extended to the new strings.

## Not verified
Real-auth sign-in and returning login; native screen readers; Hindi/Gujarati typography; human comprehension and usefulness; safety and helpline copy sign-off; Codex's own agent-browser matrices on this exact build.

## Blockers (unchanged)
**Supabase (yours):** rotate `ADMIN_SECRET`; retire `admin-user-list` and `admin-analytics` (I then re-probe for 404); historical log review; add `https://mirar-unified-real.vercel.app/auth/callback` to Redirect URLs, then first-time signup and returning login. **Product:** A6 and A7 deferred; A8 not approved; no account-history migration. **Release:** v2 stays out of Production until security, authentication and safety gates pass.

## Rollback
Additive, flag-gated, staging-only. Delete the aliases to remove staging; do not merge `mirar-unified-final`. Production and its rollback deployments are untouched.

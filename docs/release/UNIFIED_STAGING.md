# Unified staging: Aperture expansion + real pilots (13 October 2026)

**Branch `mirar-unified`** (preserves both histories, no force-push): merge `4411537` of `mirar-pilots` (`8f30963`) and `codex/mirar-aperture-expansion` (`8e9fa11`), then `4541c3f` (live pilot views, board adapter, separated pilot Mirror), `08e79c7` (board prefill, landing-preview overrides), `c23e27d` (script fix). Staging only. Not merged to `main`, not in Production.

## Review URLs (all login-protected; ask for a fresh share link when one expires)
| | URL | Auth |
|---|---|---|
| **Integrated app, demo auth** | `https://mirar-unified-preview.vercel.app` | **Simulated** (mock user). Review fixtures available. |
| **Integrated app, real auth** | `https://mirar-unified-real.vercel.app` | **Real Supabase magic link.** No mock, no fixture loader. Sign-in not yet verifiable (see blockers). |
| **Landing preview** | `https://mirar-landing-unified-preview.vercel.app` | CTA goes to the **demo** app login. |
| Production (unchanged) | `mirar.life`, `mirar-app.vercel.app` | untouched |

Journey on the demo build: landing → Enter → Today (existing engine rep) → completion → Optional extra practice → Look Again → completion → Attend (board) → completion → Mirror (engine section, then the separate extra-practice section) → return.

## How the Codex frontend is wired to the real contracts
- Codex's landing, Today, entry, completion and Mirror presentation are already the app's presentation and run on the unchanged `TodayView`, `runtime.receipt()` and `runtime.mirror()`.
- **Pilots:** `components/experience/pilots/LivePilots.tsx` renders the real `PilotSession` (`step()`, `PAnswer`, back, leave, safety) in Aperture's `ReflectiveFrame` (Look Again) and a spatial board (Attend). `lib/innerRep/pilots/board.ts` replays a board arrangement through `session.answer()`, so the runtime still validates every placement; a rejected arrangement leaves the session unchanged. `components/pilots/PilotsScreen.tsx` is the host. Codex's fictional `PracticePilots.tsx` remains **review-harness only** (`review/ExpansionReview.tsx`) and is not imported by the app.
- **Mirror:** the engine Mirror is unchanged. `components/pilots/PilotMirrorSection.tsx` renders `buildPilotMirror()` in a labelled, separate section (`MirrorExperience` gained an optional `children` slot). Nothing from pilots enters `runtime.mirror()`, engine evidence or eligibility.
- **Gates (build-time, direct `process.env`):** `EXPO_PUBLIC_PILOTS=1` mounts the pilots route, the Today entry and the Mirror section; fixtures additionally need `EXPO_PUBLIC_REVIEW_STATES=1`. A production-equivalent build contains none of it (`scripts/release/preflight-app.sh` fails the release otherwise).

## Answers to Codex's five contract questions (handoff §"Before authentic wiring")
1. **Family ids and schema:** `look_again`, `attend`; `PStep` (`choice | multi | words | hold`) and `PAnswer`, with back, unknown and leave on every step as specified in `docs/product/PILOT_CONTRACTS.md`.
2. **Is a view/edge arrangement an answer, presentation or observation?** A structured, self-reported **record in the separate pilot store**. Never engine evidence, never "personal evidence" by default, never combined with the engine Mirror.
3. **Commitments:** none. A6 is deferred; "find out later" is hidden and tested as hidden.
4. **Engine/catalog/selection:** pilots are not in the catalog and are never selected by the engine. A8 is a proposal only: `docs/product/A8_ATTEND_PROPOSAL.md`.
5. **Personal wording and safety:** Look Again accepts one session-only sentence per attempt, passed only to the existing crisis-language check; on a hit the session halts and nothing is kept. Attend collects none.

## Validation (details: `docs/release/unified-validation/results.json`)
- **Hosted journey (real app, real pilot sessions, no handcrafted outcomes):** 29/29 checks across 4 phases, with a page reload between phase 2 and 3. One earlier run of phase 4 failed five Mirror checks because of a bug in the *test script* (it looked for the Mirror tab while on `/pilots`); fixed and re-run, all pass. Script: `scripts/frontend/unified-journey.browser.js`.
- **Engine regression:** 85/85, 17/17, 18/18, 20/20, 8/8, 4/4; pilots 75 checks including the board adapter (300 random boards always accepted by the runtime) and two mutation checks.
- **Accessibility:** axe 4.10.2 (WCAG 2.0/2.1 A and AA), 11 pilot states, 0 violations, 0 incomplete.
- **Responsive:** 320 and 1440 on the board and the Look Again frame: no overflow, no target under 44 px, nothing clipped. 390 not separately measured for pilots.
- **Landing preview:** public sample intact (3/3 paths, 0 network calls, empty storage), new sections present.
- **Production-equivalent export:** no pilot or fixture content; anon-only JWT.

## Not verified (stated, not assumed)
Real-auth sign-in and returning login; native screen readers; Hindi/Gujarati typography; human comprehension and usefulness of either pilot; the safety/helpline copy review; 390 px pilot geometry.

## Blockers (unchanged by this work)
**Supabase (yours):** `ADMIN_SECRET` rotation; retire `admin-user-list` and `admin-analytics` (then I re-probe for 404); historical log review; add `https://mirar-unified-real.vercel.app/auth/callback` (and the earlier `mirar-v2-review-real` entry) to Redirect URLs, then first-time signup and returning login. **Product:** A6/A7 deferred, A8 not approved. **Release:** v2 app promotion stays blocked until security, authentication and safety gates pass. CRON_SECRET rotated and four cron jobs paused (recorded).

## Rollback
Everything here is additive, flag-gated and staging-only. Production, `mirar.life` and the rollback deployments are untouched. Remove staging by deleting the three aliases; revert by not merging `mirar-unified`.

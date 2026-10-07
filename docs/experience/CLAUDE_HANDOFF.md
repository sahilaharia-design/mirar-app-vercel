# Mirar V2 — system of experience

Architecture mapped before implementation, 7 October 2026. Base: `11f6e33` (latest integrated beta cutover, includes Codex `23ec30d`). Engine stays `inner-rep-engine-v2.0.1-correction-fix`. No deployment.

## Repository audit and product direction
The repository contains an Expo app, authenticated Supabase account setup, a device-local v2 runtime/store, canonical artwork/fonts/tokens, and retired v1 check-in/assessment/report routes. The active beta shell currently exposes Today and Me. The full source inventory was inspected; active entry/auth/onboarding, Today, contract renderer, runtime/store and route guards were read. Retired v1 screens must not become the new experience by accident.

The public site is a separate legacy deployment promising five-second check-ins and a weekly number. The new public experience will be built inside the integrated Expo repository, sharing actual product components. Domain cutover to this root is an engineering/deployment handoff, not performed here.

## Complete journey / state map
| Stage | Screen/state | Value and next movement | Source of truth |
|---|---|---|---|
| Discover | Public root | Emotional fitness; product is visible before sign-in | Authored explanatory copy, canonical assets |
| Understand | Live sample / capacity explorer / example Mirror | Experience choice and disagreement; no sample is saved | Real v2 template/step machine; explicitly labeled fictional Mirror |
| Enter | Email entry / sending / sent / expired / error | Passwordless authentication, transparent beta storage | Existing auth store and callback; no auth bypass |
| Onboard | One short practice introduction | Try a truthful response, learn uncertainty/autonomy/privacy; go to Today | Presentation only; no onboarding inference or new persistence |
| First rep | Today invitation / active rep / interrupted | Prompt hero, differentiated compare/writing/context/action responses | Actual `TodayView`, `FlowContext`, `nextStep` |
| First value | Integration receipt | Revisit the exact selected response, one general invitation to carry the noticing into life | Submitted structured choice IDs mapped to exact offered labels, not an insight |
| Integrate / live | Completion, optional Honest Mirror | Carry forward a user-chosen action; no forced reflection or next rep | Structured answers and actual completion payload |
| Return | Today, done, resume | Local day context; continuity only when supplied, quiet practice-days count | Actual runtime; no streaks or fake yesterday memory |
| Build practice | Returning invitation and Mirror | More completed days means more actual practice, not higher ability | Supplied practice-days fact; no comparative score |
| Honest Mirror | Engine reflection + equal feedback / correction / note | Evidence, uncertainty and disagreement are distinguishable | Engine text/evidence; frozen Partly reasons and safety behavior |
| Commitment | Named follow-up / exact timeframe | Something chosen to carry, no productivity list or guilt | Step commitment context; future-only calendar-date contract |
| Evolving self-knowledge | Mirror: beginning / practice / reflection / carrying / deferred archive | Clearly separate facts, observed reflections and unavailable evidence | Today and practiceDays now; read-model requirements below |

## Experience rules
The loop is NOTICE → EXERCISE → INTEGRATE → LIVE. A sample introduces noticing; the prompt is the exercise; completion returns the user's own response to them; the interface then releases attention back to life. No mandatory pause timers, auto-answers, new response schemas, mood scales or speculative sorting/spectrum controls. Tactility comes from paired statements, ruled response space, intimate writing surfaces and typographic reflection.

Today changes with actual state, not a fabricated Day 2/10/30 persona. At zero practice it welcomes; with practice it acknowledges the actual count; with a draft it resumes; after completion it offers integration and supplied reflection. No invented pattern claims, rest state or contradiction insight (those remain disabled).

## Component contracts
- DiscoverExperience: `onEnter`, real sample renderer, local-only demonstration state; no account writes.
- EntryExperience: supplied email state, submission/error/sent state and existing submit callback. No new authentication protocol.
- PracticeIntroduction: interactive authored explanation, `onBegin`; no diagnostic collection.
- DailyInnerRep: existing runtime props/callbacks remain unchanged; presentation adds day context, introductory guidance and a local integration receipt.
- IntegrationMoment: existing FlowContext + submitted StepAnswer[] + closing. Exact primary option label or uncertainty only; no raw words or new inference. Action/timeframe shown only when the actual chosen option creates one.
- MirrorExperience (implemented): `practiceDays`, optional current `CommitmentContext`, `onToday`. Reflection feedback stays in Today. The store’s current completion object does not expose archive eligibility or correction state; copying that insight into Mirror could resurrect a rejected claim, so it is deliberately withheld. All missing longitudinal fields have explicit unavailable states. No mining the persisted blob in the UI. A future approved Mirror read model may supply eligible reflection records and callbacks after review.
- Shared editorial shell, chapter/divider, read-only receipt and sample surfaces use native semantic tokens and the existing font gate/motion primitives.

## Claude read-model / engine-state requirements
Supply a read-only Mirror model through the existing runtime/store boundary, after product review:
1. Practice records: exercised capacities and dates/counts derived from completed reps (never ability scores).
2. Explicit statements: exact authored option label, provenance, day and domain when explicitly supplied; distinguish offered choices from user-introduced context; exclude all raw text.
3. Approved reflection archive: engine-authored text, tier, evidence snapshot, feedback/correction status, whether still eligible. Never revive a rejected/withheld claim.
4. Carry-forward items: user-chosen authored label, timeframe/date, neutral user status; no overdue/failure labels or priority reimplementation.
5. Shifts: only approved engine-emitted change statements with evidence. UI must not calculate patterns from daily variations.
6. Continuity cue: at most one approved line per Today. No UI synthesis.
No new Mirror storage is created in this phase. The present renderer shows current runtime facts and honest deferred states only. Return tab selection uses standard navigation events, explicit tab roles/states, an accessible navigation landmark and the existing inert-when-blurred boundary.

## Persistence / privacy
Existing authenticated account creation and v2 runtime persistence stay intact. v2 practice is device-local, not synced; signing out clears it. Email authentication sends email through the existing service. Words and correction notes remain optional, safety-only and unstored. Landing samples are memory-only; no demo answer is used for selection or profile. Existing account setup still creates legacy account/cycle records: retiring that schema is Claude's controlled migration task. No frontend workaround.

## Empty and progressive states
Beginning: “A clearer view begins with a little practice.” No findings, not a personality profile. Practice: actual nonconsecutive days count only. Reflection in Today: exact engine insight, uncertainty tier and evidence disclosure. Mirror does not duplicate completion reflections because the current store does not expose reactive eligibility/correction state. Carrying: only current named commitment when supplied. Archive/capacities/shifts: explain they are not available in this beta; never show synthetic claims in authenticated UI. Demonstration examples on discovery are explicitly fictional and separate from user data.

## Motion, responsive and accessibility
180ms direct feedback / 280ms disclosure where used / 400ms entry, settling easing and at most 8px; no ambient loops, compulsory waiting or scroll parallax. Reduced motion is immediate. Editorial width bounded on desktop; hero/sample can sit alongside one another; mobile stacks chapters and responses. Test 320×568, 390×844, 768×1024, 1024×768, 1440×900. Controls at least 44px, visible focus, meaningful headings, native roles, new prompt focus, keyboard choices, exact privacy descriptions, no color-only judgement. No modal introduced without focus management.

## Unresolved product / beta decisions
- Domain routing: move mirar.life to the new public root with auth callback allowlist review; no deployment here.
- Mirror historical read model and progressive data above require backend/product integration. No fake intelligence.
- Device-local state and sign-out wipe are beta limitations; cloud continuity needs explicit migration/privacy review.
- Hindi/Gujarati copy and intentional fonts need localization work; this transformation is English development UI.
- Safety detector/resources remain pre-production safeguards pending expert review.
- Founder credentials shown only as already publicly documented; no invented testimonials or efficacy claims.
- No new rest/contradiction surfaces until the engine contract enables them.
- Auth delivery and authenticated production account testing need configured credentials/user verification; local mock tests are not proof of delivery.

## Implementation and review entry points
Production routes: `/` discovery (signed out); `/login` email entry; existing `/auth/callback`; `/(auth)/onboarding` existing idempotent account creation; `/(onboarding)` short introduction; tabs Today / The Mirror / Me; public `/privacy` beta behavior explanation. The privacy page describes the implementation and does not replace legal policy. Authenticated root still redirects to Today. Public root/privacy and auth callback are the only new explicit guard exceptions; private tabs remain protected. The existing magic-link store and account writes are unchanged.

`npm run visual:review` → `http://127.0.0.1:5174/?experience=discover` for a clearly labeled simulated-sign-in, real-runtime, memory-only journey. `npm run web -- --port 8082` runs the actual integrated shell when configured. See `VALIDATION.md` for the local mock boundary and evidence; never deploy a mock-enabled build.

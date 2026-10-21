# Realignment reconciliation: founder decisions and Codex PR #6

**Date:** 22 October 2026. **Status:** consolidated handoff. Planning, read-only evaluation and disposable-database checks only. No engine change, Supabase migration, Cashfree work, production deployment, merge, spending or unapproved runtime implementation. G3 continuity (`mirar-g3-rev2-integration`) and E1 entitlement are preserved untouched.
**Sources read:** `MIRAR_VALUE_REALIGNMENT_SPEC.md` (`e277ce4`), `FIRST_14_DAYS_EXPERIENCE_AUDIT.md`, `MIRAR_VALUE_AND_RUNTIME_CONTRACT.md`, Codex branch `codex/mirar-everyday-practice-exploration` (`explorations/everyday/`, implementation `5781599`, validation `9432205`; PR #6). Verified: the branch changes only `.gitignore` and `explorations/everyday/**`.
**Recorded constraints (founder):** curiosity entry, practice as the product; S1 conceptually approved but held; A9–A11 only as isolated flagged simulation; light by default with no depth question in onboarding and deeper practice always voluntarily reachable; the 348-hour trial still starts only at the first completed **engine** rep (pilot completions do not start it); A3 stays a pilot proposal; A8 waits for human testing; evidence thresholds, correction rules, privacy, safety, G3 and the trial are unchanged.

## 1. The three prototypes
Codex's own README states the status honestly: only Attention runs real runtime code; Message and Reply are mocked state machines; nothing is stored, sent or counted; no human results exist.

| | **Message** · "A full stop. Or a whole story?" | **Attention** · "A little less everywhere." | **Reply** · "Before you say yes." |
|---|---|---|---|
| What the person does | Reads a fixed fictional message ("Fine."), states a first reading, moves between *the words / my reading / another reading*, leaves the meaning where they choose | Picks up to five pulls, gives each exactly one place (attend now / set aside / leave open / do nothing / unknown); only one can be foreground; optional self-ended hold; says how it sits; may rearrange once | Edits an unsent reply to a fictional favour (keep, shrink, check first, decline, plus an optional limit line), reads it beside what is known and unknown |
| Genuine behavioural operation | A guided distinction (words vs added meaning). The person *chooses views*; they build nothing of their own | **Yes.** Allocation under a constraint; the arrangement is the person's own artifact | Partly. Composition from authored parts; an artifact (the draft), but within a fixed menu |
| Same-session value | A concrete experience of "same words, different readings"; low | A visible arrangement with unknowns kept visible; highest | An edited piece of wording beside the scene's limits; moderate, with a risk of a "right answer" |
| Support today | **Mocked** (two scenes) | **Pilot-supported**: `PilotSession('attend')` unchanged; fictional wrapper only | **Mocked** (new composer; `PStep` does not authorise it) |
| Family (refined contract) | Reframe, light, fictional (F3) | Attend (F2), full form | Relate/Choose hybrid (F5/F6), new |
| Entry burden / friction | Lowest (one tap to a first reading) | Highest (up to 8 options, then several screens, ≈90 s) | Moderate |
| Safety / privacy | Fictional, no text, lowest risk | No text; the real list includes "A worry about later" and "Something I have been avoiding" | No text; scripts about declining/boundaries can read as prescriptive |
| Implementation distance | Smallest; no runtime; needs a scene bank | Smallest *real* practice: already exists on staging as an optional pilot | Largest: new mechanics, content, safety review |

**Strongest first impression (hypothesis): Message.** Smallest burden, no personal disclosure, an immediate "aha". Reply is the most relatable social scene and may compete.
**Strongest substantive practice: Attention.** A real operation, a tangible artifact, existing runtime and an implemented evidence boundary.

**One defect to fix before any study (presentation only).** Attention's wrapper tells the person to "choose for this made-up scene, not about yourself", but the runtime's own prompts say "What is pulling at your attention **right now**?" and `“A worry about later”: where does it go?`. The runtime owns those strings, so a fictional wrapper contradicts them. Two clean options: **(a) run it as the real pilot about the person's own afternoon** (a fixed list, no typing, nothing saved; recommended: it is what could ship and avoids the contradiction) or **(b) change the runtime's prompt strings for a fictional mode** (a pilot-runtime change; not recommended for the study). Reply's scene also hints that "half an hour" is the answer (Codex notes it); keep, and observe it (Codex's question 3).

**Recommended for first human testing: all three, as the founder specified**, with the Attention decision above. Fallback if the study must shrink: **Attention + Message** (substantive practice + lightest entry); defer Reply. **Not covered by this study:** candidate A from the spec (the engine day-one rep with a real payoff) and the current echo as a baseline; the study cannot say whether any prototype beats today's experience. Recommend a later, even smaller check of A against the current close once S1 exists.

**Least costly responsible route:** *Attention* → keep it as the existing optional pilot on the practice shelf (device-only, outside the engine), add a lighter mode (≤ 3 pulls, hold optional) as pilot configuration (a pilot-runtime change, not the engine); *Message* → a labelled, stored-nowhere "try" for first-run curiosity with an authored scene bank (static, no runtime); *Reply* → wait for the study and for content and safety review before any build.

## 2. Shared behavioural and frontend contract (rehearsal practice, v0)
Applies to all three and to any later practice. It adds nothing the engine must know.
1. **Shell:** entry in a familiar scene → the operation → a response/stance → a closing that is a typed payoff → optional next step (mechanism note, another scene, leave). Each step has an equal "I don't know" or "leave it"; Back where the runtime allows.
2. **Completion:** only a closing reached *after the operation* counts. Leaving anywhere is `left` and never a completion. A fictional rehearsal is never counted, stored, sent or shown in the Mirror ("this try stays only in this open page" must remain true).
3. **Payoff = the spec's `PayoffView` (`RepValue`)**: `did` (operations actually performed), `made` (the arrangement/draft/readings as the person left them), `passedOver`, `stillOpen` (always including what the scene cannot establish, e.g. what the friend meant), `kept` (nothing, for fictional), `notKept`. Rules: no praise, no "helped/worked/improved", no inference about the person; unknown/early-exit paths claim less; a swap test (a closing cannot be exchanged between two different tries).
4. **Labels:** every screen carries `source: 'pilot' | 'prototype'` and `scope: 'fictional' | 'own_life'` in plain words ("Real Attend session · your own afternoon" or "Prototype · mocked · not saved"). A mocked element is never described as built.
5. **No new data surface:** no text field, no storage, no network, no analytics; safety copy and crisis resources remain reachable.
6. **Frontend baseline already demonstrated by Codex (keep):** 44 px targets, keyboard-complete, focus moves to each new heading, `aria-pressed` for selection, disabled option carries its reason, reduced motion respected, 320–1440 without overflow; plain-language frame (no "offered question / selected response").
7. **Data shapes for new mechanics (prototype-only until built):** `views` (switch among ≥ 2 readings; completion requires that the alternative was actually visited, with the reason shown), `compose` (select authored parts; only coherent combinations are generated). Existing real shapes (`PStep` `choice | multi | hold`) are used unchanged for Attention.
8. **Not authorised by this contract:** pilot data entering engine evidence (A7), pilot-created commitments (A6), return offers or memory promises from a fictional try, any claim of effect.

## 3. Persist-on-serve versus persist-on-Begin (evaluated)
Method: `scripts/sim/persist-trigger-eval.ts` (read-only; unchanged runtime, recorder and replay). 40 simulated people × 4 behaviour patterns × 14 days; the same person behaves identically under each trigger. **N** = today, **S** = the host calls the existing `progress([])` when Today shows the rep, **B** = when the person taps Begin. Results in `docs/sim/persist-trigger-eval.md`.

| Behaviour | Trigger | Same exercise two days running | Reps the engine knows were left | Days in ease/simplify mode | Distinct exercises in 14 days |
|---|---|---|---|---|---|
| **Reader** (reads Today, usually leaves) | N / **S** / B | **8.0** / **0.0** / 6.0 | 0 / 10.7 / 2.4 | 0 / 11.5 / 1.9 | 5.5 / 14.0 / 7.5 |
| **Glancer** (opens in the morning, sometimes returns at night) | N / S / B | 3.3 / **0.0** / 3.3 | 0 / 5.0 / 0 | 1.1 / 7.3 / 1.1 | 9.7 / 13.6 / 9.7 |
| **Starter** (taps Begin, sometimes stops) | N / S / B | 3.6 / 0.0 / 0.0 | 0 / 6.0 / 6.0 | 1.1 / 8.2 / 8.2 | 9.3 / 13.8 / 13.8 |
| Steady (control) | N / S / B | 0 / 0 / 0 | 0 | 1.2 | 13.1 |

**Findings.**
- **Persist-on-Begin does not fix the audit's problem** for the people who have it: a reader never taps Begin, so the engine still never learns the rep was left (6.0 repeated days remain). **Persist-on-serve eliminates the repeated question** for readers, glancers and starters.
- **The cost of serve:** a glance that is not followed by completion is recorded as *left*, which moves the engine into its existing ease/simplify mode (light, short, choice-only; open threads rest) on many days (readers 11.5 of 14, glancers 7.3). For a disengaging person that is the intended behaviour; for someone who merely peeked it makes the product lighter and quieter sooner. Same-day returns are unaffected (a glancer who comes back that evening is not "left").
- **Abandonment events:** each left rep becomes a `rep_abandoned` structured event (template id and day only) when backup is on; volume stays at most one per day.
- **Replay and recovery (important):** with either trigger, the **shipped replay no longer matches** the live state (S: 0/40 for readers, glancers and starters; B: 4/40 for readers and 0/40 for starters, while glancers record nothing under B and still match) because replaying an abandoned rep does not persist the served rep. A replay that also calls `progress([])` for an abandoned rep matches **40/40** for every pattern and trigger. So the trigger change must ship **together with a one-line alignment in `lib/innerRep/backup/replay.ts`** and its tests. Reload within the same day behaves identically under N, S and B (the rep is the same; draft semantics unchanged); a steady user is unaffected.
- **Recommendation: persist-on-serve**, with two conditions the founder should accept knowingly: (1) glance-without-return counts as left, so ease mode will engage for such people; (2) replay is aligned in the same change. Persist-on-Begin is the conservative alternative that keeps today's behaviour for readers (and so keeps the repeated question). Add one observation to the human study: "did the next day's exercise feel lighter or repetitive?"

## 4. Corrected human-study protocol (prepared, not started)
**Design.** 12 adults (18+), each tries **two of three** prototypes. The six ordered pairs (Message→Attention, Attention→Message, Message→Reply, Reply→Message, Attention→Reply, Reply→Attention) are each used **twice**. Result: **8 exposures per prototype** (24 in total), **4 as the first exposure and 4 as the second** for each prototype. Segments (self-described, 4 each): not into self-reflection, somewhat curious, already reflective. One moderated sitting per person with a short break between the two, plus a next-day "open it again only if you feel like it" message (voluntary return recorded within 72 hours).

**Why the earlier thresholds were wrong.** They were written for 12 exposures per candidate. They are now per prototype on **n = 8** and restated in fractions of 8.

| Measure (per prototype, 8 exposures) | **Pass** (all must hold) | **Fail** (any one) |
|---|---|---|
| M1 can say what they did (reviewer-coded, blind) | ≥ 6 of 8 | |
| M2 interesting or enjoyable (1–5) / heavy or serious (1–5) | median ≥ 4 / median ≤ 2 | |
| M4 forced choice quiz / chore / practice / game | | ≥ 3 of 8 choose "quiz" or "chore" |
| M5 wants to do another (stated) | ≥ 6 of 8 | |
| M6 discomfort | at most 1 mild, none severe | any severe; any report of pressure |
| M7 payoff truthfulness and swap test | 100% pass; no statement a participant calls untrue | any untrue statement |
| Abandoned mid-exercise | ≤ 1 of 8 | ≥ 2 of 8 |
**Reading the result honestly.** A 6-of-8 pass is a *screening gate*, not an estimate: its 95% interval is 35% to 97%, and a prototype whose true rate is 60% still passes about 31% of the time (70%: 55%; 80%: 80%). The study can find problems and rule out failures; it cannot rank prototypes with confidence, prove conversion, retention or effectiveness, or say anything about segments (about 2–3 exposures per prototype per segment: descriptive only). Also report the **first-exposure-only** results (4 per prototype) to check for order effects. If more than one prototype passes, the choice is a product decision (Attention for substance, Message for entry), not a statistical one. A prototype that fails on safety or truthfulness is dropped regardless.

**Consent (plain language).** Purpose (comparing prototypes, not testing the person); voluntary; stop any time without reason; what is recorded (the moderator's notes, ratings, short quotes; **no screen or audio recording unless separately consented**); no personal words are typed into any prototype and nothing is stored or sent; study code instead of name in notes, notes kept in the founder's own storage and deleted on request; not therapy or treatment; contact person; no payment details; any thank-you is not conditional on answers.
**Safety.** Moderator script with stop rules (distress, request, discomfort); crisis resources visible before and after (112; Tele-MANAS 14416 / 1800-891-4416); fictional scenes avoid triggering topics; Attention in own-life mode uses a fixed list with no typing and the moderator says the person may skip any item; no one who is currently seeking treatment through Mirar is recruited.
**Accessibility.** Run on the participant's own phone where possible (most likely real use) and on desktop; ask about accommodations beforehand; large-print and verbal consent; state clearly that VoiceOver/TalkBack, switch control, forced-colours and physical-device behaviour were **not** tested by Codex's automated and emulated checks (their report lists 37 contrast "incomplete" results manually reviewed); screen-reader users may opt in but no accessibility claim is made.
**Prototype disclosure (read aloud and on screen).** "This is an early prototype. Some parts are real software, some are mock-ups. Nothing is saved or sent. It is not Mirar's product yet, and it makes no claim about helping you." Per prototype: Message and Reply are mock-ups; Attention uses real code from an optional practice.
**Approvals needed before the first session:** the founder's go-ahead; an **independent adviser's review of the consent and safety script (none is appointed; do not claim a review)**; Codex's pre-study fixes (Attention mode, section 1); a static, login-protected preview of the isolated build for participants (no production, no cost) or in-person devices; the thank-you decision (spending).

## 5. S1 readiness and outstanding design decisions
S1 stays **held**. What is ready, and what is not:
| S1 component | Ready? | Outstanding |
|---|---|---|
| R2 persist the served rep | **Evaluated** (section 3) | trigger choice (serve recommended); replay alignment and recorder tests; accept "glance = left" |
| R3 totals and rolling counter | Ready to specify | wording ("N days so far" or none); never a streak |
| R1 `payoffFor` + family overlay | Contract defined (spec 4.1, section 2) | the five-field frames for the 23 templates and their review; how a one-tap payoff avoids sounding like praise |
| R4 Mirror practice view | Concept defined | everyday verbs per family; "what Mirar is holding" only when real; no near-reading counts |
| P1 UI (payoff, shelf, plain frame, depth setting in Me) | Needs Codex, using the prototype closings as the reference for tone | shelf contents at launch (Attend as pilot; Message/Reply labelled prototype or absent) |
| Depth | **Default light, no onboarding question** (decided) | where and how a person later raises it (Me setting; invitations) and the A9 simulation |
**Decisions still needed:** (1) the persist trigger; (2) Attention study mode; (3) whether the first-run "try" is Message (curiosity) or the engine rep with a payoff (candidate A); (4) counter wording; (5) the payoff voice for permission paths; (6) whether the depth setting is visible at all before A9 is explored.

## 6. Minimal technical sequence, dependencies, effort
Estimates are rough planning bands in working days, not commitments; no external cost.
| # | Step | Owner | Depends on | Effort |
|---|---|---|---|---|
| 0 | Pre-study fixes: Attention mode wording; static preview of `explorations/everyday` | Codex | founder go-ahead | 1–2 |
| 1 | Study materials (consent, script, rubric, adviser review) and sessions | founder + Claude | adviser, step 0 | ~3 prep + ~1 week elapsed |
| 2 | **S1a**: persist-on-serve host change + replay alignment + recorder/replay tests (runtime-class, no engine) | Claude | approval of the trigger | 2–3 |
| 3 | R3 totals/counter accessors | Claude | none | ~0.5 |
| 4 | **S1b**: `payoffFor` + overlay + swap-test suite; Codex payoff/Mirror/frame UI | Claude + Codex | study result informs tone | 3–5 + 3–4 |
| 5 | A9–A11 **isolated flagged simulation** (a copied, flagged engine fork under a new directory, never the frozen files; byte-identical when flags are off) | Claude | authorised; can run in parallel with 1 | 8–12 |
| 6 | Attend light mode and shelf entry (pilot configuration, device-only) | Claude + Codex | study | 2–4 |
| 7 | Message "try" as a labelled, stored-nowhere first-run curiosity entry | Codex (+ scene authoring) | study | 2–3 |
| — | A3 pilot, A8, Reply build | — | study outcome, separate approvals | not scheduled |
Critical path: step 1 (study) gates 4, 6 and 7; steps 2, 3 and 5 can proceed in parallel and are independent of the study's outcome.

## 7. Supabase compatibility note (30 October 2026)
Supabase will stop adding automatic Data API grants to **new** `public` tables for **existing** projects on 30 October 2026; existing tables keep their grants; RLS is unchanged; the announcement says nothing about function `EXECUTE`. **Result for Mirar:** the E1 entitlement draft and the G4 continuity (Option B) draft are **compatible with no change**: both already grant explicitly and least-privilege (clients: two entitlement functions; select-only on three continuity tables behind RLS; no `anon`; no client writes), and both pass a fresh-database check under today's, the announced and a stricter regime (`scripts/release/grant-regime-check.ts`: **433 assertions on 6 fresh disposable databases**, PGlite 16 and native PostgreSQL 17.5, legacy / new / strict). **One regime-dependent point:** `service_role` has table access today and will not on new tables; any future Edge Function that uses the service key against a table (billing webhooks) needs an explicit grant or, preferably, a definer RPC, and must never be given `anon`. Added to the release checklist as `RELEASE_RUNBOOK.md` §6, with the rule never to copy the announcement's broad example grants onto private customer tables, and a read-only audit of existing tables' grants for the founder. Nothing was applied to Supabase.

## 8. Exact next founder approvals
1. **Study go-ahead** for the corrected protocol (12 people, two of three prototypes, 8 exposures each) and the Codex pre-study fixes; **approval to host a static, login-protected preview** of `explorations/everyday` (no production, no cost); **appointment of an independent adviser** to review the consent and safety script; **decision on any thank-you** (spend).
2. **Attention study mode:** own-life real pilot (recommended) or fictional wrapper.
3. **S1a** (persist-on-serve with replay alignment, runtime-class): approve, choose persist-on-Begin instead, or hold.
4. **A9–A11 isolated flagged simulation fork:** authorise (no production engine change), or decline.
5. **PR #6:** confirm it stays an unmerged exploration branch (this handoff does not merge it); it also predates the owner fixes in `mirar-g3-rev2-integration`, so it should not be merged into product branches as is.
6. *Optional, at E2:* whether to add an explicit `revoke all … from service_role` to the E1 and Option B drafts for regime-independent behaviour.

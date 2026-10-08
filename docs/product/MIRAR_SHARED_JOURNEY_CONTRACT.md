# Mirar — shared Product × Experience contract

One document for the whole customer journey, replacing the two parallel contracts as the working reference: Codex's `docs/experience/MIRAR_UNIFIED_EXPERIENCE_CONTRACT.md` (`c78064c`) and Claude's `MIRAR_VALUE_AND_RUNTIME_CONTRACT.md`. It states, per stage, who owns what, the data that may be shown, and when the stage counts as done. **Proposal for joint sign-off. Not merged, not deployed.**

## Principles (fixed; neither side may waive them)
1. **Evidence:** every statement about the person traces to a stored structured source. Four sources are kept distinct: `user_said`, `observed`, `inferred`, `unknown`. No score, level, rank, trait or diagnosis. A rejected reading is never reproduced.
2. **Autonomy:** "I don't know" and "leave it" are always available and equal. Disagreement is feedback about Mirar's reading, never evidence about the person. Nothing pressures return (no streaks, guilt, urgency).
3. **Privacy:** no free text is stored, logged, sent or used for inference. Structured state is device-local until the durable-history decision is approved. Fictional demonstration data can never reach an authenticated session.
4. **Sequencing:** the engine owns the next step (`nextStep`). The UI never chooses a question, computes a pattern, or reads stored blobs. UI consumes only the public runtime read models below.
5. **Honesty of surface:** a graphic explains an operation; it never measures the person, and missing evidence never animates into an answer.

## Read models the UI may use (the entire data surface)
| Read model | Source | Status |
|---|---|---|
| `TodayView`, draft, `CompletionView` | existing runtime | built |
| `runtime.receipt()` — today's exact response, survives reload | `receipt.ts` | **built, tested** (240 reps, reload-equivalent, exact prompts) |
| `runtime.mirror()` — sections `said`, `practised`, `come_up`, `carrying`, `readings`, `shifted`, `unknown`; each statement `{source, text, facts, trace}`; state `empty | sparse | populated` | `mirror-contract.ts` | **built, tested** (24 simulated users; mutation-checked) |
| Continuity cue (one line, only when a follow-up is genuinely pending) | to build | **not built** (W3) |
| Consequence of a feedback answer (No 21 d / Partly held back + hedged / Not sure 7 d) | constants from `config.ts` | to expose as a read-only constant |
| Supporting observation ids behind a count | amendment A5 | **needs approval** |

## Journey contract

Columns: **Purpose** · **Experience (Codex)** · **Product / runtime (Claude)** · **Data** · **Done when**.

| Stage | Purpose | Experience | Product / runtime | Data | Done when |
|---|---|---|---|---|---|
| Discover | Understand by trying | Aperture hero; real `foc_settle` sample; **two separate modes**: real sample (inert, session-only) and a visibly inert fictional study | none | none stored | sample completes before auth; unknown ends honestly; fictional study has no live feedback and a persistent label |
| Understand | Know what practice asks | Six capacity explanations as live text, not dials | authored copy reviewed against exercise-family spec | none | no readiness/ability implication |
| Enter | Arrive with trust | Quiet entrance, ordinary email field, real sent/expired/error states | real auth only | email to auth service | first-time signup and returning login verified on the live domain |
| Onboard | Start, not be quizzed | One authored line + straight to the first real rep (or Today); no setup questions | none (A1 start-choice only if approved) | none | no quiz, skippable, no profile |
| Today | One relevant invitation | Prompt-led home; draft/resume/done; **at most one continuity line** | continuity supplier (W3); practice-days fact | supplied only | line absent unless a follow-up is genuinely pending |
| Inner Rep | Do the exercise | Supported controls; confirmation policy per decision D4 | `nextStep`; family mechanics per `EXERCISE_FAMILIES.md` | exact `StepAnswer[]` | every emitted step handled; unknown valid; no duplicate submit; resume exact |
| Integrate | Leave with something real | Exact receipt, then a close **computed from the session's answers**; unknown and "leave it" end with no instruction | `runtime.receipt()`; close from `ReceiptStep[]` | stored observations | receipt identical before and after reload; no generic advice line; commitment shown only if chosen |
| Honest Mirror | Question a reading | Equal four answers; separate response / reading planes; provenance line visible by default | `ShownInsightView`; consequence constants | feedback, correction id | acknowledgement names the recorded event and its real consequence; Skip ends the interaction; failure never shows success |
| Commitment | Carry one chosen thing | A sentence and timeframe, neutral outcomes, no task card | existing commitment machinery | label, kind, dates | exact label and date; five timeframes; past dates rejected |
| The Mirror | See what is earned | One generous sparse state; grouped sections; ledger collapsed by default; readings only from `readings`/`shifted` | `runtime.mirror()` only | none new | every shown sentence has a `trace`; empty/sparse/populated all legitimate; rejected readings absent |
| Me / Privacy | Know what is kept | Quiet utility; point-of-use disclosure | accurate retention text | none | local-retention and sign-out behaviour stated truthfully, visible before sign-in |
| Return | Come back without pressure | Same opening; depth follows supplied data only | no day-count unlocks | n/a | Day 1/3/7/30 are review fixtures, not features |

## What is genuinely worth implementing now (user value, no engine or persistence change)
1. **Integration close from the session's own answers; unknown/leave-it end cleanly** (A1). Highest value, presentation + `receipt()`.
2. **Receipt survives reload** (A2). Done in runtime; UI wiring.
3. **Specific correction acknowledgement with the real consequence; Skip ends** (A3).
4. **Mirror on `runtime.mirror()` with sparse states and a collapsed ledger** (A7).
5. **Onboarding without the quiz** (A5).
6. **Two separate demonstration modes; fictional study inert** (A4).
7. **Remove per-option decorative marks** (A9).
8. **Continuity line** (A6; one small runtime supplier).

## Decorative or low-value as designed
- Per-option ChoiceMark graphics; story artwork repeated on completion/observation surfaces.
- The three-state landing story as the *hero* interaction (the real sample is more honest).
- "Read separately" unless it demonstrably improves source comprehension and can never reveal rejected readings.
- Weave-style density; any graphic whose fullness varies with practice.
- Day-based narrative unlocks; "Day 30" content not backed by supplied data.

## Requires engine change (separate approval, versioned, simulator-tested)
- A1 cold-start template choice. A2 record a chosen move as a commitment. A3 new exercise families (Reframe, Notice-refinement, Integrate/noticing-latency, Settle). A4 rest as an exercise. **A5 evidence returns supporting observation ids** (read-only; see `ENGINE_CHANGE_PROPOSALS.md`).

## Requires persistence change (explicit approval)
- Cross-device history, durable receipts across devices, any history beyond this device. See the decision memo.

## Next integrated milestone — **M1 "Honest Day-One"** (no engine change, no migration)
Scope, in one branch off `mirar-v2-experience`:
1. Wire `receipt()` into the integration moment; unknown/leave-it close cleanly; remove the generic noticing paragraph.
2. Specific correction acknowledgement and consequence line; Skip ends.
3. Revised onboarding (no quiz).
4. Mirror consumes `runtime.mirror()`; sparse/empty/populated states; ledger collapsed.
5. Discovery: separate sample vs inert fictional study.
6. Remove per-option marks.
7. Review-state panel extended with `empty`, `sparse`, `populated` Mirror fixtures and an "unknown" rep.
8. Staging preview with review states on; production untouched.

**Acceptance for M1:** reviewer rubric (`MIRAR_VALUE_AND_RUNTIME_CONTRACT.md` §13) passes on a five-person journey review for questions 1–4 and 8; receipt identical across reload; every Mirror sentence traced; no free text anywhere (sentinel test); engine, correction, runtime, receipt and Mirror suites and the sweep pass unchanged; five-width geometry and keyboard journey re-run, with remaining accessibility checks listed rather than claimed. **Go/no-go and deploy remain separate decisions.**

## Open questions that need a decision, not more design
D1 durable history · D2 cold-start choice · D3 first exercise families pilot · D4 confirmation policy · D5 supporting-ids amendment. See `APPROVAL_DECISIONS.md`.

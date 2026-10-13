# A8 (narrow): Attend as a selectable daily rep

**Status: PROPOSAL ONLY. Not implemented, not approved, not activated.** It would be a versioned engine amendment (`v2.1.0`), flag-off by default. This document exists so the decision can be made on evidence from the integrated staging pilots.

## Why Attend first, and why this narrow
| | Attend | Look Again |
|---|---|---|
| Typed words | none (closed pull list) | yes (camera sentence), so crisis check and session-only text |
| Interpretation of the person's life | none | a *reading* is named, which sits close to the engine's own reading model |
| Maps to an existing capacity | Focus (`foc_attention`, `foc_loops`, `foc_settle`) | Growth (`gro_update`) |
| Evidence risk if wired | low (no domain, no reading) | higher |

Look Again stays a pilot until Attend has run through this amendment and testing.

## The narrow design: delegate the interaction, keep the engine's contract
The engine's `nextStep` / `StepAnswer` contract is **not changed**. The engine sees Attend as a one-step template whose single `primary` step is *performed* by the pilot runtime and whose result is one of three authored options:

| Option id | Label | Polarity | Domain | Notes |
|---|---|---|---|---|
| `attend_arranged` | "I gave each thing a place" | present | none | the rep is complete and counts as practice |
| `attend_nothing` | "Nothing was pulling at me" | absent (honest "nothing", counter-evidence) | none | complete; engine's existing "nothing" semantics |
| unknown | "Hard to tell" | n/a | none | existing unknown path; ends the rep |

Template: `foc_attend_place`, capacity `focus`, sub-capacity `allocate`, role `training`, intensity `light`, sensitivity `low`, `seconds: 90`, `domainRole: none`, `capture: { domain: never, orientation: never }`, no `followUp`, no `words`. New enum values: `Mechanism += 'allocation'`, `Template.interaction += 'allocate'`. `RepPayload` gains `delegate: 'attend'` (UI hands off to the Attend session; the UI never chooses the family).

The placement record (which pull went where, the hold, the "when") stays in the **pilot store**, linked to the engine instance id. It is not engine evidence.

## Selection, burden, variety (what the engine would do)
- **Pool:** Attend enters the training pool only when `V2.attend.enabled` and it is not blocked by any existing guard. No guard is relaxed.
- **Variety:** the existing `templateWindowReps = 14` applies to it; mechanism fatigue and format fatigue treat `allocation`/`allocate` as new values, so it is rewarded for being different but never repeated back to back. Proposed extra family cap: at most 1 Attend in any 7 completed reps.
- **Burden and intensity:** `light`, `burden: false`, so it is allowed after a burden rep (`lightAfterBurden`) and never stacks (`maxNonLightRun`). It is longer (≈90 s vs ≈25 s), so it is **excluded from the `simplify` / `ease` modes** (after unknown runs, disengagement) where the engine already prefers shorter choice-only reps. Not offered in the first 3 reps (cold start stays `foc_attention`).
- **Unknown handling:** "Hard to tell" is the existing unknown rep (`unknownPrimary`), so it feeds `unknownRun`/`disengage` exactly as any other unknown. "Nothing pulling" is the existing honest "nothing". Leaving mid-exercise is today's dismissal (no completed rep).
- **Safety:** no free text, so no new crisis surface. Same acute-distress boundary and copy as the engine; pulls such as "a worry about later" are named by the person and never raise intensity or burden.

## Evidence implications
- **Zero effect on readings.** `capture: never`, `domainRole: none`, no domain, no orientation: Attend produces no `repeated_signal`, no `cross_capacity_convergence`, no `change`, no `unresolved_thread`. Eligibility, the Partly rule, withholding and staleness are untouched because no new evidence kind or origin is added (this is deliberately *not* A7).
- **Mirror:** the engine Mirror shows only "Focus: N reps completed" as it does today. Per-pull counts remain in the separate pilot Mirror section (source-separated).
- **Receipt:** `runtime.receipt()` returns the engine step (the three-way outcome label); the Attend receipt (`RepValue`) is rendered from the pilot record via the existing adapter.
- **Commitments:** none (A6 deferred). "Set aside" stays a non-task.

## What would change in the codebase (for the reviewer)
`lib/innerRep/v2/types.ts` (two enum values, `delegate`), `templates.ts` (one template), `config.ts` (`attend` block, default off), `engine.ts` (no new rule; the family cap is one entry in `windowBlocked`), `contracts.ts` (`RepPayload.delegate` only), `lib/innerRep/runtime/v2-runtime.ts` (map pilot completion to the primary option; link instance id), `components/inner-rep/v2/DailyExperience.tsx` (hand off when `delegate === 'attend'`). Engine version bump to `v2.1.0-attend`; every stored decision records it.

## Acceptance tests required before any activation
1. Existing suites byte-identical when the flag is off: 85 / 17 / 18 / 20 / 8 plus pilots.
2. Flag on, simulated 240 reps: selection share of Attend within the cap, no back-to-back, never in `simplify`, never in the first 3 reps, never stacked with `maxNonLightRun`.
3. Evidence equivalence: with Attend present, every evidence/insight/eligibility result for the *other* reps is identical to the flag-off run (property test).
4. Unknown and "nothing" paths drive `unknownRun` and honest-nothing exactly as existing templates.
5. Receipt and Mirror: no pilot placement appears in `runtime.mirror()`.
6. Real-auth staging run, plus usability testing with people (none done yet; no benefit claimed).

## Decision requested (later, not now)
Approve building this behind a flag on a branch for simulation, or decline. Nothing here should ship in Production without: Attend usability findings, safety copy sign-off, and the Supabase/auth gates being closed.

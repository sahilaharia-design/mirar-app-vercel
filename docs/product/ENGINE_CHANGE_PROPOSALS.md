# Engine change proposals

Status: **proposals only.** The frozen engine (`inner-rep-engine-v2.0.1-correction-fix`) is unchanged and none of these is implemented. Each is a separate, versioned, testable amendment that must be approved before work starts. Any approved amendment ships as a new engine version with a new freeze tag; the v2.0.1 tag and `scripts/sim/freeze.json` are never overwritten.

Part of [MIRAR_VALUE_AND_RUNTIME_CONTRACT.md](MIRAR_VALUE_AND_RUNTIME_CONTRACT.md).

Common test requirements for every amendment:
- **Byte-identical when unused:** with the new option absent, the simulator trace for all 21 profiles × 20 seeds is identical to v2.0.1.
- The frozen suite (85), correction suite (17), runtime suite (18), Mirror suites and the 420-run sweep pass; the one known selection-bias tail is allowed and must not get worse.
- `freeze.json` updated deliberately in the same change, with a documented diff.

---

## A1 — Cold-start template choice (the simplest useful "starting intent")

**Question evaluated: should a voluntary first-focus choice shape relevance?** Yes, minimally.

**Why not a general selection bias.** A stated preference that biases every future rep narrows what Mirar learns, increases confirmation bias (the person only gets reps about what they already named), and makes the "relevance over rotation" behaviour harder to reason about.

**Amendment.** Today `coldStartTemplate: 'foc_attention'` is a config constant [CODE `config.ts`]. Make it a *per-user input of the first selection only*: the user may pick one of six capacities at onboarding ("Where would you like to start?" + "Surprise me"). The runtime passes the matching first-rep template (one per capacity) to `decide` for rep 1. Everything after rep 1 is unchanged.

**What changes.** One function argument; no thresholds; no new state beyond a stored `initialCapacity` (a structured, user-stated preference).

**Risks.** Slightly front-loads a capacity. Mitigated: affects exactly one rep, and the engine's variety and capacity-balance guards govern all later reps.

**Tests.**
1. With no choice: byte-identical to v2.0.1.
2. With choice c: rep 1 is the template for c; reps 2–14 satisfy every existing invariant.
3. Capacity balance after day 14 within the existing sweep bounds for every c.
4. Selection-bias A tail not worse.
5. "Surprise me" equals current behaviour.

**Deferred alternative (not proposed now):** a soft tie-break prior for the first N reps. Revisit only if A1 shows a measurable day-one relevance gain and no narrowing.

**Product success criteria.** First-week completion and "I don't know" rate no worse than baseline; no reduction in capacity coverage by day 30.

---

## A2 — Record a chosen small move as a commitment

**Need.** Families F5/F6 end with an optional small action. Today only `rel_connect` and `act_tiny` create commitments, with fixed labels.

**Amendment.** Allow selected options in selected templates to carry `creates: 'commitment'` with an authored `commitLabel`. The commitment machinery (future-only dates, follow-up budget, neutral outcomes) is reused unchanged.

**Does not change** commitment budgets, follow-up rules or status semantics.

**Tests.** Commitment follow-up budget (1 per 3 completed reps) holds for any mix; no template exceeds `maxAsks`; no new label contains user-provided text; the 30-day commitment-heavy profile (`committer`) invariants unchanged.

**Success.** Of users who choose a move, follow-up shows the authored label and a neutral outcome; no increase in "dropped on purpose" clustering that suggests pressure.

---

## A3 — New exercise families (catalog change)

**Need.** The valuable families (Reframe F3, Notice-refinement F1, Integrate F8, Settle F4) cannot be expressed in 23 one-tap templates.

**Amendment.** Add templates (and, if needed, step types) under a new `catalog` version:
- **F3 Reframe:** multi-select among authored readings (`best fit`, `least fit`), then a three-way weight report (`lighter / same / heavier`). New step type `pick_two`; new option semantics `weight`.
- **F1 Notice:** a two-tier option list with a `close / not quite` follow-up.
- **F8 Integrate:** four-way timing report with `stance` options (`before / as it happened / afterwards / didn't`) so the existing `change` evidence can use it. Each stance must declare `durable` correctly.
- **F4 Settle:** urge choice → response mode → optional self-paced pause (a UI step with an explicit end; the contract only records that the step was completed).

**What must not change.** Selection layers and budgets, evidence thresholds, correction semantics. New templates enter the pool with the same variety, intensity and burden rules.

**New invariants.** Each new template: completes in ≤ 90 s; supports "I don't know"; records only structured answers; has an explicit same-day outcome; passes the variety/mechanism-fatigue rules (mechanism fatigue invariant re-run with the larger catalog); safety-sensitive families gated behind the existing `sensitivity` field.

**Tests.** Catalog stress (all templates selectable, none dominates, none starved) on the 60-day runs; `freeze.json` updated; Mirror contract property tests re-run (new stance observations must be traceable and honest).

**Success.** Reviewer rubric (contract §13) items 1 and 3 pass on ≥4 of 5 users.

---

## A4 — Deliberate rest as an exercise (not the engine's no-rep)

The engine's "rest / no-rep" is disabled in the shipping config. A *rest exercise* (F7) is a different thing: a rep whose outcome is permission not to act. If wanted, add it as a template, not by enabling the engine rest rule. Requires the same A3 tests plus: never offered immediately after a "No" on the same domain; never framed as a prescription.

---

## A5 — Evidence returns the observation ids it counted (read-only)

**Need.** The Mirror's `come_up` trace currently selects observations by domain and evidence days: an approximation of the engine's supporting set. To state exactly which responses back a count, the engine must report them.

**Amendment.** `computeEvidence` adds `observationIds: number[]` to each `Evidence`. No decision, threshold, ordering or selection changes.

**Tests.** Engine, correction and runtime suites and the 420-run sweep byte-identical; a recount from the ids equals `independentN`, `promptedN`, `introducedN` for every evidence in every simulated run; the Mirror contract replaces its approximation with the exact ids.

**Risk.** Minimal: a new field on an output type. **Success.** Zero mismatches between ids and counts across 24+ simulated users.

---

## Not proposed
- Changing evidence thresholds, correction semantics, commitment budgets, context budgets or contradiction behaviour.
- Free-text inference or storage.
- Scores, levels or rankings.
- Enabling contradiction insights.

## Approval requested
A1 (small, safest), then A3 for two families (F3, F1) as a pilot with the simulator invariants. A2, A4 follow, only if the pilot meets the success criteria.

# Inner Rep v2 — decisions log

Approved after the simulator review. Applied in `lib/innerRep/v2/` and verified by `scripts/sim/suite.ts` (80/80) and the 400-run sweep.

| # | Decision | Applied as | Where |
|---|---|---|---|
| 1 | 30–39% context/continuity share for an active issue is acceptable; keep the 2-in-5 cap; do not optimise lower | `budget { cap: 2, lookbackReps: 5, maxConsecutive: 2 }` unchanged. Measured share for active-issue profiles: 23–40% (the heavy-event profile is lowest; the partner-conflict-from-Focus profile highest) | `config.ts` |
| 2 | Remove orientation from the MVP collection path; keep the concept in docs | `V2.orientation.enabled = false`. The engine never emits `capture_orientation`, never asks after a check-in is accepted, no option carries one, nothing is stored. Type and schema columns remain as deferred | `config.ts`, `contracts.ts`, `templates.ts`, `state.ts` |
| 3 | Keep contradiction as an evidence concept; no user-facing insight; never infer it from daily-state variation | `V2.insight.contradictionEnabled = false`. Evidence still computed from **durable** statements only; crafted near-miss test still proves day-to-day variation is refused | `config.ts`, `insights.ts`, `evidence.ts` |
| 4a | Open context probe ≈ every 10 eligible reps | `probe.everyReps: 10` (was 7). Measured median gap for stable users ≈ 10 reps | `config.ts` |
| 4b | Multiple phrasings, not identical wording | `probe_anchor.promptVariants` (3). `variant` is chosen by the engine, deterministic per user, rotating, never the same twice in a row. No contract shape change | `templates.ts`, `engine.ts`, `contracts.ts` |
| 4c | Deterministic per-user tie-break | `State.userSeed` feeds the tie-break hash and the wording rotation. Same user → same result; different users → different first reps (distinct first-8 sequences across 20 users: 5 → ≥10) | `engine.ts`, `state.ts` |
| 4d | Keep budget and rest behaviour | Unchanged (cap 2/5; rest: 8 calm reps, ≤15% burden over 14, user's own "nothing", 28-day topic memory, 10-day gap). Rest remains **off in the app config** and is enabled only in the simulator until integration decides | `config.ts` |
| 4e | Apply the other recommended heuristic changes | Exercise window **10 → 14** applied. **Not applied:** "thread rests after 1 *not this*" (its purpose was to lower context share, which decision 1 rules out); "lower-cap lens for a declined thread" (a user-raised domain already qualifies for testing on its own; see tail below) | `config.ts` |
| 5 | Keep "no rep today"; do not try to eliminate hidden-issue cases | Kept. The 4–6-of-400 runs where rest followed the user's own "nothing" with no recent evidence are a reported metric, not a failure | `V2_SWEEP.md` |
| 6 | Never expose "probe" / "bias correction" in copy | Rule added to the contract; a test scans every authored string and every generated insight for `probe, bias, calibration, selection, lens, thread, engine` (0 hits). `probe_anchor` stays an internal id | `V2_CONTRACTS.md`, `suite.ts` |
| 7 | Do not materially change the contract while Codex implements | Only difference: `capture_orientation` is never emitted (type kept). Documented in the contract's change log | `V2_CONTRACTS.md` |
| 8 | No migration, no deploy; wait for the first Codex implementation, then behavioural integration review | Done: nothing created or deployed | — |

## Consequences measured after applying (20 seeds per profile)

- Exercise repeats start later: earliest exact repeat min day 13 → **15**, median 17 → **20** (30-day); stable user median **19**.
- Templates used per 30-day run: 16.7 → **17.9** (stable 17.3 → **19.5**).
- **Cost of window 14:** mechanism fatigue (≥3 of 5 reps sharing a mechanism) rose from 9 to **25** of 320 runs (first on day 11). Breakdown: `commitment_check` 11, `recognition` 11, `contrast` 3. Window 10 gives 19 runs (15 of them `commitment_check`). So the `recognition` cost of window 14 is real but small (2 → 11 runs), and commitment-check clustering exists regardless.
- **New finding — commitment pile-up:** due commitments are exempt from the continuity budget, so a user who creates several (tiny-action and reach-out reps both create them) can get 3 commitment checks in 5 reps. Not changed (not in the approved list; the user chose the dates). Candidate rules for later: cap new commitments per week or merge due checks.
- Open-question share of all reps: 11.5% → **~10%** (it still fires from the cadence, from "unexplained heavy answers", and on returns).
- Selection-bias A: partner-driven Relationships rep by day 2 in 12/20 seeds, by day 8 in 19/20; one seed at **day 24** (was two at 18 and 20). Tail is small-sample noise-sized but not zero.
- Rest: stable 0.8 days per 30 (3%), stable_60 2.3 per 58 (4%; max 4).
- Insights shown per run 1.55; **no contradiction insight in any run**; wording tiers: 533 supported, 86 hedged.

---

## Final adjustment before integration: commitment follow-up budget

**Problem.** Due commitments were exempt from the general continuity budget, so several due at once could produce 3 commitment checks in 5 reps. Mirar must remember commitments without becoming a reminder app, accountability software, a habit tracker or a task manager.

**Rule (config: `commitment.followUpBudget = { perReps: 3, max: 1 }`).** At most **1 commitment-focused rep in any rolling 3 completed reps**. In practice: if either of the last 2 completed reps was a commitment check, no commitment check is served today, however many are due.

**Selection among eligible commitments** (explicit, deterministic, no score):
1. dated before undated (a "no deadline" revisit is always last);
2. never-asked before already-asked;
3. due date closest to **today** by absolute distance, so an item 6 days overdue does **not** outrank one due today (overdue never creates unlimited priority);
4. lowest id (oldest).

**Behaviour that follows.**
- One rep, one commitment. Never combined into a checklist; each check is the same single-question rep as before.
- Commitments that wait stay eligible. The trace records, for each, that it was deferred and why (`Deliberately let rest`). They still follow the existing lapse rule: if nothing is asked within 7 days of the date, the system records **`unconfirmed`** (neutral; set only by the system; never a failure, never shown as one).
- Only the user sets done / partly done / postponed / changed my mind / decided not to. Absence of a follow-up changes nothing the user said.
- Ask limits are unchanged (2 asks per user-set date; one gentle revisit for "no deadline").

**Not changed:** context share, open-question cadence, exercise window, capacity selection, orientation, contradiction, rest, catalog size, `docs/V2_CONTRACTS.md` (verified unchanged by `git diff`) and `lib/innerRep/v2/contracts.ts`.

**Measured (all 420 runs = 21 profiles × 20 seeds, incl. the new multi-commitment profile `committer`):**

| | Before | After |
|---|---|---|
| Commitment checks | 700 (5.2% of reps) | 677 (5.0%) |
| Worst count in any 3 consecutive reps | **3** | **1** |
| Worst count in any 5 consecutive reps | 3 | 2 |
| 3-rep windows with more than one check | **130** | **0** |
| Gap of 1–2 reps between checks | 108 | 0 |
| Asks per commitment (mean / max) | 0.86 / 2 | 0.83 / 2 |

Overall volume barely moves (−3%); the change removes the clustering. Full distribution: `docs/V2_ANALYSIS.md` §9.

**Honest side effect.** When many commitments come due together, some will now lapse to `unconfirmed` without ever being asked about. That is the intended trade for not nagging, and it is recorded neutrally; it is not a failure of the user or of the commitment.

---

## v2.0.1 — post-freeze contract fix (correction flow, date contract, commitment context)

Not a heuristic change. Genuine contract defects found during integration (docs/INTEGRATION_V2.md §9) and fixed minimally. Version `v2.0.1-correction-fix`, tag `inner-rep-engine-v2.0.1-correction-fix`; the original freeze tag `inner-rep-engine-v2.0.0-mvp-freeze` is untouched.

| Change | Where |
|---|---|
| Structured correction after "Partly" (six reasons) and its effect on eligibility | `insights.ts` (`applyCorrection`, wording, cooldown), `evidence.ts` (Partly handling, `feedbackFor`), `config.ts` (`feedback.partlyNewEvidence`, `partlyCooldownMultiplier`), `docs/V2_FEEDBACK_SEMANTICS.md` |
| Feedback memory merge (a regression the new sweep invariant exposed: an "Accurate" entry on one claim shadowed a Partly/No given on another claim about the same domain) | `evidence.ts` `feedbackFor` |
| Timeframe contract: five choices; custom date = real future `date`, not a numeric offset | `contracts.ts`, runtime adapter (validation, stored `dueDate`) |
| Commitment context + the prompt names the commitment; commitments keep an authored label | `contracts.ts`, `state.ts`, `types.ts`, `templates.ts` (copy only) |
| `capacityLabel` optional | `contracts.ts`, runtime adapter |

**Config diff against the freeze:** only `ENGINE_VERSION` and the two new `feedback` keys (`partlyNewEvidence`, `partlyCooldownMultiplier`). No existing value changed (`scripts/sim/freeze.json` re-snapshotted deliberately; the diff is in the commit).
**Not touched:** selection heuristics, exercise selection, context and commitment budgets, catalog size, orientation, contradiction, rest, open-question cadence. The frozen 85-check suite is unmodified and passes; the sweep's one pre-existing open rule (selection-bias A, day 18) is unchanged.
**Measured side effect:** because "Partly" now withholds a subject until new evidence arrives, insights shown per run fell from 1.50 to 1.35 in the simulator (supported wording 540 → 470).

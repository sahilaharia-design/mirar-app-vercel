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

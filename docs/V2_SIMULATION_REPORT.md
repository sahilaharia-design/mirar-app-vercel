# Mirar Inner Rep — v2 simulator: results, failures, and what changes

> **Update after the approved decisions (`docs/V2_DECISIONS.md`).** Orientation is no longer collected; contradiction is no longer a user-facing insight; the open question runs about every 10 reps with 3 phrasings; the tie-break is per-user; the exercise window is 14 reps. Where numbers below differ (e.g. repetition, fatigue, templates used, rest frequency), `docs/V2_ANALYSIS.md` and `docs/V2_DECISIONS.md` hold the current ones; sections 3, 10–15 describe the pre-decision run and are kept as the record of what drove the decisions.


Branch `mirar-emotional-fitness`. **No migration was created or run. Nothing is deployed. The shipping app (v1) is untouched.**
This report is the output of building the v2 engine as a separate pure-TypeScript module (`lib/innerRep/v2/`) plus a synthetic-user simulator (`scripts/sim/`).

**Read this first — what these results are and are not.** Every "user" here is a synthetic profile I wrote, with behaviour I chose. The simulator shows that the engine is internally consistent, inspectable, and that it behaves sensibly under the scenarios I could think of. It does **not** show that real people will find it useful, that thresholds are right for humans, or that the wording lands. It also cannot find problems I did not model. All numbers are design evidence only.

Generated detail: per-profile day-by-day traces in `docs/sim/*.md` (20 profiles), `docs/V2_TEST_RESULTS.md`, `docs/V2_ANALYSIS.md`, `docs/V2_SWEEP.md`. Re-run everything with `npx tsx scripts/sim/{main,suite,sweep,analysis}.ts`.

## What the simulation changed (defects it found, all fixed)

Building the tests found real problems in my own design. Listed because they are the main value of this pass:

1. A **probe counted as a "capacity"**, so a convergence insight fired on day 1 from two observations.
2. **Context-driven reps counted as independent evidence** (Mirar asks about X because X was raised, the user answers X, X "keeps coming up"). Fixed: every observation from a lens/native/check-in rep, including chips tapped inside it, is `thread_continuation` and never independent.
3. **"Same capacity, different exercise" reps that were not about the domain at all** (a generic "tiny action" counted as a work rep). Fixed: only reps whose answers include that domain qualify.
4. **Thread check immediately after the thread opened.** Fixed: spacing runs from the last confirmation.
5. **Return after an absence fell through to the old thread** whenever the probe was inside its own repeat window. Fixed (probes are governed by their own cadence).
6. **An event overwrote an ongoing thread** about the same domain (real data-structure bug).
7. **An event check was re-asked the next day after "I don't know".**
8. **Feedback on one insight kind did not carry to the same domain's other kind**: "No" to "Work keeps coming up" still allowed a convergence insight about Work.
9. **Insight wording implied the user raised Focus** (Selection-bias scenario A): "Partner showed up through focus and relationships. 2 of those you named yourself." Reworded so what Mirar asked and what the user raised are separate sentences.
10. **"No rep today" was periodic** (exactly every 10th day for a stable user). It looked like a scheduled ritual. Now it requires the user's own "nothing" to an open question, 8 unburdened reps, ≤15% burden over 14 reps, and no topic named in 28 days.
11. **"Contradiction" fired on day-to-day variation** (pushing vs pacing on different days): 75 of the 694 insights shown in one 400-run set (11%). Restricted to durable statements; it no longer fires at all in the simulations.
12. **"Change" claims from 4-vs-5 samples.** Thresholds raised to 8 baseline / 4 recent.
13. **Capacity coverage counted probes and check-ins as practising Direction**, starving the Direction exercises.
14. **"Not this" answers on lenses and on check-ins did not add up** for the same domain.
15. **A no-deadline commitment revisit ignored the continuity budget.**
16. **A domain the user closed ("it feels settled") reactivated from older observations.**
17. **A confident insight shown while the user was mostly answering "I don't know".** Uncertainty now lowers interpretive confidence (tentative mode), like disagreement does.
18. **Issue-driven reps were ~45% of all reps** for a user with a real issue (cap 3 of 5). Cap 2 of 5 → ~34%, with no loss in how fast the real issue surfaces.
19. **A user-introduced domain needed a second observation before it could be tested**; now it can be tested on its own (selection-bias latency fell from median ~8 to 2 days).

Problems with **my tests** that the sweep exposed (fixed, and a reason to treat a green suite cautiously): a regex that tripped over my own "not as failure" text; `undefined === undefined` counted as "domain equals orientation"; a "hidden issue" invariant that is unobservable (now a reported metric, not a rule); single-seed assertions that flipped when an unrelated change shifted the random stream (profile checks now run across 12 seeds); one test ("no step carries raw text") was a tautology and one used hard-coded copies of the vocabularies. Both were replaced with checks that can fail.

## 1. Simulator architecture

```
lib/innerRep/v2/                       the engine (pure TS: no React Native, no Supabase)
  types.ts        State, Observation, Thread, Commitment, Evidence, Trace
  config.ts       every threshold, one place, provisional
  templates.ts    the 23 MVP templates + lens frames + domain↔capacity affinity
  contracts.ts    Step / StepAnswer / nextStep(): what the UI renders and sends
  state.ts        reducer: answers → observations, threads, commitments; calendar housekeeping
  evidence.ts     eight evidence types + refusals (near-misses with reasons)
  insights.ts     wording tiers, cooldowns, feedback handling
  engine.ts       decide(): Continuity → Life context → Training (+ constraints, rest)
scripts/sim/
  profiles.ts     synthetic users: hidden latent life + behavioural traits (engine never sees the latent)
  runner.ts       drives the real contract (nextStep) with a seeded responder, day by day
  report.ts       trace blocks + metrics     main.ts  writes docs/sim/*.md
  suite.ts        78 assertions (crafted states + multi-seed profile runs)
  sweep.ts        400 runs of invariants     analysis.ts  aggregates + threshold sensitivity
```
No Supabase, network or clock. `rng(seed)` makes every synthetic user reproducible. The runner uses the same `nextStep` the UI will use, so the contract is exercised, not assumed.

## 2. Decision trace format

Every opened day produces a trace (stored per decision). Real output (`docs/sim/relationship_conflict.md`, one seed of the final engine):

```
DAY 24
  Selected experience: dir_time#lens[partner]   [context · lens:partner]
  Primary reason: [partner] is active (4 independent observations, confirmed by the user). partner has not been tested through direction.
  Secondary reason: budget 1/2; lens offers an honest "not today / not this"
  Constraints: recovery — light reps only: the last rep carried a burden (overrode relevance and novelty)
  Continuity budget: 1/2
  Rejected: rel_boundary — same exercise, other binding, 5 reps ago (window 5) | rel_connect — same exercise 6 reps ago (window 10) | en_drain#lens[partner] — medium rep during a light-only period
  Answer: not_today
  Domain: partner   Orientation: —
  Observations created: primary:partner(thread_continuation)/absent
  Evidence created: none
  Inference: None
  Refused to infer: cross_capacity_convergence[partner] — second lens was a follow-up Mirar chose — a test, not independent evidence | change[burden_rate] — difference 5 points < 40 | resolution[partner] — 1 explicit negative(s); needs 3
```
No score is computed or shown. Training decisions list why Layer C and Layer B did not win and which alternatives lost on which named criterion (coverage, mechanism fatigue, format fatigue, positive mix, tie-break). Constraints record what they **overrode** (e.g. "recovery — light reps only (overrode relevance and novelty)").

## 3. Test suite

**77/78 pass, 1 recorded as a finding, 0 failing** (`docs/V2_TEST_RESULTS.md`).
Hard invariants run over **all** runs (400-run sweep + 240 suite runs); statistical checks run over 12 seeds with a stated pass rate.

| Area | Checks |
|---|---|
| 6 Continuity | budget cap; max in a row; per-thread cap; repeated "not this" rests the thread; refusal (unanswered check-ins); declining a thread offer; changed mind closes forever; recovery outranks relevance; no stacking of hard reps; deliberate rest documented; a resting thread wakes only when the user raises it |
| 7 Selection bias | A (Focus served, Partner real), B (asked about Work, "not this"), C (prompted Family only), continuation never independent, context-driven reps mislabelled = 0 |
| 8 Domain × orientation | six combinations, kept separate; orientation only where supported; **finding** (below) |
| 9 Evidence | one fire + at least one near-miss for each of the eight types (16 checks) |
| 10 Correction | Accurate / Partly / No / Not sure; tentative mode; banned-wording scan over every insight and trace; "No" suppresses the subject |
| 11 "I don't know" | simplify/ease, nothing escalated, no risky evidence from unknowns, lowered confidence |
| 12 Stable | nothing manufactured; positive/maintenance reps; rare rest; a passing worry is contained |
| 13 High burden | no escalation, recovery can outrank relevance, nothing discarded by the system |
| 14 Irregular | open probe after every 7+ day gap; month away → dormant, quiet lapse, no old asks |
| 16 No rep | never early / consecutive / after burden / with evidence of an active issue; not periodic; rare |
| 17 Commitments | five timeframes, six statuses, no nagging, authority rules |

**Recorded finding (not a pass):** orientation is stored but no engine rule reads it. Either use it (e.g. "future + uncertainty" → a grounding rep) or stop collecting it until a rule needs it. Collection is also sparse: ~1–3 orientation captures per 30 days per user, mostly via the open probe and when a check-in is accepted.

## 4. 30-day simulations (16 profiles, 20 seeds each; means)

| Profile | Reps | No-rep days | Context+continuity share | Max consecutive context reps | Max checks on one thread | Templates used (of 23) | Median earliest exact repeat (day) | Insights shown |
|---|---|---|---|---|---|---|---|---|
| stable | 29 | 1.2 | 3% | 1 | 0 | 17.3 | 17 | 0.1 |
| work_stress | 30 | 0.0 | 30% | 2 | 4 | 16.8 | 17 | 2.4 |
| relationship_conflict | 30 | 0.0 | 33% | 2 | 4 | 17.9 | 17 | 1.4 |
| introspective_inactive | 30 | 0.0 | 30% | 2 | 4 | 16.4 | 16 | 2.2 |
| family_past | 30 | 0.0 | 37% | 2 | 4 | 17.8 | 17 | 2.0 |
| money_future | 30 | 0.0 | 31% | 2 | 4 | 16.3 | 15 | 2.2 |
| body_present | 30 | 0.0 | 33% | 2 | 5 | 16.8 | 16 | 2.9 |
| high_burden | 30 | 0.1 | 23% | 2 | 3 | 17.9 | 17 | 0.9 |
| dont_know | 30 | 0.0 | 5% | 2 | 1 | 15.0 | 14 | 0.1 |
| disagrees | 30 | 0.0 | 18% | 2 | 3 | 18.9 | 18 | 1.8 |
| every_2_3_days | 16 | 0.1 | 27% | 2 | 3 | 12.5 | 28 | 0.8 |
| absence_week | 23 | 0.0 | 27% | 2 | 3 | 14.6 | 21 | 1.9 |
| sel_bias_A | 30 | 0.0 | 39% | 2 | 4 | 16.3 | 16 | 1.8 |
| sel_bias_B | 29 | 0.8 | 8% | 2 | 3 | 17.1 | 15 | 0.6 |
| sel_bias_C | 30 | 0.0 | 7% | 1 | 0 | 17.9 | 15 | 0.1 |
| stable_blip | 30 | 0.4 | 9% | 2 | 2 | 17.8 | 14 | 0.7 |

(`docs/sim/<profile>.md` holds the full day-by-day trace for one seed of each.)

## 5. 60-day simulations (4 profiles, 20 seeds each)

| Profile | Reps | No-rep days | Context+continuity share | Max consecutive context reps | Max checks on one thread | Templates used (of 23) | Median earliest exact repeat (day) | Insights shown |
|---|---|---|---|---|---|---|---|---|
| stable_60 | 58 | 2.4 | 4% | 1 | 0 | 19.6 | 16 | 0.1 |
| work_stress_60 | 60 | 0.1 | 27% | 2 | 8 | 19.9 | 18 | 4.3 |
| conflict_60 | 60 | 0.1 | 31% | 2 | 5 | 21.1 | 18 | 2.9 |
| absence_month_60 | 26 | 0.3 | 27% | 2 | 2 | 16.9 | 15 | 0.9 |

Longest thread run: work_stress_60 has up to 8 checks on one thread over 60 days (~1 per week), within the cap of 3 per 10 days.

## 6. Evidence-type tests (fire / near-miss)

| Type | Fires when | Near-misses that must NOT fire (all pass) |
|---|---|---|
| Repeated signal | 3 independent observations on 3 days, ≥1 raised by the user → `supported` | only 2 independent; chosen 3 of 12 times it was offered (offered often, rarely chosen) |
| Cross-capacity convergence | ≥2 training capacities + ≥3 independent observations | focus + probe only (a probe is not a second capacity); second capacity only from a lens Mirar chose |
| Change | 8 baseline + 4 recent answers, ≥40-point difference from the user's own baseline | baseline too thin |
| Contradiction | durable statements, opposite sides within 14 days | same side repeated; 25 days apart; **day-to-day state variation** |
| Unresolved thread | user-opened/confirmed, confirmed within 14 days | engine candidate; stale 20 days |
| Follow-through | any user status on a commitment | `unconfirmed` is recorded as "not failure" and no failure language appears |
| Resolution | user closes it, or 3 explicit "not today" after real presence | Mirar never asked (no opportunity); user simply stopped using the app |
| One-off event | user flags it | one heavy answer is not an event |

## 7. Correction / disagreement

- **No** → that evidence is withheld; same text is never resurfaced; the subject rests 21 days (unless the user raises it again themselves); it can return only after ≥2 **new** independent observations, hedged, and says an earlier reading didn't fit.
- **Partly** → wording acknowledges it; support is not raised. **Not sure** → waits 7 days. **Accurate** → no change.
- **Two "No" in the last 3 insights, or mostly "I don't know"** → *tentative mode*: higher evidence bar, hedged wording only, cooldown doubled. The trace says: "this is about how reliable Mirar's reading is, not about the person."
- Banned-wording scan (denial, resist, defensive, avoidance, pathology, diagnos…) over every insight and every trace line in all runs: **0 hits**.
- `disagrees` profile (says No to everything), 20 seeds: 1.75 "No" per run; 0.75 insights shown after the first "No"; ~4 days per run in tentative mode.

## 8. Irregular use

- First rep after any 7+ day gap was an **open probe in 100% of 40 returns** (`absence_week`, `absence_month_60`); old threads were not raised; after a 30+ day absence threads go dormant and past-due commitments lapse quietly with no guilt ask.
- Among the first 5 reps back from a month away: ≤1 about the old thread, in every seed.
- Use every 2–3 days: windows are counted in reps, not calendar days.

## 9. Commitments

Across all runs final states: done 238 · partly done 65 · changed mind 63 · dropped 19 · postponed 19 · unconfirmed 7 · open 63. Mean asks per commitment 0.87, **max 2**. A passed date becomes `unconfirmed` (system-set, neutral) after at most two asks and is never asked about again; "changed my mind" and "decided not to" close permanently and silently. Only the user can set any other status (enforced as an invariant across 400 runs). No insight mentions a missed or failed commitment. `introspective_inactive` (mostly changes mind) produced **zero** "avoidance"-type claims.

## 10. "No rep today" frequency (simulator only)

Stable 1.2 days per 30 (4% of opened days); stable_60 2.4 per 60 (4%; worst seed 5 = 8%); one-passing-worry profile 0.4; selection-bias-B 0.8; active-issue profiles 0.0–0.1. It never occurred in the first 10 reps, never twice in a row, never after a burden, and never while Mirar held evidence of an active issue (all runs). Rest dates across seeds are not periodic. **Known limit:** in 4 of 400 runs rest was offered while the hidden latent issue was active, because the user said "nothing" to an open question and had named nothing recently. Rest is only as good as what the user tells Mirar.

## 11. Repetition and fatigue (23 templates)

- **Earliest exact repeat** (non-continuity exercise + binding): min day 13, median day 17 (30-day); min day 14, median 17 (60-day, and the stable user alone).
- **Mechanism fatigue** (≥3 of any 5 reps share a mechanism): 9 of 320 thirty-day runs (min day 13); 3 of 80 sixty-day runs.
- **Templates used:** 30-day mean 16.7 of 23 (10–21); 60-day mean 19.4 (14–23); stable user 17.3 (16–20).
- **Capacity balance** (training reps): direction 14% · energy 17% · focus 19% · relationships 20% · growth 15% · action 16%.
- **Never selected:** none, except continuity templates for users with nothing open (by design). **Under 1% of reps:** `cont_event` (0.46%).
- **Skew:** `probe_anchor` is **11.5% of all reps** — the single most-used template, the same open question every ~8th rep.
- Sequence variety in the first week is understated by the simulator: the tie-break hash uses the day number only, so every synthetic user gets the same early order. In production it must include a per-user seed.

**Verdict on 23:** enough for the first 30 days and plausibly 60 (no template starves, nothing repeats before day 13, fatigue is rare). **Not** too few. **Poorly distributed in two ways, not too few:** the open probe is over-represented and word-for-word identical; and the `recognition` mechanism carries 5 of 18 training templates, which is why `dir_fits` (1.3%) is squeezed out. Do **not** add templates to hit a number.

## 12. Threshold failures (still open)

1. **Selection-bias A latency has a tail.** Relationships became relevant by day 2 in 12 of 20 seeds, by day 6 in 18, but on **day 18 and day 20** in two seeds (10%): the user declined the thread and rarely gave a burden answer that would trigger the context chips, so the only route was the probe cadence. Target was ≤17.
2. **Rest while an issue was hidden:** 4/400 (above).
3. **Orientation is rarely collected and never used** (finding).
4. **Mechanism fatigue exists** in 9/320 runs, mostly `recognition` ×3 (first day 13).
5. **Exact repeats start at day 13–14** with a 10-rep window; a 14-rep window moves the median to day 18 but costs nothing measurable.
6. **Context/continuity share is still 30–39%** for users with a real issue. That is the budget working as designed (cap 2 of 5), but it may still feel heavy; it is a product question, not an engine bug.
7. The 400-run sweep reports **one** violated rule class: failure 1.

## 13. Surprising or unwanted behaviour

- The open probe is the most common rep in the product (11–12%). Valuable as a bias safeguard, tiring as a repeated identical prompt.
- A single mention in an open probe + "yes, check in" produces up to ~7 context reps over a month (`stable_blip`), even for a passing worry. It rests on its own, but it is the user's own accepted offer being honoured generously.
- A user who says "settled" gets an insight echoing it ("You said this feels settled…"). It is the user's statement, not an inference, but it may read as redundant.
- "Contradiction" now never fires in the simulated runs: with only daily-state answers there are almost no durable statements (only `dir_fits` qualifies, and it is rarely served). It may not earn its place in the MVP; it is covered by crafted tests only.
- "Change" fires rarely (67 evidence objects, 48 insights across ~400 runs) and is always hedged.
- Rest and orientation depend entirely on what users volunteer; both are weak where users say little.
- The simulator's users mostly tap what they have been shown; real users abandon, mistap and change their mind more erratically.

## 14. Recommended heuristic changes

Applied in this pass (evidence in `docs/V2_ANALYSIS.md` §8): budget cap 2 of 5 (was 3) with ≤2 in a row; rest driven by the user's own "nothing"; user-raised domains testable on their own; tentative mode also for mostly-unknown users; contradiction only for durable statements; change thresholds 8/4; capacity coverage counts training reps only.
**Recommended, not applied:**
1. Probe cadence 7 → 10 reps, and **3 rotating phrasings** of the same open question (no new template). Sensitivity: latency unchanged on the median.
2. Per-user seed in the tie-break hash.
3. Exercise window 10 → 14 reps (median first repeat day 17 → 18; no measured cost).
4. Either use orientation or stop collecting it.
5. Pause "context-driven" reps once the user has said "not this" **once** on a lens (thread rest after 1 "not this" cut context share to 29% in the sensitivity run); two is the current setting.
6. Let a declined thread offer still count a user-raised domain for lens testing (the tail failure above), with a lower cap.
7. Keep rest simulator-only until product review; do not ship without the user-facing wording being decided.

## 15. Recommended catalog changes

No new templates. (a) Give the probe three phrasings. (b) Rebalance mechanisms: re-cast one of the five `recognition` templates (the weakest is `dir_fits`) as a different mechanism. (c) Review wording for presupposition ("What took the most out of you today, if anything?" is fine; "Did anything take more attention than it deserved?" still presumes). (d) `cont_event` is rarely used and could be folded into `cont_thread` with an event frame. (e) Collect real usage before authoring more.

## 16. Proposed final schema (after simulation)

`docs/proposed/017_v3_FINAL_after_simulation.sql` — **not in `supabase/migrations/`; do not run.** Changes versus the earlier draft, each driven by the simulator:
- `domains` and `orientations` as two independent vocabularies; observations carry `domain_id`/`orientation_id` separately, each with its own source.
- `inner_rep_decisions`: one row per opened day **including "no rep"**, with the full trace and a `config_version`, because thresholds will change and every decision must say which set made it.
- `domain_role` on observations, `closed_set`, `stance_durable` — all three prevented a defect above.
- `threads` gain rest fields, cadence and streak counters; new `domain_states` for pooled negatives and user-closed domains (`quiet_since`).
- `commitments` gain ask counters; only-user/only-system status rules are check constraints.
- Evidence gains `status = withheld` and explicit counts by origin; insights store their wording tier and whether confidence was lowered.
- Free text: `inner_rep_settings.free_text_retention` (`never` default | `30d` | `90d` | `keep`), tombstone fields, provenance that survives deletion (`docs/FREE_TEXT_STORAGE_MODEL.md`).

## 17. Contracts needed by Codex

`docs/V2_CONTRACTS.md`: the `Today` state, the six step types, the answer union (no text payload), the insight card contract, Home-state semantics, and the always-true behaviours (dismissible, "I don't know" everywhere, skip ≠ unknown, no overdue/missed wording, no raw text, safety stop). It is a proposal; the UI is not wired to v2.

## 18. Free text, privacy, safety (unchanged and restated)

- Free text is **not stored** in this build (hint: "Optional. Not saved in this version.").
- v2 engine does **not** read raw text; it uses only structured answers, user-selected domains/orientations, commitments, correction feedback, exercise history and response metadata. A test confirms text passed through the contract leaves no trace in state, evidence or trace.
- Retention options `never | 30d | 90d | keep`, deletion/tombstone model, and the ten things to verify about Supabase backups/PITR before any deletion promise are in `docs/FREE_TEXT_STORAGE_MODEL.md`.
- **Safety detector unchanged and not expanded.** Pre-production safeguard only; not validated. Persisted free text must not ship until external expert review, independently verified Indian crisis resources, Hindi/Hinglish/Gujarati behaviour, and explicit false-positive/negative handling are done.

## Still unknown
Whether any of this feels intelligent or caring to a real person; whether 40–50% of Home visits about one issue is acceptable at 34% or too much; the right wording for rest; whether orientation is worth its friction; whether the open probe can be made less repetitive; real abandonment and mistap behaviour; how thresholds should differ by user type; Supabase backup behaviour; and everything safety-related.

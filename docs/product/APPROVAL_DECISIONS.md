# Approval decisions

Nothing below is applied. For each: what is being decided, what we gain, what is given up, risks, my recommendation, and what must be true before it starts. The durable-history migration and engine amendment A1 are explicitly **not** being applied.

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1 | Durable structured history (opt-in backup) | Approve in principle; build on staging only | Day-30 Mirror across devices |
| D2 | Engine A1: cold-start template choice | Approve after M1 is reviewed | A better first rep |
| D3 | Engine A3 pilot: Reframe (F3) + Notice-refinement (F1) | Approve as a pilot with simulator gates | Real exercises beyond one-tap questions |
| D4 | Confirmation policy for choices | Decide by a five-person comparison | Inner Rep interaction polish |
| D5 | Engine A5: evidence returns supporting observation ids | Approve (read-only, byte-identical decisions) | Exact provenance in the Mirror |
| D6 | Safety/retention review by a qualified person | Required before wider release | Wider beta |

---

## D1 — Durable structured history
**Decision:** store structured practice history server-side, opt-in. Full design: `DURABLE_HISTORY_DECISION_MEMO.md`.
- **Gain:** a Day-30 Mirror that survives a cleared browser or new device; recovery after loss; cross-device continuity.
- **Give up:** the plain promise "practice stays on this device". Structured choices (selections, named domains, commitment labels, readings and verdicts) would sit on the server linked to the account email. Sensitive even without text.
- **Risks:** breach exposure; scope creep toward text or analytics; replay drift on engine changes; legal retention and backup questions (needs a qualified reviewer).
- **Mitigations:** opt-in default off; whitelist-validated structured payloads only; row-level security; day-level dates; delete-my-data; flag and per-user switch for rollback; replay-equivalence and RLS tests on staging first.
- **Recommendation:** approve option B in principle; no production migration until staging tests and disclosure copy are approved.
- **Required before start:** approved disclosure wording; named reviewer for retention/backup statements; staging project.

## D2 — A1 cold-start choice ("where would you like to start?")
**Decision:** let a new user pick which capacity their first rep draws from (or "surprise me"). Affects only rep 1. Spec and tests: `ENGINE_CHANGE_PROPOSALS.md` A1.
- **Gain:** day-one relevance without a general selection bias; the user has a say from the first minute.
- **Give up:** one extra choice in onboarding; rep 1 is no longer identical for everyone; the cold-start sweep numbers change slightly for users who choose.
- **Risks:** front-loads a capacity (bounded to one rep); confirmation bias if later extended to a standing preference (not proposed).
- **Tests:** byte-identical trace when unused; invariants unchanged for every chosen capacity; selection-bias tail not worse.
- **Recommendation:** approve after M1. M1's onboarding does not need it.
- **Required before start:** approval; new engine version tag; `freeze.json` update plan.

## D3 — A3 pilot: Reframe and Notice-refinement
**Decision:** add two exercise families to the catalog under a new engine version, with simulator gates. `EXERCISE_FAMILIES.md` F1, F3; `ENGINE_CHANGE_PROPOSALS.md` A3.
- **Gain:** the first exercises that are practices, not one-tap questions; a same-day outcome the user produced; the Aperture "change the frame" metaphor becomes a real mechanic.
- **Give up:** a longer, richer rep (about 60–90 s vs 20–35 s); engineering and content effort; a catalog no longer identical to the frozen v2.0.1.
- **Risks:** a reframe can feel like pressure to think differently (mitigated by "keep my view" as an equal option and a non-corrective "heavier" closing); mechanism-fatigue and variety guards must hold with the larger catalog; safety-sensitive domains need gating.
- **Tests:** catalog stress on 30- and 60-day runs; new-template invariants; Mirror contract property tests re-run; reviewer rubric items 1 and 3.
- **Recommendation:** approve the pilot only; widen only on evidence.
- **Required before start:** approval; authored content reviewed for tone and safety; the engine-version plan.

## D4 — Confirmation policy
**Decision:** auto-advance on choice, select-then-Continue, or paired-truths-only confirmation.
- **Gain of confirm:** reconsideration, fewer mis-taps on considered choices. **Cost:** one extra tap per rep.
- **My lean:** confirm paired truths only. Not supported by evidence yet.
- **Method:** five-person comparison, task effort and comprehension; no engine change either way.
- **Recommendation:** run the comparison during M1 review.

## D5 — A5: evidence returns supporting observation ids
**Decision:** allow `computeEvidence` to return the ids of observations it counted.
- **Gain:** the Mirror can state exactly which responses support a count; removes the approximation in `come_up` traces.
- **Give up:** a small change to an engine output type (no change to any decision).
- **Risks:** minimal; must not change evidence selection.
- **Tests:** engine, correction and sweep results byte-identical; the new field matches an independent recount.
- **Recommendation:** approve; low risk, high honesty value.

## D6 — Qualified review (safety and retention)
**Decision:** a qualified person reviews (a) the safety detector and crisis wording, and (b) retention, backup and disclosure statements.
- **Why:** the detector is not clinically validated; crisis resources were verified against Tele-MANAS (14416 / 1800-891-4416) and 112, but wording and coverage need expert sign-off. Retention claims must be accurate.
- **Recommendation:** required before widening the beta.

---

## Not requested
Reminders, notifications, localisation, community, AI chat, streaks, scores, or any free-text storage. Each would need its own decision.

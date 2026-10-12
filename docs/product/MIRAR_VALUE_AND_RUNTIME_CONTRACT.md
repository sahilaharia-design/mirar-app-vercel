# Mirar — value and runtime contract

Branch `mirar-product-value`. Analysis, contracts and isolated modules only. Nothing merged, deployed or migrated. Engine `inner-rep-engine-v2.0.1-correction-fix` unchanged.
Companions: [Exercise families](EXERCISE_FAMILIES.md) · [Codex alignment review](CODEX_ALIGNMENT_REVIEW.md) · [Durable history decision memo](DURABLE_HISTORY_DECISION_MEMO.md) · [Engine change proposals](ENGINE_CHANGE_PROPOSALS.md) · supersedes in part [PRODUCT_BLUEPRINT.md](../PRODUCT_BLUEPRINT.md).

Labels: **[CODE]** verified in the repository. **[SIM]** synthetic-user simulator, design evidence only. **[PROPOSAL]** not built.

Codex's `docs/experience/MIRAR_UNIFIED_EXPERIENCE_CONTRACT.md` did not exist on `codex/mirar-creative-explorations` (`460d326`, `ad4d6a9`) when this was written. §9 below is therefore my half of that contract, written against Codex's actual prototypes and `docs/creative/*`. Reconcile when theirs lands.

---

## 1. What changed in my thinking

My first blueprint diagnosed the problem correctly: generic takeaways, thin payoff, rare readings, no visible continuity, no durable history. Four of its prescriptions do not survive scrutiny:

| Earlier recommendation | Verdict | Why |
|---|---|---|
| Universal **Notice → Name → Try** | **Rejected as a universal form** | One shape for every rep becomes the next formula. It also assumes action is always the goal. It is not (§3). |
| **Display-only authored "moves"** attached to answers (P2 Phase A) | **Rejected as the payoff** | It is advice keyed to a tap. The user practises nothing during the exercise, and "Put your phone face-down" is generic whichever way they answered. It stays only as an optional last step in families where action is the right objective. |
| Mirror section 1, **a ledger of what you said** | **Kept as provenance, demoted as payoff** | I built it (`mirror-contract.ts`). Looking at real output, a list of bare choices ("Which is closer to today? You chose …") is accurate and nearly valueless on its own. It is the evidence layer other statements point to, collapsed by default. |
| **Rely on Honest Mirror readings** for day-to-day value | **Rejected** | Readings are rare by design [SIM: a stable user sees 0 in 30 days]. Daily value must come from the exercise itself. |

What replaces them: **different capacities need different forms of practice, each with its own same-day outcome** (§3); **responsiveness comes from the user's own answers, juxtaposed, not from inferred patterns** (§4); **the Mirror earns statements through a traceable contract** (§7, built and tested).

---

## 2. The customer promise and the reason to choose Mirar

**Promise:** *A few minutes a day to practise one real emotional skill, against your own life, and to see over time what actually changes. It never tells you who you are, and you can overrule it.*

**Distinctive reason to choose Mirar** (defensible, not aspirational):
1. **It is an exercise, not a log.** What you do during the session is the practice.
2. **Every claim shows its evidence and can be overruled, and overruling changes what happens.** No competitor in the category does this as a hard rule.
3. **It never turns what you say into a trait, a score or a diagnosis.**
4. **Private by construction:** no raw words stored; structured choices only.

Not the reason: aesthetics, streaks, reminders, "insights".

Emotional fitness here means capacities exercised, not feelings tracked: noticing accurately, directing attention, taking another perspective, responding rather than reacting, holding boundaries, choosing deliberately, recovering, and integrating what was learned.

---

## 3. Exercise model (summary; full spec in [EXERCISE_FAMILIES.md](EXERCISE_FAMILIES.md))

**Outcome types.** A session need not deliver all of them. It must deliver at least one that is true to the exercise:

| Outcome | Meaning |
|---|---|
| **Clarity** | The user can state something more precisely than when they began (their own words, their own choice). |
| **Capacity exercised** | They did the skill (reframed, named, paused, sorted), not just reported on it. |
| **Intentional action** | They chose one specific small thing. |
| **Permission not to act** | They explicitly chose to leave something alone, or to rest. Equal in standing to action. |
| **Continuity** | Something specific carries forward and Mirar says so truthfully. |

**When action is the wrong objective:** acute distress; grief; things outside the person's control; fatigue (rest is the exercise); ambiguity (staying with not knowing is the skill); relationships where the "action" would be a reaction. In those, the correct outcome is clarity, capacity exercised or permission, and any action prompt would be pressure.

**Families (not all ship):** Notice · Attend · Reframe · Settle · Relate · Choose · Recover · Integrate. Each defines what the user *does*, why it is an exercise and not a questionnaire, its mechanic, its same-day outcome, memory needs, variation, safety and privacy limits, and acceptance tests.

**Mechanics that earn their place:** granular naming with "close / not quite"; sorting (mine / shared / theirs); choosing between competing readings and rating how much each changes the weight; deliberate set-aside ("not now"); a self-paced pause with an explicit end; recalling a resource. **Rejected as visually novel without behavioural value:** drag-only interactions, idle breathing animations, density that grows with practice count, gesture-only input.

---

## 4. Day-one payoff

Requirement: real value in session one, with no history and no future commitment.

The first session is the **first family the user is best placed to benefit from, run end to end**, and it ends with a **responsive closing built only from what they just said**. It must hold for every answer, including "I don't know".

| Situation | What the session still delivers | Closing behaviour |
|---|---|---|
| User answers normally | Capacity exercised + clarity | Juxtapose two of their own answers ("You said X weighed on you, and that Y is within reach.") |
| **"I don't know"** | Capacity exercised (staying with not knowing is the skill) + permission | "Not knowing is a complete answer. Nothing here needs fixing." No inference, no re-ask. |
| **Declines action** | Permission not to act | The "leave it" choice is a first-class equal option; the closing acknowledges it. |
| **Disagrees with Mirar** | Clarity (about the instrument) | Disagreement is recorded as feedback about Mirar's reading, never as evidence about the person. |
| **Nothing needs examining** | Capacity exercised (noticing absence) | "Nothing to look at today is a real result." |
| **Skips an optional step** | Whatever was completed stands | No penalty copy, no re-ask. |

**Responsiveness without inference.** Allowed: restating, comparing and juxtaposing *this session's* structured answers, and a before/after the user reports within the session ("how heavy does it feel now: lighter / same / heavier"). Not allowed: any claim about the person beyond what they chose.

This replaces the generic closing sentence ([CODE] `IntegrationMoment.tsx`: one fixed noticing line for every rep) with one that is a function of the session's own answers. Any new exercise form needs catalog work: see [ENGINE_CHANGE_PROPOSALS.md](ENGINE_CHANGE_PROPOSALS.md) A3. Within the current 23 templates, only closing/receipt copy can change (presentation layer).

---

## 5. Progression: maturity states, not a program

Depth follows available evidence, never elapsed days. Day numbers below are illustrations of typical states.

| State | Typical when | What is legitimate | Gate (evidence) | Forbidden |
|---|---|---|---|---|
| **First session** (≈Day 1) | no history | One exercise, responsive closing, a truthful "what Mirar will remember" line | none | Any pattern or tendency |
| **Early continuity** (≈Day 3) | ≥1 named domain or open commitment | One line on Today for something pending; a follow-up rep the engine already schedules | a stored structured user statement | Inferred feelings |
| **Richer view** (≈Day 7) | several completed reps | A collapsed ledger of own choices; capacities practised; commitments carried | completed reps exist | A pattern from <3 independent observations |
| **Evidence-backed self-knowledge** (≈Day 30, if earned) | repeated signals and/or `change` evidence | Readings with counts and the user's verdict; hedged changes vs the person's own earlier answers; correction history | engine thresholds (`config.ts`: ≥3 independent over ≥3 days; change: baseline ≥8, recent ≥4, delta ≥0.4) | Growth claims, scores, "you are" |

A user whose month is calm gets a sparse Mirror and that is correct. Value for that user must come from the exercises themselves.

---

## 6. Honest Mirror: more useful without overstating

The engine's conservatism stays. Changes are presentation and one small runtime contract.

1. **Distinguish a one-time observation from a recurring signal.** One observation is never presented as a reading. It appears only in the ledger. A reading exists only past the engine threshold.
2. **Show why it is being offered, by default:** "Counted 3 times in 28 days: 1 chosen from a list, 2 raised by you." The provenance line is not behind a disclosure.
3. **State what each answer changes**, truthfully from `config.ts`: *No* → "I'll leave this alone for 21 days"; *Partly* → "I'll hold back until there's more to go on, and word it carefully"; *Not sure* → "I'll check again in a week"; *Accurate* → no change.
4. **Next choices that do not prescribe:** *Notice it this week · Ask me again later · Leave it*. These are not engine inputs; they are presentation, and "leave it" is always equal.
5. **Never** frame a reading as a diagnosis, a cause, or advice. Wording follows the weakest necessary link (already enforced in `insights.ts`).
6. **Daily usefulness does not depend on readings.** See §4.

---

## 7. The Mirror: contract v1 (built, tested)

Implemented in `lib/innerRep/runtime/mirror-contract.ts`, exposed as `runtime.mirror()`. Pure function of stored structured state.

**Sources (kept separate in the data):**
| Source | Meaning | Example |
|---|---|---|
| `user_said` | a structured choice, a commitment, or a verdict the user gave | "Which is closer to today? You chose “I pushed past what I had”." |
| `observed` | a count Mirar made over those choices | "Work has come up 3 times (1 chosen from a list, 2 raised by you) in the last 28 days." |
| `inferred` | an engine reading the user was shown, always with the user's own verdict | "…You said this was partly right: Something important is missing." |
| `unknown` | what Mirar has not been told | "You answered “I don’t know” 4 of 11 times… nothing is assumed from it." |

**Sections:** `said`, `practised`, `come_up`, `carrying`, `readings`, `shifted`, `unknown`.

**Statement shape:** `{ id, section, source, text, facts, trace: { instanceIds, observationIds, commitmentIds, insightIds }, date? }`. `facts` is structured so Codex can restyle `text` without changing meaning.

**Eligibility rules (enforced by tests):**
- Every statement has a non-empty `trace` whose ids exist in stored state.
- `come_up` uses the engine's own `computeEvidence` and thresholds; a domain the user said "No" to is withheld by the engine and therefore absent.
- A reading the user rejected is **never reproduced**. It appears only as "You said one of Mirar's readings did not fit. Mirar set it aside." (Mutation-tested: removing the guard fails the test.)
- `practised` is alphabetical and unranked. No scores, levels, ranks or traits (vocabulary test).
- No free-text field exists in the model or in storage.
- Same input → identical output.

**States:** `empty` (no completed reps, no statements) · `sparse` (ledger, practice, commitments, unknowns only) · `populated` (≥1 engine-counted recurring signal, reading or shift).

**Tests** (`scripts/runtime/mirror-contract.test.ts`, `mirror.test.ts`): over 24 simulated 30-day users (8 profiles × 3 seeds), 430 statements: all traceable; no forbidden vocabulary; 6 rejected readings, none revived; deterministic; exact labels; inferred statements always carry the user's verdict; 12 of 24 users remain sparse (the model does not manufacture content).

**What the real output taught me (honest limit).** The ledger of bare choices is not a payoff. The valuable statements will be the ones that need *more than the current catalog gives*: repeated structured stances over time (only 6 stance-bearing options exist [CODE]) and the noticing/reaction measures proposed in Exercise family 8. The Mirror contract is ready; its richest content depends on exercise work (A3).

**Sparse/empty copy:** keep Codex's beginning state ("A clearer view begins with a little practice."). Empty and sparse are success states.

**Not in v1 (deliberately):** cross-device history (needs the decision in the memo), comparison across time windows beyond the engine's `change` evidence, any score.

---

## 8. Structured-history privacy model (summary)

Today: device-local. Sign-out wipes. See [DURABLE_HISTORY_DECISION_MEMO.md](DURABLE_HISTORY_DECISION_MEMO.md) for the full proposal, trade-offs and recommendation: **opt-in server backup of structured state only, event-sourced and replayable, row-level secured, with delete-my-data; free text never stored.** Needs explicit approval. Nothing applied.

---

## 9. Interaction → runtime map (my half of the unified contract)

Columns: purpose · exercise mechanism · engine input → output · stored data · evidence requirement · privacy requirement · user-visible outcome · error/empty · status.

| Interaction | Purpose | Mechanism | Engine in → out | Stored | Evidence | Privacy | Outcome | Error/empty | Status |
|---|---|---|---|---|---|---|---|---|---|
| Discover sample | Let a visitor try before sign-in | One real rep (`foc_settle`), memory-only | `nextStep` only | nothing | none | nothing saved or sent | A felt sense of the practice | Sample unavailable → static copy | [CODE] built (Codex) |
| Entry/auth | Passwordless sign-in | Email → magic link | none | Supabase auth only | none | email to auth service only | Return to Today or intro | expired/invalid/err states | [CODE] built; first-time signup untested live |
| Intro | One short orientation, once | Try-one-response | none | none | none | none | Knows how it works | Skip allowed | [CODE] built |
| Today | Invite, resume, or acknowledge done | State-driven | `decide` → rep | draft (structured) | none | local | One clear next step | Load error with retry | [CODE] built |
| Today continuity line | Say what Mirar remembers | Quiet line | open thread/commitment → authored label | none new | stored structured statement | none new | "Mirar remembers" made visible | Hidden when nothing pending | **Not built** (`continuityCue` unwired) |
| Rep: list/compare | Perform the exercise | Per family | `nextStep(ctx, answers)` | answers → observations | n/a | no text | Same-day outcome (§4) | "I don't know" always | [CODE] built; form is currently one tap |
| Rep: optional words | Let user say more, privately | Textarea | safety check only | **nothing** | none | never stored/logged/sent | Felt agency | crisis → safety panel | [CODE] built |
| Integration | Release with a responsive close | Receipt + family-specific close | answers → closing | none | none | none | Outcome per §4 | Unknown → neutral close | [CODE] generic; **needs content** |
| Honest Mirror | Offer a reading with evidence | Equal Accurate/Partly/No/Not sure | `chooseInsight` | insight + feedback + correction | engine thresholds | no text | Visible consequence (§6) | none eligible → nothing shown | [CODE] built; consequence copy missing |
| Correction | Qualify, not reject | Structured reason | `applyCorrection` | reason id only | n/a | optional note is safety-checked and discarded | "Noted" + effect line | skip allowed | [CODE] built |
| Commitment | Carry one chosen thing | Option → timeframe | creates commitment | label, kind, dates | n/a | authored labels only | Follow-up truthfully scheduled | Postpone/change/drop neutral | [CODE] built |
| Mirror | Show only earned statements | Contract v1 | `runtime.mirror()` | none new | §7 | structured only | Sparse/empty truthful | `empty` state | **Contract built; UI not wired** |
| Me/Privacy | Account and retention truth | Utility | none | none | none | accurate retention text | Trust | none | [CODE] built |

---

## 10. Production-readiness blockers

1. **Rotate/disable `ADMIN_SECRET`** (Supabase). Exposed publicly for months; still valid.
2. **Real first-time signup and returning-session auth tested on the live domain** (not yet done).
3. **Clinical/expert review of the safety detector and crisis wording.** Resources verified (Tele-MANAS 14416 / 1800-891-4416, 112); the detector remains unvalidated.
4. **Truthful retention disclosure visible before sign-in** (device-local, sign-out wipes) until durable history is approved.
5. **Do not ship any Mirar statement that lacks a `trace`.** Wire Codex's Mirror UI only to `runtime.mirror()`.
6. **Native-device accessibility** (VoiceOver/TalkBack) unverified.
7. **If exercise families ship:** catalog change under a new engine version with sweep invariants (A3).

---

## 11. Workstreams and dependencies

| # | Workstream | Depends on | Owner |
|---|---|---|---|
| W1 | Wire Codex Mirror UI to `runtime.mirror()`; collapse ledger by default | Codex visual direction chosen | Codex + Claude |
| W2 | Responsive closing from session answers; Honest Mirror consequence lines (presentation only) | none | Claude (copy) + Codex |
| W3 | Today continuity line (`continuityCue`) | small runtime contract | Claude |
| W4 | Exercise families, first two (Reframe, Notice): templates, tests, simulator invariants, engine v2.1 | A3 approved | Claude |
| W5 | Cold-start template choice (A1) | A1 approved | Claude |
| W6 | Durable history | explicit privacy approval | Claude |
| W7 | User research (§13) | W1–W3 visible | Product |

Sequence: W2 → W1 → W3 in parallel with research setup → W4/W5 after approval → W6 last.

---

## 12. Go / no-go for a broader beta

**Go** requires all of: blockers 1–4 cleared; W2 and W3 shipped; Mirar statements in the product all trace; the engine, correction, runtime, Mirror suites and sweep pass unchanged (known selection-bias tail only); a five-person journey review (below) finds no unaddressed "this was just questions" verdict.
**No-go** if any: a statement about the person the engine did not emit; free text appears anywhere; a rejected reading reappears; a streak/score/urgency element is introduced.

---

## 13. Validating by user value

Automated (already in place or built here): engine 85, correction 17, runtime 18, Mirror model 4, **Mirror contract** (8 properties over 24 simulated users); 420-run sweep.

Journey review rubric (per session, scored by a reviewer watching a real first-time user; yes/no with a note):
1. Was the exercise more than answering questions: did the user *do* something (reframe, name, sort, pause)?
2. Did they reach a moment of clarity, practice, or a deliberate choice, including a deliberate choice to leave it?
3. Was the closing responsive to what *they* said, not interchangeable?
4. Did the product respect "I don't know" and disagreement without pushing?
5. Did the second session build on something real from the first?
6. Did every Mirror statement trace to something the user could recognise?
7. After correcting Mirar, did the user see what that changed?
8. Could they stop, return later, and feel no pressure?

Pass criterion for the beta: ≥4 of 5 reviewed users answer yes to 1, 3, 4 and 8 on their first two sessions; no reviewer records a statement the user finds untrue and unretractable. These are acceptance gates, not efficacy claims. **No clinical efficacy is claimed anywhere.**

---

## 14. Known limitations

- The catalog is 23 templates; exercise families beyond what exists need engine work.
- Stance-bearing options: 6 only. The richest Mirror content needs more.
- The contract is verified against simulated users, not real people.
- The ledger's bare choices are low-value on their own.
- Sample output and thresholds are provisional design values (`config.ts` says so).
- Durable history, starting intent and new exercises are proposals, not approved.

---

## 15. Branch and commit

`mirar-product-value` (from `mirar-product-blueprint` `9095186`). New: `lib/innerRep/runtime/mirror-contract.ts`, `runtime.mirror()`, tests `scripts/runtime/mirror-contract.test.ts` and `mirror.test.ts`, and `docs/product/*`. Engine, selection, evidence thresholds, contracts and the Codex branches are untouched.

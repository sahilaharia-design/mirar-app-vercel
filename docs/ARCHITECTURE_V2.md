# Mirar Inner Rep — architecture v2 (design, pre-implementation)

> **Update:** the context taxonomy in §3 was **superseded**: domain and orientation are now two independent vocabularies, and the engine, thresholds and schema changed after simulation. See `docs/V2_SIMULATION_REPORT.md`, `docs/V2_CONTRACTS.md`, and `docs/proposed/017_v3_FINAL_after_simulation.sql`.

Status: **design only.** No v2 code, no migration, no deploy. The one exception is the privacy fixes in §12, which are done and verified.
Companion files: `docs/proposed/017_v3_inner_rep_PROPOSAL.sql` (schema, not runnable from `migrations/`), `docs/ENGINE_REVIEW.md` (why this pass exists).

Everything numeric below is a **provisional design target**, to be tested by simulation and then by real use. Nothing here has been validated with users.

---

## 1. Revised engine model (summary)

The previous engine asked "which rep next?" and scored candidates mostly on rotation. Replaced by:

> **What, if anything, is the most useful thing to exercise today — given what is already open, what is happening in this person's life, and what hasn't been trained?**

Three principles carry the whole design:

1. **Relevance is primary; variety is a secondary constraint.** No "never repeat a capacity" rule. Repeating a *capacity* is allowed whenever the user's own context supports it. Repeating the same *exercise* is what's guarded.
2. **What the user said, what Mirar asked, and what Mirar inferred are separate things** — and evidence strength depends on who set the topic.
3. **Silence is a valid output.** "No rep today" is an engine outcome, never filler.

## 2. Three-layer selection architecture

```
LAYER C  CONTINUITY      What is already open?                      (highest priority)
LAYER B  LIFE CONTEXT    What seems to be going on in their life?
LAYER A  TRAINING NEED   What capacity/mechanism is worth exercising?   (fills the rest)
                 +
CONSTRAINTS (apply to all layers):  intensity cap · sensitivity cap · format fatigue ·
                                    exercise-repetition window · continuity budget · suppressions
```

**Layer C — Continuity** produces *intents*, each with an urgency tier:

| Tier | Intent | Source (always user-originated) |
|---|---|---|
| due | commitment due / postponed date reached | commitment the user created |
| due | one-off event check-in (decays) | event the user flagged |
| open | thread check ("is X still weighing on you?") | thread the user opened or confirmed |
| open | contradiction check | stored user stance + later opposite |
| soft | resolution check ("does it feel settled?") | thread quiet for N days / negative tests |
| soft | revisit after disagreement | user said an insight was wrong |

**Layer B — Life context** reads *observations*, weighted by origin (§4), into a short list of **active contexts** (e.g. `work`) with, for each: independent observations, which capacities they came through, trend, whether a user-introduced observation exists. It decides *what to look at*, not whether to speak. It can produce:
- a **convergence test** (look at the same context through a different capacity, with an honest "not this" answer),
- an **anchor probe** when context concentration has no independent confirmation (§6),
- a **same-capacity, different-exercise** rep when relevance points there.

**Layer A — Training need** is the old engine, demoted: coverage (capacities/mechanisms not recently practised), pacing (intensity ramp), format fatigue, positive-rep mix, cold start. It only decides when B and C have nothing to say.

**Pseudocode**

```
decide(today):
  constraints = {
    maxIntensity: light if last rep heavy or ≥2 recent "I don't know"; else medium,
    maxSensitivity: low if ease mode,
    blockedTemplates: those inside exercise-repetition window,
    continuityBudget: ≤ 3 of the last 5 reps may be continuity/context-driven,
    suppressions: subjects the user disagreed with (until suppress_until)
  }

  # C — continuity
  for intent in continuityIntents(sortedByTier):
      tpl = templateFor(intent, constraints)
      if tpl and (intent.tier == 'due' or budgetRemaining): return serve(tpl, layer='continuity', why=intent)

  # B — life context
  for ctx in activeContexts(minIndependentEvidence):
      if ctx lacks any independent (non-prompted-by-Mirar) observation: → anchor probe
      else tpl = templateThrough(ctx, capacity = relevant one OR a different lens, constraints)
      if tpl and budgetRemaining: return serve(tpl, layer='context', why=ctx)

  # rest — earned, never random
  if rest.enabled and history ≥ rest.minHistory and nothing open and last K reps unburdened
     and an anchor probe in the last M days found nothing: return REST(reason)

  # A — training
  return serve(bestTrainingTemplate(constraints), layer='training')
```

**Constraints beat intents.** After heavy reps Mirar goes light *even if* the thread is relevant (conflict days: relevance wants Relationships again; ease wants something gentle; ease wins, relevance returns tomorrow). **Budget beats volume:** no more than 3 of any 5 reps may be driven by a continuity/context intent, so a thread never becomes the whole product (due commitments excepted).

Every decision stores `layer_winner`, `intent_kind`, `intent_ref`, the constraints applied and the candidates considered — so "why this?" is answerable.

### Capacity repetition vs exercise repetition (item 6)

| | Rule |
|---|---|
| Capacity repetition | **No hard rule.** Layer A has a weak coverage preference; Layer B/C override it freely |
| Exercise repetition | Same *template+frame* not within ~10 days; same template with a *different context binding* not within ~5 days |
| Same format repeated | soft penalty only (Layer A) |

---

## 3. Shared context taxonomy

Small, flat, travels across capacities. One **primary** context per observation (a second is a later question).

| id | kind | note |
|---|---|---|
| work | domain | job, colleagues, own business |
| partner | domain | |
| family | domain | |
| friends | domain | |
| money | domain | |
| body_health | domain | |
| self | domain | own thoughts/habits/identity |
| time | orientation | scarcity, schedule |
| phone_tech | orientation | |
| future | orientation | |
| past | orientation | |
| uncertainty | orientation | |
| rest | orientation | |
| other | — | |
| unknown | — | user couldn't or wouldn't say |

Notes and open points:
- **Two axes are mixed** (places in life vs orientations). I kept the flat list you proposed but tagged each entry `domain|orientation` so a later split is a data change, not a migration.
- `unknown` ≠ no row: "I chose not to say" is information; absence is not.
- Context never comes from reading free text. It comes from (a) the option the user chose (`option_defined`) or (b) a chip the user tapped (`user_tapped`). The engine does **not** infer context from words. That is deliberate: it keeps text out of the engine and makes every context claim user-attributable.
- Lightweight capture: *"What's this mostly connected to?"* (chips, skippable) appears only when **(answer carries a burden or the user wrote something) AND (context not already determined by the option) AND (not asked in the last ~3 days)**. Never on neutral/positive reps by default, never mechanically.

## 4. Provenance model

Every observation records **who set the topic** and **what was available**:

| origin | Meaning |
|---|---|
| `prompted_choice` | Chosen from options after Mirar asked about that area |
| `prompted_text` | Typed in response to a prompt |
| `user_introduced` | The user raised it in an open field/probe (anchor probe, "something else", "anything else on your mind?") |
| `thread_continuation` | Answer inside a rep Mirar served *because of* an earlier answer |
| `commitment` | A status/intent the user set on a commitment |
| `correction` | The user corrected an insight |

Plus `offered_contexts[]` (what was available as an answer), `polarity` (`present | absent | unknown`), `thread_id` / `continuation_of`, and `option_label` (the exact words the user saw — snapshotted, so editing the catalog can't rewrite history).

**Chain for any shown insight (item 9 of the previous round, unchanged):**
```
Insight → Evidence (rule, counts by origin, window, version) → Observations (origin, offered set, label, time) → Instance (what was served, and why)
```
No insight row without evidence rows.

## 5. Evidence types

Each type has its own rule, wording and retirement; none is forced through the same threshold. `support` is `tentative | supported` from a rule table — **not** a made-up probability. Counts are always shown to the user.

| Type | What it says | Minimum to *claim* (provisional) | Wording style | Retired by |
|---|---|---|---|---|
| **Repeated signal** | A context/signal keeps appearing | ≥3 *independent* observations on ≥3 days, in ≥4 *opportunities*; ≥1 not from a continuation | "Work has come up 3 times — twice you chose it, once you raised it." | Resolution |
| **Cross-capacity convergence** | Same context via different capacities | ≥2 capacities, each ≥1 independent observation from a *different template*; neither was served *because of* the other **unless the second was an honest test** (below) | "Work showed up in Focus and in Energy." | Resolution / no further support |
| **Change** | Differs from the user's *own* baseline | ≥5 baseline + ≥3 recent observations of that dimension; stated as counts | "Lately 3 of 4 mention people; earlier, 1 of 6." | Next baseline |
| **Contradiction** | New evidence conflicts with a stored user stance/hypothesis | A stored user statement + a later direct opposite on the same dimension; both quoted | "Earlier you chose X; today Y. Both can be true." | User resolves it |
| **Unresolved thread** | Something important is open | **User-opened or user-confirmed** — no count | "You said this is still on your mind." | User closes; or stale → asked, never auto-closed |
| **Follow-through** | An intention has a status | From the commitment lifecycle (§7) | "You said you'd reach out this week." | User sets status |
| **Resolution** | Something stopped, or was closed | Explicit user closure (strong), **or** ≥3 negative tests/opportunity-adjusted absences (tentative) | "It hasn't come up in your last 4 check-ins." | Reappearance |
| **One-off significant event** | One high-salience thing deserves continuity | **User-flagged only** — never inferred | "Last week you said something big happened." | Time decay / user |

A single high-salience event never becomes a "pattern." A pattern never survives its own absence: resolution retires it.

## 6. Selection-bias safeguards

The failure: Mirar asks about X, the user answers X, Mirar concludes X matters. Safeguards:

1. **Count opportunities, not just selections.** "Work: 3 of the 4 times it was an option," not "3 of 4 reps." `offered_contexts` is stored on every observation.
2. **Independence classes.** `user_introduced` > `prompted` (different templates) > `thread_continuation` (collapsed to **one** observation per chain). Mirar-initiated follow-ups can *keep a thread alive* or *falsify it*; they cannot build a pattern.
3. **Continuation reps are honest tests.** A context-bound rep must offer a real "not this / not today" answer. A "no" is stored as `polarity: absent` and is counter-evidence — this is what makes convergence and resolution trustworthy. A rep with no way to answer "no" can't be used as corroboration.
4. **Anchor probes.** A rep with the **same open question and full context list** ("What's most on your mind today?", `nothing` allowed) every ~7 reps, and immediately when a context has concentrated without any independent confirmation. It estimates salience without Mirar choosing the topic.
5. **The engine never counts what Mirar served.** Only what the user answered, relative to what was offered.
6. **Wording follows the weakest necessary link.** If every occurrence was prompted, Mirar says "You chose Work when asked about attention," not "Work keeps coming up."
7. **Correction is first-class.** "Partly/No" can carry "it's more about [context]" → an observation with origin `correction`; a "No" suppresses that subject for a period (`suppress_until`).
8. **Authored content is a bias source too.** Leading prompts ("What took more attention than it deserved?" presupposes something did) need an honest "nothing" option and a wording review; a `bias_review` checklist is part of the template spec (§10).

## 7. Commitment model

Created only when the user chooses to name an intention; Mirar never infers one.

- **Timeframe (user-chosen):** `today · tomorrow · this_week · specific_date · none`.
- **Kind:** `reach_out · start · finish · decide · rest · other`, plus optional `context`. The label is structured by default; an optional short note, if the user writes one, goes in the free-text table.
- **Status:** `open · done · partly_done · postponed(until) · changed_mind · dropped_on_purpose · unconfirmed`.

| Status | Set by | Meaning | Mirar's behaviour |
|---|---|---|---|
| open | user | active | resurfaces at the due date, not on a universal timer |
| done | user | completed | optional light "how did it land?" — skippable |
| partly_done | user | some progress | one offer to continue or close; user decides |
| postponed | user | new date | resurfaces on that date |
| changed_mind | user | the goal itself shifted | closes quietly; no follow-up; may feed *resolution* |
| dropped_on_purpose | user | I'm choosing not to do it | same; **not failure** |
| unconfirmed | **system** | due date passed, no update | one soft ask, one more ~2 days later, then dormant; never "failed" |

Rules: **only the user can mark a commitment as no longer relevant.** The engine may *ask* ("Is this still something you want to do?") but cannot set `changed_mind` or `dropped_on_purpose`. `none`-timeframe items never auto-resurface; at most an optional card every ~2 weeks. If a user repeatedly answers "yes, but unclear how to start," Mirar offers a smaller step instead of re-asking the same question. Every status change is logged append-only (`commitment_events`).

## 8. Free-text persistence model

Principle: **free text is the user's language and is sensitive. It is optional, separate, deletable, and never persisted in browser storage.**

| Stage | Where | Rule |
|---|---|---|
| Composing | React state in `RepFlow` | In-memory only. Gone on unmount |
| Safety check | Client, before anything is written | On hit: nothing stored; panel shown |
| Retry on failure | **Memory only** | Retried while the app is open; if the app closes before it saves, it is lost, and the user is told. No localStorage/sessionStorage/IndexedDB |
| Long-term | Supabase `inner_rep_free_text` (separate table) | Own RLS, `origin`, checker id/version, optional `expires_at` |
| Native (later) | Possibly encrypted device storage | Only with a key held in secure storage; not on web |
| Structured answers | May use the per-user local retry queue | Contains no text |
| Analytics / logs / URLs | **Never** | No raw text in `console.*`, analytics events, error reports, query strings, route params |
| AI providers | **Never by default** | Any model use requires explicit opt-in and its own review |
| Engine | Does not read it | Evidence uses structured fields and user-tapped context only |
| Deletion | Per entry, per rep, all; account delete cascades | Backups: deleted rows may remain in the provider's backups for its retention window — **not yet verified; open item** |
| Provenance | `origin` (`prompted_text` / `user_introduced`), checker version, instance link | Text can be a salience signal via its *origin and the user's context tap*, not via parsing |

**Current build (honest):** until this model is approved and built, typed text is used only for the safety check and then **discarded** — not stored in Supabase, local storage or state. The UI hint says "Not saved in this version." That means the one text rep (appreciation) saves no words today.

## 9. Proposed database schema (revised)

Full SQL: `docs/proposed/017_v3_inner_rep_PROPOSAL.sql`. Not applied. Not in `supabase/migrations/`.

```
context_taxonomy        reference list (15), versioned
inner_rep_instances     SERVED: template@version, frame, bound context, layer_winner, intent, decision_trace,
                        local_date (unique per user), status, safety_panel_shown (bool only)
observations            SAID (structured): capacity, mechanism, signal, context(+source), polarity, burden,
                        option snapshot, ORIGIN, offered_contexts[], thread/continuation links
inner_rep_free_text     SAID (text): separate, origin, checker version, optional expiry
threads                 open items; kind ongoing|event; state candidate|open|dormant|resolved (+ who set it)
commitments (+_events)  intent, timeframe, user-only statuses, system-only 'unconfirmed', append-only history
mirror_evidence         INFERRED: 8 kinds; independent/offered/prompted/introduced/continuation/negative counts;
                        support; rule_id; engine_version; retirement
mirror_evidence_refs    evidence → observations (supports | counters | context)
mirror_insights         SHOWN: template+params, exact shown_text, generated_by, suppress_until
mirror_insight_evidence insight → evidence (≥1 required)
mirror_insight_feedback append-only; optional correction_context_id
```
Check constraints encode the human-authority rules: `resolved` threads and every non-open commitment status must be `user`-sourced; `unconfirmed` is the only system status; `engine_candidate` threads are internal and never counted as user-confirmed.
Open items in the SQL: `local_date` is supplied by the client (trust level acceptable for self-owned data); deferred trigger for "insight needs evidence"; whether `observations` should be written by the client or a function; seed of `context_taxonomy`; indexes (not yet designed).

## 10. Exercise-system architecture

Five layers that stay separate:

| Layer | Question | Example | Authored or runtime |
|---|---|---|---|
| **Capacity** | What is being trained? | Focus & Flow | authored (fixed 6) |
| **Sub-capacity** | What ability within it? | Distraction awareness | authored |
| **Mechanism** | What is the rep asking the person to do? | Recognition | authored, **reusable** |
| **Life context** | What part of life is showing up? | Work | **runtime** (from options/chips/thread) |
| **Signal** | What concrete issue? | Meetings | user-supplied or option-level |

Capacity, sub-capacity and mechanism are fixed by the **template**. Context and signal are **never authored into the prompt**; they are captured, or bound at serve time.

**Template** (authored once, versioned):
```
id, version
capacity, sub_capacity, mechanism, interaction (choice | choice_then_follow | compare | words | acknowledge | probe)
intensity, sensitivity, positive_compatible, estimated_seconds
frames:      base + optional context-bound variant ("Thinking about {context}, …")
response:    options  — each may carry {signal, context, burden}; always includes an honest "not this/nothing"
context_policy: none | answer_is_context | capture_after | inherit
unknown:     always available (UI-level)
links:       deepen_to (follow-up template), tests (the context it can falsify)
bias_review: leading-wording check, presupposition check, symmetry of options
```
**Mechanism library (reused across capacities):** recognition · inventory · contrast (compare two statements) · attribution ("whose is this?") · appreciation · acknowledgment · micro-commit · reappraisal-lite · anchor probe · commitment check · thread check · event check.

So variety comes from **template × context binding × continuity type**, not from more prompts. A `Focus × recognition` template bound to `work` today and `phone_tech` next month is not "the same question," and not a new prompt either.

## 11. Recommended number and type of exercises (MVP)

Question: how many to feel varied, relevant and non-repetitive across 30 days?

Reasoning (design, to be verified by simulation):
- A user doing ~25 reps in 30 days, with a ~10-day same-template window, needs **≥ ~12** templates to avoid forced repeats at all; anything below feels cyclical (the current 14 already did by day 8).
- Training needs **breadth across 6 capacities and ≥3 mechanisms each** so Layer A can pick by need, not by scarcity.
- Relevance needs **context-bindable templates** and **dedicated continuity templates**, so a thread doesn't reuse the same prompt.
- Quality over count: each needs the bias review.

**Recommendation: ~23 authored templates for the first 30 days.**

| Group | Count | Templates |
|---|---|---|
| Training, 6 capacities × 3 mechanisms | 18 | see below |
| Continuity | 3 | commitment check · thread check · event check |
| Calibration | 1 | anchor probe |
| Presence | 1 | "anything need attention?" (also the basis for the *no-rep* outcome) |

Training set — **14 exist** (reuse with edits: honest "nothing" option everywhere, `context` tags on options, bias review), **9 new** (marked +):

| Capacity | Templates (mechanism) |
|---|---|
| Focus | attention drain (recognition) · unfinished loops (inventory) · +settling vs switching (contrast) |
| Energy | drain/restore (recognition) · what helped (inventory, positive) · +pushing vs pacing (contrast) |
| Relationships | boundaries (attribution) · appreciation (appreciation, words) · +connection (acknowledgment) |
| Growth | updating a belief (reappraisal-lite) · facing a mistake (contrast) · +something noticed (recognition, positive) |
| Direction | know vs act (contrast) · does it still fit (recognition) · +time vs what matters (attribution) |
| Action | tiny choice (micro-commit) · credit (appreciation, positive) · +starting friction (recognition) |
| Continuity | +commitment check · +thread check · +event check |
| Calibration / presence | +anchor probe · presence (existing) |

At least 8 light, ≥6 positive/neutral-compatible, none "deep" in v1. Content must be Hindi/Gujarati-translatable (labels only; taxonomy ids are language-neutral).
**Expected effect (target, not measured):** a stable user meets each template ~1.3× in 30 days; a user in a work-stress thread meets ~6 templates bound to `work` over ~10 days without a repeated exact prompt; no template repeats inside 10 days (inside 5 if context-bound differently). Verify with the simulator before building more; adjust the count from that, not from this table.

## 12. Privacy fixes done in this pass (verified)

- **Free text no longer persists anywhere.** `complete()` strips `words` after the safety check; it is not written to Supabase, local storage or state. Local storage code (`lib/innerRep/local-store.ts`) also scrubs `words` on every read and write, so data from older builds is cleaned the first time it's read.
- **Sign-out clears everything.** `signOut` now calls `clearInnerRepData()`, which removes every Inner Rep local key (including the legacy un-keyed one) and resets in-memory state. Unsynced structured reps are dropped on sign-out (rare: needs a failed save and then a sign-out).
- **Shared-device separation.** Local data is keyed per user; if a different user id loads, the previous state is cleared first.
- **Verified:** node test (6 checks: no text written; legacy/older text scrubbed on read; users separated; sign-out clears all prefixed keys incl. legacy; unrelated keys untouched; newest-200 kept). **Real browser:** before sign-out localStorage held the legacy `mirar_inner_reps_v1` key and the per-user key; after signing out through the app: none.
- **Text input hygiene:** `autoComplete=off`, `autoCorrect=false`, `spellCheck=false`, `importantForAutofill=no` on the words field.
- **Logs / analytics / URLs:** no `console.*` in any Inner Rep file; no analytics or crash-reporting dependency found in the app; `/inner-rep` carries no parameters. (As of this pass; any future SDK must be re-checked.)
- **Copy made truthful:** the hint now reads "Optional. Not saved in this version."

## 13. Safety (conservative, not validated)

- Keep the initial layer as is: a short regex list on the single free-text field, English plus some Roman-script Hindi. **It will not be expanded phrase by phrase**; adding patterns does not make it validated.
- Known limits: misses paraphrase, indirect statements, misspellings/obfuscation, Devanagari and Gujarati script; false positives on idioms; no "uncertain" tier; client-only.
- Before **any** production persistence of free text: external expert review of the approach and wording; independent verification of current Indian crisis resources (the numbers in the app are **unverified**); explicit design for Hindi/Hinglish/Gujarati behaviour; explicit design of false-positive and false-negative handling (including what the user sees when we're unsure). No clinical claims; Mirar is not therapy.
- Open design question: whether to store `safety_panel_shown` at all (boolean only; never text).

---

## 14. Example 14-day trajectories

**These are designed walkthroughs under the proposed engine, not output from running code** (the v2 engine is not built). They are meant to test whether the rules produce sensible experiences; they will be replaced by simulator output. `O` = origin. Contexts in `[ ]`.

### A. Stable user

| Day | Winning layer · why | Rep (template, binding) | User input (O) | Stored | Mirar says / refuses |
|---|---|---|---|---|---|
| 1 | A · cold start, light, concrete | Attention drain | "Nothing in particular" (prompted_choice) | obs: absent for the offered contexts | nothing |
| 2 | A · energy untrained, positive mix | What helped | Moving my body [body_health] (prompted) | obs | nothing |
| 3 | A · pacing | Does it still fit | "Yes" | obs | nothing |
| 4 | A | Appreciation (words, optional) | skipped | unknown | nothing; no text stored |
| 5 | A | Something noticed | "Something small" | obs | nothing |
| 6 | A | Credit | "I showed up" | obs | nothing |
| 7 | **A→calibration** · ~7 reps since last open probe | Anchor probe | "Nothing in particular" (**user_introduced**) | obs: absent | nothing |
| 8 | A | Unfinished loops | "One or two" | obs | nothing |
| 9 | A | Pushing vs pacing | "Pacing" | obs | nothing |
| 10 | A | Know vs act | "Need clarity" | obs | nothing |
| 11 | A | Connection | "No one in particular" | obs | nothing |
| 12 | A | Tiny choice | "Five minutes outside" → asks timeframe: *today* | obs + commitment | nothing |
| 13 | **C due** · commitment due | Commitment check | "Done" (user) | commitment done | "Done." No analysis |
| 14 | **REST** · ≥10 reps, last 6 unburdened, no open items, anchor probe found nothing | — | — | `layer_winner=rest`, reason stored | "Nothing needs examining today." Refuses: any trait claim ("you're stable"), any pattern |

### B. Repeated work stress

| Day | Winning layer · why | Rep | User input (O) | Stored | Mirar says / refuses |
|---|---|---|---|---|---|
| 1 | A · cold start | Attention drain | Work (prompted_choice) | obs [work] | nothing |
| 2 | A · energy untrained | Drain/restore | Work (prompted_choice) | obs [work] | nothing (internal: work in 2 capacities, **tentative**) |
| 3 | **B** · work concentrated with no independent confirmation → **anchor probe** | Anchor probe | Work (**user_introduced**) | obs | nothing yet |
| 4 | **C** · candidate thread | Thread check "Is work still weighing on you?" | "Yes, a lot" (user confirms) | thread → `open`, user-confirmed | nothing |
| 5 | constraint: last heavy → light | What helped | "Time alone" | obs | nothing (ease beats relevance) |
| 6 | **B** · work thread, different lens | Starting friction, bound [work], honest "starting isn't the problem" | "Too many things at once" (thread_continuation) | obs, collapsed into the thread chain | nothing |
| 7 | **A** · continuity budget (3 of last 5) | Something noticed | "Something small" | obs | nothing |
| 8 | A | Tiny choice | "Five minutes outside" + timeframe *tomorrow* | commitment | nothing |
| 9 | **C due** | Commitment check | "Partly" | partly_done | offers to continue or close (user decides) |
| 10 | A (varied) | Know vs act | "Already know" | obs | **Insight shown:** convergence + repeated signal — "Work came up in 3 separate check-ins: attention, energy, and when you were asked what's on your mind." Counts shown: 2 prompted, 1 introduced. Not counted: the 2 continuation reps. "Does this sound right?" |
| 11 | C · after feedback "Accurate" | Thread check | "Somewhat" | thread confirmed | nothing |
| 12 | A | Appreciation | skipped | — | nothing |
| 13 | **C/B** · honest test | Attention drain, bound [work], "work: not today" available | "Nothing in particular" (**polarity absent**) | counter-evidence | nothing |
| 14 | C · soft | Thread check | "Not today" | 2nd negative | **Does not** call it resolved. Queues a resolution check for tomorrow. Refuses: "work is draining you," any cause, any trait |

### C. Relationship conflict

| Day | Winning layer · why | Rep | User input (O) | Stored | Mirar says / refuses |
|---|---|---|---|---|---|
| 1 | A | Attention drain | "Another person" → chips (burden + context unknown) → [partner] (user_tapped) | obs | nothing |
| 2 | A | Drain/restore | [partner] (prompted_choice) | obs | nothing (internal: partner in 2 capacities) |
| 3 | **B** · concentration → anchor probe | Anchor probe | "Something else" → types a sentence (**user_introduced**, free text) → taps [partner] → "Want me to check in on this?" → yes | text (separate store *if approved*; discarded in today's build), obs, **thread open** (user_introduced + user-confirmed) | nothing. The engine never reads the sentence |
| 4 | **B/C** · thread; sensitivity ok | Attribution, bound [partner]: "how much of today's mood is about that?" incl. "none" | "Most of it" (thread_continuation) | obs (chain) | nothing |
| 5 | **constraint** · two heavy in a row → light; relevance defers | What helped | "Time alone" | obs | nothing |
| 6 | **B** · relevance returns, same capacity as day 4 allowed, **different exercise** | Connection | "Yes" → commitment: reach_out [partner], *this week* | commitment | nothing |
| 7 | A · budget | Something noticed | "Something small" | obs | nothing |
| 8 | C · thread | Thread check | "Yes, but less" | confirmed | nothing |
| 9 | A | Unfinished loops | "Several" → chips → [partner] (user_tapped) | obs | nothing |
| 10 | — | Unfinished loops done; insight | — | — | **Insight:** convergence — "Your partner came up through Focus, Energy and Relationships. Once you brought it up yourself." Counts by origin shown. "Partly" → "What's off?" → chip [family] → correction observation; subject suppressed 7 days |
| 11 | **C due** | Commitment check | "Not yet" → postpone to day 13 | postponed | nothing; no failure framing |
| 12 | A | Credit | "I asked for help" | obs | nothing |
| 13 | C due (postponed date) | Commitment check | "Done" | done | "Done." Optional "how did it land?" (skippable) |
| 14 | C soft | Resolution check "Does this feel settled?" | "Mostly" (user) | thread `resolved` by user | resolution, user-sourced. Refuses: "the conflict is over" / any claim about the relationship |

### D. Introspective but inactive

| Day | Winning layer · why | Rep | User input (O) | Stored | Mirar says / refuses |
|---|---|---|---|---|---|
| 1 | A | Attention drain | "Overthinking" [self] | obs | nothing |
| 2 | A | Know vs act | "I already know. I just haven't acted." (prompted_choice) | stance obs | nothing |
| 3 | A | Facing a mistake | "Something I'd rather not look at" (burden) | obs | nothing |
| 4 | **constraint** · after burden → light | Tiny choice | "Nothing — resting, **on purpose**" | obs; **not** classed as avoidance | nothing |
| 5 | A | What helped | "Rest or sleep" | obs | nothing |
| 6 | A | Connection | "Yes" → timeframe: **none** (user) | commitment, no timeframe | nothing; will not auto-resurface |
| 7 | **calibration** | Anchor probe | "Nothing in particular" (user_introduced) | obs: absent | nothing |
| 8 | A | Unfinished loops | "Several" → chip [time] | obs | nothing |
| 9 | A | Does it still fit | "Mostly" | obs | nothing |
| 10 | A | Updating a belief | "A little" | obs | nothing |
| 11 | A | Starting friction | "I'm not sure how to start" | obs | nothing |
| 12 | **C soft** · "unclear how to start" is a signal to offer a smaller step, not repeat the question | Tiny choice, *smallest step for reaching out* (different frame, allowed) | "Send one line" → timeframe: *today* | commitment | nothing |
| 13 | A (budget) | Something noticed | "Something small" | obs | nothing |
| 14 | **C due** | Commitment check | "I've changed my mind" (user) | `changed_mind` | closes quietly. **Not** logged as failure. Refuses: "you avoid acting," "pattern of inaction." The user's own stance ("I know but haven't acted") stays a stored user statement, available for a *contradiction* check only if they later act |

### What the walkthroughs check

- Relevance repeats **capacity** (day 4/6 in C) but not the same exercise.
- Constraints (ease, budget) correctly outrank relevance on heavy days.
- Insights appear only after enough independent evidence and always show their composition; B day 10 and C day 10 each *exclude* continuation reps.
- Honest tests produce counter-evidence (B day 13), and nothing is called resolved without the user.
- D never produces an "avoider" claim, and the engine does not treat "changed my mind" as failure.

## 15. Remaining unknowns

1. **Taxonomy shape:** flat vs split domain/orientation; one vs two contexts per observation; whether `self` is too broad; whether the list holds in Hindi/Gujarati culture-specific framing (e.g. joint family).
2. **Thresholds:** every number in §5 is untested; the simulator must be rebuilt for v2 before any is trusted.
3. **Option-set personalisation:** can Mirar choose *which* contexts to offer (relevance) without reintroducing bias? Currently: allowed only if `offered_contexts` records it.
4. **Anchor-probe cadence** (~7 reps) and its cost to user patience; whether it is felt as "the same question".
5. **Friction of context capture** and the thread/commitment prompts; no analytics exist to measure drop-off.
6. **Free-text retention default:** keep until deleted vs auto-expire; whether to store free text at all in the first release (you decided yes, but retention and deletion UX are not designed).
7. **Provider backups:** deletion semantics vs Supabase backup retention — not verified.
8. **Safety:** expert review; verified current Indian resources; Hindi/Hinglish/Gujarati behaviour; uncertain-tier UX; whether to store the safety-shown flag; server-side check.
9. **Where inference runs:** client now; must move to a function before any model-generated insight.
10. **Honest-test wording:** whether an offered "not this" option reduces or invites answers; symmetry/bias review process.
11. **Rest outcome:** exact wording and the minimum history; risk that "nothing today" feels like the app has nothing to give (needs product review, and tests with real users).
12. **Template-count assumption (~23):** derived by reasoning, not by data.
13. **Multi-language:** template versioning with translations; taxonomy labels per language.
14. **Legacy users:** whether any legacy `responses` data feeds the new context model (currently: no).
15. **Timezone/`local_date`:** client-supplied; behaviour around travel and midnight.
16. **Commitment label:** structured-only vs optional note, and where the note lives.
17. **"Why am I seeing this?" UI** — data supports it; surface not designed.
18. **Existing rep wording** needs the bias review before reuse (several presuppose a problem).

Nothing in this document has been implemented beyond §12, and no migration should be run until you've reviewed §3–§9 and the open items above.

# Inner Rep engine review (pre-Phase 2)

Branch `mirar-emotional-fitness`. Nothing here is deployed. The Supabase migration has **not** been applied and should not be (see §12).
**Update:** §10's privacy findings (free text in local storage, not cleared on sign-out) were fixed afterwards; see `docs/ARCHITECTURE_V2.md` §12. The v2 schema in §6 is superseded by v3 (`docs/proposed/017_v3_inner_rep_PROPOSAL.sql`).
Evidence for the behavioural claims: `docs/ENGINE_SIMULATIONS.md` (regenerate with `npx tsx scripts/simulate-inner-rep.ts`).

## 0. What the review found

1. **The engine is, in practice, a fixed rotation.** Days 1–7 are identical for every user whatever they answer (foc_attention → rel_appreciation → gro_mistake → dir_still_fits → pos_credit → en_reset → dir_know_vs_act) in 6 of 10 scenarios. "Capacity not yet practised" (+4) outweighs every signal about the person for the first week.
2. **Relevance exists in code but cannot fire.** Continuation never triggered in any scenario. Two causes: a rep can't repeat inside its window, and the catalog has only 1–3 reps per capacity, so the pool for "stay on this capacity" is empty.
3. **Pattern claims are unreachable in the first month.** Each rep recurs about every 8 days, so "3 of 4 comparable" needs ~24+ days. Patterns fired 0 times across all scenarios. The only output was "You've chosen X twice now. Too early to call it a pattern." — often about trivial answers ("Yes, it fits").
4. **Evidence can't see across exercises.** "Work" as an attention sink and "Work" as an energy drain are different keys, so the most meaningful repetition is invisible.
5. **Insight feedback is stored and ignored.** A user who answers "No" to every insight gets the same kind of insight.
6. **The catalog is too small.** 14 reps → exact repeats from day 8, in a recognisable order.
7. **There is no commitment model.** Follow-through is one yes/no question; nothing stores an intention, a timeframe or a status.
8. **The v1 schema collapses "said" and "inferred" and has no provenance** (§6–7).
9. **My earlier safety claim was too strong.** "4/4 phrases" tested phrases I wrote. A wider probe found real misses (§9).
10. **Four defects found and fixed in this pass:** local storage not keyed per user (a second user on a shared device could see, and sync, the first user's reps); local history kept the *oldest* 200 records instead of the newest; the "end my" crisis pattern fired on "end my subscription"; the "3 × I don't know" note repeated every day.

## 1. Current engine architecture

```
catalog.ts   14 exercises (content + metadata, in code)
config.ts    every threshold, with rationale            ← new
engine.ts    decideToday(history, now) → Decision       ← refactored
evidence.ts  buildInsight / continuityCue / practiceDays (rule-based counts)
safety.ts    regex crisis check on free text
store        load history → decideToday → complete() → buildInsight → persist
```
Inputs the engine reads: completed reps (exercise, capacity, intensity, interaction type, answer, time). It does **not** read: insight feedback, free text, calendar gaps, time of day, anything outside Inner Reps.

## 2. Decision-selection pseudocode

```
decideToday(history, now):
  sorted = history, newest first
  ease        = last rep carried a burden  OR  last N reps all "I don't know"
  commit      = latest follow-through answer is "open" → {ageDays, due = ageDays ≥ minDays}
  relevant    = last rep's capacity, IF ≥ minBurdenReps burden reps in that capacity
                within recentDays AND consecutive reps in it < maxConsecutive

  if rest.enabled AND calm run AND no due commitment AND no relevant capacity:
      return REST                                   # no exercise served (OFF by default)

  pool = catalog where minimum_history ≤ n AND NOT inside repetition_window
         (a due follow-through may return early)
  for each ex in pool: score = Σ terms
      capacity: never practised +4 | same-as-last −2 (or +6 if "relevant") | rested +1/+2
      format:   same as last −3 | two back −1 | saturated −2
      pacing:   light after non-light +2 | medium when fresh +1 | deep too early −10
      ease:     gentle+positive-compatible +3 | sensitive −2 | action-oriented −1
      mix:      positive rep when none in last 5 +2
      commitment: follow-through rep when due +5
      cold start: preferred first rep +3 | "nothing needs attention" −4 (first 3 reps)
      tie-break: deterministic per day, < 0.1
  serve argmax;  label = follow_through | continuation | recovery | fresh
  return Decision{kind, exercise, reasons[], candidates[] with terms}
```
Every candidate carries its terms, so any choice can be explained ("+4 capacity not yet practised, +3 cold start…"). `rest` is a first-class outcome; the store still calls a wrapper that never returns it.

## 3. Configurable heuristics

All in `lib/innerRep/config.ts` (`ENGINE_CONFIG`, `EVIDENCE_CONFIG`). Before this pass: ~25 numbers and 3 exercise IDs (`act_followthrough`, `foc_attention`, `neutral_nothing`) plus the answer id `'yes'` were inline in `engine.ts`/`evidence.ts`; four evidence constants were exported but the rest (2, 3, 5, 4, 14) were inline. Now none are.

| Setting | Value | Rationale (provisional) |
|---|---|---|
| capacityFresh | +4 | First reps should cover ground. Currently **too strong** (finding 1) |
| capacitySameAsLast | −2 (was −6) | Mild anti-monotony only. Variety is not a goal |
| continuation | +6 | Relevance must beat the −2 rotation preference |
| relevance.minBurdenReps / recentDays | 2 / 3 | One heavy answer is an event; two in 3 days is a thread |
| relevance.maxConsecutiveSameCapacity | 4 | Stops a rut running forever |
| formatSameAsLast / TwoBack / saturated | −3 / −1 / −2 | Identical tap-pattern daily feels like a form |
| lighterAfterHeavier, mediumWhenFresh | +2, +1 | Pacing. Note: counts the *rep's* intensity, not the user's state (misleading label, §0) |
| deepMinHistory | 10 (−10) | Effectively a gate; no deep reps exist yet |
| ease.unknownRunLength | 2 | Two "I don't know"s → go gentle |
| easeGentle / sensitive / action | +3 / −2 / −1 | After a burden, don't escalate |
| positiveMix, positiveLookback | +2, 5 | Mirar shouldn't be only problem-hunting |
| followThrough.minDaysBeforeResurface | 3 | Placeholder: no timeframe is stored (§8) |
| followThrough.cueMaxAgeDays | 14 | A stale "something undone" cue is worse than none |
| rest.enabled | **false** | Trigger and UX unreviewed |
| evidence.pattern | 3 of ≥4, ≥60% | Smallest sample where "again" isn't coincidence of two; blocks 3-of-9 |
| evidence.windowDays | 28 | Matches the earlier month framing; likely too long for reversal (§5) |
| evidence.unknownRun | 3 | Name it once, don't push |

None of these are claims about people. Replacing a value is a one-line change.

## 4. Relevance vs variety

Variety is a tiebreaker, not an objective. The engine should answer "what, if anything, is most useful to look at today?" with these outcomes (✔ = representable now, ◐ = partly, ✗ = needs work):

| Outcome | State |
|---|---|
| fresh rep | ✔ |
| continuation of a recent issue | ◐ logic present; **inert** (needs ≥4 reps per sub-capacity and "deepen" reps that are allowed to follow a parent) |
| follow-through | ◐ one yes/no question; no commitment object |
| contradiction check | ✗ |
| recovery / light | ✔ (label `recovery`) |
| revisit something that changed | ✗ (needs resolution evidence) |
| simple presence / "nothing needs examining" | ◐ engine outcome exists, off |

Rule: relevance overrides rotation when the user's own recent answers point at a capacity (burden in ≥2 reps within 3 days). Rotation resumes naturally when they stop, or after 4 consecutive reps in one capacity. Today's catalog can't demonstrate this (tested: two energy-burden reps → engine moves on because both energy reps are inside their repetition window).

A deeper structural gap: **the engine only learns from the rep it chose to serve.** If a relationship conflict runs days 3–8 and Mirar happens to serve Focus, it learns nothing. Relevance needs a user-driven channel (e.g. an optional "what's it mostly about?" tag after any rep) or shared context tags across exercises (§5).

## 5. Evidence taxonomy (proposal — not implemented)

Pattern detection is one concept among six. Each is a distinct claim type with its own threshold and wording.

| Type | Meaning | Minimum evidence | Allowed wording |
|---|---|---|---|
| REPEATED SIGNAL | Same context tag across reps (any exercise) | 3 of ≥4 comparable, ≥60% (today's rule, generalised across `context_tag`) | "Work has come up in 3 of your last 4 reps." |
| ASSOCIATION | Two tags co-occur | 3 co-occurrences and more often together than apart | "Work and 'avoiding' came up together 3 times." Never causal |
| CHANGE | Differs from user's own recent baseline | ≥5 baseline reps, ≥3 recent; difference stated as counts | "Lately 3 of 4 reps mention people; before, 1 of 6." |
| CONTRADICTION | New answer conflicts with a stored statement | A stored user statement + a direct opposite, both quoted | "Earlier you chose X. Today Y. Both can be true." |
| RESOLUTION | Something recurring stopped, or user said it's resolved | Prior repeated signal + ≥3 reps without it, or explicit user closure | "Work hasn't come up in your last 5 reps." Retires the old pattern |
| HIGH-SALIENCE EVENT | One important thing, user-flagged | One user-marked event (never inferred) | Continuity only ("Last week you said X happened"), never "pattern" |

How they coexist: each insight carries exactly one type. Event and resolution can **retire** a repeated-signal insight, so a pattern can't outlive its evidence (scenario 10: with a 28-day window, a work-stress pattern would persist ~weeks after it stopped; resolution fixes this, a shorter window or recency weighting helps). Counts are always shown. Silence remains valid.

Prerequisite for all of these: a shared `context_tag` vocabulary (work, people, body, thoughts, phone…) on options. Without it, finding 4 stands.

## 6. Data model review (v1 `017_inner_rep_responses.sql`)

v1 is one table, one row per **completed** rep. The full v1 is in `docs/proposed/017_v1_inner_rep_responses_SUPERSEDED_DO_NOT_RUN.sql`.

| Concept | v1 | Verdict |
|---|---|---|
| Exercise definition | Code only (`catalog.ts`); stored rows carry `exercise_id`, **no version** | ✗ Editing a prompt or option silently changes the meaning of old rows |
| Exercise instance (served) | Doesn't exist; a row appears only on completion | ✗ Skipped/abandoned reps and *why a rep was chosen* are not recorded |
| Structured response | `answer` jsonb: option **ids** (`'work'`, `'yes'`) | ◐ Meaning depends on today's catalog; ids reused across exercises |
| Free-text response | `answer.words` — **same jsonb** as structured | ✗ Can't be retained, exported, or deleted separately |
| User statement | Same jsonb | ✗ collapsed |
| Commitment / status | None | ✗ |
| Evidence | None; recomputed on the client and discarded | ✗ |
| Pattern / contradiction / hypothesis | None, except as an `insight` jsonb | ✗ |
| Mirror insight | `insight` jsonb on the response row (kind, text, counts) | ✗ inference stored *inside* the user's row |
| Confidence | None | ✗ |
| Feedback on insight | One mutable column | ◐ overwrites; no history |
| Capacity / sub-capacity / intensity | Columns | ✔ |
| Timestamps | `completed_at` (client clock, trusted), `created_at` | ◐ no `served_at`; client-supplied |
| Provenance / source | None | ✗ |

**Verdict: v1 collapses user statements and Mirar's inferences into one row. That violates the Honest Mirror requirement, so it should not be applied.** I moved it out of `supabase/migrations/`.

The proposal, `docs/proposed/017_v2_inner_rep_PROPOSAL.sql` (not in `migrations/`, not runnable by accident):

```
SERVED     inner_rep_instances   what was shown, decision_kind, decision_terms, versions
SAID       inner_rep_answers     structured choices; option label/key/tag snapshotted; source='user'
SAID       inner_rep_free_text   separate table: own retention/deletion, never in analytics/AI
COMMITS    commitments           user intent + timeframe + status; 'lapsed' is the only system status
INFERRED   mirror_evidence       kind, subject, count/of, window, rule_id, engine_version
           mirror_evidence_refs  evidence → the answers that justify it
INFERRED   mirror_insights       template + params + exact shown text; generated_by; status
           mirror_insight_evidence insight → evidence (≥1 required)
FEEDBACK   mirror_insight_feedback append-only
```
Open review items inside the proposal: one-rep-per-day must key on the user's **local** date (`local_date`), not UTC; the "≥1 evidence row" rule needs a deferred constraint trigger; client-computed evidence is acceptable only until any model-generated insight exists, then it must move to an edge function.

## 7. Provenance architecture

```
mirror_insights ─▶ mirror_insight_evidence ─▶ mirror_evidence ─▶ mirror_evidence_refs ─▶ inner_rep_answers ─▶ inner_rep_instances
 (what was shown)                              (rule_id, count/of,                        (what the user chose,    (what was served,
                                                window, version)                            label as displayed)      and why)
```
"Why is Mirar showing me this?" is answered by walking that chain: the rule, the count out of how many, the window, and the dated answers (with the exact wording the user saw). Rule: **no insight row without evidence rows.** Insight text is stored with its template id and params so it can be re-derived and audited. Free text is deliberately *not* an evidence input in v1 (counts over tags only).

## 8. Commitment / follow-through model

Today: `act_followthrough` asks "Is there something you said you'd do that you haven't done yet?" (yes / kind of / no / changed my mind). Only `yes` counts as open; it resurfaces after a flat 3 days, and the Home cue says "Last time you said something was still undone." Nothing stores *what* it was, *when* it was meant to happen, or what became of it. `changed_mind` is recorded as an answer but the engine ignores it. Scenario 4 shows the cost: an introspective user who keeps answering "yes" gets asked every 3 days with no softening and no change of approach.

Proposed (`commitments` table):
- **Timeframe:** `today | tomorrow | this_week | whenever | none`, with `timeframe_source = 'user'` by default. `inferred` only when the user's own words/choices make it unambiguous; otherwise ask or assume `none`.
- **Status:** `open · done · postponed(until) · changed_mind · dropped_on_purpose · lapsed`.
- **Resurface** at the due date (or the postponed date), not at a universal 3 days. `whenever`/`none` never auto-resurface; the user can raise them.
- **Failed vs decided against:** `changed_mind` and `dropped_on_purpose` are user-set and mean "not right for me" — no nudges, no negative framing, they can feed *resolution* evidence. `lapsed` is system-set, means only "date passed without an update," and is never shown as failure. Mirar has no "failed" status.
- Repeated "yes + unclear how to start" is a signal to offer a smaller step (`act_tiny`), not to repeat the question.

## 9. Safety data flow

- **Where it runs:** client only, in `store.complete`, on `answer.words` (the one free-text field; `rel_appreciation`, 80 chars max). No other text input exists.
- **Matching:** ~19 case-insensitive regexes with word boundaries; binary hit/no-hit. No normalisation (leetspeak, repeated letters), no scoring, no uncertain tier.
- **Order of operations:** text lives in React state in `RepFlow` until submit → check → on hit the stored answer becomes `{unknown:false}`, `safety_shown=true`, no insight, safety panel shown. The text is never written. On no-hit the text is stored (Supabase `answer.words` and local fallback).
- **What is persisted on a hit:** a completed-rep row with an empty answer and `safety_shown=true`. That flag is itself sensitive metadata and should be discussed (keep for audit, or drop).
- **English coverage (probe of 23 phrases, not a validation):** hits: "end it all", "I wanna die", "hurting myself", "don't want to be here anymore". Misses: "I can't go on", "I just want to disappear", "I feel like giving up", obfuscations ("su1cide", "d1e").
- **Hinglish (Roman):** hits "jeena nahi hai", "mar jaunga", "zindagi khatam…" after this pass's fixes (they missed before). Misses "khud ko hurt karna hai" and most other phrasings.
- **Devanagari / Gujarati script:** **no coverage at all.**
- **False positives:** idioms hit by design ("I could kill myself for forgetting that", "kill myself laughing"). A false positive shows a crisis panel on a harmless rep. The previous "end my …" pattern also hit "end my subscription"; fixed.
- **False negatives:** paraphrase, indirect statements, misspellings, non-Roman scripts, code-mixed phrasing. Expect substantial misses.
- **Uncertain cases:** no handling; anything unmatched is stored as ordinary text.
- **Server side:** none. RLS accepts any text sent directly to the API.
- **Interaction with free text:** only `rel_appreciation` collects text, and it is skippable. Until crisis resources and detection are validated, the safest posture is to keep free text to that one rep (no new text reps). Not a clinical safeguard; Mirar is not therapy.

## 10. Privacy data flow

| Surface | What happens |
|---|---|
| Typed text | React state in `RepFlow` → `store.complete` → safety check → Supabase `inner_rep_responses.answer` and local fallback |
| Supabase | Whole answer jsonb incl. free text, plus insight text (insight text uses catalog option labels, never free text). RLS: own rows. No deletion UI; deleted only if the user row cascades |
| Local fallback | `AsyncStorage` key `mirar_inner_reps_v1:<userId>` (now per-user). On **web this is browser localStorage**: unencrypted, readable by any script on the origin, persists until cleared. **Not cleared on sign-out.** Holds up to 200 recent reps including free text |
| Logs | No `console.*` in any Inner Rep file; errors from Supabase calls are caught and swallowed (nothing logged). `lib/supabase.ts` has one unrelated config warning |
| Error reporting / analytics | No Sentry/PostHog/Amplitude/Mixpanel dependency found in `package.json`, `app/`, `lib/`, `stores/`. The landing site has GA4 but is a separate property. App has no in-app analytics |
| URLs | `/inner-rep` carries no parameters; text never enters a URL |
| AI providers | No edge function reads `inner_rep_responses`. Nothing in Inner Reps is sent to a model. Existing functions use the legacy `responses` table |
| Retention | None defined |

Places text could leak if code changes later: any future `console.log(answer)`, an error-reporting SDK capturing store state, an analytics event with the answer payload, or a model call that reads `answer`. The v2 proposal puts free text in its own table partly so those paths can be excluded structurally. Recommended: clear the local store on sign-out; encrypt or avoid persisting free text locally; add a "delete my reps" action.

## 11. First-10-days simulations

Full tables in `docs/ENGINE_SIMULATIONS.md`. Policies are scripted, so these show the engine, not real people.

| # | Scenario | Served | Why | Stored | Infers | Refuses to infer | Follow-up | Repetitive? |
|---|---|---|---|---|---|---|---|---|
| 1 | Stable | Fixed rotation d1–7, repeats from d8 | "capacity not yet practised" dominates | choices | "chose My phone twice" (noise) | any pattern | none | **Yes by d8** (order recurs) |
| 2 | Repeated work stress | Same rotation as #1 | Rotation ignores the stress | work ×N across attention/drain | Only "chose Work twice" | Pattern (threshold unreachable; keys differ per exercise) | none | Yes. **Fails "feels intelligent":** it served work-stress reps once a week and never noticed the thread |
| 3 | Relationship conflict d3–8 | Relationships rep served d2, d13 only | Rotation | nothing about conflict (rep never served in window) | nothing | — | none | Conflict was **invisible** to the engine |
| 4 | Introspective, rarely acts | Follow-through d16, again d19 | due after 3 days | open commitments | cue "something undone" | that they "avoid" | Every 3 days, unchanged | Risk of nagging |
| 5 | Action-oriented, avoids reflection | Rotation | — | several "I don't know" on direction | only a gentle reorder after unknowns | that they avoid reflection | none | Yes |
| 6 | Irregular | d1,2,6,13,14,24 → six *different* reps | freshness | choices | nothing | trends across gaps | none | No (gaps hide the rotation), but no welcome-back handling |
| 7 | Always "I don't know" | Recovery-labelled light reps; observation once on d3 (previously every day) | ease mode | unknown flags | "3 in a row, that's allowed" | any reason | none | Yes, same few light reps |
| 8 | One major event | Not testable: the d4 rep had no burden option and there is **no "event" channel** | — | — | — | — | — | Engine has no concept of a one-off significant event |
| 9 | Disagrees often | Rotation, unchanged | **feedback is ignored** | feedback column | same "twice now" notes | — | — | Yes; Mirar can't be corrected |
| 10 | Pattern reverses | Rotation | — | work d1–10, then "nothing" | no pattern was ever claimed (so no wrong claim) | — | — | Mirar would not notice the reversal: no resolution type, 28-day window |

Verdict: the code paths are sound, but **the product does not yet feel intelligent**. Variable behaviour comes from user answers only through the ease rule; nothing else adapts.

## 12. Recommended changes before any Supabase migration

1. Do not apply v1. Review the v2 proposal; decide the free-text and commitment tables first (they define retention and deletion).
2. Add `local_date` and per-instance rows so "served but not completed" is recorded.
3. Add a shared `context_tag` to catalog options and snapshot label/key/tag at answer time (so catalog edits can't rewrite history).
4. Decide whether free text is stored at all in v1 of the product. Keeping to tags removes the largest privacy and safety surface.
5. Validate safety wording, helplines and detection with a clinician or crisis-line partner before any production use.
6. Expand the catalog to ≥4–6 reps per sub-capacity, including "deepen" reps that may follow a parent, before relevance can work.

## 13. Changes made now (all in this pass; nothing deployed)

- `lib/innerRep/config.ts`: every threshold and exercise id, with rationale; engine and evidence read from it.
- `engine.ts`: `decideToday` returns a `Decision` (`fresh | continuation | follow_through | recovery | rest`) with per-candidate score terms. `rest` is plumbed but disabled. Rotation penalty cut from −6 to −2; continuation term added (inert, see §4). `selectExercise` kept as a wrapper so the store/UI are unchanged.
- `evidence.ts`: constants moved to config; "I don't know" note now fires once per run; follow-through cue expires after 14 days.
- `safety.ts`: fixed "end my …" false positive; added "wanna/gonna die", "hurting myself", and Hinglish phrasings. Header now says it is not validated.
- `stores/inner-rep-store.ts`: local storage keyed per user; keeps the newest 200, not the oldest.
- `scripts/simulate-inner-rep.ts` and `docs/ENGINE_SIMULATIONS.md`.
- v1 migration moved to `docs/proposed/` (superseded); v2 proposal added. `supabase/migrations/` has no 017.
- Re-run after changes: `tsc` clean; engine/evidence/safety checks pass (these are my own assertions, not independent validation).

## 14. Leave untouched until visual / product review

Home layout and copy; the Inner Rep screen's look and motion; whether `rest` ("Nothing needs examining today") is shown and what it says; whether free text stays; the safety panel wording and helpline list; exercise wording in `catalog.ts`; History and Capacities views; Hindi/Gujarati; notifications; the legacy week-number/bounce-back code on `main`; any deploy. The evidence taxonomy (§5), commitment model (§8) and v2 schema (§6) are proposals pending your decision, not built.

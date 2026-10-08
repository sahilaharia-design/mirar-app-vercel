# Mirar v2 — product value audit and blueprint

Status: analysis and proposal. Nothing here is merged, deployed or implemented. The engine (`inner-rep-engine-v2.0.1-correction-fix`) is unchanged.
Written 8 October 2026 against `mirar-v2-experience` (Codex `6c6f0d0` + runtime/Mirror read model).

Labels used throughout:
**[CODE]** a fact verified in the repository. **[SIM]** a figure from the synthetic-user simulator (`docs/V2_ANALYSIS.md`, `docs/V2_SWEEP.md`): design evidence, not evidence about real people. **[PROPOSAL]** future functionality, not in the product.

---

## 0. The honest verdict

Mirar today is **a trustworthy instrument with a thin payoff**.

It is unusually honest. It never claims more than it counted, it lets the user overrule it, it stores no raw words, and it has no streaks or scores. That is a real foundation and a real differentiator against the field.

But a person who opens it on Day 1, 3, 7 or even 30 mostly gets *a very short question answered*, then *their own answer read back to them with the same generic sentence*. The engine is far more sophisticated than the experience it can currently express. Technical rigour is not yet user value.

Three facts carry most of the weight:

1. **The takeaway is the same for every rep.** [CODE] `IntegrationMoment` ends every non-commitment rep with one fixed sentence: *"Notice once, later today, whether this comes up again. You can leave it there; noticing does not oblige you to change it."* The "You chose" receipt repeats the user's own tap. The user leaves with nothing new.
2. **Reflections are rare and thin.** [SIM] Over 30 days a stable user sees 0 reflections; a user with a recurring issue sees about 2. [CODE] The text is a count with its provenance: *"Work has come up 3 times (1 chosen from a list, 2 raised by you)."* That is honest, but it has no "so what", no meaning, and no next step.
3. **The longitudinal promise has no durable home.** [CODE] State is device-local. Clearing the browser, switching phone or signing out deletes the user's "evolving self-knowledge". A Day-30 Mirror cannot be promised on that foundation.

So the answer to "why would someone return?" is, today, **weakly: because it is quick and kind, not because it changes their day.** The blueprint below keeps everything that is honest and adds the missing payoff, in the order that matters.

---

## 1. Current product audit (the twelve questions)

| # | Question | Finding | Grounding |
|---|---|---|---|
| 1 | Genuinely useful? | Partly. Useful as a calm 20–35 second check; not yet useful as a tool that changes what someone does. | [CODE] 23 templates, 15–35 s each |
| 2 | What problem does each rep solve? | Each is a *noticing* prompt on one capacity (focus, energy, relationships, growth, direction, action). None says what problem it solves for the user or what to do with the answer. | [CODE] `templates.ts` |
| 3 | Immediate value? | Low. The receipt returns the user's own choice. | [CODE] `IntegrationMoment.tsx` |
| 4 | Engaging or repetitive? | Varied at first, then fixed. 18 training exercises (3 per capacity), and a median first exact repeat at day ~20 over 30 days; 319 of 340 simulated 30-day runs repeat at all. Interaction type is almost always "tap one option". | [SIM], [CODE] |
| 5 | Feedback insightful or generic? | Honest but generic. The reflection is a frequency count plus provenance. The closing line is identical every time. | [CODE] `insights.ts` |
| 6 | Adapts to the user? | Yes in selection and continuity (threads, lenses on a recurring domain, commitment follow-ups, rest after "No"). The user rarely *sees* it adapt. | [CODE] engine; the Today `continuityCue` prop exists but the runtime never supplies it |
| 7 | What does the user learn about themselves? | Almost nothing new in the first two weeks. The one learning event is a repeated-signal reflection ("Work has come up 3 times"), at best around day 6–10, and only for users who raise an issue. | [SIM] |
| 8 | Commitments useful beyond the app? | Directionally yes (a named small action, a future-dated follow-up, no guilt). Thin in practice: two commitment-creating exercises, authored labels only ("Reach out to your partner"), no way to say *what* or *how*. | [CODE] `rel_connect`, `act_tiny` |
| 9 | Does Honest Mirror build trust? | It is the strongest trust mechanism in the product: Accurate / Partly / No / Not sure, structured correction reasons, and the engine changes behaviour (rest 21 days after "No", hedged resurfacing after "Partly"). But it appears rarely, and the user is not told what their answer will change. | [CODE] `config.ts feedback` |
| 10 | Does The Mirror give longitudinal value? | Not yet. It lists capacities practised (counts, last date) and open commitments. It does not show the user's own choices over time, shifts, or reflections. Codex deliberately left these honest and empty. | [CODE] |
| 11 | What is missing? | A payoff per rep; visible continuity on Today; a user-stated starting intent; a way for a choice to become a specific small action; a durable place for history; a reason to return that is not just "do the next one". | see §8 |
| 12 | Remove or simplify | The fixed closing sentence; the "You chose" receipt as a stand-alone payoff; the generic "Evidence comes before interpretation" copy block in the Mirror (explains the system instead of helping the person); three of the Mirror's four chapters when they only say "not available yet". | [CODE] |

Strongest elements to protect: evidence provenance wording (prompted vs introduced), the correction taxonomy, "I don't know" always available, the commitment follow-up budget (max 1 per 3 reps), no shaming status words, free text never stored, and the safety stop.

---

## 2. The actual user value

**One sentence:** *Mirar is a daily 90-second practice that helps you notice what is actually taking your energy and attention, decide one small thing to do about it, and see over weeks what repeats, with the app showing its evidence and letting you overrule it.*

### Primary problems it can credibly serve
1. **"I'm busy and wound up and I can't tell why."** Naming what took attention or energy today.
2. **"I keep meaning to do the small thing."** Turning a vague intention (reach out, rest, start) into one named action and one honest check-in.
3. **"Is this a pattern or just a bad week?"** Counting what recurs, with the user as the final judge.
4. **"I want to understand myself without being analysed."** A mirror that cites its evidence and can be told it is wrong.

### Why try it
Short, private, no account of feelings to write, no score to chase, no one watching.

### What a single session should give (target, not current)
One thing named (what took attention), one small chosen move (or an explicit choice to leave it alone), and one sentence of meaningful continuity ("last time you said X; today it is Y").

### How it differs
- **vs journaling:** nothing to write or keep; selection and small action instead of prose. Strength: low effort. Risk: shallower.
- **vs meditation apps:** a skill practised against *your own* situations, not a generic session.
- **vs AI therapy chatbots:** no free-text inference, no advice, no persona, no diagnosis. Every claim carries its count. The user can overrule it and it changes behaviour as a result. This is the defensible position and must not be eroded by "just add a chat".
- **vs mood trackers:** no mood score; the unit is a situation and a small action.

### Why it could become a daily habit
Only if each rep ends with something usable and the product visibly remembers. A habit built on "it's quick" decays; a habit built on "it noticed that and helped me do something about it" does not. Today only the first is true.

---

## 3. Day 1 / 3 / 7 / 30

These are evaluation checkpoints, not program stages. For each: what exists, what the user gets, what is missing, and the evidence required before Mirar may say anything.

### Day 1
- **Now [CODE]:** Discovery → sign-in → short introduction → Today → one rep (cold start is `foc_attention`, "did anything take more attention than it deserved?") → receipt ("You chose…") and the fixed noticing line.
- **Value:** a calm moment and a named distraction. Little to carry.
- **Why Day 1 matters:** it sets the belief "this is useful, not a quiz".
- **Missing:** a takeaway that is not a repeat of the tap; one small optional move; a visible promise of what Mirar will remember ("I'll check back on this").
- **Evidence required for any claim:** none beyond the tap itself. **Forbidden:** any pattern, any "you tend to…".
- **Reason to return:** a specific, honest one: *"Tomorrow I'll ask whether this came up again"* — only if the engine will actually do it (it will, for domains captured; see §5).

### Day 3
- **Now:** if the user named a domain or chose a commitment, a continuity rep (thread check, commitment check, lens) can appear, bounded by the budget (≤2 of the last 5 reps continuity/context, never >2 in a row). Variety: no exact repeat before ~day 15 [SIM].
- **What feels different:** at best one rep that references something the user said. The Today screen itself does not say so (the `continuityCue` slot is empty).
- **Missing:** show continuity on Today before the user begins: "You mentioned: reply to one message."
- **Evidence required:** a stored structured user statement (a chosen option or domain). **Forbidden:** inferred feelings.

### Day 7
- **Now:** a first hedged reflection is possible only if the same domain has come up ≥4 times from a list or ≥3 independent/introduced times across ≥3 distinct days, inside a 28-day window [CODE `config.ts`]. Most users will not reach it by Day 7 [SIM: stable 0.0, work-stress 2.5 per 30 days].
- **Genuine accumulated value:** a *ledger of what you chose* (USER SAID), not a pattern. That is available now, unused.
- **Missing:** a weekly "what you said this week" recap built only from the user's own selections; Honest Mirror consequences stated in plain words.
- **Evidence required:** counts with denominators and provenance (prompted vs introduced). **Forbidden:** "you are stressed at work."

### Day 30
- **Now:** capacities practised, open commitments, possibly 1–3 reflections with the user's feedback history. Median exact exercise repeat is ~day 20 [SIM], so some users will have seen the same rep twice.
- **Why still useful (target):** because the Mirror shows *their* choices over time with dates, because commitments were followed through or consciously dropped, and because their corrections visibly changed what Mirar says.
- **What would make a user believe Mirar helped:** their own words, in their own structured choices, showing change: "In week 1 you chose 'I pushed past what I had' 5 of 6 times; in week 4, 2 of 6." That statement is supportable from existing `change` evidence **only for the six stance-bearing contrast templates** [CODE]. It must be presented as a comparison with their own earlier answers, never improvement.
- **Evidence required:** the engine's `change` evidence (baseline ≥8 answers, recent ≥4, delta ≥0.4). **Forbidden:** claiming growth, improved emotional fitness, or any score from elapsed time.
- **Hard prerequisite:** durable history (see §10, P1).

---

## 4. Reinventing the Inner Rep

**Current:** a question. One prompt, one tap, sometimes a follow-up or optional words. It feels like **A. completing questions**.

**Target:** a rep that feels like **B. practising emotional fitness**, in a **Notice → Name → Try** shape, still under about 90 seconds.

### Concept: "Notice → Name → Try"
1. **Notice** (exists): the situational prompt in everyday language. Keep.
2. **Name** (exists, shallow): pick the option that fits; "I don't know" always allowed.
3. **Try** (missing): one optional, specific, small move chosen from 2–3 authored options that fit *this* answer, plus "leave it alone" as an equal choice.
   - After "Phone took more attention than it deserved": *Put it face-down for the next hour · Turn off one notification today · Leave it*.
   - After "I pushed past what I had": *Take ten minutes with nothing scheduled · Say no to one thing tomorrow · Leave it*.
   - After "Someone I've been meaning to reach out to — My partner": *Send one line today · Plan a call this week · Leave it* (this one already exists as a commitment).
4. **Carry** (partly exists): if they take a move, it is a commitment with a date (existing mechanism, future-only date, one follow-up per 3 reps, no failure language).

Why this is better:
- It converts awareness into intentional action, which is the stated mission.
- It makes every rep end with something usable, so the closing line stops being generic.
- It does not add questions: it replaces the fixed sentence with one choice.
- "Leave it alone" is a first-class option, which protects autonomy and avoids pressure.

### Everyday relatability
Prompts today are well written but abstract at the margins ("Which is closer to today?" appears four times, with different pairs). Proposal: lead each compare rep with the *situation*, not the label ("Did you pace yourself today, or push through?"). Pure copy change in the presentation layer where the template prompt is identical.

### Variety without volume
Do not add dozens of exercises. Add **depth within the existing 18**: each training template gets 2–3 "Try" options keyed to its chosen option. That is a content task, not a new engine.

### Less cognitive load
Keep ≤2 steps before the "Try". Keep "I don't know" everywhere. Keep burden-aware ordering (the engine already inserts a light rep after a heavy one).

### What stays out
No journaling, no prose prompts, no AI conversation, no mood scales, no "how are you feeling 1–10".

---

## 5. Intelligence and personalisation audit

| Capability | State | Notes |
|---|---|---|
| Three-layer selection (continuity → life context → training), relevance over rotation | **ALREADY SUPPORTED** | [CODE] `engine.ts` |
| Threads, event follow-ups, commitment follow-ups with a budget | **ALREADY SUPPORTED** | [CODE] |
| Evidence taxonomy with provenance (prompted vs introduced vs independent) | **ALREADY SUPPORTED** | [CODE] `evidence.ts` |
| Feedback semantics: No rests a domain 21 days, Partly hedges with structured reason, Not sure waits 7 days | **ALREADY SUPPORTED** | [CODE] |
| Variety guard (14-rep template window, mechanism fatigue limits) | **ALREADY SUPPORTED** | [SIM] first exact repeat day ~20 |
| Today shows what Mirar remembers *before* the rep (continuity cue) | **UX IMPROVEMENT / NEW RUNTIME CONTRACT** | The component slot exists; the runtime supplies no cue. Needs a read-only line derived from open threads/commitments. |
| Tell the user what their Honest Mirror answer will change | **UX IMPROVEMENT** | Behaviour exists (21-day rest, hedged resurfacing); only the copy is missing. |
| Per-rep "Try" options keyed to the chosen answer | **UX IMPROVEMENT** for display of an authored line; **ENGINE CHANGE (catalog)** to record it as a commitment | Templates are frozen. Needs a documented catalog change. |
| Mirror "what you said": ledger of the user's own structured choices with dates | **NEW RUNTIME CONTRACT REQUIRED** | Observations are stored structurally; no read model exposes them. Must exclude rested domains and rejected claims. |
| Mirror "what may have shifted" | **NEW RUNTIME CONTRACT REQUIRED** | Engine already emits `change` evidence; no contract shows eligible, un-rejected items. |
| User-stated starting intent (what do you want to practise first?) | **ENGINE CHANGE REQUIRED** | Selection currently has no user-supplied priority; this is a preference, not an inference. |
| Rest/no-rep, contradiction | **ENGINE: disabled by decision** | Leave off. |
| Cross-device history | **FUTURE OPPORTUNITY** (privacy and migration review first) | See P1. |
| Reminders, notifications | **FUTURE OPPORTUNITY** | Only user-set, single, no guilt; separate approval. |

Where continuity breaks down: the engine remembers; the screen does not say so. A user with an open commitment sees nothing about it until the rep that asks.

Do corrections influence future understanding? **Yes in behaviour, no in perception.** The user is never shown "because you said X, I'll leave Work alone."

Does feedback differentiate? Moderately: tiers (supported / tentative / hedged) change wording. The *content* is count-based and does not vary by capacity or user meaning.

---

## 6. Reinventing The Mirror

**Principle:** earn the right to speak. The Mirror may say only what legitimate evidence supports, labelled internally as:

- **USER SAID** — a structured choice the user made, with day and the exact authored label.
- **OBSERVED** — a count Mirar made over those choices, with numerator, denominator and window.
- **INFERRED** — only an engine-emitted reflection with its tier and the user's feedback status; never a rejected or withheld claim.
- **UNKNOWN** — what Mirar has not been told, including "I don't know" answers; shown as such, not hidden.

Do not expose those four words as technical labels unless Codex designs them in. Show them as language: "You chose…", "Across 6 reps, 4 times…", "Mirar's reading (you said partly right)…", "Not enough yet to say".

### Proposed structure (sections appear only when supported)

1. **What you've said** *(USER SAID)* — the last several of the user's own selections, newest first, with dates. No prose, no text. Supported by existing observations.
2. **What's come up** *(OBSERVED)* — recurring domains with numerators/denominators and the prompted-vs-introduced split, only past the engine's repeated-signal threshold.
3. **What you've been practising** *(OBSERVED)* — capacities and counts. Already built; keep, alphabetical, no ranking.
4. **What you're carrying** *(USER SAID)* — open commitments with date; closed ones as neutral facts ("Done · Partly · Postponed · Changed my mind · Decided not to"). No overdue or failure words.
5. **Mirar's readings** *(INFERRED)* — past reflections the user did not reject, with tier, evidence snapshot and the user's own verdict beside each. Rejected or "No" readings appear only as "you said this didn't fit".
6. **What may have shifted** *(INFERRED, hedged)* — only engine `change` evidence, worded as a comparison with the person's own earlier answers.
7. **What isn't known** *(UNKNOWN)* — plainly, including a count of "I don't know" answers and the capacities not yet practised.

A truthful empty Mirror is a success state. Today's copy for it is good and should stay.

### What not to do
No scores, no capacity "levels", no personality types, no confidence percentages, no "you are", no progress bars toward emotional fitness, no comparison with other people.

### Required for this
- A read-only **Mirror contract** (see §9, P3) built from stored structured state, never from free text, applying the same eligibility rules as Today (no resurrected rejected claims).
- Durable history (P1), or the Mirror must say honestly that it lives on this device.

---

## 7. The returning-user experience

Reasons to return that are legitimate, in order of strength:

1. **Continuity that is felt.** "You mentioned reply to one message. Want to see how it went?" shown on Today, never as a nag.
2. **A rep that gives something to use.** The "Try" step.
3. **Seeing your own words over time.** The ledger and shifts.
4. **Trust.** The user can overrule Mirar and sees that this mattered.
5. **Appropriate time.** About 90 seconds; "leave any time" is honest and already built.

Reasons that are explicitly off the table: streaks, rewards, guilt, comparative metrics, engagement tricks, urgency copy.

On notifications: *not now.* If ever approved, one **user-set** reminder time, no content from the user's data in the message, trivially removable, off by default. Treat as a separate privacy and product decision.

The honest retention risk: for a user with a calm month, Mirar has little to *say*. The product must be valuable through the practice itself (the "Try") and through the ledger, not through reflections.

---

## 8. Gap assessment

**Strengths:** honest evidence design; correction and commitment semantics; privacy (no free text stored, device-local); calm presentation; `Not sure`/`I don't know` everywhere; tested engine (85+17+18 tests, 420-run sweep).

**Weak or superficial:** fixed closing sentence; receipt as payoff; count-only reflections; Mirror chapters that say "not available"; four "Which is closer to today?" prompts; commitments with fixed labels.

**Missing user value:** a usable takeaway per rep; visible continuity; a user's own starting intent; consequences of Honest Mirror answers shown; the user's own history over time.

**Missing technical capabilities:** Mirror read model beyond capacities; continuity cue supplier; authored "Try" content and its presentation; durable structured history.

**Underutilised engine capabilities:** threads and event checks (the user rarely sees that they exist); `change` evidence (never surfaced beyond a hedged insight); feedback memory (invisible).

**Experience bottlenecks:** the first reflection arrives late and rarely; exercise repeats from ~day 20; the user is asked a question at the start of every rep before being shown anything.

**Evidence limitations:** the engine counts selections, not meaning; only six options carry durable stances; capture is rationed by a 2-in-5 context cap and a 3-day capture cooldown, which protects the user and limits learning.

**Privacy implications:** the ledger and shifts are derived from structured choices already stored locally. Moving them to the server (P1) is the one change with real privacy weight and needs explicit review.

**Retention weaknesses:** value depends on the next rep, not on carried-over benefit; device-local state turns a lost phone or cleared browser into a lost history.

**Long-term opportunities:** reviewed server-side structured history; a user-set reminder; carefully scoped second-person "what helped" patterns; localisation (Hindi, Gujarati) with authored content, not machine translation of sensitive wording.

---

## 9. Ranked recommendations

Each is: USER PROBLEM → PROPOSED SOLUTION → EXPECTED VALUE → TECHNICAL REQUIREMENT → EVIDENCE REQUIREMENT → PRIVACY → SUCCESS CRITERIA.

### P1 — Durable structured history (precondition for any Day-30 promise)
- **Problem:** Longitudinal value disappears when the device does; the Mirror cannot promise an evolving self.
- **Solution:** store the same structured engine state server-side, per user, behind row-level security, restoring on sign-in. Free text stays unstored.
- **Value:** the Mirror becomes real across devices and time.
- **Technical:** one reviewed table (see `docs/proposed/017_v3_FINAL_after_simulation.sql`), sync on completion, conflict rule (latest completed day wins), delete-my-data path, sign-out no longer wipes server state.
- **Evidence:** none new.
- **Privacy:** **needs explicit approval.** It changes the privacy promise from "on this device" to "in your account, structured only". Disclosure copy and a deletion control are launch requirements for this item.
- **Success:** sign in on a second device → same Mirror; delete account → nothing remains; no raw text anywhere.
- **Classification:** NEW RUNTIME CONTRACT + migration (not started).

### P2 — A real takeaway per rep ("Try")
- **Problem:** the rep ends with the same sentence for everyone.
- **Solution:** Notice → Name → Try. Authored 2–3 small moves per (template, option), plus "Leave it alone".
- **Value:** every rep gives something usable; turns awareness into action.
- **Technical:** Phase A (display only): a presentation-layer map keyed `templateId:optionId` → authored moves, shown in the integration moment, not recorded. Phase B: record a chosen move as a commitment (engine catalog change; separate document).
- **Evidence:** none. Moves are suggestions, never inferred from the person.
- **Privacy:** none in Phase A. Phase B stores only an authored label (as commitments already do).
- **Success:** ≥60% of completed reps either choose a move or consciously leave it (target to be validated, not assumed); no increase in skip or drop-off; closing line no longer identical across reps.
- **Classification:** UX IMPROVEMENT (A), ENGINE CHANGE (B).

### P3 — The Mirror, built on real facts
- **Problem:** the Mirror shows counts and "not available yet".
- **Solution:** the seven sections in §6, each gated by evidence.
- **Technical:** extend `mirrorFacts()` into a contract: user selections (last N, authored labels, dates), recurring domains (numerator/denominator), eligible readings with the user's verdict, closed commitments, count of "I don't know". Exclude rested domains and rejected readings.
- **Evidence:** the engine's existing thresholds; no new inference.
- **Privacy:** reads stored structured state only; no text.
- **Success:** every sentence on the Mirror can be traced to stored structured data; zero sentences about the person that the engine did not emit; a new user sees a truthful short Mirror.
- **Classification:** NEW RUNTIME CONTRACT.

### P4 — Visible continuity on Today
- **Problem:** Mirar remembers but doesn't say so.
- **Solution:** one quiet line on Today from an open commitment or thread ("You mentioned: Reply to one message"), only when the engine would actually follow up.
- **Technical:** populate the existing `continuityCue` prop from runtime state; copy is authored label only.
- **Evidence:** a stored commitment or open thread.
- **Privacy:** none new.
- **Success:** the line appears only when a follow-up is due or pending; never fabricated; users who dismiss are not re-prompted the same day.
- **Classification:** NEW RUNTIME CONTRACT (small).

### P5 — Say what Honest Mirror answers change
- **Problem:** the user cannot see that "No" or "Partly" has an effect.
- **Solution:** a single line after each answer: No → "I'll leave this alone for a while." Partly → "I'll hold back until there's more to go on." Not sure → "I'll check again later." Accurate → nothing.
- **Technical:** copy in the presentation layer, tied to actual behaviour (21 / hedged / 7 days).
- **Evidence:** none. **Privacy:** none.
- **Success:** corrections feel consequential; no change in answer distribution that suggests pressure.
- **Classification:** UX IMPROVEMENT.

### P6 — A starting intent
- **Problem:** Day 1 is relevant only by accident.
- **Solution:** one optional onboarding choice: "What would you like to practise first?" (focus, energy, relationships, growth, direction, action, or "surprise me").
- **Technical:** this is a preference that must bias selection; the engine has no such input.
- **Evidence:** user-stated, not inferred. **Privacy:** one stored choice.
- **Success:** first-week completion and "I don't know" rate no worse than baseline.
- **Classification:** ENGINE CHANGE REQUIRED (documented separately before any work).

### P7 — Copy and relatability pass
- Replace repeated "Which is closer to today?" leads with situational questions; tighten Mirror chapter text; remove system-explaining copy where it is not helping the person. Presentation only.
- **Classification:** UX IMPROVEMENT.

### P8 — Deferred
Reminders, localisation, deeper content volume, richer "what helped" analysis.

---

## 10. Alignment with Codex's creative exploration

Codex owns form. This is the meaning the creative work should carry:

- **Notice → Name → Try** as a physical progression: attention narrows, then a single choice, then a small hand-off to the day. The "Try" step is where interaction design matters most: choosing a move should feel like setting something down, not filling a form.
- **The Mirror as an honest surface, not a dashboard.** A visual language for evidence strength: what is *said* (solid), *counted* (marked), *read* (tentative, openly questionable), *unknown* (visible absence). Uncertainty must be visible, not decorative.
- **Honest Mirror as a conversation about interpretation.** The visual should keep "Mirar's reading" clearly separate from "what you said", and make overruling it feel normal.
- **Motion** that supports comprehension (a chosen answer settling, a reading offered then withdrawn when rejected), never rewards.
- **Avoid:** any visual that implies progress toward an emotional-fitness level, a score, a streak, or an ideal state.

---

## 11. The product blueprint

1. **Core promise.** A short daily practice that helps you notice what is taking your energy and attention, choose one small thing to do, and see over time what repeats, with the evidence shown and your say final.
2. **Primary use cases.** Name what's taking attention/energy; turn a vague intention into one small action; check whether something is a pattern; understand yourself without being analysed.
3. **Day-one experience.** Discovery → sign-in → short intro → optional starting intent (P6) → one rep → Notice, Name, Try → a clear statement of what Mirar will remember.
4. **Daily Inner Rep.** About 90 seconds. ≤2 steps before Try. "I don't know" and "leave it" always available. Situational wording.
5. **Integration and completion.** The user's choice, one authored small move or an explicit "leave it", and a plain note of what Mirar will do next. No fixed generic sentence.
6. **Honest Mirror.** Reading with provenance and tier; Accurate / Partly / No / Not sure; structured correction reasons; a single line stating the consequence of the answer.
7. **Commitments.** Authored, dated, future-only; one follow-up per 3 reps; neutral outcomes (done, partly, postponed, changed mind, decided not to); no overdue or failure language.
8. **The Mirror.** Seven evidence-gated sections (§6); truthful sparse state; every sentence traceable.
9. **Returning-user journey.** Today shows what Mirar remembers (P4); a rep that builds on it; a Mirror that shows your own choices over time.
10. **Day 1 / 3 / 7 / 30.** §3.
11. **Personalisation architecture.** Engine selection and continuity (existing) + user-stated intent (P6, engine change) + user feedback memory (existing) + authored content depth (P2).
12. **Evidence requirements.** Keep the engine's thresholds. Presentation must state numerator, denominator and provenance. No claim about the person that the engine did not emit.
13. **Privacy requirements.** Free text optional and unstored; no analytics on responses; structured state only; server history (P1) only after explicit review, with disclosure and deletion; sign-out behaviour stated truthfully.
14. **Preserve.** Engine v2.0.1, correction semantics, commitment budget, context budgets, safety stop, device-local default until P1, no streaks/scores.
15. **Missing functionality.** P1–P6.
16. **Recommended improvements.** P2, P3, P4, P5, P7 first.
17. **Implementation priorities.** See §12.
18. **Acceptance criteria.** See §13.

---

## 12. Roadmap

**Before widening the beta beyond close users**
1. P2 Phase A (display-only "Try") and P5 (consequence copy) and P7 (copy pass): presentation only, no engine or data change, highest value per effort.
2. P4 (continuity line on Today): small runtime contract.
3. Honest disclosure that history lives on this device (already in Me and Privacy); verify it is visible *before* sign-in.
4. Clinical/safety review of the crisis resources and detector (already flagged; not validated).

**Soon after**
5. P3 (the Mirror on real facts), staged: user-selections ledger → recurring domains → eligible readings → shifts.
6. P1 (durable structured history) with explicit privacy approval, delete-my-data and a second-device test.

**Later, each needs its own decision document**
7. P2 Phase B (record a chosen move as a commitment) and P6 (starting intent): engine/catalog changes.
8. User-set reminder; localisation; content depth beyond the current 18.

---

## 13. Acceptance criteria (for the transformed product)

- Every rep ends with something other than the user's own tap read back, or an explicit, equal "leave it".
- No sentence in the product states something about the person that the engine did not emit with evidence.
- Every Mirar reading shows its counts and provenance, can be overruled, and the user is told what overruling does.
- Today shows what Mirar remembers only when it will actually follow up.
- The Mirror's empty and sparse states are truthful and short.
- No streaks, scores, levels, rewards, comparison or urgency language anywhere.
- Free text is never persisted, transmitted or logged.
- A returning user is never shown onboarding again.
- Sign-out and data-location behaviour is described accurately wherever it matters.
- Engine, correction, runtime, Mirror-model suites and the 420-run sweep all pass unchanged (the one known selection-bias tail excepted).

---

## 14. Proposed complete customer journey

Discover → sample a rep (nothing saved) → sign in with email → short introduction → *(optional)* "What would you like to practise first?" → **first rep: notice, name, try** → a plain line on what Mirar will remember → Today shows done.
Next days: Today shows one continuity line when something is pending → rep → try → occasionally a reading with its evidence, which the user can accept, qualify, reject or leave → the user is told what that changes.
Over weeks: The Mirror shows what you've said, what has come up, what you carry, what Mirar has read and how you answered it, and plainly what it does not know.
Returning on a new device: history is there (P1, once approved); nothing about the person was ever stored as text.

---

## 15. What is grounded and what is proposed

**Grounded in code or the simulator:** §0 facts 1–3; the audit table; the intelligence table's "ALREADY SUPPORTED" rows; the Day-1/3/7/30 "Now" bullets; all numbers marked [CODE] or [SIM].

**Proposed, not in the product:** the "Try" step, the starting intent, the seven-section Mirror, the continuity line, the consequence copy, server-side history, reminders. None is implemented or approved. Any that touch the engine catalog or selection need a separate documented change before work starts.

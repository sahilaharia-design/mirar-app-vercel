# Mirar value realignment: product contract and engineering feasibility

**Status:** design and technical planning only. Nothing here is built, approved, deployed or paid for. The frozen engine (`inner-rep-engine-v2.0.1-correction-fix`), the live app, Supabase, billing, entitlement logic and production are untouched. The G3 continuity integration (`mirar-g3-rev2-integration`) and the entitlement work (E1, contract v1.0) are preserved as they are.
**Date:** 21 October 2026. **Inputs:** `FIRST_14_DAYS_EXPERIENCE_AUDIT.md`, `MIRAR_VALUE_AND_RUNTIME_CONTRACT.md`, `EXERCISE_FAMILIES.md`, `ENGINE_CHANGE_PROPOSALS.md`, `PILOT_CONTRACTS.md`, `A8_ATTEND_PROPOSAL.md`, `SAMPLE_EXERCISE_SPEC.md`, `APPROVAL_DECISIONS.md`, `V2_DECISIONS.md`, `MIRAR_SHARED_JOURNEY_CONTRACT.md`, the code under `lib/innerRep/` and `components/`.
**Labels:** **[CODE]** verified in the repository · **[VERIFIED NOW]** checked by a read-only run in this pass · **[PROPOSAL]** not built.

## 0. The finding that shapes everything
The audit showed the first days are *question-and-echo*. Re-reading the prior contracts and the code, three facts decide what is possible:
1. **A closing cannot turn a one-tap question into a practice.** The earlier contract already says this (value contract §4, §14; sample spec §6). The honest options are (a) stop echoing and report *what the person did, made, kept and left open* (R-class work, no engine change), and (b) serve exercises that actually **produce something the person builds** (an arrangement, a re-weighed view, a sorted set, a chosen step). Those exist today only as the **optional pilots** (Look Again, Attend) and as proposals F1–F8.
2. **Several "too much too early" problems are not about content.** One is a runtime/host defect: **a rep that is served but not touched is never persisted**, so the engine never learns it was abandoned and serves the same exercise again. [VERIFIED NOW, `scripts/sim/abandonment-probe.ts`: the same exercise on days 2, 3 and 4; the engine's record holds one instance. With the existing `progress([])` call made when the rep is served, the same person gets three different exercises and the engine records three skipped reps.]
3. **The engine's `intensity` and `sensitivity` tags are not a measure of how introspective an exercise feels.** [CODE `templates.ts`] `dir_fits` ("Does the direction you're heading still fit?") is tagged `light`/`low`; so are `dir_time`, `gro_update` and `presence`. Only five templates are `medium`. Any "keep it light early" rule built on those tags would not work; readiness needs its own attribute (section 5).

## 1. Refined product promise
**Curiosity is the way in. Practice is the product. Emotional fitness is the long-term purpose.**
- **Arrive** through something small, relatable and sometimes playful that asks nothing serious.
- **Practise** a real capacity by *doing* something with it, and leave with something the person made and can see, not their own tap read back.
- **Go deeper only when the person chooses to.** Depth is an invitation the person accepts or declines, never a consequence of days elapsed or something the app infers about them.
- **Ongoing, not a course.** No day-numbered unlocks, curriculum or end date; "day 7" and "day 14" are review fixtures, never product states. (Gaps and returns already exist in the engine as *absence* handling; they are not readiness.)
- Unchanged: it never tells the person who they are; every claim shows its evidence and can be overruled; no raw words are stored; no streaks, scores or pressure; no efficacy claims.

## 2. Reconciliation ledger: audit R1–R11 against what already exists
Rule: nothing already rejected is reintroduced. Rejected earlier (value contract §1): a **universal** Notice→Name→Try shape; **display-only authored "moves"** keyed to an answer as the payoff; the **ledger of bare choices as the payoff**; **reliance on Honest Mirror readings** for daily value. Also not on the table: streaks, scores, AI chat, free-text storage, reminders without separate approval.

| Audit item | Already exists in | Status of that item | What this spec adds | Class |
|---|---|---|---|---|
| **R1** useful payoff, not an echo | Value contract §4 (responsive close); `PILOT_CONTRACTS.md` §1 (`RepValue`, five questions) and its **proposed rule that engine reps get the same five fields from the receipt** | Proposed, not built; the shipped close is generic | Section 4: one payoff grammar for all families built on `RepValue`; an honest statement of what it can and cannot do for one-tap templates | R (runtime read model) + P |
| **R2** keep week one light | Value contract §5 "depth follows evidence, never days"; engine `intensity` rules | Principle stated; no mechanism | Section 5: a **depth** attribute and a **user-controlled ceiling**; raised only by the person | E (A9) |
| **R3** smaller, later open question | `probe` cadence in `config.ts` (frozen); V2 decision 4a | Cadence tuned on synthetic users | Person-initiated entry first; engine probe gated by depth (A10) | E (A10) |
| **R4** no words + ten chips after a "Yes" | `contracts.ts` step machine; `rel_appreciation` `words`, `capture: if_present` | Frozen | D0 variants of the template without those steps (A11) | C (catalog) |
| **R5** do not re-serve a left question | `windowBlocked` (engine) already blocks repeats **if** the instance exists | **Root cause is the missing persist** | Host persists the served rep with the existing `progress([])` | store/R (no engine change) |
| **R6** limit lenses on a declined topic | Context budget `cap 2 of 5`, V2 decision 1 ("acceptable; do not optimise lower") | Deliberately kept | Only a depth ceiling reduces them (A9); no budget change | E (A9) |
| **R7** plain-language copy | Journey contract; Aperture copy | Open | Section 8 vocabulary rules for the surrounding frame | P (Codex) |
| **R8** a Mirror worth opening before a reading | Mirror contract v1 `practised` / `carrying`; "ledger demoted" | Built; thin | Practice view in everyday verbs, "what Mirar will keep", **no near-reading counts** | R + P |
| **R9** more light, curious, playful exercises | F1–F8; A3 pilot (F3, F1) | Not approved | Which D0 forms are needed (section 4/5), authoring guardrails | C (A3) |
| **R10** a reason to return | "Not requested: reminders" (`APPROVAL_DECISIONS`) | Separate approval | Only **true continuity** (what Mirar holds) and a voluntary shelf; no reminders here | P + R |
| **R11** say what the trial is for | Trial contract §9 | Specified | Aligns with sections 4 and 11; no change | copy |

## 3. User value loop
```
ARRIVE        a small, relatable opening (curiosity)           — nothing serious, nothing to perform
DO            a practice with an operation                      — the person performs a skill (notice, attend, reframe, ...)
RECEIVE       an immediate, truthful payoff                     — what they did, made, kept, left open (no inferred reading)
CARRY         optionally, one specific thing                    — a chosen step, a set-aside, a held question (or an explicit "leave it")
RETURN        voluntarily, with true continuity                 — what Mirar actually holds; a shelf of practices they can pick
GO DEEPER     only by invitation the person accepts             — a user-stated depth, not a day count
```
Invariants of the loop: every stage has an **equal "not now / leave it"**; "I don't know" is a complete answer; the payoff exists for *every* path including unknown, nothing and skip; nothing in DO/RECEIVE feeds evidence unless the engine already counts it today.

## 4. Practice mechanisms: from question-and-echo to the eight families
Families are the existing F1–F8 (`EXERCISE_FAMILIES.md`). Verbs are what the person *does*. "Light form" is the curiosity entry; "deeper form" is available only by choice. Step types: **supported** = emitted by the engine step machine today (`choice` list/compare, `words`, `domain_chips`, `timeframe`, `yes_no`); **pilot** = built in the separate pilot runtime (`choice`, `multi`, `words`, `hold`); **new** = does not exist.

| Family | The person does | Light form (entry) | Deeper form (voluntary) | Exists today | Gap | Path |
|---|---|---|---|---|---|---|
| **Notice** (F1) | Narrows a broad feeling or situation to a more exact one and says whether it is close | "What took more attention than it deserved?" then *close / not quite* | Finer tiers, body or situation sets | One-tap `foc_attention`, `en_drain`, `gro_noticed` | Refinement tier (`close/not quite`) | A3 (pilot with F3) |
| **Attend** (F2) | Names what pulls at attention and gives each pull exactly one place (attend now / set aside / leave open / let be) | Three pulls, one place each, no hold | Stay with the attended item until ready (`hold`, no timer) | **Attend pilot** (staging); one-tap `foc_*` | Not an engine rep | Shelf now; A8 (narrow) later |
| **Reframe** (F3) | Writes what happened as a camera would, names the reading, sets other readings beside it, re-weighs | Pick one of 4 situations; weigh; see 3 readings; re-weigh | Own-situation wording check, more alternatives | **Look Again pilot** (staging); `gro_update` one-tap | Not an engine rep | Shelf now; A3 later |
| **Settle** (F4) | Names an urge, picks a response mode (pause / say something small / leave it), optional self-paced pause | Urge + response mode only | Pause with explicit end | `en_pace` (contrast); pilot `hold` step | Whole family | New (A3-class); reuse `hold` mechanic |
| **Relate** (F5) | Sorts items into mine / shared / theirs for one relationship | Three items, one relationship | More items, optional held phrase | `rel_boundary` + follow-up, `rel_connect`, `rel_appreciation` | Three-bucket sort | New step type; A3-class |
| **Choose** (F6) | Picks what mattered, compares to where the day went, chooses one small step or "nothing now" | One step or none | Dated step with follow-up (existing commitments) | `dir_time`, `act_tiny`, `act_friction`, `dir_fits`, commitment follow-ups | Mostly closings | R + P |
| **Recover** (F7) | Recalls what restores, picks one to use or chooses to rest | "What has helped lately?" + use / rest | Recall of own earlier choices | `en_helped`, `presence`, `en_pace` | Rest exercise (A4) | R + A4 |
| **Integrate** (F8) | Reports *when* a reaction was noticed (before / as it happened / afterwards / didn't), keeps one thing or nothing | One moment, timing report | Counts over the person's own earlier reports (the Mirror, factual) | Check-ins (`cont_*`) approximate follow-through | Timing report with durable stances | A3-class |

**Playful, safely.** Playfulness is a *tone and mechanic* choice for D0 exercises only: quick comparisons, sorting, picking, small puzzles about the person's own day. Guardrails (authoring rules, [PROPOSAL]): never on a path that carries a burden; never about the person's feelings as a joke; no scoring or "winning"; the permission closings ("you can leave it here") stay plain; every playful stem passes the same safety and tone review as any other. The spec does not write copy; it fixes where playfulness is allowed.

### 4.1 Immediate payoff contract (every family, every path)
A payoff is a typed `RepValue` (the existing five questions, `lib/innerRep/pilots/types.ts`) computed **only** from the session's structured answers and exact authored labels. It never reads an inferred reading.

| Field (existing `RepValue`) | Rule |
|---|---|
| `practised` | Only operations the person performed ("narrowed it to X", "set Y aside", "weighed it twice") |
| `established` | The person's own choices, exact labels, *including the option they passed over where the exercise had alternatives* |
| `usefulNow` | A **structural fact about what they now have** (an arrangement, a re-weighed view, a sorted set, a chosen step or an explicit "nothing now"), never an insight, never advice |
| `unknown` | Everything not told, always including "why it happened" where relevant, plus every "I don't know" |
| `carriedForward` / `notCarried` | Exactly what is kept (and where: this device) and what is not (typed words, any judgement, reminders) |

**Swap test (acceptance):** no payoff could be swapped with another session's without becoming false. **Forbidden:** praise, "helped / worked / improved", progress, scores, traits, causes, advice keyed to a tap, "you are". **Permission paths** ("I don't know", "nothing", "leave it", skip) get a payoff too: a plain statement that it is a complete answer and what, if anything, is kept.

| Family | The thing the person built (the payoff's core) | Source of the data |
|---|---|---|
| Notice | The exact name they settled on, the neighbour they rejected | answers (A3 for refinement; today only the first pick) |
| Attend | The arrangement: which pull has which place, and what was set down | pilot record (`AttendFacts.dispositions`) |
| Reframe | Situation, the reading they carried, the alternatives set beside it, weight before and after | pilot record (`LookAgainFacts`) |
| Settle | The urge, the chosen response mode, whether a pause was taken and ended | new structured answers |
| Relate | The sort (counts per bucket), nothing about fault | new structured answers |
| Choose | The one step chosen (or the explicit choice of none) and its timeframe | existing commitment machinery |
| Recover | The resource chosen and whether "use it" or "rest" | existing `en_helped` answers + A4 |
| Integrate | The timing reported, and (later) a **factual count over the person's own earlier reports** with numerator, denominator and window | answers; Mirror contract |

**Honest limit for today's one-tap templates (23 of them).** Their payoff can change from echo to *did / made / passed-over / kept / open* (R1, R-class). That is better and still modest. A genuinely useful payoff needs an exercise that builds something; that is why the practice shelf (section 6) and A3/A8 matter more than closing copy.

## 5. Readiness-sensitive depth without counting days
**Principle:** depth can be **lowered automatically** (the engine already does: `ease`, `simplify`, `return`, `recovery`, `no stacking`) but can be **raised only by the person**. Inferring readiness from behaviour would be an inference about the person, which the product does not make.

**5.1 Depth attribute [PROPOSAL, A9].** Each exercise carries `depth`: **D0 Light** (observational, everyday, one tap or a short build, positive or neutral topic) · **D1 Practice** (a little personal, low burden) · **D2 Personal** (relationships, mistakes, direction, "what's on your mind") · **D3 Heavy** (an event the person flagged, thread work on a heavy topic). Suggested mapping of today's templates (evaluator's, needs product review):

| Depth | Templates |
|---|---|
| D0 | `foc_attention`, `foc_loops`, `foc_settle`, `en_helped`, `en_pace`, `gro_noticed`, `act_credit`, `act_tiny`, `rel_appreciation` (only in a D0 variant without words and chips) |
| D1 | `dir_time`, `gro_update`, `rel_connect`, `act_friction`, `dir_know_act`, `en_drain` |
| D2 | `rel_boundary`, `gro_mistake`, `dir_fits`, `presence`, `probe_anchor` |
| inherited | `cont_*` and lens frames inherit the depth of the person's own act that created them; a lens on partner, family, money, body or self counts as D2 |
Coverage gap to authors: **Direction has no D0 exercise** (`dir_time` is D1), so a D0-only ceiling would leave a capacity unserved.

**5.2 The ceiling is a user-stated setting, not an inference.** `depthPreference ∈ {light, mixed, open}`, default **light**, changeable at any time in Me; stored as structured data on the device (and, if backup is on, as a recorded event so replay stays exact; see section 9 and 10). The engine treats it like the proposed A1 start choice: a **selection-time input**, never evidence. `light` → D0 only (plus D1 the person created); `mixed` → up to D1; `open` → up to D2/D3 as today.

**5.3 Invitations, not unlocks.** After a completed rep, Mirar may offer once: a plain invitation to try something more personal sometime, with an equal "Not now". Rules (acceptance-testable): never after a burden rep, an "I don't know" or a skip; never twice in the same day; after a decline, none for at least 7 completed reps (a *rep* count, because days are not readiness); a decline is **never** evidence; accepting only raises the ceiling by one step.
**5.4 The person can always go to it themselves.** The **practice shelf** (section 6) lists practices by family and depth; choosing one is a voluntary act, and does not change the ceiling.
**5.5 Person-originated depth.** If the person themself raises a topic (a chip they tap, "Something else", a flagged event), the existing context layer may follow it, as today, because it is theirs. The engine's existing rules (evidence independence, budgets) are unchanged.
**5.6 Acceptance:** a property test shows depth eligibility is a function of the stated ceiling and the person's own recorded acts only; permuting the calendar gaps between completed reps does not change it.

## 6. Making curiosity actionable: the practice shelf (available now)
The staging build already offers "Another opening: optional practice" on Today (Look Again, Attend), device-local, separate from the engine, and excluded from Production by the build. Realignment treats this as the **voluntary on-ramp**:
- A **shelf** of practices by family, each with its light form first, one line saying what the person will *do*, the honest time, and "what is kept" (device-local).
- Choosing is always the person's act; no depth, trial or evidence consequence. Pilot data remains device-only; **A7 (pilot choices as engine evidence) stays deferred.**
- Today's single engine rep remains the daily default; the shelf is optional. This is the lowest-cost way to let curious people try a *real* practice before any engine change, and the way to test candidates B and C in section 12.
Catch for the entitlement contract: a **pilot completion is not a completed engine rep**, so it does not start the trial. Either keep the first session an engine rep (candidate A) with the shelf visible straight after, or amend the trial contract (separate approval). Nothing is changed here.

## 7. The audit's problems, with verified causes
| Problem | Verified cause | Fix | Class | Revalidate |
|---|---|---|---|---|
| **Repeated abandoned question** | `today()` creates the instance in memory but does not persist; a reload drops it; the next day's `decide` sees nothing [VERIFIED NOW]. `windowBlocked` would block the repeat if the instance existed | Host calls the **existing** `progress([])` when a rep is served, so the abandonment is recorded as skipped next time. No new API. Trigger choice for review: on *serve* (the question has been shown on Today; recommended) or on *Begin* (more conservative: a glance is not an abandonment) | Store/host (`stores/inner-rep-v2-store.ts`), runtime unchanged | Runtime suite; **backup recorder/replay** (new `rep_abandoned` events appear: whitelist already supports them); disengage/ease accounting changes by design; simulator unaffected |
| **Excess context follow-ups** | `rel_appreciation` has `words` and `capture.domain: if_present` (`templates.ts:43`); step machine emits them (`contracts.ts:130, 140`); thread offer after any probe answer (`:159`) | D0 variants without words/chips; thread offer only for depth ≥ D2 (A11) | C (catalog version) | Engine suites, sweep, new-template invariants |
| **Forced probe timing** | `probe.firstAfterReps: 4` (`config.ts:16`) so rep 5 is always "what's on your mind" | Person-initiated entry first; engine probe only when ceiling ≥ D2 and not after a decline (A10) | E | Sweep, probe cadence tests |
| **Needless extra steps** | Same as above plus `timeframe` (needed) | Trim in D0 variants; keep the timeframe step for chosen intentions | C | As above |
| **Serious exercises too early** | No depth concept; `intensity` tags do not capture it (§0.3) | Depth attribute and user ceiling (A9) | E | Property test (5.6); coverage by capacity |
| **Monthly counter reset** | `practiceDaysThisMonth()` (`v2-runtime.ts:236`) and the Today/Mirror text | Add read-only totals: days practised in total, and a rolling window; copy says "N days so far" or omits it; **never** a streak | R + P | Runtime + Mirror tests |
| **Sparse Mirror** | Mirror contract is a tally in category names; "ledger demoted" | Practice view in everyday verbs (family overlay), "what Mirar is holding" (open commitments/threads, only if real), the shelf; **no "how close to a reading"** (it would invite steering) | R + P | Mirror contract tests |
| **Echo completion** | `IntegrationMoment.tsx` (generic) | Payoff grammar (4.1) via a new pure module over `Receipt` | R + P | New unit tests; receipt/mirror suites unchanged |

Overlay principle: **metadata that is only presentational** (family, everyday verb, depth tag for the shelf, payoff frames) lives in a new module outside the frozen engine files (for example `lib/innerRep/runtime/families.ts`), keyed by template id. Only metadata that changes *selection* (depth ceiling, trimmed steps, probe gating) touches the engine and needs the approvals in section 10.

## 8. Language contract (R7, presentation only)
Questions stay as authored. Replace the *frame*: avoid "offered question / selected response / source material / not ability / no verdict on you / what remains open" as headings; say what happened in plain verbs ("You picked…", "You put it aside", "Still open: …"). Capacity names stay as internal ids; the person sees the **verb of the practice** ("Noticing", "Looking again", "Giving things a place"), not "Direction / Growth / Action". Keep every honesty statement (no reading is implied, nothing is scored) but say it once, in plain words, near the Mirror, not on every screen. Final copy is Codex's, reviewed against the forbidden-word list in 4.1.

## 9. What must not change (preserved invariants)
Evidence thresholds and independence rules (`config.ts` snapshot, `freeze.json`); provenance and `trace` on every statement; correction behaviour (No/Partly/Not sure effects); the safety boundary (crisis check on typed words, halt, no persistence); privacy (no free text stored; structured only; device-local unless backup is opted into). Nothing here lowers, bypasses or relabels any of these. The Honest Mirror still speaks only when its rules are met; the realignment does not try to make it speak more often.
**Preserved work:** G3 continuity (controller, consent gate, verified-export policy) and the entitlement contract (348 h, first completed engine rep, per-account) are unchanged. Two interactions to flag: (1) a **new user-stated input that affects selection** (depth preference, and the proposed A1 start choice) must be recorded as a structured event so Option B's replay stays exact; the backup vocabulary and SQL are not applied (G4 blocked), so this is a design note to fold in before any approval; (2) the persist-on-serve change adds `rep_abandoned` events, which the recorder already supports.

## 10. Engine and contract change map
Legend: **P** presentation only (Codex, no revalidation beyond UI tests) · **R** runtime/read model/store, no engine behaviour change (revalidate runtime, Mirror, receipt, backup suites) · **C** catalog/content under a new catalog version (revalidate engine suite, correction suite, sweep, invariants) · **E** engine behaviour (new engine version, `freeze.json`, full revalidation).

| ID | Change | Class | Files | Approval | Status |
|---|---|---|---|---|---|
| P1 | Payoff screen, plain-language frame, shelf, depth invitation UI, counter copy | P | `IntegrationMoment.tsx`, `DailyExperience.tsx`, `MirrorExperience.tsx` | none beyond review | not started |
| R1 | `payoffFor(receipt, templateId) → RepValue` (pure) + family/verb overlay | R | new `lib/innerRep/runtime/payoff.ts`, `families.ts`; tests | review | not started |
| R2 | Persist the served rep (host calls existing `progress([])`) | R | `stores/inner-rep-v2-store.ts` | review + backup revalidation | root cause verified |
| R3 | Totals and rolling window accessors | R | `v2-runtime.ts` (read-only) | review | not started |
| R4 | Mirror practice view fields (family verbs, "holding") | R | `mirror-contract.ts` | review | not started |
| **A1** | Cold-start template choice | E | `config.ts`, `engine.ts` | **not approved** (per record) | existing proposal |
| **A3** | Families F3 Reframe and F1 Notice-refinement in the catalog; new step types | C/E | templates, contracts | **not approved** | existing proposal (pilot) |
| **A5** | Evidence returns observation ids | E (read-only) | `evidence.ts` | **planned, not approved** | existing |
| **A8** | Attend as a selectable rep (narrow) | E | per `A8_ATTEND_PROPOSAL.md` | **not approved** | existing |
| A6, A7 | Pilots create commitments / enter evidence | E | n/a | **deferred** | do not revisit here |
| **A9** | Depth attribute, user-stated ceiling, invitation rules | E | `types.ts`, `templates.ts` (metadata), `engine.ts` filter | new | proposed here |
| **A10** | Probe gating (person-initiated first; engine probe only at ceiling ≥ D2; light "welcome back" on return) | E | `config.ts`, `engine.ts` | new | proposed here |
| **A11** | D0 template variants (no words/chips); thread offer gating | C | `templates.ts`, `contracts.ts` | new | proposed here |
| A12 | Backup vocabulary: events for user-stated selection inputs (depth, start choice) | design | `lib/innerRep/backup/events.ts`, SQL draft | with G4 | note only |
Byte-identity rule for every E/C item (as in the existing proposals): with the new option absent or at its maximum, the simulator trace for all 21 profiles × 20 seeds equals v2.0.1; frozen suites (85/17/18/Mirror) and the 420-run sweep pass; `freeze.json` is updated deliberately.

## 11. Codex-facing frontend requirements
Codex may prototype now **without inventing functionality** if every element is built from one of three sources, and labelled accordingly.
**Available today (build against real data):** `TodayView` (`rep` with `payload` and `context`, or `done`), `Receipt` (steps, commitment), `MirrorModel` (sections and statements with `trace`), `practiceDaysThisMonth()` (to be replaced by R3), the pilot hub and sessions (`PStep` `choice | multi | words | hold`, `RepValue`, `PilotReceipt`, `buildPilotMirror`).
**Fixture-only until built (label every screen "PROTOTYPE · not served by the engine"):**
```ts
// R1: runtime-supplied; Codex renders, never computes. Mirrors the existing RepValue.
interface PayoffView { version: 1; practice: string /* everyday verb phrase from the overlay */;
  did: string[]; made: { label: string; value: string }[]; passedOver?: string[];
  stillOpen: string[]; kept: string[]; notKept: string[]; permission?: string; trace: { instanceId: number } }
// A9 UI: a user-stated setting and an invitation that can be declined
interface DepthState { preference: 'light' | 'mixed' | 'open'; invitation?: { id: string; offeredAtRep: number } }
// Shelf entry: only what is real. 'engine' | 'pilot' | 'prototype' decides how it may be described.
interface ShelfItem { id: string; family: 'notice'|'attend'|'reframe'|'settle'|'relate'|'choose'|'recover'|'integrate';
  source: 'engine' | 'pilot' | 'prototype'; light: string /* what you will do */; seconds: number; kept: string }
// Candidate new step types (prototype data shapes only; the engine does not emit them)
type ProtoStep =
  | { type: 'pick_two'; prompt: string; options: { id: string; label: string }[]; labels: [string, string] }   // best fit / least fit
  | { type: 'report3'; prompt: string; options: [string, string, string] }                                      // lighter / same / heavier
  | { type: 'sort3'; prompt: string; items: { id: string; label: string }[]; buckets: ['mine','shared','theirs'] }
  | { type: 'hold'; prompt: string; endLabel: string }                                                           // exists in the pilot runtime
```
**Rules Codex can rely on (unchanged):** the runtime owns sequencing (`nextStep`/`session.step()`); the UI never decides what to ask, never infers, never stores text; every step has "I don't know" or skip; the person can leave at any time; a disabled option shows its reason; no timers, scores, streaks, praise or advice; a payoff is rendered from `PayoffView` only; fixtures are generated by the real code where possible and excluded from Production bundles (preflight enforces).
**Screens to prototype:** (1) first-session variants A/B/C (section 12) with the payoff screen; (2) the practice shelf; (3) the depth invitation and Me setting; (4) the Mirror practice view; (5) the plain-language frame pass; (6) counter copy. Each with the empty/unknown/leave paths and the 320–1440 matrix. **Not for Codex to design:** new engine logic, evidence wording, depth rules, or anything that implies a capability labelled prototype is real.

## 12. Three candidate first-session experiences
Common to all: under 90 seconds; one clear "do"; payoff per 4.1; "I don't know", "nothing" and "leave" are complete paths; nothing stored beyond the existing structured data; no claim of benefit.

| | **A · Notice, with a real payoff** | **B · Look Again (short)** | **C · Attend: give each pull a place** |
|---|---|---|---|
| Entry (curiosity) | "What took more attention than it deserved?" (existing day-1 exercise) | "Pick a situation; look at it again" (pilot, 4 situations) | "What's pulling at your attention?" (pilot, up to 3 pulls) |
| The person does | Picks, then (optional, A3) says *close / not quite* | Weighs, sees 3 readings including a less charitable one, re-weighs | Gives each pull exactly one place; at most one "attend now" |
| Payoff core | The name chosen and the neighbour passed over, plus what is kept | Situation, reading carried, alternatives set beside it, weight before and after | The arrangement the person made and what was set down |
| Source | Engine rep + R1 + P1 (**feasible without engine change**) | Pilot runtime (staging) | Pilot runtime (staging) |
| Trial interaction | Starts the trial (engine rep) | Does **not** (pilot) unless the trial contract is amended | Does **not** (pilot) |
| Weakness | Thin until refinement (A3) exists | Words step, longer; typed text session-only | Longest (≈90 s) |
| Acceptance (engineering) | Payoff differs by answer; swap test passes on all 23 templates; "unknown" path has a payoff; zero forbidden words; receipt identical after reload | Closings differ by choice; "keep my reading" and "heavier" produce non-corrective closings; leaving records `left` not a completion | Second "attend now" blocked with a reason; "do nothing" valid; nothing creates a reminder or task |

**Recommended integration path:** A as the default first session (an engine rep, so the trial rule is untouched) with the shelf visible immediately after, so B and C are one tap away for the curious.

## 13. Human test protocol and pass/fail
**Purpose:** learn whether a candidate feels like an enjoyable, understandable practice with a payoff, not to prove effect or conversion. Reuses the consent, safety and adviser-review approach in `TRIAL_LENGTH_EVALUATION.md`; no new spending is committed (participant thank-yous are a founder decision).
- **Who:** 12 adults, 18+, recruited from the founder's network and waitlist, with self-described segments: 4 "not into self-reflection", 4 "somewhat curious", 4 "already reflective". Not for people seeking treatment; plain consent; right to stop; crisis resources visible (112; Tele-MANAS 14416).
- **Design:** each person tries **two** of A/B/C in a counterbalanced order (each ordering twice), moderated, on a staging build with prototype elements labelled. A short message the next day says "open it again if you feel like it"; voluntary return in 72 hours is recorded.
- **Measures:** (M1) can say what they did (reviewer-coded, blind to the candidate); (M2) 1–5 ratings: interesting or enjoyable, heavy or serious, effort; (M3) "what did you get out of that?" in their words; (M4) forced choice "quiz / chore / practice / game" for the experience; (M5) stated wish to do another, plus observed return; (M6) any discomfort; (M7) reviewer swap test on the structured payoffs.
- **Pass (pre-registered, descriptive only):** ≥ 9 of 12 can say what they did; median "interesting or enjoyable" ≥ 4 **and** median "heavy or serious" ≤ 2; ≥ 8 of 12 want another; swap test 100%; no payoff statement a participant calls untrue; at most one mild discomfort and none severe.
- **Fail (any one):** ≥ 4 people say it was "just questions"; anyone reports pressure; any untrue statement; ≥ 3 abandon mid-exercise.
- **Reporting:** per candidate and per segment, "of these 12 people", no statistics beyond counts. The next build choice is the candidate with the most passes; ties go to the simplest. A candidate that fails on safety or untruth is dropped regardless.
- **Feeds:** masterplan requirement V3 (standalone value), gate F2 (usefulness) and P1; it does not replace or relax any gate.

## 14. Safety and privacy implications
- **No new text storage.** Reframe's camera sentence stays session-only with a crisis check (pilot behaviour); payoffs read only structured answers.
- **Playful tone** is confined to D0, burden-free paths, and reviewed; permission closings stay plain.
- **Settle/pause** (new): no medical or breathing claims, explicit end, not for acute distress; a "very strong" urge routes to the safety panel.
- **Depth**: only the person can raise it; automatic lowering stays; a decline is not evidence; the preference is practice data and must be disclosed as such; if backup is on it is a recorded structured event.
- **Persist-on-serve** records that a rep was *served and left* (a structured fact already supported); it adds no content.
- **Pilots stay device-only and outside the engine's evidence** (A7 deferred); backup scope is unchanged.
- **Safety copy and detector** remain unvalidated and unsigned-off; this spec does not change that blocker.

## 15. Implementation sequence and cost
All local engineering; **no new recurring cost and no purchases**. Effort bands are rough estimates for planning, not commitments.
| Step | What | Owner | Needs | Effort (est.) |
|---|---|---|---|---|
| S0 | This spec; Codex prototypes the shelf, payoff, invitation and Mirror practice view on fixtures | Codex | nothing | 4–6 days |
| S1 | R2 persist-on-serve + tests (incl. backup recorder); R1 `payoffFor` + overlay for the 23 templates + swap-test suite; R3/R4; P1 wiring | Claude + Codex | review | 6–10 days |
| S2 | Human test of A/B/C on staging (section 13) | founder + Claude | consent, participants | ~1 week elapsed |
| S3 | A9 depth + A10 probe gating + A11 D0 variants: build behind flags, simulate | Claude | **approval of A9–A11** | 8–12 days |
| S4 | A3 pilot (F3 Reframe, F1 refinement): templates, step types, invariants | Claude + Codex | **approval of A3** | 10–15 days |
| S5 | A8 (narrow) if Attend proves out | Claude | **approval** | 8–10 days |
S1 is independent of any engine approval and addresses R1, R5, R8 and the counter immediately.

## 16. Reconciliation with the launch plan and gates
No gate is changed, relaxed or added. Mapping: **V3** (standalone value) gets its definition from 4.1 and its evidence from section 13; **P1/P2/P3** (first rep, variety, Mirror) are served by S1 and A9–A11; **T1** (trial) is unaffected as long as the first session is an engine rep (section 6); **H1** (honest history copy) is unaffected; **S1/B1/O1** and the continuity (G3, G4) and entitlement (E1–E5) gates are untouched. Open release blockers (historical log gap, real two-inbox isolation run, safety sign-off, human pilot testing, v2 promotion) are unchanged; section 13 contributes to "human pilot testing" and does not satisfy it alone.

## 17. Decisions for the founder
1. Approve S1 (R1–R4, P1) as non-engine work. 2. Approve running the section-13 test (and participant thank-yous). 3. Approve A9–A11 for flagged simulation, or decline. 4. Decide whether a pilot completion should ever start the trial (default: no). 5. Confirm the default depth preference is **light**. 6. Confirm the depth-tag mapping in 5.1 with product review. 7. Confirm that A3 (F3, F1) remains the pilot proposal and A8 waits for the test.

## 18. Evidence and reproduction
- Abandonment diagnosis: `npx tsx scripts/sim/abandonment-probe.ts` (unchanged runtime; scenario A = today, scenario B = the host also calling the existing `progress([])`). Output recorded in section 0.
- Template tags: five templates are `intensity: 'medium'` (`en_drain`, `rel_boundary`, `gro_mistake`, `dir_know_act`, `act_friction`); `dir_fits`, `dir_time`, `gro_update` and `presence` are `light`/`low` [CODE `templates.ts`].
- Recorder behaviour for abandoned reps: `lib/innerRep/backup/recorder.ts:49` emits `rep_abandoned` for any instance that was skipped and not completed.
- Journey data behind the problems: `docs/product/FIRST_14_DAYS_EXPERIENCE_AUDIT.md` and `docs/product/first14/first14-raw.json` (40-run aggregates).


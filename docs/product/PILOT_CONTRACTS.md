# Exercise pilots: Look Again and Attend (contract v1)

Status: **implemented, tested, hosted on staging; not active in production.** Code: `lib/innerRep/pilots/`. Tests: `scripts/runtime/pilots.test.ts` (66 checks, mutation-checked on two guards). The frozen engine (`inner-rep-engine-v2.0.1-correction-fix`) and the runtime adapter are unchanged; the test suite fails if either differs from `mirar-integration`.

A pilot is an **optional extra practice the person chooses**. It does not replace, select, or alter Today's engine rep, and it writes nothing the engine reads.

## 1. Quality standard for every rep (Priority B)
Every pilot closing is a typed `RepValue`, computed only from the stored record:

| Question | Field | Rule |
|---|---|---|
| What did they practise? | `practised[]` | Only operations the record shows they performed. Stopping early lists "stopping where it stopped being useful", not the full exercise. |
| What could be useful before they leave? | `usefulNow` | A structural fact about what they now have ("named separately"), never an insight. |
| What did it establish? | `established[]` | Their own choices, exact authored labels. |
| What remains unknown? | `unknown[]` | Always includes "why it happened" for Look Again; adds every unknown/"can't tell" they gave. |
| What is carried forward / not? | `carriedForward[]`, `notCarried[]` | States exactly what is kept on this device and what is not (typed words, any judgement, reminders). |

**Proposed rule for engine reps (needs Codex + review, no engine change):** the existing `Receipt` gets the same five fields rendered from the same structured data. Today's engine closing keeps its current meaning; the standard is applied in presentation and review, not by changing the engine.

## 2. Pilot 1: Look Again (Reframe)
**Operation.** The person (1) picks a situation type, (2) writes what happened as a camera would record it, (3) checks their own sentence against that standard (yes / partly / no; one retry), (4) names the reading they are carrying, (5) rates how certain it feels, (6) sets other possible readings beside it, (7) re-rates, (8) chooses whether to do anything. Steps 2–3 and 6–7 are acts on their own material with their own judgement as the check. Nothing is graded.

**Not a questionnaire.** The flow is a fixed sequence of *ten acts* (test: "the exercise is an operation"). The person produces a sentence (kept on screen only), tests it, and sees it displayed *beside* their named reading. The closing cannot be swapped between two sessions: it names their situation, their wording check, their reading, what they set beside it (test: closings differ by choice).

| | |
|---|---|
| Inputs | choice, multi-choice (0–4), unknown, skip, words (character count only), safety signal |
| Outputs | `LookAgainRecord` (structured only), `RepValue`, `PilotReceipt` |
| Unknown | "I don't know" on every choice; skip on words; no reading yet → straight to exit; all complete |
| Exit | Leave from any step → `left` record (never counted as a completion); nothing answered → no record |
| Resume | Draft restored on the same local day only; typed words are *not* restored (UI says so); other-day or corrupt drafts dropped |
| Completion / return | After the exit choice the receipt shows; "Back to practice" returns to the hub; Today is unaffected |
| Alternatives | 4 per situation, always including a *less charitable* one, ≥3 valences; "keep my reading" (none) is an equal result; "more certain" is accepted without comment |
| Forbidden | Stating or implying the cause; ranking readings; "positive/healthier" language; converting any authored sample content into personal evidence (there is none here: the situation list is a menu, the person's own choice) |

## 3. Pilot 2: Attend (Choose Attention)
**Operation.** The person names what is pulling at their attention (up to 5), then gives each pull **exactly one place**: attend now, set aside, leave open, or deliberately do nothing. **Only one pull can have "attend now"** (the control disables the second with a reason). If they attend, they may stay with it until they say they are ready (no timer). They report how the arrangement sits, and may rearrange once.

**Not a questionnaire, not productivity.** The constraint (one at a time) forces a choice; "do nothing" and "no attend-now" are valid. No ranking, no timer, no overdue, no score of how much was done. Setting aside creates **no reminder, due date, task or commitment** (`PILOT_CAPS.commitments = false`).

| | |
|---|---|
| Inputs | multi-choice, choice, unknown, hold-end |
| Outputs | `AttendRecord`, `RepValue`, `PilotReceipt` |
| Unknown | "Hard to tell" is its own complete outcome; "I don't know" per pull is recorded as *unknown*, distinct from *leave open* |
| Nothing pulling | Completes immediately: "Nothing needs arranging" |
| Exit | Leave anywhere; leaving during the hold is `left_during` and never a completion |
| Resume | As Look Again |
| Continuity | A set-aside item is offered back **once**, next Attend session, within 7 days, never the same day, max 2, framed as "Is it pulling at you now?" with "Not right now" as a normal answer; never "overdue" |
| Return | Receipt, then hub |

## 4. Evidence and persistence semantics
- **Stored:** structured records only (`schema 1`): ids of authored options, counts, statuses. **No text field exists**; a words answer is a character count, kept only in an unfinished draft for validation.
- **Where:** device-local, per user, key `mirar_pilots_v1:<userId>`, separate from the engine blob. Not synced. Cleared on sign-out. 180-day / 200-record retention, reported by the Mirror.
- **What may be said (pilot Mirror, `buildPilotMirror`):** counts with numerator and denominator over the person's own choices; their exact latest answers; set-aside items inside the window. Cross-session counts need ≥3 completed sessions of the same exercise (sparse state says so). Every statement carries `source` (user_said / observed / not told), the record ids, and `provenance: exact`.
- **What may not be said:** reasons, traits, trends, "improved", rankings, advice. A language test scans every generated string.
- **Not active (and listed as such in the data interface so a renderer cannot imply them):** reminders, account-level history, turning an exercise into a commitment.

## 5. Safety boundaries
Not for acute distress. The words step runs the existing crisis-language check; on a hit the session **halts**: no further step, no record, nothing persisted (tested at session and store level). The same limitations as the engine's check apply (not validated; misses paraphrase and non-Roman scripts), and the helpline copy still needs founder/clinician sign-off before production. No exercise instructs confronting trauma, suppressing a feeling, or fixing a relationship.

## 6. Data interfaces for Today / receipt / Mirror (Priority C)
`lib/innerRep/pilots/read.ts`:
- `pilotReceipt(record) → PilotReceipt { recordId, pilot, title, date, status, value: RepValue, trace }`
- `buildPilotMirror(records, today) → PilotMirror { state: empty|sparse|populated, statements[], retention, inactive[] }`
- `pilotOffers(records, today, resume) → PilotOffer[]` (Today's optional second-practice card: title, line, resume flag, count of carried items)
Pilot statements are a **separate** model today. Merging them into the engine `MirrorModel` is a runtime change (mine, no engine approval) that I have deliberately not done until the presentation is agreed with Codex, because it adds sources to a contract Codex already renders.

## 7. Engine compatibility and amendments requiring explicit approval
Nothing below is implemented. Each is a versioned engine amendment.

| ID | Proposal | Why | Cost / risk |
|---|---|---|---|
| **A6** | Pilots may create an engine commitment ("find out something later", "set aside until…") | Real follow-through | Touches commitment budget and check cadence; must keep "no overdue" guarantees. Until approved the option is hidden (tested). |
| **A7** | Pilot choices enter engine evidence as a new origin (`pilot`) with independence rules | Lets the longitudinal Mirror combine Today reps and pilots | Changes evidence counting; needs the same correction/withhold behaviour; a Partly rule would apply. |
| **A8** | Engine-selected pilots (templates with `sort` / `allocate` interactions) | Daily practice becomes the richer mechanic, not an extra | Changes selection, variety and burden guards; needs simulation across the 240-rep suite. |
| **A5** (existing) | Engine reports exact observation ids behind a count | Makes `come_up` provenance exact | Already proposed. |

**Not proposed here, still gated:** opt-in durable account history (DURABLE_HISTORY_DECISION_MEMO); this release stays device-local and says so.

## 8. Contract for Codex (Priority D)
Render `PStep` (`choice | multi | words | hold`); return `PAnswer`. The reference renderer is `components/pilots/PilotViews.tsx` (functional, deliberately plain). Constraints Codex can rely on, and must not contradict:
1. Never decide sequencing. The step comes from `session.step()`.
2. Typed words are component-local; pass only `chars` and the safety signal; clear on every exit.
3. A `disabled` option carries its reason; show it.
4. `allowBack` / `allowUnknown` are per step.
5. The hold has no timer and no back.
6. Fixtures (`scripts/runtime/pilot-fixtures.ts`) are generated by the real sessions, labelled "FIXTURE DATA" in the UI, and are excluded from Production bundles (preflight checks).
Ambitious visual treatment is welcome (e.g. a true two-column "split" of observation and reading, a spatial allocation board). The contract supports it; what it cannot support is any claim about *why* something happened, any task/reminder semantics, or cross-device continuity.

## 9. Gates still open
- Safety wording and helpline copy: founder/clinician sign-off.
- Comprehension and usefulness testing of both pilots with real people (none done; no efficacy is claimed).
- Product decision on A6–A8 and on merging pilot statements into the engine Mirror.
- Supabase: `ADMIN_SECRET` rotation, admin function retirement, log review, real-auth callback and signup verification (all blocking any v2 app promotion).

## 10. Deployment and rollback
- **Staging only.** `EXPO_PUBLIC_PILOTS=1` (plus `EXPO_PUBLIC_DEV_MOCK=1`, `EXPO_PUBLIC_REVIEW_STATES=1` for the demo-auth review build) at build time. A production-equivalent build contains none of the pilot screen, authored content or fixtures; `scripts/release/preflight-app.sh` fails the release otherwise.
- Hosted preview: `https://mirar-pilots-preview.vercel.app` (login-protected, demo auth). Branch `mirar-pilots`, not merged to `main` and not deployed to Production.
- **Rollback:** the pilots are additive and flag-gated, so there is nothing to roll back in Production. To remove from staging: repoint or delete the alias; `git revert` the pilots commit(s). The engine and landing are untouched.
- **To ship a pilot later:** approve A6–A8 as needed; sign off safety copy; test with people; then remove the staging-only gate for that pilot behind a new, explicit release decision.

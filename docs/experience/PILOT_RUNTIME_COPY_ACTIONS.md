# Runtime-copy actions for Claude

Prepared 14 October 2026. Verified against PR #3’s frontend candidate `85b3322` and fetched `mirar-unified` HEAD `7cc38ac6247e42044099787c17ce299b2a8b443e`. The four affected functions are unchanged on that unified branch. Real `PilotSession` reproductions confirmed each finding. This handoff proposes runtime-owner fixes; Codex has not modified runtime, evidence, persistence, schema or selection.

These are read-model wording repairs. Preserve every answer, unknown category, early-exit status, eligibility threshold, trace and device-local privacy rule. Add regression assertions to `scripts/runtime/pilots.test.ts`; test `pilotReceipt(record)` and `buildPilotMirror()` as well as the value functions, because both consume this copy.

## F1 — Look Again claims acts that have not happened

**Path:** `lib/innerRep/pilots/look-again.ts`, `lookAgainValue()`, lines 108–109; related wording at 123–125 and 137.
[Verified source](https://github.com/sahilaharia-design/mirar-app-vercel/blob/7cc38ac6247e42044099787c17ce299b2a8b443e/lib/innerRep/pilots/look-again.ts#L105)

**Reproduce:** situation `no_reply` → observation skip → interpretation `ignoring` → leave at `weight`. Record: `status=left`, object interpretation, `weightBefore=null`. Current `practised` says “Naming the reading you were carrying as a reading, and noting how certain it felt”. Certainty was never answered. Similarly, writing and leaving at `camera` yields a claim that the sentence was checked when `cameraChecks=[]`.

**Expected:** name only the operations recorded. Naming a reading is sufficient; leaving before rating must not imply a rating. Writing is distinct from checking. Unknown is a valid recorded check, not a successful verification.

**Suggested fix:** split the compound statements into fact-gated operations: observation written → writing; nonempty `cameraChecks` → self-check; object interpretation → naming; `weightBefore !== null` → checking certainty (including uncertainty). Keep the camera check explicitly the person’s assessment. For related `usefulNow`/`carriedForward` wording, do not claim alternatives were considered or before/after ratings exist when their fields are absent. Do not imply the typed observation remains available after leaving.

**Acceptance:** leave after writing but before camera; leave after naming but before weight; unknown camera/weight; completed normal route. Absent acts produce no claim; supplied unknowns retain their legitimacy; normal records still describe the performed operations. No text enters the record.

## F2 — Attend reports a complete arrangement or a deliberate absence of focus from partial/unknown placements

**Path:** `lib/innerRep/pilots/attend.ts`, `attendValue()`, lines 119–120, 129–140, 142–151.
[Verified source](https://github.com/sahilaharia-design/mirar-app-vercel/blob/7cc38ac6247e42044099787c17ce299b2a8b443e/lib/innerRep/pilots/attend.ts#L114)

**Reproduce:** name `work`, `rest` → leave `work` open → leave before placing `rest`. Current value claims every thing has a place and that the person chose not to focus on any of them. The remaining pull was never answered. Completing with an unknown disposition also produces “Each thing you named has a place”.

**Expected:** distinguish unplaced, explicitly unknown and explicitly placed pulls. Unknown is not Leave open or Do nothing. Absence of an Attend-now answer is not a deliberate choice to keep attention free when another placement is missing/unknown. Left remains left, regardless of how many placements were answered.

**Suggested fix:** derive copy predicates from existing facts only: all named pulls have a disposition; all those dispositions are known; an explicit Attend-now exists. Use complete-arrangement wording only when all placements are present and known. Otherwise describe recorded placements and leave the rest open: e.g. “Some places remain undecided.” Gate the “chose not to give any one attention first” statement on all known placements and no Attend-now. Preserve each explicit placement in `established`. In `unknown`, describe unplaced/unknown pulls rather than filling their gaps. For a leave at `when`, do not present the derived default `no_time_set` as a time choice the person explicitly made.

**Acceptance:** leave before any placement; leave after one of two placements; one known plus one unknown; all unknown; all-known with no Attend-now; all-known with one Attend-now; leave during hold; rearranged result. No partial result is described as full, no unknown is converted to a placement, and hold facts stay tied to the actual held pull.

## F3 — Hard to tell is changed into Nothing pulling in retention copy

**Path:** `lib/innerRep/pilots/attend.ts`, `attendValue().carriedForward`, line 151.
[Verified source](https://github.com/sahilaharia-design/mirar-app-vercel/blob/7cc38ac6247e42044099787c17ce299b2a8b443e/lib/innerRep/pilots/attend.ts#L149)

**Reproduce:** `pulls` → unknown. Record: `outcome=could_not_name`, empty pulls. Current carrying line: “That you checked and nothing was pulling at you.”

**Expected:** retain exactly the distinction the person supplied. They could not name what was pulling; they did not say there was nothing.

**Suggested fix:** branch on `outcome`, not merely `pulls.length`: `nothing_pulling` keeps the current nothing-pulling line; `could_not_name` says “That you checked and said it was hard to tell what was pulling at you.” For an early exit with `outcome=null`, do not use either completed-outcome sentence. Keep structured choices only; add no text, tasks, reminders or commitments.

**Acceptance:** compare explicit empty options vs unknown at `pulls`; their carrying statements must differ and agree with `usefulNow`/`unknown`. Exercise both through `pilotReceipt` and latest Mirror wording.

## F4 — Global state/notice can imply count readiness when no eligible comparison exists

**Path:** `lib/innerRep/pilots/read.ts`, `buildPilotMirror()`: `totalDone` line 52; existing eligibility lines 63–74; sparse notice/state lines 83–85.
[Verified source](https://github.com/sahilaharia-design/mirar-app-vercel/blob/7cc38ac6247e42044099787c17ce299b2a8b443e/lib/innerRep/pilots/read.ts#L44)

**Reproduce:** two completed Look Again sessions plus one completed Attend session, all unknown. Result: `state=populated`, zero `come_up` statements, no sparse notice. Three Look Again completions without eligible reweigh answers similarly cannot produce a reweigh count.

**Expected:** do not imply cross-session comparisons are available merely because three sessions exist across families. Exact practice totals and latest choices may still appear. Existing per-family/per-pull eligibility and numerators/denominators remain authoritative.

**Suggested fix:** compute comparison availability from the actual emitted `come_up` statements, after existing eligibility filters. When none exists, provide an accurate limitation notice regardless of `totalDone`. Suggested wording: “There is not yet enough answered material for a comparison across sessions. Your practice totals and latest choices can still be shown.” If one family/pull has a count, do not imply the other does. Reuse existing fields; do not add an eligibility rule or lower a threshold.

**Contract clarification for Claude:** `state` currently has no explicit distinction between records being present and comparisons being ready. If `populated` is meant to describe readiness, align it with actual eligible comparison statements. If it means only populated records, preserve that enum meaning and make the limitation notice independent of it. Document the chosen meaning; frontend must not infer readiness from the enum alone. This is a labeling decision, not permission to change evidence rules.

**Acceptance:** empty; left-only; 2 Look Again + 1 Attend; 3 Look Again without reweigh; 3 eligible Look Again; 3 eligible Attend sessions naming the same pull; one eligible family and one sparse family. Verify notices, `state`’s documented meaning, unchanged count eligibility/trace and no cross-family aggregation.

## Reconciliation watchpoint — explicit attention choices

At `7cc38ac`, `lib/innerRep/pilots/board.ts:26` (`normalizeArrangement`) automatically changes an earlier Attend-now pull to Leave open when another is selected. PR #3 preserves the approved disabled destination and exact runtime reason, letting the person explicitly free the slot through Back. Runtime acceptance of the normalized final board does not establish that the person chose the automatically assigned Leave-open answer. Resolve this during reconciliation; preserve the explicit-choice boundary, rather than silently importing the old mock’s swap behavior. No Codex runtime edit is proposed here.

## Exact-build review handoff

`docs/release/UNIFIED_STAGING.md` on `7cc38ac` supplies independently integrated preview aliases, but that commit does not contain PR #3 candidate `85b3322`. PR #3 has no reconciled-build reply as of this check. Those earlier aliases are not evidence of the final reconciliation.

Claude: reply in PR #3 with the reconciled branch, full commit SHA, immutable deployment URL and demo/real-auth mode. Include the preview flags and whether fixture loading is available; no secrets or share tokens. Once the build is identified, Codex will review that exact deployment at the five agreed sizes, including keyboard, reduced motion and actual exercises/receipts/Mirror. Only concrete regressions or high-impact improvements will receive focused frontend patches, based on the reconciled commit. No further parallel integration branch, design direction or independent production deployment.

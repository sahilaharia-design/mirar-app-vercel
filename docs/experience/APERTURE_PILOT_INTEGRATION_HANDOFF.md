# Aperture × real pilots — Claude integration handoff

This branch combines the approved Aperture expansion (`8e9fa11`) with the actual `mirar-pilots` runtime (`8f30963589ed0a83caa0fc483a73fd58a294840a`). It supersedes the candidate mock-pilot sections of APERTURE_EXPANSION_HANDOFF.md. No new exercise or candidate schema remains in the review journey.

## Runtime boundary

`PilotRunner` renders `session.step()` and returns `PAnswer`. It does not sequence, select or author runtime options. Choice, multi, words and hold all use the emitted prompt/options/limits/allowUnknown/allowBack. Disabled Attend destinations display the exact runtime reason. No automatic focus swap. No drag gesture is required: touch and keyboard activate the same destination buttons. Multi selects at most the emitted maximum.

Words exist only in the mounted runner. Only trimmed character counts enter the session, and only after the unchanged crisis check. Camera/retry screens show local words; every departure destroys those words. A restored draft visibly states that words were not restored. Readings and alternatives are reconstructed from structured runtime choices and exact authored labels, never inferred from words. Additional selected possibilities have equally weighted revisit controls. Unknown and no-reading paths do not invent placeholders that imply an interpretation.

`PilotPractice` consumes an injected runtime port. The real app uses Claude’s unchanged Zustand wrapper/device-local store; the public review uses the same PilotStore/session/read functions with separate memory KV. Pausing with Back to Today retains a structured draft. Leave closes as `left`; no answers produces no record. Starting another family never silently replaces an unfinished draft. Safety halts/discards; no receipt or record. The hold has no countdown, automatic end or back. Rearrangement follows the emitted contract and never adds another hold. The Back affordance also respects the session’s snapshot boundaries (hold, hold offer and rearrange), preventing a button that the session would refuse.

## Presentation integration

- `PilotViews.tsx`: shared Look Again reflective planes, spatial Attend field, destination/selection controls, value panel, offers and pilot Mirror.
- `PilotPractice.tsx`: shared practice/hub/receipt/safety presentation. All writes supplied by the caller.
- `PilotsScreen.tsx`: real routes, loading guard, actual store callbacks and labelled existing staging fixtures.
- `PilotHosts.tsx`: focus refresh and actual `pilotOffers`/`buildPilotMirror` for Today/Mirror.
- DailyInnerRep adds an optional presentation slot, shown on Today/completion, never during engine practice/safety. Engine callbacks and selection are unchanged.
- MirrorExperience adds a separate presentation plane. Daily engine facts, retained own responses, current possible readings and correction/unknown history retain their existing gates. Pilot facts and choices are separately attributed and traced; no combined count, insight or history.
- The old `components/experience/pilots/PracticePilots.tsx` mock was removed. The full review journey now uses real pilots and their actual receipts/offers/Mirror.

Canonical artwork bytes, Instrument Serif/DM Sans, tokens, approved motion, reduced motion and existing landing sample are preserved. Readings move into view only because the person changes the view; no ambient animation was introduced. Mobile receipts stack without fixed flex sizing, avoiding overlap in Expo’s constrained scroll surface.

## Runtime copy findings for Claude (no runtime edits here)

1. `lookAgainValue` can describe “noting how certain it felt” when a person leaves immediately after naming a reading, before the weight step.
2. `attendValue` can say each named pull has a place when the person leaves mid-allocation or chooses unknown for a place.
3. `attendValue.carriedForward` describes “nothing was pulling” on `could_not_name`, though hard-to-tell is a distinct outcome.
4. `buildPilotMirror`’s global state/sparse notice uses total completed sessions, while cross-session counts correctly require three eligible same-family sessions. A populated state can therefore exist without any eligible count.

The presentation stays safe without changing these semantics: early-left receipts show only established choices/unknowns, not complete-operation summaries; unknown Attend placements remain explicit; retention disclosure states that structured pilot choices stay device-local, without repeating the inaccurate generic carrying sentence. Mirror renders actual statements and never converts `state=populated` into a personal trend/profile. Please correct these record-derived sentences in your runtime-owned work before production and rerun pilot tests.

## Build/release ownership

Every production-route pilot import remains inside the direct `EXPO_PUBLIC_PILOTS === '1'` gate. No production flag, auth, environment, migrations, selection, persistence or evidence code was changed. Expo must be exported with `--clear` when switching staging/production flags: a reused Metro cache retained prior staging values in an initial local build. The clean production-equivalent export is the relevant exclusion check. Supabase values used locally for builds are nonfunctional review placeholders; real auth is not validated by these tests.

Claude’s protected pilot preview was verified as READY at `8f30963` and reviewed using existing Vercel access. It currently predates these frontend commits. The new public visual preview uses the existing creative-review project and memory adapters only. Please integrate this frontend into your staging branch and supply the resulting immutable hosted URL for the final post-merge review. Do not promote the creative-review build to production.

Safety content/clinical review, human comprehension/usefulness, real authentication/callbacks and deployment approvals remain Claude/founder release gates. Existing engine amendment proposals remain outside this frontend task. This is ongoing daily practice, not a scored course or completion programme.

## Validation

Evidence, source provenance and repeatable commands are in `pilot-integration-validation/README.md`. The review matrix drives emitted controls through actual sessions; the separate Expo matrix checks actual route/store hosts and real same-device reload. Neither substitutes for human comprehension testing or real-account security testing.

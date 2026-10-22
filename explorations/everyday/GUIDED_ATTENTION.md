# Guided Attention — founder feedback revision

Same isolated exploration branch and draft PR #6. Presentation only; no edits to `lib/innerRep/pilots/*`. Message and Reply were reviewed and retained without changes: their reversible fictional readings and unsent non-prescriptive rehearsal remain distinct. The founder's interest in all three is recorded as individual review feedback, not human-study results. No rotation or personalization is built.

## Before → after

| Before | After |
| --- | --- |
| Introductory copy, scene artwork, placement legend and controls competed for attention | The actual runtime question is the only active heading; one short distinction: choose things first, place them next |
| Immediate single-choice submission made selection and advancement the same gesture | Every ordinary step has a local selection and one explicit Continue; selecting is reversible until submission |
| Repeated explanation and full arrangement competed with each new pull | Current pull and position dominate. Earlier choices are in a collapsed disclosure; the arrangement opens at the runtime's reflection/rearrange step |
| Source item and destination were easy to conflate | Named pull in the question, separate destination choices, then a source → destination preview only after selection |
| Artwork shown alongside repeated controls | Canonical Aperture window foregrounds the actual optional hold; it does not add a prelude or extra action |
| Small-screen reading burden before an obvious next action | Current choices appear immediately. Continue appears once there is a response to submit. Persistent Not now and permitted Back remain available |

There is no overall completion score or promise to finish five items. “1 chosen · up to 5” describes selection; “Place one pull · 1 of 2” describes the current pull. This is not a productivity list. Unknown, leaving open and deliberately doing nothing remain separate answers.

## Exact runtime mapping

`GuidedAttendStep` consumes the actual `PStep`. Local choice state is cleared when the actual step changes or Back is used. Continue sends exactly one supported `PAnswer`; it does not insert a new runtime step, invent an answer or record unsubmitted choices. `session.step()`, `answer()`, `back()`, `leave()`, record and value functions are unchanged.

- Pull selection: fixed eight options, maximum five, none and unknown unchanged. None/unknown close only after explicit submission, with truthful distinct closings.
- Placement: one Attend-now; later Attend-now remains disabled with the actual reason. Back changes an earlier answer; no silent reassignment. Earlier rows are informational, not arbitrary edit shortcuts.
- Set-aside: all three actual time choices and no reminder. The runtime supplies neither unknown nor a separate skip here; none is fabricated. No deadline/task is created.
- Hold offer: hold now, after, or unknown. Hold: self-ended, no timer, no automatic advance. Back remains absent where the actual step disallows it. Not now exits; it does not complete a hold or exercise.
- Reflection/rearrangement: actual sit choices, unknown, and one optional rearrangement. No bypass, jump-back across a no-Back boundary, extra rearrange or forced positive result.
- Exit/resume: no resume/persistence service is connected in this isolated first-session lab. Refresh/reset begins fresh. No fabricated saved session or restoration. The production runtime's evidence/continuity remains outside scope.

Both mouse/touch and keyboard use native buttons with pressed state and a named fieldset. The fixed action area has scroll clearance so focused options stay uncovered. Help and earlier choices use native disclosure controls. Heading focus follows actual steps; reduced motion is retained. No decorative animations, dragged-only controls or new artwork.

## Runtime proposals, not implemented

Reducing the initial fixed option bank or maximum pulls, skipping the set-aside time question, editing arbitrary earlier rows after a no-Back boundary, or allowing further rearrangements could shorten the experience. Each changes approved mechanics/sequencing and requires Claude/product approval. This patch does none of them. The remaining eight choices and per-pull repetition need first-time human testing; presentation alone does not establish comprehension or enjoyment.

## Review and boundaries

Use the privately supplied protected preview with existing Vercel access. No public alias, bypass link, access grants or invitations. Review `/?practice=attention` without a demonstration, including uncertainty, Back/change, hold and exit. Message and Reply remain available for comparison. No answers are saved, sent, replayed or attached to an account. Static hosting/authentication requests and host logs exist; no exercise-payload requests or analytics.

Validation and screenshots: `validation-guided/README.md`. Physical-phone and screen-reader testing remain outstanding. Founder review is not a substitute for the separately approved moderated study.

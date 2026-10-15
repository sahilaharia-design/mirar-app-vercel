# Mirar v2 roadmap (15 October 2026)

Ordering principle: **release blockers first, then the workstreams that make Mirar an enduring daily practice.** Mirar is an ongoing emotional-fitness system, not a time-bound program; nothing here introduces scoring, surveillance or a completion target.

## Track A: release blockers (independent of everything else; v2 stays out of production until closed)
| Item | Owner | State |
|---|---|---|
| Historical admin-endpoint log review (from 18 April) | founder (dashboard) | open; coverage limited by plan retention (§Option B spec §10) |
| Safety and helpline wording sign-off | founder / clinician | open |
| Human usefulness and comprehension testing of the two pilots | founder | open |
| Two-account isolation run on `mirar-unified-real` (two inboxes) | founder | open; code fix and store-level test done |
| Codex final confirmation of the exact hosted build | Codex via founder | requested |
| Native screen readers, Hindi/Gujarati typography | Codex / founder | open |
Closed: admin functions retired (404 verified), secrets rotated, staging redirect added, first-time and returning real-auth login PASS.

## Track B: privacy-controlled continuity (Option B), **elevated priority**
Intended architecture confirmed 15 Oct. State: design and local prototype complete and tested; nothing external touched. Sequence and approvals: `OPTION_B_IMPLEMENTATION_SPEC.md` §12 (G1 design approval, G2 privacy/legal review and provider facts, G3 local wiring, G4 staging migration, G5 staging data, G6 production decision, G7 opt-in rollout). Each gate is a separate explicit approval.

## Track C: practice depth
Pilots (Look Again, Attend): approved for staging integration and usability testing only. A8 (Attend as a selectable daily rep) proposal ready, **not approved**. A6, A7 deferred. A5 planned, not approved.

## Sequencing note
Track B work does not unblock or delay Track A; Track A does not wait for Track B. Production promotion requires Track A closed and a separate decision on Track B's activation (G6).

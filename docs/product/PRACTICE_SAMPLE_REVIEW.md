# Review of `codex/mirar-practice-sample` (`9750b2b`, updated for `b0b20af`) against the sample exercise rules

Reviewer: Claude (release owner). Short coordination note for Codex. Tested by building the branch in an isolated worktree and running it in a browser; nothing was deployed or merged.

## Verdict: approved for integration after one required line of copy

Codex took a better route than the spec's before/after self-report: a **fictional scene** (no message from the visitor's own life) where the visitor separates an observation from a possible reading. That removes the self-report and any causal claim about the visitor, so it satisfies the spec's intent and supersedes its steps 2 and 4.

## Verified
- **No storage, network or analytics:** across all nine start/view combinations plus Leave, zero `fetch`, XHR or beacon calls, no new resources, empty `localStorage`, `sessionStorage` and cookies, and no answer in the URL.
- **Forbidden claims:** none of helped, worked, progress, score, should, just, reframed, calm, therapy, mindfulness or technique appears in the component.
- **Honest endings:** "I don't know" and "Leave the exercise" both end without pressure; the closings state what the scene held ("This was not an assessment of you").
- **Labelling:** "Fictional scene · nothing saved" and "An authored perspective exercise. No visitor profile, inferred insight or remembered answer."
- **Separate from the real sample and the fictional Honest Mirror study:** yes.

## Required before release (one line)
Spec rule 1: the sample must not imply the app offers this exercise. The last state shows **"Continue with Mirar"** directly under the closing, which reads as "this continues in the app". Add, near that button:
> *"In the Mirar app, today's exercise is chosen for you and may be simpler than this one."*
The app's closest real exercise is a one-step question about whether a view has changed.

## Suggested, not blocking
- Closings such as "You separated an observation from a possible meaning" credit the visitor with an operation the interface performed (the two stay apart on screen whatever they pick). Prefer "Here, the observation and a possible meaning stayed separate."
- Keep `PracticeSample` independent of `V2RepFlow` and the engine step types; it already is.

## Release path
I will integrate it into `mirar-landing` and deploy only after the line above is in, and after your confirmation that the five-width, keyboard and reduced-motion checks in your contract still pass on the integrated build. Production landing rollback stays `mirar-landing-m2kbb91wn-…` then `…-hgc7m5ger-…`.


---
## Update for `b0b20af` (PR #1): mechanics approved, opening copy must change

**Approved.** The fictional scene, the fixed observation beside a movable reading, the three views, the inert and unsaved behaviour, and the beta-boundary disclosure (now added). Re-checked on the new tip: no storage, network or analytics, and none of the forbidden words.

**Required change: the opening question is a quiz.** "What is observable?" has a keyed answer. Tile 1 states the observation, tile 2 states an interpretation, and the three responses grade the choice:
- tile 2 gets a correction ("A reading is not an observation… keep it as a possible reading, not a fact");
- the result lines credit performance differently ("You held the observation steady", "You separated an observation from a possible meaning", "You made room for an unanswered part").
A visitor who picks the "wrong" tile is corrected, and one who picks the "right" tile is praised. That is the right/wrong quiz the contract forbids, and it teaches the visitor that their first instinct was a mistake.

**Fix, copy only (mechanics unchanged):**
1. Ask a question with no keyed answer, for example **"Where does your attention go first?"** with tiles *That there is no reply* / *What the silence might mean* / *I'm not sure*. Keep the scene and the window as they are.
2. Make the three opening responses equal in weight and non-evaluative, for example: *Starting with what is visible. There is no reply yet; why is a separate question.* / *Starting with what it might mean. That is a natural place to begin. Here it is held as one possible reading beside what is visible.* / *Not sure where to begin. That is fine; nothing here needs settling.*
3. Replace the achievement-style result lines ("held steady", "separated", "made room") with one neutral line for all three starts, for example: *Here, what is visible and a possible reading stay separate.* Optionally add a purely descriptive line about where they began ("You began with the visible part", "You began with a possible meaning", "You began without choosing"), never a verb of success.
4. Keep the step-2 views as they are; they are already equal choices.
5. Show the beta-boundary line in body size **above "Continue with Mirar"** in the completed state, in addition to the small line at the foot. As a footnote it is easy to miss exactly where the visitor is deciding to continue.

**Release path.** On Codex's confirmation of these edits and a re-run of the five-width, keyboard and reduced-motion checks, I will deploy a protected hosted preview of `mirar-landing` with this sample. The current public landing and its rollback (`mirar-landing-m2kbb91wn-…`, then `…-hgc7m5ger-…`) stay untouched until you approve the revised experience.

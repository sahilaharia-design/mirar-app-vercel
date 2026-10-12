# Review of `codex/mirar-practice-sample` (`9750b2b`) against the sample exercise rules

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

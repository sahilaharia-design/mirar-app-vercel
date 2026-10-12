# Hosted practice review and first-time comprehension test

12 October 2026. Review deployment only. Production release remains Claude’s responsibility.

## Preview

https://mirar-creative-review-8zhsa4dn7-sahilaharia-designs-projects.vercel.app/

- Existing review project: `mirar-creative-review`, `prj_uE4hxjIBAa2KkZXQsuX3bXIzAb69`.
- Deployment: `dpl_31CjwccgTWHGhXkTn2bPPVrCEtgr`, READY, preview (`target: null`).
- Exact frontend source: `b0b20afc44f033fbcfa81fdb3073734ca2169333` on `codex/mirar-practice-sample`.
- Static build with published app entry `https://mirar-app.vercel.app/login`; no server functions, credentials or engine changes included.
- Unauthenticated HTTP 200 and clean-browser page access verified. No Vercel login, signed bypass token or expiring share URL. The deployment-specific URL is stable while this deployment is retained.
- No production project deployment, domain alias, DNS, project protection or existing production routing change. Earlier creative deployment URLs remain separate.

## Hosted validation

The complete browser harness passed on the hosted URL: all nine paths at all five sizes (45 checks), 51 axe scans with zero violations/incomplete checks, 13 exit/restart states, keyboard/reduced motion and canonical login arrival. See `practice-sample-validation/README.md`. No login or expiring bypass was required.

## Human test protocol

Two invitations were sent separately via the user-authorized email contacts. Contact details and mail identifiers are not published in this repository. No introductory description of observation/interpretation or intended skill was supplied. Participants were told to use the preview naturally, stop whenever they want, and answer without returning to the page.

Exact questions:

1. What did you actually practise, if anything?
2. Did it feel useful? What, if anything, did you take away?
3. What did you think the first question was asking you to do? Did you feel an answer was expected of you?
4. Was anything confusing, or did any choice feel less acceptable than another?
5. Had you seen this version before? Which device did you use, and where did you stop?

Answers should be recorded verbatim under anonymous participant IDs, including uncertainty, uselessness or confusion. A participant who has seen this version is useful for follow-up review but does not count as first-time comprehension evidence. Two invitations are a small formative sample, not proof of general usefulness; both may not qualify.

## Opening risk to examine

This is a design observation, **not a visitor result**: “What is observable?” offers one statement that describes the scene and one that adds a motive. That framing can suggest a factual knowledge quiz even though there is no score or correct-answer reward. The interpretation branch’s explanatory heading may reinforce that impression.

Keep the reviewed build stable during the test. Watch for unsolicited “right answer”, “wrong”, “test”, “quiz”, “I got it” or embarrassment about choosing the original reading. Ask the neutral first-question prompt only after the visitor describes the practice and usefulness. Record whether original-view or unknown felt less acceptable; do not tell the visitor those choices are supposed to be legitimate beforehand.

A visitor describing only classifying an answer or being corrected does not satisfy the success test. Describing keeping the scene fixed while trying or leaving open a meaning is evidence of understanding that operation, not emotional-health efficacy. Distinguish reported usefulness from an inferred effect.

If quiz framing is reported, the next bounded revision should change the opening invitation and response framing, retaining this fictional scene, reversible window, uncertainty, original view and evidence boundaries. No new concept cycle, personal before/after questionnaire, engine amendment or production deployment is authorized by this review.

## Results status

Invitations sent: 2. Human replies pending. No comprehension or usefulness finding is claimed. Add actual verbatim replies, prior familiarity, device, stopping point and interpretation after receipt. Automated branch tests and AI reviews are not human participants.

## Claude handoff

PR #1 remains a draft for mechanics review and release integration. User approved the fictional behavioral direction for further review and explicitly preferred it to a personal before/after questionnaire. The hosted preview is for desktop/mobile interaction review; production remains gated on Claude’s mechanics/content review and the human findings.

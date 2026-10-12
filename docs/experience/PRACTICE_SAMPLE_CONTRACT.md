# Mirar — public perspective practice and Claude handoff

12 October 2026. Candidate on `codex/mirar-practice-sample`, based on frontend handoff `0a47691`. **Public demonstration only; Claude reviews and releases.** No production deployment, engine change, new personal-response schema or merged catalog amendment.

## Live experience audit

The deployed `https://mirar.life/` was opened in a browser and each completion branch was exercised (no registration). Exact captured output is in `practice-sample-validation/live-audit.json`.

| Old answer | Live response | Value beyond receipt |
|---|---|---|
| I could settle into one thing. | Exact choice, “A moment, named by you,” then “You put words to this moment…” | No attention practice or new discrimination |
| I kept switching between things. | Identical completion structure and generic release | No opportunity to choose a focus or reconsider a reading |
| I don't know | Exact choice, “Room for not knowing,” permission to stop | Respectful autonomy, but no experience of the skill |

The prior sample was not enough. Its static graphic framed a self-report; it did not let someone practise looking again. This implementation replaces that sample, not its motivational closing. No legacy sample self-report transfers into this exercise.

## Candidate mechanic: keep the scene, move the reading

A clearly authored **fictional scene**, not a reconstruction of the visitor's life: “You sent a message. No reply has arrived.”

1. **Distinguish:** choose whether “The message has no reply yet” is the observable part, “They don't want to reply to me” is what seems known, or remain unsure. All branches get a specific, non-scored response. No correct-answer reward, trait or inference.
2. **Operate the window:** keep the observation fixed while selecting the initial possible reading, an alternative possibility, or an unknown reason. These controls directly change the reading plane, its position and the source-mask illustration. The mark boundary stays stable. Nothing declares why the reply is missing.
3. **Reconsider freely:** all three views remain available. The user can switch back without penalty. No extra Finish click or forced pause; a natural CTA appears after a view is selected.
4. **Release:** a concrete description of the operation and chosen view, not generic advice. Leave is available before and after any choice; no commitment, task, timer or obligation to act.

**Success description:** “I practised keeping what happened separate from the meaning I put on it; I tried another possibility / kept a reading as a possibility / left the reason open.” This is an intended comprehension test, not a claim of measured benefit or efficacy.

## Why this is not another receipt

The observation remains visible while the possible meaning physically changes and can be revisited. The visitor actively controls the distinction instead of merely reporting their attention state. They see that changing a reading changes neither the scene nor the evidence. A kept original reading remains a possibility, not a failed attempt at a more positive answer. Choosing unknown retains something definite to attend to.

| Starting response | Guided distinction | Concrete closure after operation |
|---|---|---|
| Observation | No reply is observable; its reason is separate | You held the observation steady |
| Interpretation | A motive is possible, not supplied by this scene | You separated an observation from a possible meaning |
| I don't know | Observable absence and unknown reason can coexist | You made room for an unanswered part |

Each combines with one of three distinct endings:

- **Keep the first reading:** “You kept the first reading in view, without turning it into a known fact.”
- **Consider another possibility:** “You considered another possibility. Nothing in the scene established which reason was true.”
- **Leave the reason unknown:** “You left the reason open while keeping the observable part in view.”

There are **nine** normal response paths. No answer implies calmness, avoidance, rejection sensitivity, growth, improvement or lighter feelings. There is no preferred charitable reading. The alternative is authored and explicitly possible; it is never generated from visitor data.

## Evidence and privacy boundary

- React component state only: initial fictional distinction, selected authored view and whether the exercise was left. No personal situation/question, free text, emotion measurement or rating.
- No engine/template/StepAnswer calls, account writes, selection bias, feedback, storage, URLs containing answers, logs or analytics. State resets on restart or navigation away.
- `onEnter()` is the only outgoing callback and takes **no answer payload**. Natural CTA uses the existing configurable app destination; no practice data, return URL or session transfer is appended.
- The fictional label remains present in initial, active, completed/CTA and left states. It cannot become authenticated personal history. Shared rendering on signed-out app discovery does not connect it to runtime evidence.
- This does not replace the app's approved catalog or assert that it already supports Reframe/Notice-refinement families. D3/A3 remains unapproved for personalized/catalog work. The user's latest request explicitly permits a general authored perspective exercise; **Claude's review/sign-off of this public mechanic/content is still requested before release**.

## Coordination request for Claude

Please review this candidate against `MIRAR_SHARED_JOURNEY_CONTRACT.md`, F1/F3 and the frozen evidence rules. Confirm:

1. The public generic observation/meaning operation is acceptable separately from engine/catalog amendments. Nothing here adds `pick_two`, weight, preference, personal advice or inferred evidence.
2. The no-reply scene and the three equal views avoid unsupported motive attribution and a “think positively” lesson. Any content edits should preserve original-reading and unknown legitimacy.
3. There are no visitor-response analytics from the existing landing wrapper; retain only approved generic CTA metrics, never attach sample choice or completion detail.
4. Integrate the small frontend commit into `mirar-integration`, rebuild the static landing with existing infrastructure and verify the authored label, all paths, canonical assets and CTA on staging. Do not change the app engine to fit this demo.
5. Release remains yours. No Codex production/domain/deployment change is performed. Provide the staged/live revision for post-release visual QA.

No claim of Claude approval is made by this document. The published branch is the review handoff; it is not a request to silently apply an engine proposal.

## Visual and interaction system

- Canonical Mirar image and actual alpha mask unchanged; supporting planes are independent graphics. `WindowStudy` gains optional height and perspective controls. Open removes the illustrative reading lines, not the mark or the observation.
- Live observation and reading outside masks remain legible. Tactile ruled choices expose selected state with text and `aria-pressed`; no drag or hover requirement.
- Visitor-controlled reading plane motion uses existing restrained timing; reduced-motion preference updates immediately. No breathing loop, meter, mood-coded colour or graphic whose fullness measures the person.
- Sample is in the hero on desktop and immediately below a short proposition on mobile. No “Begin sample” gate; no generic completion click. Existing site's other chapters/legal links remain.
- CTA appears only after the visitor operates a view, without interrupting further experimentation. Header account entry remains available for people who already know Mirar.

## Files and integration

- `components/experience/PracticeSample.tsx`: isolated authored exercise, exact public text/options, controls and release.
- `components/experience/DiscoverExperience.tsx`: replaces the old sample/receipt section with the active practice in the hero.
- `components/experience/WindowStudy.tsx`: optional sizing/perspective; defaults preserve other uses.
- `components/experience/ExperienceKit.tsx`: shorter public header spacing.
- `scripts/frontend/verify-practice-sample.py`: all response paths and exit/restart/motion/keyboard coverage.

Build: existing `npm run landing:review-build` for local checks. For Claude's verified release configuration, use the existing `landing:build` gate and **complete** `MIRAR_APP_ENTRY_URL`. Authoritative routing contract on `mirar-routing-contract` confirms `https://mirar-app.vercel.app/login`; no Supabase/session/callback logic is introduced in the landing. Legal paths remain the existing `/privacy`, `/terms`, `/cookies` destinations. No production legal replacements are made here.

## Acceptance before Claude release

- Every initial × view path retains the same observation and a distinct appropriate response; no manufactured insight.
- Unknown works without a story, personal disclosure, compulsory action or false clarity claim.
- Original view, alternative and unknown remain reversible; leaving/restarting works from every state.
- The graphic changes the reading plane, never marks the person as fixed, improved, failed or measured.
- At 320×568, 390×844, 768×1024, 1024×768 and 1440×900: no overflow, ≥44px controls, legible text, keyboard/focus, reduced-motion parity and contrast.
- No sample state is stored/transmitted/logged or attached to CTA URLs; no authenticated demo history.
- Formative review: ask a first-time visitor “What did you practise?” without feeding the intended answer. “I answered questions” means more redesign is needed. This implementation's automated checks cannot prove that comprehension.

## Verified candidate evidence

See [validation evidence](practice-sample-validation/README.md): 45 normal path checks across five sizes, 51 axe scans with zero violations/incomplete checks, 13 exit states, keyboard/reduced-motion checks and CTA arrival at the published login URL. TypeScript and review build pass. First-time visitor comprehension and Claude mechanic/content approval remain pending.

## Reconciliation with Claude’s newly published sample spec

Read completely: `origin/mirar-integration:docs/product/SAMPLE_EXERCISE_SPEC.md` at `78d12c4` (introduced in `1985735`). Its status is **specification for approval**, not an approved engine exercise. This candidate does not silently implement its proposed personal questionnaire.

Agreements: demonstrate an operation; separate the public sample from the unbuilt Reframe catalog; no personal inference or efficacy attribution; no persistence, analytics or answer URL; preserve original-view legitimacy; no gesture-only input; live text carries all meaning; focus/live announcement and reduced motion; retain the inert fictional Honest Mirror study separately. The candidate now visibly states on every state that this sample lives only on this page and the beta chooses a daily rep that may be simpler. This is a concise disclosure rather than the spec’s longer exact sentence; Claude should review the wording before release.

**Recommended difference requiring Claude’s product/content decision:** keep the fictional observation/meaning window rather than collecting a personal situation, before-weight, chosen frame and after-weight. Four successive self-reports risk recreating the repetitive questionnaire the user explicitly challenged. A before/after receipt can suggest an outcome even with a causality disclaimer; none is needed to demonstrate keeping evidence separate from a possible meaning. The spec’s “smaller than the waiting makes it feel” reading also supplies an unsupported explanation; “worth starting small” moves into advice, contrary to its own authoring rules. The fictional scene avoids drafting four personal frame sets whose fit we cannot know.

Unknown differs intentionally: instead of ending immediately without practice, it offers a usable distinction between observable absence and an unknown reason, while retaining an immediate Leave option. The user asked for a meaningful unknown branch. No obligation to complete or settle an answer is added.

No personal before/after weights, efficacy sentence, new catalog family or engine amendment is implemented. Human review must decide the public exercise before release. The preview shows the proposed alternative concretely, so the decision can be made from an operating experience rather than copy alone. `git merge-tree` confirms no textual conflicts with `78d12c4`; no branch merge was performed.

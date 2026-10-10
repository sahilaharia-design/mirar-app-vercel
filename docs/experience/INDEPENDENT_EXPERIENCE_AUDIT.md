# Mirar — independent experience audit

> Historical audit before blueprint publication. The complete originals at `9095186` and `2d150e0` have since been read; current findings, capabilities and decisions are in [the reconciled common contract](MIRAR_UNIFIED_EXPERIENCE_CONTRACT.md) and [alignment matrix](PRODUCT_CREATIVE_ALIGNMENT.md).

8 October 2026. Source review on `codex/mirar-unified-experience`, implementation base `ad4d6a9`. This audit does not reconstruct or evaluate the missing blueprint. The user identifies its original branch as `mirar-product-blueprint`, commit `9095186`; publication is awaiting confirmation. Once confirmed, fetch it, read `docs/PRODUCT_BLUEPRINT.md` completely, record its full commit, and reconcile before merging or deploying.

## Evidence and limits

Read the actual discovery, entry, introduction, Today, rep flow, interactions, integration and Honest Mirror components; creative review and artwork; runtime and feedback semantics. The latest previously fetched experience branch is `origin/mirar-v2-experience` at `8850cfc`. Inspected its Mirror facts additions (`2a72585`, `8850cfc`) without merging. Historical browser evidence is in `../creative/deployment-validation/`; it is evidence of the three explorations, not a test of future unified implementation.

Findings below distinguish direct source behavior from design hypotheses. No new browser walkthrough, user research, efficacy test or claim about the missing document is made. No app, engine, schema, privacy or deployment changes accompany this audit.

## Findings ordered by consequence

### A1 — Integration contradicts its own uncertainty release

**Observed in source:** `components/experience/IntegrationMoment.tsx:11–12` tells an unknown responder that nothing more needs answering, then unconditionally renders the non-commitment “Notice once, later today…” instruction. The discovery sample also discards completed answers and always returns the same attention instruction (`DiscoverExperience.tsx:19`). The creative exploration handles unknown separately, so the main journey is less careful than the prototype.

**User cost:** choosing not to resolve something still becomes another instruction. A user cannot tell whether their response mattered.

**Proposed improvement:** preserve the exact primary choice and unknown branch. Unknown can end without a carry instruction. A useful integration outcome must depend on the approved exercise/outcome contract, not a new inferred user state. Distinguish noticing, non-action and chosen action; do not turn every rep into a commitment.

**Boundary:** renderer branching and exact receipt are supported. New authored outcome content/mapping needs product reconciliation. **Acceptance:** unknown and intentional non-action end without a contradictory assignment; distinct approved exercises do not all produce identical advice. Verify completion after reload separately from immediate completion.

### A2 — The exact receipt disappears on reload

**Observed in source:** `DailyExperience.tsx` keeps `receipt` in component-local state and sets it only after the current component completes a rep. The done view from the runtime carries optional closing/insight, not the submitted context/answers. Reloaded completion therefore falls back to generic integration; local completion preserves the exact choice.

**User cost:** the most concrete day-one value is transient, while product language can imply ongoing remembered context.

**Proposed improvement:** preserve an exact receipt only through an approved read model. In the meantime show a truthful done state rather than implying a response archive exists. Do not reconstruct receipts by reading diagnostic `_state` or storage blobs in UI.

**Boundary:** durable receipt is an adapter/read-model dependency; do not add persistence in a visual pass. **Acceptance:** immediate and reloaded states make their differing data availability clear; no raw optional words are ever part of a receipt.

### A3 — Correction works behaviorally but barely communicates receipt

**Observed in source:** `HonestMirror.tsx` changes the feedback line to “Noted.” after all four values. Successful structured correction sets `corrected=true`, hiding its controls, without a specific acknowledgement. Failure displays an alert and leaves retry possible. Partly's initial Skip closes its reasons, then makes “What's off?” available again; this is not a final-looking release.

**User cost:** a careful correction can look indistinguishable from dismissing a form. Reopening after Skip can feel as though the unfinished question remains due.

**Proposed improvement:** acknowledge the successfully recorded event, and let the interaction visibly end. Avoid claims about immediate intelligence, instant rewriting or a learning score. Whether correction can later be revisited is a product decision, not an assumed engine capability.

**Boundary:** existing `onFeedback`/`onCorrection` and fixed eligibility policy suffice for truthful submission acknowledgement. Historical “what changed because of this” needs an approved read model. **Acceptance:** failure never displays success; every reason including prefer-not-to-say has equal treatment; Skip leaves no nag; rejected/qualified text is never automatically replaced with invented interpretation.

### A4 — The preview's adjacent planes are not connected evidence

**Observed in source:** `creative-review/main.tsx` places the current exact sample response beside a reflection generated from five fictional work responses. They are explicitly labelled separate, which is honest, but their adjacency still invites a causal reading. Its feedback/correction callbacks are no-ops. Discovery similarly demonstrates a fixed fictional reflection.

**User cost:** visual elegance can imply that Mirar inferred the reflection from the choice just made, or that demo corrections affect future selection.

**Proposed improvement:** use two clearly separate modes: an actual response receipt, and a conspicuously fictional evidence study with its own matched provenance. A functional Mirror must receive supporting records from the approved contract. “Read separately” is useful only if it improves source comprehension; it does not create provenance.

**Boundary:** `ShownInsightView` supplies text/tier/counts, not exact supporting response records. Never reverse-engineer those records from counts. **Acceptance:** users can identify which responses support a reading; demo feedback is described as demonstration; real adapter calls actual runtime callbacks.

### A5 — Onboarding asks for permission instead of exercising it

**Observed in source:** `PracticeIntroduction.tsx` asks “When you aren’t sure, which answer is allowed?” Both offered answers lead to the same explanation. The CTA is already enabled without selecting either.

**User cost:** it resembles a quiz about Mirar's rules. It teaches the correct attitude to perform more than it gives a useful first moment.

**Proposed improvement:** make autonomy operational in one brief, explicitly authored introduction: consider a moment or leave it alone, with equal legitimacy. Keep a direct route to Today. Do not add an inferred trait or onboarding score. Challenge any proposed blueprint flow that adds setup questions without a concrete benefit.

**Boundary:** presentation-only introduction supported; a real training exercise requires an approved template. **Acceptance:** user can skip without penalty; no personal story required; no diagnostic data collected; intro does not duplicate the first rep unnecessarily.

### A6 — Attention cues currently substitute for a useful attentive home

**Observed in source:** Today can render draft/resume, done, optional capacity, seconds, practice count and a supplied continuity cue. The creative prototype's Notice / Choose / Look again graphic is static authored explanation, not a source of remembered context.

**User cost:** the same warm greeting can remain anonymous over time; adding day-specific copy or richer artwork would conceal rather than solve missing continuity.

**Proposed improvement:** prioritize actual pending choice, supplied commitment and available practice fact. Use at most one approved continuity line. Let sparse Today feel deliberately inhabited through composition, not multiple empty modules. Never show a remembered incident without data.

**Boundary:** current Today contract plus remote factual carrying support; generated narrative continuity needs Claude. **Acceptance:** Day 1/3/7/30 review fixtures vary only with supplied data; no elapsed-day unlocks, guilt or improvement claims.

### A7 — Mirror's “unavailable” copy now lags remote capabilities

**Observed in source:** the local Mirror describes capacity history as being built and carrying mainly through today's check. Remote `mirrorFacts()` now supplies completed training capacities and open/postponed carrying records, without readings or evidence history.

**User cost:** preserving all old empty sections would hide available value and make the interface seem unfinished. Treating the new facts as a complete evidence contract would overclaim.

**Proposed improvement:** after reconciliation, consume the public facts model and group unavailable interpretation/history into one honest sparse state. Use alphabetical capacity ordering, not bars ranked by amount. Count completed practice as practice, not ability.

**Boundary:** remote implementation must be reviewed/integrated, not approximated locally. Historical responses, contexts, corrections, readings and shifts remain separate dependencies. **Acceptance:** empty, factual-only and carrying states remain useful; rejected insights cannot reappear; undefined dates remain undefined.

### A8 — Creative choice confirmation is a real behavior difference

**Observed in source:** production `ChoiceInteraction` submits an option on activation; creative `ChoiceStep` first selects, then requires Continue. Both emit approved answer shapes, but they differ in effort and ability to reconsider before submission.

**User cost:** an extra confirmation for every list response may add friction; immediate advance can discourage careful comparison. Keeping the prettier prototype automatically is not evidence-based.

**Proposed improvement:** reconcile confirmation policy explicitly. Consider deliberation for paired truths only where useful, retaining standard buttons and no drag-only action. Evaluate task effort and comprehension; do not claim either policy improves outcomes without testing.

**Boundary:** sequencing and schema remain engine-owned; presentation policy can change only as an explicit reviewed choice. **Acceptance:** exact option IDs, no defaults, unknown equally legitimate, no double submission; keyboard activation understandable in both layouts.

### A9 — Graphics should explain an operation, not decorate every state

**Observed in source:** canonical alpha masks and separate planes create a coherent brand relationship. Small ChoiceMark images are repeated for every option; story artwork also repeats on completion and observation surfaces.

**Design hypothesis:** repetition can crowd small-screen choices and weaken the mark's meaning. The source-defined boundary is more ownable when it identifies a change in reading than when it becomes a decorative checkbox.

**Proposed improvement:** keep an expressive arrival, a quiet question boundary and an explicit reflection boundary. Remove choice graphics where they do not help distinguish operations. Use live words to explain sources; never clip prompts into the silhouette. Carrying can be a typographic sentence without another illustrated card.

**Boundary:** presentation-only; canonical pixels unchanged. **Acceptance:** 320px reflow and long copy stay legible; essential meaning survives disabled graphics/motion; no clarity meter or fitness-shaped fill.

### A10 — Accessibility evidence is encouraging but incomplete

**Observed in historical evidence:** five sizes, 44px targets, keyboard, reduced motion and zero reported axe violations. 64 of 66 scans have incomplete contrast checks involving overlap; physical native date ergonomics and assistive-technology behavior were not validated. These are limitations, not proven failures.

**Proposed improvement:** resolve actual rendered contrast on the unified surfaces, inspect focus after correction/completion/navigation, and test the real date UI. Avoid marketing a successful automated scan as accessibility certification.

**Acceptance:** complete keyboard journey, visible focus, correct labels/states, reduced-motion parity, no horizontal overflow, long prompt/reason/commitment stress cases, date picker usability and explicit reporting of remaining manual checks.

## Product assertions needing evidence

- Emotional capacity practice is an intended mechanism, not proof that a given UI improves emotional fitness.
- A factual practice count does not demonstrate growth or explain why someone returns.
- A beautiful separation graphic does not prove people distinguish evidence and inference.
- More frequent reflections may reduce trust if they exceed real evidence; frequency alone is not value.
- A correction changes eligibility under fixed policy. It does not raise confidence, produce evidence or imply that Mirar learned what the user meant.
- A chosen structured option is not necessarily the user's own wording. Label offered choices accurately.
- Device-local retention is not durable cross-device memory; signing out clears practice in the current beta.

## Blueprint reconciliation protocol

Read the complete original file after confirmed publication; do not substitute this audit for it. For each material recommendation, record:

| Field | Required record |
|---|---|
| Original recommendation | Exact section and faithful paraphrase from the actual blueprint |
| Agreement | Concrete user need and supported mechanism shared with experience work |
| Disagreement | Specific tradeoff or failure risk, with source/flow evidence |
| Unsupported claim | Assertion needing product research or unavailable evidence |
| Engine dependency | Exact current input/output or missing approved contract |
| Experience improvement | Revised interaction, fallback and acceptance criterion |
| Resolution | Agreed implementation, explicit fixture, deferred feature or open question |

Update both shared contract documents rather than quietly implementing unresolved proposals. Do not merge or deploy before reconciliation. The existing hosted explorations remain unchanged.

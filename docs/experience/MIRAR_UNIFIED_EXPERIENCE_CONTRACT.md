# Mirar — unified experience contract

8 October 2026. **Working specification; not an approved product contract.** Branch: `codex/mirar-unified-experience`, based on `ad4d6a9`. No unified implementation or new deployment is claimed by this document.

## Source gate

The actual `docs/PRODUCT_BLUEPRINT.md` must be read before decisions that depend on Claude's product-value model. After fetching origin with tags/pruning, the file is absent from the checkout, all remote branch trees, and all fetched history for that path. Checked: `origin/main` / `origin/mirar-v2-experience` at `8850cfc`, `origin/mirar-v2-integration` at `3394254`, `origin/mirar-v2-beta-cutover` at `11f6e33`, and `origin/mirar-emotional-fitness` at `ab017dd`. Its location has been requested. The seven product problems in the user's brief are requirements to investigate, not a substitute for that document.

Read sources: creative review, brand refinement, validation/deployment records; `V2_CONTRACTS.md`, `V2_FEEDBACK_SEMANTICS.md`, `CODEX_FOLLOWUPS.md`; previous `CLAUDE_HANDOFF.md`; actual creative implementations and runtime. Remote changes `2a72585` / `8850cfc` were inspected without merging or editing them.

**Important new support:** remote `mirrorFacts(): MirrorFacts` exposes completed training capacities (capacity, label, reps, lastDate) and open/postponed commitments (label, optional dueDate), alphabetically ordered. It does not expose response history, observations, eligible interpretations, correction history or approved changes. The earlier statement that all Mirror facts lack a read model is now outdated. These remote changes are not yet integrated into this branch.

## Unified thesis

**A stable opening, an honest response, a reading that stays revisable.** Aperture supplies one spatial grammar. Fieldnotes contributes provenance, not a second palette. Weave contributes the idea of carrying an intention, not a fabric whose density measures progress. The user can understand and operate the distinction between experience and interpretation.

Day-one value must exist without an insight: meeting a real choice, noticing what it asks, and leaving with the exact response or a legitimate decision not to resolve it. Returning offers another useful practice and real carried context, never a promise that the product has discovered the person.

## Canonical identity and visual grammar

- Preserve the canonical mark and wordmark artwork. Existing PNGs were verified pixel-identical to the originals after removal of transparent outer margins; provenance is in `../creative/brand-validation/asset-provenance.json`.
- Use the actual mark alpha for graphic windows. Do not redraw an oval, trace a substitute, recolour the artwork, or make an oval control library.
- Large source-defined opening at arrival; quiet boundary beside a question; distinct reading planes at reflection. Live text and hit areas remain outside masks.
- Ivory, paper, charcoal, restrained clay; Instrument Serif and DM Sans. Keep the approved semantic token roles rather than introducing a palette per feature.
- Original diagrams depict framing, separation and carrying. They must explain an operation, not supply a measurement of the person. Photography is optional only if it does more than this system already does; no stock wellness filler.
- A gap is room for uncertainty, never missing progress. A correction changes the reading's presentation, never damages or dims the person/mark.
- User-triggered motion: 180ms feedback, 280ms disclosure, up to 400ms / 8px entry. Any longer explanatory graphic must be optional and outside the task path. Reduced motion is immediate. No loops, compulsory delays, scroll hijack or reveal that withholds essential copy.

## Implementation boundaries

**Implemented now:** existing app's auth/onboarding, runtime Today/draft/completion, supported response steps, feedback/correction, optional-note privacy; separate three-direction prototypes and their public Preview. These are existing implementations, not the unified deliverable.

**Prototype-only now:** source-mask story graphics and reading-layout controls; fictional future Mirror and illustrative evidence. Its no-op feedback callbacks demonstrate layout only. They are unsuitable for a functional unified experience.

**Deferred pending actual blueprint / approved contract:** new exercise semantics, varied integration outcomes beyond exact responses, historical evidence archive, correction-history presentation, shifts over time, cloud history and day-based narrative features. The user's list of possible interactions does not itself extend `Step` or permit selection logic in UI.

## Feature specifications

Each proposal below records the required product/interface questions. “Capacity” describes the intended exercise, not a measured improvement or an invented label on non-training reps.

### 1. Discover and demonstrate
- User need: understand emotional fitness by trying something before registering.
- Capacity: attention for the existing `foc_settle` demonstration; other examples only if approved.
- Behavior: a real template/step sequence; framing highlights what is being considered without changing option copy.
- Outcome: exact selected statement, uncertainty, or leaving; never an inferred visitor profile.
- Input: authored discovery copy, canonical assets, approved `FlowContext`.
- Output: structured `StepAnswer[]` held only in the demo session; explicit entry action.
- Existing support: template and `nextStep`; existing sample implementation.
- New functionality: unified graphic/components and public-to-entry transition; no new engine behavior.
- Evidence/privacy: demo separate from personal practice; no migration of sample answers into account history.
- Fallback: unsupported step gets an explicit unavailable state; optional/unknown paths remain available.
- Acceptance: complete sample before auth; unknown ends honestly; reload clears demo; no inference or outbound answer request.

### 2. Understand six capacities
- User need: know what a practice asks them to exercise.
- Capacity: Direction, Energy, Focus, Relationships, Growth, Action; use established vocabulary, not legacy theme-score dials.
- Behavior: selectable authored examples reveal the operation, not a result or readiness level.
- Outcome: a concrete explanation of practice; no score, diagnosis or promise of efficacy.
- Input: approved authored descriptions and real template references.
- Output: display selection only.
- Existing support: catalog capacity metadata; no capacity assessment.
- New functionality: explanatory visual system; copy review against blueprint.
- Evidence/privacy: no collection and no personal ranking.
- Fallback: all explanations available as plain live text without animation.
- Acceptance: user can describe an example; label never implies demonstrated ability; no unsupported exercises presented as functional.

### 3. Enter and onboard
- User need: arrive with trust and minimal setup.
- Capacity: introductory noticing; not assessment.
- Behavior: existing email/sending/sent/error/retry flow, then a brief interaction permitting uncertainty/disagreement/declining examination.
- Outcome: clear next action and accurate privacy expectations.
- Input: supplied auth status/callbacks; approved authored introduction.
- Output: existing auth submission and existing onboarding completion; no new inferred attributes.
- Existing support: account/auth/onboarding boundary; introduction component.
- New functionality: coherent arrival graphics and accessible transition.
- Evidence/privacy: real email only through existing service; hosted demo authentication must be explicitly simulated and cannot ship as auth.
- Fallback: retry and back; preserve existing expired-link behavior and guarded routes.
- Acceptance: no long questionnaire; no bypass; focus lands on meaningful content; sign-out semantics unchanged.

### 4. Today and return
- User need: one relevant invitation, with genuine continuity when available.
- Capacity: supplied rep capacity only; optional labels stay optional.
- Behavior: welcome/draft-resume/done; at most one approved continuity line. Keep the prompt visually primary.
- Outcome: begin, resume, finish, or return to life without obligation.
- Input: `TodayView`, practice-days fact, draft and approved context; remote Mirror facts only after reviewed integration.
- Output: existing navigation/progress callbacks.
- Existing support: actual Today states, commitment context, local practice count.
- New functionality: attentive home composition. Narrative continuity text requires supplied approved data.
- Evidence/privacy: never invent yesterday, claim cloud recall, or read the storage blob in presentation.
- Fallback: sparse home with one meaningful invitation; missing capacity has no blank placeholder.
- Acceptance: Day 1/3/7/30 fixtures are explicit review inputs, not feature unlocks. Missing/rejected evidence cannot appear as memory.

### 5. Inner Rep interaction
- User need: exercise a useful operation rather than complete a decorative survey.
- Capacity: exactly the template's capacity and mechanism.
- Behavior: render the actual step/prompt/options. Compare separates offered truths; list supports scanning; words/context/timeframe retain existing semantics. No ranking, drag, freeform inference or new response shape without contract.
- Outcome: user's exact structured response, or unknown/optional skip/dismissal.
- Input: actual `nextStep(context, answers)` result; no UI-chosen next question.
- Output: exact `StepAnswer` variants; no raw words.
- Existing support: choice compare/list, optional words/domain, timeframe and check-in offer. Orientation remains disabled.
- New functionality: purposeful presentation and focus choreography. Separating event/interpretation and other proposed exercises need real templates/schema if not supported.
- Evidence/privacy: exact option provenance; safety-only transient words with existing safeguards.
- Fallback: standard accessible controls remain sufficient; no gesture-only dependency.
- Acceptance: every emitted step handled; unknown valid; optional skip distinct; resume exact; no duplicate submit; missing label and long prompt reflow.

### 6. Integration and completion
- User need: understand what was useful today without repetitive generic advice.
- Capacity: tied to actual completed practice; no universal second exercise.
- Behavior: show exact offered question/choice; vary only from approved outcome metadata, never inferred psychological meaning.
- Outcome: potentially noticing, action, revision, intention, uncertainty or leaving alone. These are design targets, not existing output variants.
- Input: completed context/structured answers and current `CompletionView`; future authored outcome contract needs Claude.
- Output: existing completion/Today navigation. No automatic commitment.
- Existing support: exact selected option, unknown, commitment timeframe and optional supplied closing/insight.
- New functionality: varied authored integration types and truthful reusable mapping require blueprint/contract.
- Evidence/privacy: receipt is not a saved journal or an insight; do not expose unsaved words.
- Fallback: exact response with permission to finish; no canned advice filling absent data.
- Acceptance: unknown requires no action; non-action is valid; commitment shown only when chosen; no universal Notice → Name → Try sequence.

### 7. Honest Mirror and visible correction
- User need: inspect a tentative reading and see that disagreement is legitimate.
- Capacity: examination of interpretation; not a test of self-awareness.
- Behavior: separate selected response, supplied observation, engine reading and unknown. Read separately/alongside changes layout only. Keep four feedback values equal and all six Partly reasons exact.
- Outcome: existing feedback/correction is actually submitted; acknowledgement describes that event, not an instant new insight.
- Input: eligible `ShownInsightView`, explicit response/observation provenance if supplied, async feedback/correction callbacks.
- Output: existing feedback value/reason; optional note remains safety-only and unstored.
- Existing support: current reflection, counts disclosure, fixed feedback policy and structured correction. No supports-raising effect for Accurate.
- New functionality: visible successful-submission acknowledgement; a history view requires approved reactive eligibility/correction read model.
- Evidence/privacy: do not pair an unrelated current response with a reflection as evidence. Partly qualifies/withholds; No is final. No raw note in callbacks, history or analytics.
- Fallback: no eligible insight means no interpretation; absent exact evidence means do not invent quotations or observation text. Retry errors without false success.
- Acceptance: exact engine wording; hedged reading not styled as fact; no rejected reading resurrected; “I'd rather not say” first-class; all reasons, skip, privacy wording and safety stop verified.

### 8. Commitments
- User need: recognize what was remembered and name its outcome without productivity pressure.
- Capacity: actual action/continuity rep; label omitted for continuity as supplied.
- Behavior: carry exact authored label and timeframe as a sentence. Follow-up only through actual approved step; neutral postponed/changed-mind outcomes.
- Outcome: user's own status choice or optional timeframe; no inferred failure.
- Input: step commitment context; remote `MirrorFacts.carrying` for factual display after integration.
- Output: existing structured step answers; no arbitrary task editing endpoint.
- Existing support: named follow-up, future-only dates; remote open/postponed carrying facts.
- New functionality: unified carrying surface, no new calendar/task system.
- Evidence/privacy: no IDs, overdue state, urgency badge or implied user-authored text when label is an offered option.
- Fallback: no carrying records means quiet absence, not suggested obligations; undefined dueDate is no invented deadline.
- Acceptance: label immediately recognizable, all five timeframes exact, today/past rejected for picked date, Back to Today distinct from Today timeframe.

### 9. The Mirror and evolving understanding
- User need: see genuine accumulation while retaining the right to revise.
- Capacity: factual practiced-capacity history, not an ability score.
- Behavior: factual practice and carrying first; evidence-backed readings only from an approved eligible model. Avoid repeated unavailable cards.
- Outcome: intelligible difference between fact, interpretation, correction and what cannot yet be said.
- Input: approved `MirrorFacts`, practice-days fact; future explicit response records/eligible readings/corrections/shifts.
- Output: navigation or approved callbacks only; no UI-computed patterns.
- Existing support: remote capacities/carrying facts. No historical eligible reflection/response/shift model found.
- New functionality: structured archive and correction/shift provenance remain Claude dependencies; fixtures may demonstrate the concept when conspicuously labelled.
- Evidence/privacy: never mine `_state` or persisted blob; no charts of invented growth; no restoration of rejected claims.
- Fallback: one generous beginning/sparse state; facts remain useful without interpretation.
- Acceptance: no evidence, only practice, carrying, pending correction, rejected reading and unavailable history all distinguishable. Fixture data cannot enter production adapter.

### 10. Privacy, trust and useful return
- User need: know what is retained and return because practice has value.
- Capacity: none assigned to utility screens.
- Behavior: point-of-use privacy plus plain utility detail; a return is welcomed without a missed-day narrative.
- Outcome: informed use, optional departure, a practice that ends.
- Input: actual retention/auth behavior and approved product copy.
- Output: existing support/sign-out/delete capabilities only where real; no invented control.
- Existing support: device-local structured state, sign-out wipe; unsaved words/notes; existing account setup remains separate.
- New functionality: durable cross-device history requires controlled engineering/privacy work; intentional Hindi/Gujarati font parity remains planned.
- Evidence/privacy: do not describe the entire production product as “nothing saved” merely because a demo is memory-only.
- Fallback: service/network errors explained honestly; no false deletion or sent-email confirmation.
- Acceptance: demo/real-account distinction explicit; clear storage limitations; no unsupported security, efficacy or clinical claim.

## Functional/prototype adapter requirements

Reusable presentation accepts approved view data and callbacks. Real adapters consume public runtime/store methods, never diagnostic state. Fixture adapters are isolated development entry points with a persistent “fictional scenario” label, separate lifecycle and no production export. A fixture day is not the user's day. Prototype auth never connects to protected app routes. Mock errors/corrected/history states are explicitly labelled; they cannot claim real writes succeeded.

## Validation and release gate

Validate the complete implemented journey at 320×568, 390×844, 768×1024, 1024×768 and 1440×900; focus order, keyboard-only completion, 44px targets, contrast, reduced motion, long copy, scrolling and layout stability. Include sparse/return/resume/done, every correction, privacy/safety, date picker, failed callbacks and absence of eligibility. Product review must ask whether each operation helps understanding, not merely whether it is impressive.

Previous creative evidence is historical, not validation of the unified journey: 185 records, 84 geometry screenshots, 66 axe scans; 64 incomplete contrast checks remain unresolved. No new validation is claimed yet. New hosted preview must be a separate verified Preview, anonymous without token, leaving mirar.life and authoritative deployments unchanged. No merge or public production deployment.

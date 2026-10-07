# Phase 2 — Daily Inner Rep visual implementation

> Historical Phase 2 record. Claude subsequently supplied the v2 runtime adapter and v2.0.1 contract fixes. See [final polish and current validation](polish-v2.0.1/README.md) for the current integration status.

## Source and branch
Repository: `https://github.com/sahilaharia-design/mirar-app-vercel.git`.
Implementation checkout: `/Users/sahilharia/Documents/Mirar v2 visual`.
Branch: `codex/mirar-v2-visual`, based on `origin/mirar-emotional-fitness` at `ab017dd` (engine v2.0.0-mvp freeze). Required commit `5fa8209` is an ancestor; both `docs/V2_CONTRACTS.md` and `docs/V2_DECISIONS.md` were read in full. The newer commitment-budget freeze is preserved. The previous uncommitted Vite/landing work remains untouched in `/Users/sahilharia/Documents/New project`.

## Contract → component mapping

| Contract / step | Component | Semantics | Accessibility | Mobile / desktop |
| --- | --- | --- | --- | --- |
| `choice`, list | ChoiceInteraction + SelectionSurface | One tap emits exact option ID; unknown emits `kind: unknown`; copy verbatim | Named action buttons, no pretend radio selection; new prompt receives focus | Vertical ruled statements; bounded editorial width |
| `choice`, compare | ChoiceInteraction | Exactly supplied statements, plus equal unknown action | Same keyboard semantics as list | Stacked statements on phones; paired at 768px+ |
| `words` | WordsInteraction | Optional; maxChars from contract; only safety detector receives raw text; emits payload-free `words` or `skip` | Labeled multiline input, privacy description, autofill/correct/spellcheck off | Lightweight writing surface with clear Skip |
| `domain_chips` | ContextInteraction | Exact offered domains; separate Skip, no inference | Named actions, visible focus, ≥44px | Naturally wrapping neutral selections |
| `timeframe` | TimeframeInteraction | Exact options; `pick_date` emits `specific_date` with integral civil-day `inDays`; skip remains skip | Labeled date control, Continue unavailable for invalid date | Wrap choices; date control fits narrow screens |
| `yes_no` | CheckInOffer | Equal Yes/No; no default; separate Skip | Buttons with visible focus | Paired actions, wrapping as needed |
| `orientation_chips` | Not implemented | Disabled by frozen MVP | No collection path | Not rendered |
| `RepPayload` | DailyInnerRep | Supplied capacity and exact seconds; Begin/Resume | Clear primary action and headings | Warm, bounded composition; no dashboard |
| `ShownInsight` + feedback | HonestMirror | Exact engine text and evidence counts; four equal feedback callbacks; no default answer | Named disclosure with expanded state; neutral feedback | Editorial divider and typography, no chat bubble |
| Completion / `done` | DailyInnerRep | Calm closing, optional engine insight, Return to Today | Focused headings; no celebratory state | Same quiet shell |

Template labels such as acknowledge, commitment check, continuity and open-context rep are not new step types. They render whatever the frozen step machine emits. No internal frame, template, intent or trace text is exposed.

## Components and presentation
New reusable components are in `components/inner-rep/v2/`. They import the real `Step`, `StepAnswer`, `FlowContext`, `RepPayload` and `nextStep` rather than duplicating the engine. The presentation-only completion/insight interfaces describe the documented callback boundary; they do not create storage schema.

The approved CSS foundation is retained in `design-system/tokens.css`; `design-system/native.ts` maps its colors, spacing, fonts, radius and motion to React Native. Canonical wordmark artwork receives no filters, recoloring, opacity animation or transformations. Instrument Serif and DM Sans are locally bundled TTF files with retained OFL licenses; platform font gates load them without network requests. Localization typography remains a deferred production requirement.

Choices use ruled physical space rather than stacked cards. Compare becomes a deliberate pair on desktop. Optional words have a single writing surface. Context and check-in permission remain neutral. Honest Mirror is a typographic reflection; hedged wording is labeled “Something to consider,” without becoming a finding. “No” receives only “Noted.”

Motion uses the approved 400ms settling entry with at most 8px movement. Reduced motion starts conservatively enabled and follows the platform preference. There are no ambient loops or delayed auto-answers. Direct press feedback never changes the option IDs or adds a confirmation step.

## Integration boundary — DESIGN DEPENDENCY

Contract: v2 `Today` / `RepPayload` / `FlowContext` / `StepAnswer` completion and insight-feedback transport.

Problem: the contract explicitly states v2 is not wired into the app. `stores/inner-rep-store.ts` still selects v1 exercises and writes v1 `RepAnswer` records to `inner_rep_responses`. There is no production adapter supplying v2 Today/context, in-progress state, v2 completion or correction-observation callbacks. Replacing it would alter persistence and product behavior.

Recommendation: product/engineering supplies the v2 runtime/store adapter and approved migration. Mount DailyInnerRep with the actual payload/context and callbacks after behavioral integration review. Do not translate v2 answers into v1 records.

Reason: the visual task must preserve engine, evidence, schema and persistence semantics. The complete presentation path is implemented and reviewable, but shipping routes intentionally remain untouched. This is not a deployed v2 product.

Additional dependencies:
- **Partly correction:** the document describes a correction observation, but no transport shape exists. The UI offers the optional domain correction only when the host supplies `onCorrection`; no observation is inferred or saved by the UI.
- **Rest / no rep:** shipping-disabled; no invented rest screen. Orientation and contradiction insights remain disabled.
- **Why this today:** proposed wording is not approved; raw decision traces are not displayed.
- **Date limits:** legal date range is unspecified. The renderer validates a real civil date and emits its exact offset without imposing a future-only rule or silently converting it. Engineering should define admissible ranges before production integration.
- **Drafts:** interrupted presentation retains structured answers only in its mounted session, and can accept a host-provided draft. Reload persistence needs the owner’s adapter; no new storage was created.
- **Safety:** existing detector and resource copy are used unchanged. Expert-review limitations from the contract remain; a safety hit stops this UI, calls the safety callback with a skip and no text, and does not call completion.

## Local review
`npm run visual:review` starts a standalone local review harness at `http://127.0.0.1:5174`. It imports no auth, Supabase, analytics or persistence adapter. Its fixtures use real templates and the frozen engine/evidence functions; the default rep is engine-selected. Synthetic fixtures cover individual contract paths and are not app selection rules. `window.reviewAudit` exposes structured answers only for testing. No raw text is accepted by those callbacks.

Review paths use `?case=compare`, `words&step=words`, `context&step=capture_domain`, `timeframe&step=timeframe`, `commitment`, `continuity`, `open&step=thread_offer`, `followup&step=follow_up`, `acknowledge`, `mirror`, and `done`. “Mirror” uses actual engine-generated insight text from synthetic observations, never an authored claim about a real user.

Only local review tooling was added (Vite and React DOM type definitions). No broad framework/security upgrade was performed. Existing advisory findings remain a separate engineering task; the fetched Expo branch has its own advisory inventory.

## Validation and commits
See `VALIDATION.md` and `screenshots/` for exact checks, limitations and evidence. The shipping Expo build and the isolated visual review build are checked separately. Engine compatibility is verified by the unchanged frozen simulator suite and a zero diff across protected source directories.

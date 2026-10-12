# Response to Codex's independent experience audit

Subject: `codex/mirar-unified-experience` at `c78064c` (`docs/experience/INDEPENDENT_EXPERIENCE_AUDIT.md`, `MIRAR_UNIFIED_EXPERIENCE_CONTRACT.md`, `PRODUCT_CREATIVE_ALIGNMENT.md`). I verified each source claim against the integrated code (`mirar-v2-experience`) before answering. Codex wrote the audit before it could read my blueprint; where it asked for things I have since built, that is noted.

Verdict: the audit is accurate and well-bounded. **I agree with all ten findings.** Four need qualification, one exposed a flaw in my own work, and two things Codex marks as "needs Claude" are already built.

| # | Finding | Verified in code | My position | Action |
|---|---|---|---|---|
| A1 | Integration contradicts its own uncertainty release; one fixed "notice once" line for every rep | Yes. `IntegrationMoment.tsx`: the unknown branch says nothing more needs answering, then the generic noticing paragraph renders unconditionally. Discovery sample also returns the same line. | **Agree. Genuine defect, highest priority.** The fix is not new advice copy: unknown and "leave it" end with no instruction; a chosen commitment keeps its sentence; otherwise the close is built from the session's own answers. | **Implement** (presentation, uses `runtime.receipt()`) |
| A2 | Exact receipt disappears on reload | Yes. `receipt` is component-local state; `CompletionView` carries no answers. | **Agree, and fixable now without new persistence.** The structured answers are already stored. | **Built:** `runtime.receipt()` (`receipt.ts`), reload-equivalence tested over 240 reps incl. unknown and commitments. UI to consume it. |
| A3 | Correction acknowledged only by "Noted."; Skip re-offers "What's off?" | Yes (`HonestMirror.tsx`). | **Agree.** Acknowledge the recorded event specifically and state its real consequence from `config.ts` (No → 21 days; Partly → held back and hedged; Not sure → a week). Skip should end the interaction. No claim that Mirar "learned". | **Implement** (presentation; no engine change) |
| A4 | Fictional reflection beside a real response invites a causal reading | Yes: discovery shows a fixed fictional reflection (labelled "Example · fictional responses") with live feedback buttons. | **Agree, with one qualification:** the labelling is honest; the risk is adjacency and live-looking buttons. Make it two modes: a real receipt, and a clearly separate study that is visibly inert (no feedback buttons, or buttons labelled "demonstration"). Never reachable from an authenticated session. | **Implement** (presentation) |
| A5 | Onboarding is a permission quiz | Yes: two answers lead to the same message; the CTA is enabled without choosing. | **Agree.** Replace the quiz with one authored line and one real, skippable first rep, or go straight to Today. No extra questions. | **Implement** (presentation) |
| A6 | Today is anonymous over time; use at most one real continuity line | Yes: `continuityCue` prop exists, runtime never fills it. | **Agree.** Build the supplier from open commitments/threads only. | **Build** (small runtime contract, W3) |
| A7 | Mirror "unavailable" copy lags remote capabilities | Yes (before `2a72585`/`8850cfc`). | **Agree and go further:** the facts model Codex inspected is superseded by `runtime.mirror()` (contract v1, with `said`, `come_up`, `carrying`, `readings`, `shifted`, `unknown`, each traced). Codex's "needs Claude" list for the Mirror (response provenance, eligible readings, corrections, shifts) is largely **already built**; see the limitation below. | **Integrate** (Codex consumes `runtime.mirror()`) |
| A8 | Confirmation policy differs (auto-advance vs select-then-Continue) | Yes. | **Open decision, no engine impact.** My lean: confirm only for paired truths (considered choice); auto-advance for list choices. Decide by a short five-person comparison, not by taste. | **Test, then decide** |
| A9 | Graphics should explain an operation, not decorate every state | Yes (ChoiceMark per option). | **Agree.** Keep arrival, question edge, reading boundary. Remove per-option marks. Carrying is a typographic sentence. | **Implement** (presentation) |
| A10 | Accessibility evidence incomplete (64/66 contrast scans incomplete; no native testing) | Per Codex's records. | **Agree.** Do not call it certified. Resolve rendered contrast on the unified surfaces; test the real date UI and screen readers. | **Required before wider release** |

## What I disagree with or want to correct

1. **"Never reverse-engineer supporting records from counts" (A4) applies to my own work.** In `mirror-contract.ts`, the `trace.observationIds` for a `come_up` statement are observations matching the evidence's domain on the evidence's days. That is an approximation of the engine's supporting set, not the engine's own list. It is traceable and safe (the ids exist and are the user's own), but it is not guaranteed to be the exact set the engine counted. **Fix proposed (amendment A5, read-only):** have `computeEvidence` return the observation ids it used. Until then the contract must not claim "these are the exact responses behind the count"; the UI should say "responses about Work in this period".
2. **"A real training exercise requires an approved template" (A5/A6 context).** True, and that is the point of amendment A3. I do not agree that onboarding must wait for it: the introduction can simply hand off to the first real rep.
3. **"Integration outcome must depend on an approved exercise/outcome contract."** Partly. A closing computed from the session's own answers (restating, juxtaposing, a before/after the user reports) needs no new contract and is allowed now. Genuinely different outcomes per mechanism need A3.
4. **The three-step "Notice / Choose / Look again" grammar.** Codex says no universal sequence. I agree and hold the line equally on my earlier "Notice → Name → Try": both are brand verbs, not rep structure.
5. **Interaction deemed decorative:** per-option ChoiceMark; story artwork repeated on completion/observation; the three-state landing story as the hero interaction (the real sample is more honest); Weave density; the "Read separately" control is useful **only** if it separates sources, and only if it can never reveal a rejected reading.

## Things Codex marked as dependent on me that are now available
| Codex dependency | Status |
|---|---|
| Exact receipt after reload | `runtime.receipt()` — built, tested |
| Factual Mirror: capacities and carrying | `runtime.mirror()` `practised`, `carrying` — built, tested |
| Response provenance | `said` section with exact authored prompts and labels via the engine's own `nextStep` (handles prompt variants and lens/follow-up option sets) — built, tested |
| Eligible readings with the user's verdict and correction; rejected never revived | `readings`/`shifted` — built, tested (mutation-checked) |
| Sparse/empty states | `state: 'empty' | 'sparse' | 'populated'` — built |
| Approved shifts | Only engine `change` evidence, hedged — built; thin until new exercises add stance options |
| Continuity line | Not yet built |
| Cloud history, new exercise semantics | Proposals only; need approval |

## Bug found in my own contract while doing this
The first version of the ledger and receipt resolved option labels from the base template, which was wrong for lens, thread-check, resolution and commitment-check frames and for per-user prompt variants (13 of 240 simulated reps produced no receipt; ledger text could name a prompt the user never saw). Both now resolve exact prompts and labels through the engine's `nextStep` (`step-resolver.ts`); the receipt test asserts the receipt's prompts equal the prompts actually shown.

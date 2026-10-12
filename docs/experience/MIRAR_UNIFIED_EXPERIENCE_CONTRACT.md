# Mirar — unified product and experience contract

Reconciled recommendation, 10 October 2026. Branch `codex/mirar-unified-experience`. **Integration specification, not an approval to amend the engine, merge, migrate or deploy.** This replaces the provisional missing-blueprint specification. Open decisions and capability gates are explicit; no claim that Claude or the user has accepted every resolution.

## 1. Sources and actual state

Repository: `sahilaharia-design/mirar-app-vercel`.

| Source | Pinned revision | Review |
|---|---|---|
| Original blueprint, `docs/PRODUCT_BLUEPRINT.md` | `90951865776f8632c536dafcb8aeb4edbd72bc3e` | Read completely; diagnosis retained, several prescriptions superseded |
| Product-value documents, Mirror implementation and tests | `2d150e01fd30e0b9d20e7f642147188414def8c3` | Published branch fetched; all five companion documents read completely, code inspected and tested in isolated temporary snapshot |
| Experience audit | `c78064c7085bc07150e487f06cc8a37516f8e33b` | Pushed and remote verified before reconciliation |
| Creative brand refinement and public evidence | `460d326`, `ad4d6a9` | Canonical artwork, three implemented concepts and historical validation |
| Existing runtime and frozen contracts | engine tag `inner-rep-engine-v2.0.1-correction-fix`; experience remote `8850cfc` | Existing behavior checked against code, not just blueprint assertions |

The product-value branch is **read, not merged**. This branch retains the existing runtime without `runtime.mirror()`. Capability marked “remote-built” refers specifically to `2d150e0`, not functionality already integrated here. The original audit remains historical; its missing-blueprint/read-model statements are superseded by this contract.

## 2. Common recommendation

**A stable Mirar opening; a useful act of practice; a reading that remains separate and revisable.** Adopt Aperture / The Revisable Window as the single visual grammar, Fieldnotes' provenance discipline, and Weave's idea of carrying a chosen intention only where real data exists. No new competing creative worlds.

Daily value comes from what the user does during a supported exercise, not the frequency of insights or the beauty of a receipt. An exact receipt is useful grounding, not sufficient evidence of benefit. Keep non-action, ambiguity and leaving legitimate. Neither Notice → Name → Try nor Notice → Choose → Look again is a mandatory sequence.

**Challenge to both teams:** adding a second choice and a responsive closing can still be a questionnaire. A family earns its place only when a user performs a useful operation and can describe it. Current templates cannot honestly be presented as fully implemented new Reframe, sorting or pause exercises. Improved presentation is the first slice, not proof that the larger product problem has been solved.

## 3. Brand, graphics and motion across the journey

Preserve canonical artwork pixels, proportions and colour. Use actual mark alpha for original graphic windows; never redraw a generic oval, trace a new logo, filter/recolour the source, or crop meaningful artwork. Transparent margin trimming already verified in `../creative/brand-validation/asset-provenance.json` remains unchanged.

The mark's negative space structures a relationship: what was experienced, a separate possible reading, and an open boundary. Text and controls remain live, legible and unmasked. Use the opening generously at discovery, quietly beside a rep and explicitly at a reading boundary. Do not put a mark beside every answer simply to brand it. Plain utilities use the smallest expression.

One warm ivory/paper/charcoal system, restrained accents, existing semantic roles, Instrument Serif and DM Sans. Preserve reflective texture from the source artwork and purposeful original graphic planes. No three palettes, textile-density progress, circular reticles, glass, ambient loops or stock wellness imagery. One expressive composition per screen; flat, varied information arrangements instead of repeated cards.

Input-driven motion explains separation, consideration or release. Standard feedback 180ms, disclosure 280ms, entry up to 400ms/8px; optional explanatory motion may settle longer only outside required task completion. No forced wait, auto-answer, endless breathing or scroll capture. Reduced motion preserves all information with immediate state changes. Rejection/qualification changes the reading surface, never damages, dims or stains the mark/person. No fill, brightness or gap size measures fitness or certainty.

## 4. Capability map and adapter boundary

| Capability | Actual input/output | Status and truthful fallback |
|---|---|---|
| Selection / Today | runtime `today(): TodayView`; rep payload/context/draft or done/optional insight | Existing. UI never chooses cold-start/family from a preference |
| Rep sequence | `nextStep(FlowContext, StepAnswer[]) → Step|null` | Existing. Exact supplied prompt/options; unsupported type → unavailable/back; orientation remains disabled |
| Answers | option ID, unknown, skip, domain, timeframe/date, yes/no, payload-free words | Existing. No rank, sort, weight or pick-two schema |
| Completion | `complete(answers,duration) → CompletionView` | Existing closing?/insight?. Immediate answers available; no durable exact session receipt exposed after reload |
| Feedback/correction | async `feedback(id,value)`, `correction(id,reason)` | Existing fixed semantics. Acknowledge success only; error/retry stays honest |
| Capacity practice / carrying | `mirrorFacts(): MirrorFacts` | Remote-built at `8850cfc`, not integrated here. Factual-only interim adapter after reviewed integration |
| Typed Mirror | `mirror(): MirrorModel` from `buildMirror(state,day)` | Remote-built at `2d150e0`; **not ready for unqualified full UI use** until review gates in §8 are repaired |
| Continuity cue | optional component `continuityCue` | Slot exists, runtime supplier absent. Hide it; no UI-generated remembered narrative |
| New families / first capacity | A1–A4 proposals | Not built/approved. Separate versioned engine/catalog work, never renderer-only answers |
| Durable account history | opt-in event-sourced memo | Proposal only. Current structured practice remains device-local; sign-out wipes it |

Presentations accept public view data and callbacks. They must not inspect `_state`, parse storage, recompute evidence, infer eligibility or make new selection rules. Diagnostic state is used only in tests. Development fixtures have separate entry points/adapters, explicit fictional-scenario labels and isolated session state. They cannot populate authenticated production data or imply successful real authentication/writes. Reuse presentation components; prevent fixture data from entering the production adapter/build.

## 5. Complete journey specification

Each row includes user need, intended capacity/operation, real input/output, outcome, privacy/evidence and fallback. Detailed acceptance follows.

| Stage | User need / operation | Real inputs → outputs | Outcome / evidence / privacy | Fallback and status |
|---|---|---|---|---|
| Discover | Understand emotional fitness through a moment of noticing | Authored explanation + canonical graphic + real sample context → local structured answers | Sample before registration; no personal inference, no transfer to account | Existing sample can be refined. Static explanation if unavailable; do not imply full new family exists |
| Demonstrate / understand | Feel a real choice and understand six areas of practice | Exact sample step; approved authored capacity descriptions → display selection | Distinguish practice from score; no claim that visitor trained/improved | All meaning in live text; diagrams optional. Real sample is primary, three-state metaphor secondary |
| Enter | Informed, ordinary account entry | Existing email/loading/sent/error/callbacks → existing auth request | Retention visible before sign-in; demo explicitly separate | Back/retry/expired paths preserved; no fake delivery success |
| Onboard | Learn autonomy by exercising it, briefly | Authored demonstration → local display state and existing begin callback | Consider a statement, leave it open, or go directly to Today; no diagnosis/preferences collection | Replace “which answer is allowed?” quiz. Skip first-class. Capacity selector deferred until A1 approved |
| First rep | Do a useful operation available today | Actual Today rep/context/draft → exact contract answers | Prompt hero, source-defined attention boundary, legitimate unknown | Existing cold start remains `foc_attention`; no renderer override to Reframe |
| Integration | Understand what happened and leave without another task | Completed context + answers + supplied completion → display only | Exact offered statements with their actual questions; outcome-specific authored release, no raw words/inference | Unknown/absence can end immediately; reloaded done has no invented receipt; no universal extra action |
| Today | An attentive home with one clear action | Today/draft/count/approved context → begin/resume/done | Optional capacity secondary, exact named commitment, one approved cue at most | Sparse composition, no blank label. Missing cue stays absent |
| Return | Resume something real rather than unlock a milestone | Supplied draft/practice facts/carrying → normal navigation | No streak, elapsed-day insight, fabricated yesterday or cloud memory | Day 1/3/7/30 are explicit review scenarios, not feature gates |
| Honest Mirror | Inspect a possible reading and disagree | Eligible supplied insight + real callbacks → value/reason only | Distinct reading/provenance/unknown; equal feedback, optional note safety-only | No eligible insight → no reading. Missing exact support → no pseudo quotation |
| Commitments | Recognize what was chosen and name the outcome | Commitment step context/timeframe → existing structured status/date answers | Offered label identified as chosen; neutral postponement/change/drop | No task list/overdue warning; no invented date. Missing carrying omitted |
| The Mirror | Inspect earned facts and conditional readings | Reviewed runtime view → source-separated presentation, no new inference | Factual practice/carrying; ledger secondary; only eligible reviewed readings | One beginning state; sparse useful facts. Gated sections hidden, not seven empty cards |
| Evolving understanding | Revisit actual changes without a growth narrative | Only approved engine reading/change + matched trace | Own earlier answers compared as authored by engine; no causality/ability claim | Insufficient/mismatched/withheld evidence → no comparison; fixtures explicit |
| Privacy / Me | Know storage and leave safely | Actual account/retention callbacks → existing actions | Device-local structure, sign-out wipe, unsaved optional text; sensitive data even when structured | No new deletion/sync control until real implementation and approval |

### Day-one integration rules

Use the actual `nextStep(context,[])` question and offered labels, including contextual frame/variant. Never rewrite engine prompt in the UI to make it more relatable. Author separate supporting explanation if needed; catalog copy changes require controlled approval.

| Actual current session | Permitted useful release | Not permitted |
|---|---|---|
| Primary unknown | “Not knowing is a complete answer.” Finish without a new assignment | Claim skill mastery or ask another question to resolve it |
| Explicit absence / deliberate rest option | Acknowledge that exact choice and release | Treat calmness as missing data; automatically create a commitment |
| Ordinary offered response | Show what was selected and a concise authored description of the operation, matched to approved content | Generic advice keyed to the tap presented as an insight or proof of benefit |
| Real primary + follow-up | Present each exact response under its actual question; juxtapose without adding causal connective | Assume mood ownership, reason, goal or result not selected |
| Commitment-creating option | Exact chosen authored commitment label + actual timeframe; optional permission to leave | Promise tomorrow's check unless supplied/scheduled; add another move choice |
| Optional step skipped | Completed responses stand; no re-ask or penalty | Imply skip means unsure, resistance or missing effort |
| Reloaded done with no receipt view | Truthful done state and eligible supplied insight, if any | Mine state or reconstruct an exact historical answer from current catalog defaults |

The intended future outcomes are clarity, a capacity exercised, intentional action, permission, or continuity. These are evaluation categories, not outputs already emitted by runtime. A new family must demonstrate its operation in session before its closing may describe it. A before/after report says what the user reported; it never proves the exercise caused the change. No mandatory time target or 90-second marketing promise from templates currently estimated at 15–35 seconds.

## 6. Exercise families: retain ambition, gate unsupported mechanics

| Family | What earns its place | Current support | Decision/dependency |
|---|---|---|---|
| Notice | User discriminates a closer description, can say not quite | Broad recognition lists exist | Refinement/close-not-quite is new; don't call extra profiling a skill without review |
| Attend | Deliberate allocation or set-aside | Attention recognition/paired statements | New allocation/remember-later semantics need contract; no productivity pressure |
| Reframe | User considers genuinely different possible readings without a correct answer | `gro_update` reports change; does not perform new Reframe | Pilot after A3 approval. Domain alone may be insufficient to author safe plausible alternatives; keep original view/heavier legitimate, no charitable-reading preference |
| Settle | User can pause and choose a response | No urge/pause contract | Safety review + A3; never infer crisis from “very strong” alone or change resource triggers in UI |
| Relate | User distinguishes responsibilities without adjudicating fault | Mood attribution/follow-up and connection commitment | Full sort is new. No blanket “theirs” advice, unsafe-context detection claim or drag-only answer |
| Choose | Deliberate intent or intentional non-action | `act_tiny`/`rel_connect` create real commitments; direction templates exist | Full values → compare → action chain is not already implemented despite family “Exists” label. A2/A3 if extended |
| Recover | User deliberately recalls a resource or rests | `en_helped`, pacing and intentional rest option | New use-resource follow-up needs contract. Rest exercise distinct from disabled no-rep rest |
| Integrate | Reflect on when noticing occurred without scoring it | No timing-report schema | A3; four-way timing is not automatically compatible with current change evidence. Dedicated evidence design needed before longitudinal comparisons |

Select a small pilot for genuine operation, not all eight families at once. Reframe's brand fit does not prove its safety or superiority. A1 is optional, affects first selection only, and needs approved engine work; it is not necessary to repair today's permission-quiz onboarding. Never register family answers in an unsupported generic option slot.

## 7. Corrections: clear consequences, precise promises

Four answers remain equal and unselected. All six correction reasons remain exact, in order, including prefer-not-to-say. Partly records its value first; reason is optional. Something else note retains “Optional. Not saved in this version.” Text is safety-checked, cleared, never passed through callbacks, persisted, sent, logged or rendered into history.

Copy below is a **reconciled candidate**, shown only after awaited success; final product copy requires review.

| Event | Candidate acknowledgement | Policy detail / limitation |
|---|---|---|
| Accurate | “Your response is recorded.” | Does not increase support or confidence; ordinary cooldown remains |
| Partly | “This reading needs qualifying. It won’t be repeated unchanged.” | Withheld until reason-dependent new independent evidence; later wording must be hedged; not a promise of an instant rewritten reading |
| Structured reason success | “Your correction is recorded.” | Show chosen reason if useful; no claim that user explained missing meaning; skip leaves no nag |
| No | “This reading is set aside.” | Domain-related lens rest is 21 days for relevant claim kinds. Do not promise all questions, commitments or all reading kinds disappear for exactly 21 days |
| Not sure | “No conclusion added. This reading will wait.” | Seven-day eligibility delay, not a guaranteed check-in in a week |
| Callback failed | Existing failure + retry, no success | Keep reason retryable, note cleared; no false claim of confirmed durable disk/cloud write |

Do not use “Ask me again later” as an actionable scheduling control without a real callback/contract. Do not show an explicit scheduled date based solely on cooldown expiry. Immediately hide or qualify the reading surface according to the reviewed product choice; do not keep the unchanged claim in Mirror history after Partly as a shortcut. Real feedback semantics remain unchanged.

## 8. Typed Mirror: good foundation, concrete release gates

Remote v1 supplies `MirrorModel {version,engineVersion,state,statements,sections}` and `MirrorStatement {id,section,source,text,facts,trace,date?}`. Sources are `user_said`, `observed`, `inferred`, `unknown`; sections said/practised/come_up/carrying/readings/shifted/unknown. Use these source boundaries, not seven mandatory visual chapters. IDs are internal metadata, never user-facing copy.

**Verified result:** existing suite passes all nine checks over 24 simulated users / 430 statements, including six directly rejected readings. That does not prove current eligibility, exact question identity or supporting-trace correctness. Focused checks on the same pinned code reproduced the first four issues below; source review establishes the others. Evidence in `reconciliation-validation/`.

| Gate | Gap in `2d150e0` | Required runtime contract behavior / fallback |
|---|---|---|
| M1: current reading eligibility | `readings` loops all insights and only omits directly No records; Partly prints original text unchanged with a verdict suffix. Old related readings are not checked against later feedback/current withholding | Claude repairs eligibility/provenance view outside frozen engine. All six Partly reasons, skipped reason, Not sure delay, later domain rejection and expired/retired evidence tested. Until repaired: show no historical inferred reading/shift; do not infer eligibility in UI |
| M2: actual offered question/choice | `optionLabel` uses base template prompt/options, ignores instance frame/binding/variant; tested variant question mismatch and missing lens “Not today” | Return actual served question/label provenance. Do not silently substitute defaults. Missing provenance → omit exact receipt; no reconstruction in presentation |
| M3: source-linked evidence | Trace IDs exist, but readings have only insight IDs; no supporting record mapping. `come_up` collects domain/day observations, potentially mixing independent and continuation records | Expose authoritative minimal support records and count semantics. Hide response→reading links until supplied. Adjacent planes never imply derivation just because both exist |
| M4: complete structured facts | `facts` is an open Record, not a source/section-discriminated schema. Reading facts omit prompted/introduced counts; recurring facts have window/count but no offered denominator | Strengthen view schema/validators with required per-source fields and validity. Do not infer ratios, numerator definitions or denominators from trace length/window length. Use authored text only when eligible; display exact counts actually supplied |
| M5: accurate unknown copy | “Mirar has not been told anything in these areas” is based on unpractised capacities; a probe can supply work context without any training rep | Say only that those capacities have no completed training reps. Unknown count is not refusal/ability; not a prominent score. Missing practice is not missing personal knowledge |
| M6: retained-state limits | Runtime housekeeping retains finite instances/observations/insights; existing suite only covers 30 days | Test traces after trimming/reload (including >120-day observations/>300 instances). Specify retained-history window, omit unverifiable statements; never market lifetime/all-history counts |
| M7: historical status vs current assertion | Historical accepted readings may no longer be supported; date and old verdict alone do not establish permission to present as current | Model explicit current eligibility or withheld/history-only status. Resolve archival policy before display; current recommendation keeps gated historical text out |

The UI may render reviewed factual practice/carrying views, and matched source statements after repair. A safe interim Mirror is an empty/sparse surface with real practices and commitments, optional provenance disclosure, no gated readings or unsupported recurring/shift statements. The ledger is inspectable evidence, not a hero list of quiz answers.

Do not connect an unrelated live answer with a fictional work reading. Fictional studies use their own coherent support records and explicit label. Read separately/alongside changes layout only; it never restores hidden claims. Before/after describes reported answers, never causes or growth.

## 9. Privacy and claim decisions

Retain local structured practice and sign-out wipe. An account email and authored choices still constitute sensitive information; “no raw words” is not “no sensitive data.” New cloud history remains explicit opt-in proposal, default off, not part of visual delivery. No migration, backup setting, staff access or deletion claim is implemented here.

The durable-history memo needs engineering decisions: ordered feedback/correction events are not generally commutative; runtime feedback is first-answer-wins, not a universal last-action-wins policy. Replay needs served decisions, variants, dates, abandoned instances and feedback, not completions alone. Existing bounded local snapshot cannot always recreate discarded event history. Owner-only RLS is not proof that only the user can technically access data; disclosure must match actual staff/provider capabilities. Schema text-key bans alone cannot prevent raw content inside JSON; validation must constrain values. None of these is approval to implement sync.

Do not repeat unsupported competitor superiority, habit certainty or safety claims. “No competitor does this” is unverified and excluded from product copy. Simulator figures describe synthetic runs, not real retention or efficacy. A Day-30 view can be useful on one retained device; cross-device durability is the unsupported promise, not the existence of any Day-30 value. Earlier/lighter answers never signify better mental health. No clinical claims or new safety routing.

## 10. Implementation priorities and decision ownership

1. **P0 / Claude:** repair M1/M2 and define M3/M4 support/eligibility. Tests must cover qualified/withheld/related-old readings and contextual exact receipts, not only No. User decisions on archival semantics remain explicit. No engine edit required to enforce a safe read boundary.
2. **P1 / Codex + product:** one unified discovery→entry→brief autonomous intro→actual first rep→outcome-specific integration slice. Repair unknown/absence contradiction, eliminate permission quiz, truthful success/error correction acknowledgement. Preserve real runtime and canonical graphics. This improves current flow; it does not pretend new families ship.
3. **P2 / Claude + Codex:** factual/sparse Mirror and corrected typed view, collapsed provenance, real carrying, reactive feedback updates. Never ship all seven sections because the type lists them.
4. **P3 / Claude:** approved scheduled-context cue supplier; show on Today only when actual current selection/pending event supports it. No “tomorrow” promise from a general eligibility rule.
5. **P4 / product:** decide a real exercise pilot and explicit confirmation policy; approve versioned A1/A3 separately if desired. Validate Reframe alternative content, taxonomy and non-action paths before pursuing volume.
6. **Separate / engineering + product:** opt-in durable history, actual auth/security review, safety review, multilingual fonts and native assistive-technology checks. No broad dependency upgrades in the design pass.

## 11. Acceptance and truthful failure states

- Every major operation states a concrete user need/capacity, actual performed action, user-visible outcome, supported input/output and legitimate stop/unknown path. A reviewer can name what was done, not just how many answers were collected.
- Day 1 works without any insight/history/commitment. An unsure/absent/declining user can finish without generic advice or a compulsory move.
- Intro skip works; no personal preference can change first selection until A1 is approved. Returning people do not repeat onboarding solely because history is sparse.
- Exact primary/follow-up questions and choices are preserved across frame/variant. Reloaded missing receipt is honest; no raw text reconstructed.
- All four feedback paths and six reasons, reason skip, note skip/continue, failure/retry and safety stop tested. No/Partly cannot resurrect unchanged text through Today, Mirror, separation control, reload or a related reading.
- All claims in functional Mirror come through reviewed public model, with authoritative eligibility and supporting provenance. IDs existing is necessary, not sufficient. Denominator/window semantics explicit; no cause/growth inference.
- Empty, sparse, factual, corrected, rejected, unavailable, returning, interrupted and completed states are useful. Day 1/3/7/30 fixtures labelled and capability-driven, not unlocks.
- Validate 320×568, 390×844, 768×1024, 1024×768, 1440×900; long prompts/reasons/commitments, scroll/focus stability, keyboard-only completion, 44px targets, contrast, reduced motion and native date behavior. Historical axe incomplete checks must be resolved/reported, not called certification.
- Five-person journey review is formative usability, not efficacy or representative retention evidence. Observe clarity about selected response vs reading and why a correction mattered. Don't optimize down the unknown rate as if uncertainty is failure; better relevance may increase honest uncertainty.
- Canonical pixels unchanged. No engine/catalog/privacy changes hidden in presentation. Auth errors and local write limitations accurately described. No analytics on responses.

## 12. Delivery status

The audit branch and reconciled specification are published for Claude to read. This change is documentation and reproducible review evidence only. No new unified UI, runtime edits, engine amendments, merge, migration or deployment. Existing creative Preview remains unchanged. Agreement exists at the recommendation level; implementation blockers and product decisions in §§6–10 are not silently resolved.

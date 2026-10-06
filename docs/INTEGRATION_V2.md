# Daily Inner Rep — v2 integration (Codex presentation ↔ frozen engine)

Branch `mirar-v2-integration`. Not deployed. No migration. No engine change.

```
Frozen v2 engine (tag inner-rep-engine-v2.0.0-mvp-freeze, ab017dd)      lib/innerRep/v2/**   byte-identical
        ↓
v2 runtime adapter                                                       lib/innerRep/runtime/v2-runtime.ts   (new, pure TS)
        ↓
reactive store + host                                                    stores/inner-rep-v2-store.ts, components/inner-rep/v2/DailyInnerRepHost.tsx (new)
        ↓  V2_CONTRACTS step output (RepPayload / FlowContext / StepAnswer)
Codex Daily Inner Rep renderer                                           components/inner-rep/v2/** (Codex a0eff00, d411588 — unmodified)
        ↓  user response
runtime → frozen engine state/evidence → Honest Mirror → feedback → engine
```

## 1. Commits

| | Commit | Note |
|---|---|---|
| Engine freeze | `ab017dd` (tag `inner-rep-engine-v2.0.0-mvp-freeze`) | untouched |
| Codex foundation | `a0eff00` | brought in as the **same commit**, fast-forwarded (no cherry-pick, hashes preserved) |
| Codex Phase 2 | `d411588` | same |
| Integration | see `git log a0eff00..HEAD` | three isolated commits: adapter+tests, wiring, this document |

Codex's work lived in a separate worktree (`~/Documents/Mirar v2 visual`, branch `codex/mirar-v2-visual`) and was not on `origin`; it was fetched from there. Nothing in `components/inner-rep/v2/**`, `design-system/**`, `assets/**` or `review/**` was edited.

## 2. Files added / changed for the adapter

| File | Purpose |
|---|---|
| `lib/innerRep/runtime/v2-runtime.ts` | The adapter. Today's rep, contract validation, `complete`, `feedback`, `progress`/resume, safety discard, practice-day count, sign-out wipe helper. Calls only the frozen engine's public functions (`decide`, `nextStep`, `applyRep`, `computeEvidence`, `chooseInsight`, `applyFeedback`, `flowContext`). **Decides nothing itself.** |
| `lib/innerRep/runtime/flag.ts` | `EXPO_PUBLIC_INNER_REP_V2` (default on in this branch; `0` falls back to the v1 Home) |
| `stores/inner-rep-v2-store.ts` | Thin zustand wrapper; AsyncStorage; `clearInnerRepV2Data()` |
| `components/inner-rep/v2/DailyInnerRepHost.tsx` | Passes the store's view + callbacks into Codex's `DailyInnerRep`; greeting from the existing i18n keys |
| `app/(tabs)/index.tsx` | Today tab renders the host (with `role="main"`); the previous Home is kept as `LegacyTodayScreen` behind the flag |
| `app/inner-rep.tsx` | v1 route redirects to Today when v2 is on |
| `stores/auth-store.ts` | Sign-out also calls `clearInnerRepV2Data()` |
| `scripts/runtime/runtime.test.ts` | 13 adapter tests (below) |
| `scripts/runtime/scenarios.ts` | Dev tool that builds realistic persisted states for browser walkthroughs |

## 3. Persistence behaviour (exactly)

**What is persisted:** the frozen engine's `State` for the signed-in user, as one JSON blob, plus the structured draft of an unfinished rep: instances (template, frame, binding, intensity, intent, wording variant, completion flags, decision trace for the last 30), observations (option id, domain, origin, polarity, burden, stance), threads, commitments (+status history), insights shown (+feedback), feedback memory, domain state, user seed. Structured vocabulary only: no key named text/words/body/note/message; verified.
**Where:** `AsyncStorage` key `mirar_inner_rep_v2:<userId>` (browser `localStorage` on web). **Device-local. Not Supabase. No table exists** (the approved schema/migration is intentionally not applied). `inner_rep_responses` (v1) is not written by this path.
**Housekeeping limits** (storage size only; engine windows are far shorter): last 300 instances, last 100 insights, observations from the last 120 days.

| Event | Behaviour |
|---|---|
| Reload / close and reopen | Structured state survives. A finished rep → "Done for today". A started-but-unfinished rep → **Resume** at the next unanswered step with the same exercise and wording. A rep that was only *looked at* (no answer yet) is not persisted; the same rep is re-served deterministically |
| Next calendar day | Fresh decision from the frozen engine. An unfinished rep from an earlier day is recorded as abandoned using the simulator's own abandon path |
| Honest Mirror feedback | Written to engine state immediately; after a reload the answered insight is not asked again |
| Sign-out | All `mirar_inner_rep_v2:*`, `mirar_inner_reps_v1:*` and the legacy un-keyed key are removed; unrelated keys untouched; in-memory state reset |
| Sign back in (same device) | **Starts clean** (no history, no draft, cold-start rep). v2 has no server persistence, so signing out discards the structured history |
| Another device | Nothing carries over |
| Free text | Never persisted anywhere (§6) |
| **Development-only until the schema is approved** | all of the above; the adapter's storage dependency (`KV`) is the single seam to replace with the approved Supabase tables |

## 4. Contract-by-contract review

All paths below were driven in a real browser against the integrated app (Expo web, dev-mock auth), with state built by the real adapter (`scripts/runtime/scenarios.ts`) so the frozen engine chose the rep. "Stored" is read back from the persisted blob.

| Contract / renderer | Input | Stored result | Evidence/state effect | Reload | Privacy | |
|---|---|---|---|---|---|---|
| `choice` list — `ChoiceInteraction` | tap "Another person" | primary option id; burden true; draft `[primary]` | observation; burden → engine's recovery rule applies next day | resumes at next step | none involved | PASS |
| `choice` compare | tap one of two statements | option id with stance; burden per option | observation (daily-state stance only; no contradiction insight) | — | — | PASS (pair layout confirmed at 768/1024/1440; stacked below) |
| "I don't know" (every choice) | tap | `unknownPrimary`, observation `polarity: unknown` | uncertainty only; no insight; no avoidance wording anywhere in state | done | — | PASS |
| `words` — `WordsInteraction` | typed sentinel text, Continue | `{kind:'words'}` only; **no text** | none (engine never reads it) | text lost, resume at an empty words step | sentinel absent from local/session storage, cookies, IndexedDB, caches, URL, history state, DOM after completion, network, console | PASS |
| `words` + crisis wording | typed crisis phrase, Continue | nothing stored; pending instance removed | none | rep is offered again | text absent everywhere; panel shown; detector unchanged and **not validated** | PASS |
| `domain_chips` — `ContextInteraction` | tap "Partner" / Skip | observation domain `partner`, source `user_tapped`, origin `user_introduced` | independent, user-introduced evidence | resumes mid-rep | — | PASS |
| `yes_no` — `CheckInOffer` | Yes / No / Skip | Yes → user-sourced open thread; No → 21-day decline memory | thread / suppression | — | — | PASS |
| `timeframe` — `TimeframeInteraction` | "Choose a date" +3 days | commitment `specific_date`, `dueDay = day+3` | commitment lifecycle starts, user-set | — | — | PASS |
| `follow_up` choice | "I asked for help" | follow-up observation | burden per option | — | — | PASS |
| `orientation_chips` | never emitted | nothing | — | — | — | PASS (renderer returns an "unavailable" notice and the engine never reaches it; checked that no orientation step was ever shown across all walkthroughs) |
| Commitment check (`commitment_check`) | "I've changed my mind" | status `changed_mind`, set by `user`, no failure state | only the user sets it; closed quietly | — | — | PASS |
| Commitment check | "Not yet, later" + Tomorrow | `postponed`, `postponedUntil = day+1`, asks reset | re-asked on that date | — | — | PASS |
| Thread check | "This isn't what's on my mind" | observation `polarity: absent`, origin `thread_continuation` | **genuine counter-evidence** (negStreak 1) | — | — | PASS |
| Lens | "Not today" | `polarity: absent`; domain negative streak | counter-evidence; rest after two | — | — | PASS |
| Event check | "Heavier" | observation present+burden; `eventAsks` 1 | follow-up cadence per engine | — | — | PASS |
| Resolution check | "Not yet" | thread stays, cadence slowed | only the user can resolve | — | — | PASS |
| Open question (3 wordings) | tap "Work" | observation `user_introduced`; offer → thread | — | — | no "probe/bias" wording shown | PASS |
| `RepPayload` / Today | Begin / Resume | — | — | Begin ⇄ Resume correct | — | PASS |
| Honest Mirror (`ShownInsight`) | engine text rendered verbatim; "Why am I seeing this?" shows counts | — | — | answered insight not re-asked | text matches the engine's own output exactly | PASS |
| Feedback Accurate / Partly / No / Not sure | tap each (four separate runs) | `insights[i].feedback.value` = value | No → evidence withheld + domain rests 21 days; Partly/Not sure → engine memory; Accurate → no change | done, no insight re-shown | — | PASS |
| Safety | see `words` + crisis | — | — | — | detector untouched; helplines unverified (pending expert review) | PASS (as specified) |
| Rest / no-rep | disabled in shipping config | never served | — | — | — | PASS |
| Contradiction insight | disabled | none shown in any run | — | — | — | PASS |

**Equivalence with the engine:** 30 consecutive days driven through the runtime adapter produce the **identical** sequence of exercises, frames, bindings, intents, wording variants and insight texts as the frozen simulator for the same synthetic user and seed (`scripts/runtime/runtime.test.ts`).

### Mismatches between Codex's renderer and the frozen contract
None found in step handling. Observations that are **not** mismatches:
1. **Partly → "What's off?"**: Codex only shows it if the host passes `onCorrection`. The contract (§5) promises the answer "returns as a `correction` observation", but the **frozen engine has no reducer for it** (no correction observation is created or read anywhere). I did not pass `onCorrection`, so the control is hidden rather than offering an action with no effect. This is a contract/engine gap, not a presentation bug — see §9.
2. **Two buttons named "Today"** on the timeframe step (the header return control and the "Today" timeframe option). Distinguishable visually and by position, not by accessible name.
3. `capacityLabel` is the template's nominal capacity (e.g. "Direction" for the open question, "Action" for a commitment check). Contract-correct; arguably not the best user-facing label for continuity reps. Product decision.
4. The commitment-check prompt is generic ("You mentioned you might do something…") and does not say which commitment. Engine copy.

## 5. Interrupted flows

| Action | Expected MVP behaviour | Verified |
|---|---|---|
| Begin, answer step 1, refresh | Today shows **Resume**; resumes at step 2; same exercise and wording | yes |
| Close and reopen | same as refresh (state is in `localStorage`) | yes (same mechanism) |
| Typed words, refresh | text gone; Resume returns to an **empty** words step; text absent from storage | yes |
| Sign out | all Inner Rep keys removed (v2, v1, legacy), unrelated keys kept; draft discarded | yes |
| Sign back in | clean start, no Resume, no history | yes |
| Next day, unfinished rep | recorded as abandoned (not as "I don't know") | adapter test |

No persistence is fabricated: nothing survives sign-out; nothing is shared across devices.

## 6. Privacy review (free text)

Raw text is held only in the `TextInput` of the active words step. On Continue the text goes to the existing safety detector, the field is cleared, and a payload-free `{kind:'words'}` (or a `skip` on a safety hit) is the only thing emitted. In the adapter, every answer is **validated by replaying it through the engine's own step machine** and rebuilt from a whitelist, so a `text` property cannot be persisted even if a caller passes one (tested with a sentinel through both `progress()` and `complete()`).

Searched after a completed words step (real browser): `localStorage` (only the v2 key; no sentinel), `sessionStorage` (empty), cookies (none from this app; unrelated Google-Analytics cookies from other localhost projects exist in this browser profile), IndexedDB (none), CacheStorage (none), URL/query/hash, `history.state`, rendered DOM, network requests, console. **No occurrence.** Not in Supabase (no v2 table; v1 path not executed), not in evidence state, not in engine traces (traces hold engine reason strings and domain names only). No analytics or crash-reporting dependency exists in the app.
Caveat: this is a web check. Native (iOS/Android) storage and OS-level text services were not exercised.

## 7. Accessibility (integrated app, Expo web, axe-core 4.12)

States scanned at **each** of 320×568, 390×844, 768×1024, 1024×768, 1440×900: Today, choice, domain chips, check-in offer, done (plus Honest Mirror, expanded evidence and after-feedback at all sizes; compare, words and date picker at 768/320).
- **Codex content: zero violations** in every scan.
- Remaining findings are the **existing app shell** (the bottom tab bar), not Codex content and not touched: `color-contrast` ×3 on the inactive tab labels, `region` ×1 (the tab bar sits outside the page landmark), and one `color-contrast` "incomplete" that is the tab bar's glyph characters. Integration added `role="main"` around Today so the content has a landmark.
- Keyboard: Tab reaches Begin with a visible 2px blue ring; **Enter** activates it and focus moves to the new prompt; **Space** selects an option; the next step's prompt receives focus (`aria-level=1`). Focus moves to the new prompt on every step change in all walkthroughs.
- Disabled states: "Continue" (words) and "Use this date" are disabled until valid; both verified. Selected states use `aria-pressed`/`aria-expanded` per Codex.
- Targets: **no control under 44×44px** at any viewport.
- Text field: `autocomplete=off`, `spellcheck=false`, `autocorrect=off`, labelled, described by the privacy hint, `maxlength=80`.
- Modal/sheet focus: **not applicable** — the integrated experience has no modal or sheet; "Why am I seeing this?" is an inline disclosure with `aria-expanded`.
- **Not re-tested:** reduced-motion live (the browser harness cannot toggle the OS preference; Codex defaults to reduced until the preference is read and follows the platform preference — verified by reading the code and by Codex's own evidence), screen-reader announcements (no assistive technology available here), native VoiceOver/TalkBack. Automated axe is not an accessibility certification.

## 8. Responsive (behaviour, not only screenshots)

At all five sizes: no horizontal overflow, no sub-44px targets, prompt receives focus on each step, Begin/Resume, options, chips, offer, Honest Mirror and feedback all operable. Compare statements sit **side by side at 768px and above** (312×167 each at 768) and stack below. The date input fits at 320 (272px wide). Long-copy stress was Codex's own and not repeated.

## 9. Genuine contract defects and gaps — RESOLVED in v2.0.1 (see `docs/V2_DECISIONS.md`)

*Original report (all three below were then fixed or clarified in the v2.0.1 patch; the Today/capacity-label/commitment-context presentation items moved to `docs/CODEX_FOLLOWUPS.md`):*


1. **Correction path (contract §5 vs frozen engine).** The contract says "Partly → optional 'What's off?' → returns as a `correction` observation". The frozen engine (`lib/innerRep/v2`) has no function that creates or consumes one; `Observation.origin = 'correction'` exists only as a type value. The adapter therefore does not offer the control. **Decision needed:** either (a) a reviewed engine change adding a correction reducer (and deciding what it counts as), or (b) amend the contract to say the control is not part of the MVP.
2. **Date range policy** (Codex flagged it): the adapter accepts any integer day offset exactly as stated (past dates become due immediately; far-future dates are never due). An out-of-range rule would need to live in the contract.
3. **`rest` Today state** is in the contract text but disabled in config; the adapter returns `done` defensively if the engine ever returned rest.

## 10. Tests run

| Suite | Result |
|---|---|
| Frozen engine suite (`scripts/sim/suite.ts`) | **85/85 pass**, 0 findings (unmodified) |
| 420-run sweep | unchanged: one open rule class (selection-bias-A tail, day 18) from before this work |
| Runtime adapter (`scripts/runtime/runtime.test.ts`) | **13/13 pass** (`docs/INTEGRATION_RUNTIME_TESTS.md`) |
| TypeScript (`npx tsc --noEmit`) | clean |
| Production build (`npx expo export --platform web`) | passes; bundle contains the v2 runtime and Codex's fonts/wordmark. *Note: the local `.env.local` enables the dev mock; do not deploy a build made with it.* |
| Browser walkthroughs | every supported step type and frame (§4), five viewports, keyboard, sign-out/in |
| Frozen-path diff vs tag | `lib/innerRep/v2`, `docs/V2_CONTRACTS.md`, `scripts/sim/freeze.json`: **byte-identical** |

## 11. Not done (by instruction or capability)
No deploy, no Supabase migration, no analytics, no History/Emotional Fitness work, no engine tuning. Not exercised: native devices, a real Supabase session, live reduced-motion, screen readers.

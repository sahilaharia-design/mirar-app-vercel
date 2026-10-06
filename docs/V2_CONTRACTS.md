# Inner Rep v2 — response and interaction contracts (for the Codex / UI workflow)

> **Contract status: stable for implementation.** Do not change the shapes below while the first UI is being built unless a genuine defect is found; if one is, document it in the *Change log* at the bottom **before** changing the interface.

Source of truth: `lib/innerRep/v2/contracts.ts` (types + the step machine, exercised by the simulator on 400 synthetic runs).
Status: **contract proposal, not wired into the app.** The shipping app still runs the v1 flow. Nothing here has been seen by a real user.

## The one rule

**The engine decides; the UI renders.** The UI never chooses what to ask, never infers context, never stores raw text, and never invents wording about the user. It loops: `render nextStep(...)` → collect a `StepAnswer` → repeat until `nextStep` returns `null` → submit.

## 1. What the engine returns for "today"

```ts
type Today =
  | { kind: 'rep';  payload: RepPayload }                   // show the rep card on Home, then the rep screen
  | { kind: 'rest'; reason: string }                        // PROPOSED, not built: "Nothing needs examining today."
  | { kind: 'done'; closing?: string; insight?: ShownInsight }; // already completed today

interface RepPayload {
  instanceId: number;
  templateId: string;          // opaque to the UI
  frame: 'base' | 'lens' | 'thread_check' | 'resolution' | 'event_check' | 'commitment_check';
  bound?: Domain;              // set for context-bound frames; the prompt text already contains it
  capacityLabel: string;       // user-facing: Direction / Energy / Focus / Relationships / Growth / Action
  intensity: 'light' | 'medium';
  estimatedSeconds: number;
  dismissible: true;           // the user can always leave without answering
}
```
`rest` copy is **not** decided. It must emerge from the engine's reason, never read as a reward, a streak or filler (see §6).

## 2. Steps the UI must be able to render

```ts
type Step =
  | { id: 'primary' | 'follow_up'; type: 'choice'; prompt: string; layout: 'list' | 'compare';
      options: { id: string; label: string }[]; allowUnknown: true }
  | { id: 'words'; type: 'words'; prompt: string; maxChars: number; optional: true; saved: false; safetyCheck: true }
  | { id: 'capture_domain'; type: 'domain_chips'; prompt: "What's this mostly connected to?"; domains: Domain[]; optional: true }
  | { id: 'capture_orientation'; type: 'orientation_chips'; prompt: 'Is it more about…'; orientations: Orientation[]; optional: true }  // DISABLED: never emitted in the MVP
  | { id: 'timeframe'; type: 'timeframe'; prompt: string; options: ('today'|'tomorrow'|'this_week'|'pick_date'|'none')[]; optional: true }
  | { id: 'thread_offer'; type: 'yes_no'; prompt: string; domain: Domain; optional: true };
```

| Step | UI obligations |
|---|---|
| `choice` | One tap answers. The prompt wording can differ between uses of the same exercise (the engine rotates 3 phrasings of the open "what's on your mind" question): **render `prompt` verbatim, never hard-code it.** One tap answers. **"I don't know" is always present** (UI adds it; `allowUnknown` is always true) and ends the rep with no further questions. `layout: 'compare'` shows two statements and no more |
| `words` | Optional and skippable. **Not saved in this build** (`saved: false`): say so ("Optional. Not saved in this version."). The text is only passed to the safety check; the answer sent to the engine is `{kind:'words'}` with **no payload** |
| `capture_domain` | Chips, skippable, never shown on neutral/positive answers (the engine only requests it when warranted). Copy is exactly the engine's prompt |
| `capture_orientation` | **DISABLED in the MVP. The engine never emits it** (`V2.orientation.enabled = false`). The type stays in the union so a future rule can reuse it; the UI can ignore it entirely and need not build it |
| `timeframe` | Only after an option that creates a commitment, or when postponing. `pick_date` returns `specific_date` + `inDays`. Skipping = "no timeframe" |
| `thread_offer` | Yes/No, equally weighted, no default selection, no persuasion copy. "No" is final for ~3 weeks |

## 3. What the UI sends back

```ts
type StepAnswer =
  | { stepId: string; kind: 'option'; optionId: string }
  | { stepId: string; kind: 'unknown' }
  | { stepId: string; kind: 'skip' }
  | { stepId: string; kind: 'domain'; domain: Domain }
  | { stepId: string; kind: 'orientation'; orientation: Orientation }
  | { stepId: string; kind: 'timeframe'; timeframe: 'today'|'tomorrow'|'this_week'|'specific_date'|'none'; inDays?: number }
  | { stepId: string; kind: 'yes' | 'no' }
  | { stepId: string; kind: 'words' };   // no text. Ever.
```

## 4. Vocabularies

```ts
Domain      = 'work'|'partner'|'family'|'friends'|'self'|'body_health'|'money'|'time'|'technology'|'rest'|'other'|'unknown'
Orientation = 'past'|'present'|'future'|'uncertainty'|'none'|'unknown'
```
Independent dimensions. Neither is required. Labels come from locale files (`en/hi/gu`); ids are language-neutral. The chip list for `capture_domain` excludes `rest` and `unknown`.

## 5. Insight card (after a rep, at most one)

```ts
interface ShownInsight {
  id: number;
  tier: 'supported' | 'tentative' | 'hedged';
  text: string;                  // exact wording from the engine; the UI must not rephrase it
  evidence: { independentN: number; promptedN: number; introducedN: number }; // for the "Why am I seeing this?" view
  feedback: 'accurate' | 'partly' | 'no' | 'unsure';  // four equal chips; none preselected
}
```
- Show the counts if the user opens "Why am I seeing this?". Never show a score or a percentage.
- `hedged` text is a question or a comparison; do not style it as a finding.
- After **No**: no "are you sure?", no follow-up persuasion. After **Partly**: optional "What's off?" with the domain chips (the answer returns as a `correction` observation).
- Never display wording about the person's psychology that is not in `text`.

## 6. Home states (visual polish is yours; semantics are fixed)

| State | Must show | Must not show |
|---|---|---|
| Rep today | greeting, capacity label, seconds, **Begin** | a score, a streak, a "day N of 28" |
| In-progress | resume | a nag |
| Done | "Done for today" + optional one insight | next-day teasers framed as obligation |
| Rest *(proposed)* | the engine's one-line reason | a reward treatment, confetti, a streak, any "you earned it" |
| Continuity cue *(optional)* | one quiet line, only if the engine supplies it | more than one; a guilt line |
| Practice days | "N days of practice this month" | consecutive-day framing |

## 7. Copy rule: internal vocabulary stays internal

Users must never see "probe", "bias", "calibration", "selection", "lens", "thread" or "engine". The open question about what's on someone's mind is a normal Inner Rep: same card, same look, no special label. Internal ids (`probe_anchor`, `intent` values such as `probe_confirm`) are opaque and are not copy. A test scans every authored prompt, option, chip and generated insight for these words.

## 7a. Always-true behaviours

1. Any rep can be dismissed; nothing is lost and nothing is shamed.
2. Every optional step can be skipped; skipping is not "unknown".
3. "I don't know" is a legitimate answer on every choice step and is never styled as a failure.
4. A commitment's `postpone`/`changed mind`/`decided not to` are neutral options. **Only the user** can pick them; the UI never shows "overdue", "missed" or "failed".
5. No raw text is written to storage, URLs, logs, analytics or error reports. The words field must disable autofill/autocorrect/spellcheck (already done in v1).
6. Safety: if the safety check fires on `words`, stop the rep, show the safety panel (copy pending expert review), store nothing, and send `{kind:'skip'}` for that step. The detector is a **pre-production safeguard only; not validated.**
7. Accessibility: every step has a text label, every chip a role/state, focus moves to the new prompt, nothing relies on colour alone.

## 9. Explanation payload for "Why this today?" (proposed)
The engine's decision trace (`Trace` in `types.ts`) is already stored per decision. A user-facing version should expose only: the layer (open thread / something you raised / a different area), the one-line primary reason, and what was deliberately left alone. Wording needs product review; the raw trace is for developers.

## Change log

| Date | Change | Contract impact |
|---|---|---|
| 2026-10-06 | Orientation removed from the MVP collection path: `capture_orientation` is never emitted; no thread-level orientation question after accepting a check-in; no option carries an orientation | **None for a UI that implemented the six steps listed.** The step type remains in the union and may be ignored |
| 2026-10-06 | The open question has 3 phrasings, chosen by the engine per user (`variant`), never the same wording twice in a row | None: the wording arrives in `prompt` as before; do not hard-code it |
| 2026-10-06 | Contradiction is not a user-facing insight in the MVP (config switch) | None: `ShownInsight.kind` will simply never be `contradiction` |

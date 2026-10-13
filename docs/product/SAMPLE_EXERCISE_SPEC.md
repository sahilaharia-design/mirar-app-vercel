# Landing sample: an actual attention and reframing exercise (evidence-safe specification)

For Codex. Owner of behaviour and claims: Claude. Owner of visual and interaction design: Codex. Status: **specification for approval; nothing here is in the engine or the app.**

## 0. The problem, stated precisely
Today's landing sample runs the real `foc_settle` template (two statements, "Which is closer to today?"). It is honest, but the person does one tap and gets their own tap read back. There is no operation. The fix must give the visitor something to *do* without (a) storing or sending anything, (b) inferring anything about them, (c) claiming an effect, or (d) promising something the app does not offer.

## 1. Two rules that decide the design
1. **The sample must not misrepresent the product.** The in-app catalog has no "reframe" exercise. The nearest real template is `gro_update` ("Has anything changed how you see a situation lately?"). A richer Reframe is a proposed engine amendment (A3, decision D3) and is **not built**. So the sample is a labelled **demonstration**, not "a real Inner Rep from the app".
   Required label, visible before and after the exercise: *"A sample exercise. It runs only in this page and is not saved. In the Mirar beta, the exercise you get today is chosen for you, and it may be simpler than this."*
   The landing must not say or imply that the app currently lets the user reframe, or that this exact exercise exists there.
2. **The payoff comes from the visitor's own reported change, and is never attributed to the exercise.** The closing may restate what they chose and what they reported. It may not say the exercise helped, calmed, improved or worked.

## 2. The exercise: "Look again" (attention, then reappraisal)
Session-only, four short steps, about 45 to 60 seconds, deterministic, no timers, no free text. "I don't know" and "Leave" are available at every step. Back is available.

### Step 1 — Notice (attention)
Prompt: **"What is taking up the most room right now?"**
Options (authored, plain, none privileged):
- Something I haven't started
- Something someone said or did
- Something that might happen
- Something I can't change
- Nothing in particular
- I don't know

Ends early, with no further steps:
- *Nothing in particular* → title "Nothing to look at is a real result." Body: "You can leave it there."
- *I don't know* → title "Not knowing is a complete answer." Body: "Nothing here needs fixing, and nothing more is being asked."

### Step 2 — Weight (self-report, "before")
Prompt: **"How much room does it take up?"** Options: **A little · A fair amount · Most of it.**
Label under the options: *"Your own report. There is no right answer."*

### Step 3 — Look again (reappraisal)
Prompt: **"Here are three ways to look at it. None is the right one."**
Show three authored readings for the Step 1 choice, plus **"I'd rather keep my view"** as a fully equal fourth option. The visitor picks the one that fits best.

Authoring rules for readings (all must hold; reviewed by a human before shipping):
- Describe a *way of seeing the situation*, never the person ("It may be about how it started, more than how big it is", not "You're avoiding it").
- No imperatives, no advice, no "should", no "just".
- No causal claims about why the visitor feels what they feel.
- No minimising ("it's not a big deal") and no catastrophising.
- At least one reading must be less comfortable than the others; none is labelled healthier or better.
- Three distinct frames, for example: *scale* (how big), *time* (how long it lasts), *ownership* (how much is mine).

Illustrative set for **"Something I haven't started"** (to be reviewed, not final copy):
1. "It may be smaller than the waiting makes it feel."
2. "It may be exactly as big as it feels, and still worth starting small."
3. "It may be less about the task and more about the first step."
Authors must write equivalent sets for the other three situations in Step 1. No set may be reused across situations.

### Step 4 — Weight again (self-report, "after")
Prompt: **"Now, how much room does it take up?"** Options: **A little · A fair amount · Most of it.** A visible line: *"No change is a fine answer."*

### Closing — computed only from the visitor's answers
Always show, as exact quotes of what they chose: the situation, the reading they picked (or "I kept my view"), and the two weights. Then one sentence, selected by a fixed table:

| Before → After | Sentence |
|---|---|
| Less room than before | "You reported it takes up less room than before." |
| The same | "You reported no change. That is a fine result." |
| More room than before | "You reported it takes up more room after looking again. That happens, and it does not mean you did it wrong." |
| Kept their view | "You kept your view. That is as legitimate as any other." (then the weight sentence) |

Then, in small print for every outcome: *"This is what you reported. It does not show that the exercise caused any change."*

**Never present:** praise ("well done"), progress, a score, a streak, a level, a trait, "this helped", "you reframed", "this is how you think", or any advice.

## 3. Evidence, privacy and safety
- **Evidence:** the only facts are the visitor's selections in this session. No inference, no pattern, no "readings of you". The three weights are self-report and are labelled as such.
- **Privacy:** no network request, no analytics, no cookie, no `localStorage` or `sessionStorage`, no URL parameter carrying answers; a reload clears everything. The page's "not saved" statement must be true (test below).
- **Free text:** none. Therefore no safety detector is involved. The situation options are fixed, so a visitor cannot type crisis language into the sample. The standing crisis resources must remain reachable from the landing footer or privacy link.
- **Not clinical:** no therapeutic claim in the label, the title, or the copy; do not call it a technique, therapy, CBT or mindfulness.
- **Separation:** this is not an engine rep. Do not reuse engine step ids, `StepAnswer` shapes or the `V2RepFlow` renderer for steps the engine does not define. The fictional Honest Mirror study stays separate and inert, and must not be shown beside this sample's closing as if it derived from it.

## 4. Interaction and accessibility
Standard buttons only; no drag, no gesture-only input; 44 px targets; the new prompt receives focus at each step; a polite live region announces the closing; reduced motion shows every state immediately; mobile first, nothing clipped at 320 px; each step reachable by keyboard; the Aperture graphic must not carry meaning (all meaning in live text).

## 5. Acceptance tests
1. Every path ends cleanly: *Nothing*, *I don't know*, and *Leave* at any step.
2. The closing sentence equals the table for all nine before/after combinations, and for "kept my view" with each combination.
3. A recording of network, storage and console during a full run shows no request, no storage write, no console output containing an answer.
4. Reload returns to the first screen with nothing remembered.
5. The label in §1 is present on the first screen and on the closing.
6. No string in the exercise matches the forbidden list in §2 ("helped", "worked", "progress", "score", "should", "just", "reframed").
7. Keyboard-only completion; focus lands on each new prompt; screen-reader announcement of the closing; 320, 390, 768, 1024, 1440 widths without overflow.
8. A reviewer who sees only the screens can say what the visitor *did* (looked at one situation, compared three ways of seeing it, reported how much room it took before and after). If the answer is "answered questions", the exercise has failed.

## 6. Assessment of the same weakness inside the app
**What is fixed.** The closing is no longer interchangeable: it shows the exact question and answer, ends cleanly on "I don't know" or an honest "nothing", and describes the operation the template asked for.

**What is not fixed, and cannot be without the engine.** Most in-app reps are still a single tap (only a handful of templates have a follow-up, optional words or a timeframe). The closing is honest but the visitor did not *do* anything beyond choosing. Reappraisal in the beta is `gro_update` only.

**What can be improved without touching the frozen engine.**
- Prefer the existing two-step templates in presentation: `rel_boundary` (then "How much of the mood is yours?") already sorts responsibility, so its closing can juxtapose both answers.
- For reps that offer optional words (`rel_appreciation`), the privacy-safe closing can invite the user to finish the sentence in their head ("a few words, only for you"), with no data kept.

**What requires an approved engine amendment.** The real version of this exercise (best-fit reading, before/after weight, recorded as structured answers) is family F3 under amendment A3 (decision D3). Until then, the landing sample is a labelled demonstration and the app does not claim the capability.

**Success criterion for the app** (when F3 ships): in a five-person journey review, at least four people can describe what they did, and the closing could not be swapped with another session's without being wrong. No efficacy claim is made.

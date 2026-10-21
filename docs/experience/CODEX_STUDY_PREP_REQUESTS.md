# Codex coordination — Focused Validation Sprint (DRAFT; Sahil relays, Claude cannot message Codex)

Scope: preparation only. No session is scheduled. Do not merge PR #6; it predates the owner fixes. Do not touch the frozen engine, G3, E1, billing or production.

## Requests (in priority order)
1. **Attention wording fix (blocking).** `explorations/everyday/main.tsx` wraps Attention with "Choose for this made-up scene, not about yourself", but the runtime Attend pilot prompts ask about the person's **own afternoon**. Study mode must be the real Attend pilot about the person's own afternoon. Replace the wrapper copy with an accurate line, e.g. "Pick what fits your afternoon. Nothing is saved." Remove every made-up-scene framing in Attention.
2. **Attention study-mode behaviour.** Fixed options only, no free typing, nothing persisted (keep `PilotSession('attend')` with in-memory state), a clear voluntary exit on every step, no streak, no tally, no first-run counters.
3. **Disclosure labels.** Each prototype opens with a one-line status label: "Early draft. Choices are not saved." Message and Reply: same label, adjusted if they do persist anything (state which).
4. **Direct entries for the moderator.** A URL/hash per prototype (`#message`, `#attention`, `#reply`) and a reset-to-fresh-variant control so exposure 1–8 each uses a study-ready variant. Provide a variant list and which are study-ready.
5. **No depth setting UI.** Do not show a depth control until the functionality exists. No prominent first-run tally.
6. **Static preview build.** A single build command and output folder for the three prototypes, no backend calls, no analytics, no external fonts or scripts. Hosting is a separate founder decision (do not deploy).
7. **Language.** Signal / check-in / notice. No "reflect", "journal", "heal", "therapy", "mindset", "motivational".
8. **Accessibility pass.** Keyboard operation, tap targets, readable at phone width; report anything that blocks a participant.

## Not requested
Engine changes, new pilots, persistence, auth, billing, trial or entitlement UI, depth-preference UI, Reply or A3/A8 promotion.

## Return from Codex
- Branch name and commit, the changed files list, build command, a short note on each item above, and screenshots of each prototype's first screen and exit.
- Claude re-verifies against the unchanged engine and pilots test suite before the build is used in a session.

## Dependencies
Study cannot start until: item 1 and 3 are done, adviser review of consent/safety is recorded, founder approves recruiting/running and any hosting or thank-you spend.

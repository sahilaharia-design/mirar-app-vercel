# Honest Mirror feedback — exactly how each answer changes what may be shown (engine v2.0.1)

Feedback is about **Mirar's interpretation of the evidence**. It never creates evidence, never creates an observation, and is never read as something about the person (no denial, resistance, avoidance or ambivalence is inferred from disagreement; a test scans every generated text for that wording). There are **no numeric confidence values**: effects are discrete, listed here, and all numbers live in `config.ts` (`feedback.*`).

Scope: for claims about a domain (repeated signal, cross-capacity convergence) feedback applies to the **domain**, whichever claim carried it. Feedback given on one claim and "Accurate" on another never shadow each other (regression fixed in v2.0.1; the two memories are merged, latest day wins).

| Answer | What it means | Effect on future eligibility |
|---|---|---|
| **Accurate** | Mirar's interpretation was accepted | **No change.** Normal cooldown (14 days) and weekly cap apply. Support is not raised |
| **Partly** | Some of the underlying observation may be useful; the interpretation needs qualifying | The same text is **never** shown again unchanged. The subject is **withheld** until enough **new** independent observations arrive (table below). It then returns only as **hedged** wording (never "supported"), that states what was qualified. **Cooldown doubles** (28 days). The domain is **not** put to rest: Mirar may still ask about it, because the observation is not rejected |
| **No** | The interpretation is treated as unsupported / rejected | **Withheld** until **2** new independent observations; then only tentative + hedged, mentioning that a similar reading didn't fit. The domain **rests 21 days** (no lens tests). Counts toward *tentative mode* (two "No" in the last three insights raises the evidence bar and doubles cooldowns). Stronger than Partly in every respect |
| **Not sure** | No information either way | **Neither strengthens nor rejects.** The subject waits **7 days**, then is exactly as eligible and as strong as before. No rest, no tier change |

## Partly, by reason

| Reason | New independent observations needed to resurface | Wording after resurfacing (always `hedged`) |
|---|---|---|
| `situation_right_meaning_off` | 1 | "…has come up N times. This is only the count: you said the situation was right but not what it means." |
| `importance_overstated` | **2** (raised bar) | "…You said an earlier reading made it sound more important than it is." |
| `something_missing` | 1 | "…You said an earlier reading was missing something, so this may be only part of the picture." |
| `changed_since` | evidence window **restarts**: observations before the correction no longer count; normal thresholds then apply to the newer ones (3) | "…This counts only what has happened since you said things had changed." |
| `something_else` | 1 | "…You said an earlier version was only partly right, so treat this as a question." |
| `prefer_not_to_say` | 1 | same as `something_else` |
| *(skipped — no reason)* | 1 | same as `something_else` |

"New independent observations" = observations the user originated for that subject after the correction (follow-ups Mirar initiated never count, as everywhere in the engine). For claims that are not about a domain (e.g. a change claim) any newly answered, non-follow-up observation counts.

## What is stored
`insight.feedback {day, value}`, `insight.correction {day, reason}` and a feedback memory per claim and per domain (`partlyDay`, `partlyReason`, `noDay`, `unsureDay`). Structured values only. Free-text notes are never stored (the optional note on `something_else` is safety-checked, cleared, and not passed on).

## Tests
`scripts/sim/correction-suite.ts` (17 checks, incl. one mutation-checked: weakening a config value is caught), `scripts/runtime/runtime.test.ts` (adapter), the unmodified frozen suite (85/85), and sweep invariants over 420 runs: after Partly, no "supported" insight about that subject, no unchanged text, no resurfacing inside the doubled cooldown.

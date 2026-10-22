# 04 — Data sheet and analysis plan (DRAFT)

## Sheet: `exposures` (one row per exposure)
`participant_code, order_slot(1|2), prototype(Message|Attention|Reply), exposure_no(1-8), first_exposure(Y|N), U, T_sec, C, X, H, M, R, E, A, K, N1, NS_unaided, NS_total, O_pause, O_reread, O_scroll, O_ask, O_screen_ids, F_note, F_verbatim, moderator`

## Sheet: `participants`
`participant_code, schedule_row(P01-P12), variety_pref(same|different|none), variety_why_verbatim, return_motivation(curiosity|usefulness|both|neither), return_why_verbatim, prototype_build_id_first, prototype_build_id_second, first_prototype, second_prototype, age_band, usage_of_wellbeing_apps(none|past|current), consent_ack(Y), eligibility_ok(Y), withdrew(Y|N), incident(Y|N)`
No names, emails or phone numbers in this sheet. Contact details, if kept for the thank-you, live in a separate file the analyst never opens.

## Analysis plan (fixed before running)
1. **First-exposure table** (primary): for each prototype, n = 8, count of passes (rubric §Pass), plus U, E, R medians and range. Report `k/8`, never a percentage alone.
2. **Repeat-exposure table** (secondary, exposures 2–8): completion, exits, R and E trend by exposure. Report as description only.
3. **Order check:** compare first-exposure outcomes when the prototype was shown first vs second. With 4 per cell, only flag a visible gap; do not test.
4. **Qualitative coding:** group F_note and baseline/feedback quotes by theme. Two coders if available; record disagreements.
5. **Decision rule:** a prototype with ≥ 6/8 first-exposure passes **and** no unresolved K or wording issue advances to iteration; 4–5/8 iterates on the observed failure; ≤ 3/8 is set aside. These are product triage decisions, not findings about effect.

## Exploratory observations (founder addendum; no thresholds, no pass/fail)
Report as descriptive counts and quotes only, split by prototype and by first vs repeat exposure:
- **Unassisted comprehension:** n of 8 who identified the first action unaided (N1) on first exposure; median share of later steps unaided (NS).
- **Information overload:** overload events per prototype (O), listed by screen id so Codex can see where. Compare Attention builds only descriptively.
- **Variety preference:** counts of same / different / no preference (n = 12) with every "why" verbatim.
- **Return motivation:** counts of curiosity / usefulness / both / neither. Report curiosity and usefulness separately; do not combine them into "would return".
- **Build identity:** record the Attention build id for each session. If Codex's progressive-disclosure build replaces the earlier one mid-study, report the two builds separately and do not pool them.

**Verbatim rule.** Quotes are kept exactly as said, in a separate column, before any coding. Coding never overwrites the verbatim.

**Founder feedback.** Reported in a separate section titled "Founder review (single informed reviewer, not participant evidence)". Never counted in any n, table or threshold. See `07_FOUNDER_REVIEW_NOTE.md`.

## Claims allowed in the write-up
"In an 8-person screening, k of 8 participants understood and completed the first exposure unaided."

## Claims not allowed
Any inference from the exploratory observations beyond "this was observed in these participants", any claim that variety or novelty will drive retention, efficacy, wellbeing change, habit formation, retention, conversion, willingness to pay, statistical significance, or any comparison implying one prototype "works better" for people in general.

## Storage
Local encrypted folder, participant codes only, notes retained until the decision is made then archived without any contact details. Retention period `VERIFY` with reviewer.

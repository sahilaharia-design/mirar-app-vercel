# 04 — Data sheet and analysis plan (DRAFT)

## Sheet: `exposures` (one row per exposure)
`participant_code, order_slot(1|2), prototype(Message|Attention|Reply), exposure_no(1-8), first_exposure(Y|N), U, T_sec, C, X, H, M, R, E, A, K, F_note, moderator`

## Sheet: `participants`
`participant_code, schedule_row(P01-P12), first_prototype, second_prototype, age_band, usage_of_wellbeing_apps(none|past|current), consent_ack(Y), eligibility_ok(Y), withdrew(Y|N), incident(Y|N)`
No names, emails or phone numbers in this sheet. Contact details, if kept for the thank-you, live in a separate file the analyst never opens.

## Analysis plan (fixed before running)
1. **First-exposure table** (primary): for each prototype, n = 8, count of passes (rubric §Pass), plus U, E, R medians and range. Report `k/8`, never a percentage alone.
2. **Repeat-exposure table** (secondary, exposures 2–8): completion, exits, R and E trend by exposure. Report as description only.
3. **Order check:** compare first-exposure outcomes when the prototype was shown first vs second. With 4 per cell, only flag a visible gap; do not test.
4. **Qualitative coding:** group F_note and baseline/feedback quotes by theme. Two coders if available; record disagreements.
5. **Decision rule:** a prototype with ≥ 6/8 first-exposure passes **and** no unresolved K or wording issue advances to iteration; 4–5/8 iterates on the observed failure; ≤ 3/8 is set aside. These are product triage decisions, not findings about effect.

## Claims allowed in the write-up
"In an 8-person screening, k of 8 participants understood and completed the first exposure unaided."

## Claims not allowed
Efficacy, wellbeing change, habit formation, retention, conversion, willingness to pay, statistical significance, or any comparison implying one prototype "works better" for people in general.

## Storage
Local encrypted folder, participant codes only, notes retained until the decision is made then archived without any contact details. Retention period `VERIFY` with reviewer.

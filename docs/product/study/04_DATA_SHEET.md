# 04 — Data sheet and analysis plan (DRAFT)

## Sheet: `tries` (one row per participant × prototype × try)
`participant_code, order_slot(1|2), prototype(Message|Attention|Reply), try_no(1..3), first_try(Y|N), first_in_order(Y|N), build_id, U, T_sec, C, X, H, M, R, E, A, K, N1, NS_unaided, NS_total, O_pause, O_reread, O_scroll, O_ask, O_screen_ids, F_note, F_verbatim, moderator`

## Sheet: `pairings` (one row per participant × prototype; 8 per prototype; the gate's rows)
`participant_code, prototype, order_slot, build_id, M1_said_what_they_did(blind-coded Y|N), M2_interesting(1-5), M2_heavy(1-5), M4_forced_choice(quiz|chore|practice|game), M5_wants_another(Y|N), M6_discomfort(none|mild|severe), M6_pressure_reported(Y|N), M7_untrue_statement(Y|N), abandoned(Y|N)`

## Sheet: `builds` (build register; see below)
`build_id, prototype, commit_sha, deployment_id, output_hash, recorded_by, recorded_on, used_in_sessions, notes`

## Sheet: `participants`
`participant_code, schedule_row(P01-P12), variety_pref(same|different|none), variety_why_verbatim, return_motivation(curiosity|usefulness|both|neither), return_why_verbatim, prototype_build_id_first, prototype_build_id_second, first_prototype, second_prototype, age_band, usage_of_wellbeing_apps(none|past|current), consent_ack(Y), eligibility_ok(Y), withdrew(Y|N), incident(Y|N)`
No names, emails or phone numbers in this sheet. Contact details, if kept for the thank-you, live in a separate file the analyst never opens.

## Analysis plan (fixed before running)
1. **Gate table (primary):** per prototype, the 8 pairings' first tries scored against the authoritative gate in `03_OBSERVATION_RUBRIC.md`. Report each measure as `k/8` or median, never a bare percentage.
2. **Order table:** the same measures split first-in-order (4) vs second-in-order (4). Describe only.
3. **Repeats (tries 2–3):** completion, exits, R and E. Describe only.
4. **Qualitative coding:** group F_note, baseline and feedback quotes by theme, verbatim preserved; two coders if available; record disagreements.
5. **Decision:** clearing the screen means "worth iterating", not "works". Failing on M6/M7 drops the prototype. If more than one clears, the choice is a product decision, not a statistical one.

## Exploratory observations (founder addendum; no thresholds, no pass/fail)
Report as descriptive counts and quotes only, split by prototype, first try vs repeat, and first-in-order vs second-in-order:
- **Unassisted comprehension:** n of 8 first tries where the first action was identified unaided (N1); median share of later steps unaided (NS).
- **Information overload:** overload events per prototype (O), listed by screen id so Codex can see where. Never pool Attention builds.
- **Variety preference:** counts of same / different / no preference (n = 12) with every "why" verbatim.
- **Return motivation:** counts of curiosity / usefulness / both / neither. Report curiosity and usefulness separately; do not combine them into "would return".
- **Build identity:** record the Attention build id for each session. If Codex's progressive-disclosure build replaces the earlier one mid-study, report the two builds separately and do not pool them.

**Verbatim rule.** Quotes are kept exactly as said, in a separate column, before any coding. Coding never overwrites the verbatim.

**Founder feedback.** Reported in a separate section titled "Founder review (single informed reviewer, not participant evidence)". Never counted in any n, table or threshold. See `07_FOUNDER_REVIEW_NOTE.md`.

## Claims allowed in the write-up
"In an 8-pairing screening, k of 8 participants met [measure] on their first try of this prototype."

## Claims not allowed
Any inference from the exploratory observations beyond "this was observed in these participants", any claim that variety or novelty will drive retention, efficacy, wellbeing change, habit formation, retention, conversion, willingness to pay, statistical significance, or any comparison implying one prototype "works better" for people in general.

## Build register (rule: old and new Attention are never pooled)
Every session records the `build_id` of each prototype it ran. Each distinct `build_id` is its own stratum. A change in commit, deployment or output hash starts a new `build_id`. Results from different Attention build_ids are reported separately and never summed, averaged or counted toward the same n = 8; if the Attention build changes mid-study the Attention gate restarts for the new build (the extra sessions are an approval item, not a decision made here).

| build_id | Prototype | Commit | Deployment | Output hash | Status |
|---|---|---|---|---|---|
| ATT-GUIDED-1 | Attention (guided, one choice at a time) | `36da9f3c456119f4900ab3486ca64e064bd7f22d` (frontend source per Codex; PR #6 head `705b90c9da6fea49f3c5caddff3e24a351a72a70` adds evidence/docs only) | `dpl_DsaWPK3Wikjd3bh3mC7pHQP1x6hK` (Preview, as recorded in Codex's `hosting.json`) | JS `index-5MxDfiAu.js` sha1 `625351d80f255ca6f7635111c0e71b4b1721c7e3`; `index.html` sha1 `3aae2460e884f00de51471a407c86b7210c8f4e1` (Codex `host-hashes.json`) | **Study candidate, pending Codex's written confirmation** |
| ATT-PRE-GUIDED | Attention before guided revision (parent of `36da9f3`: `7c4fdc5398ee5c17e09e2107e6665fbcdcb67e4e`) | `7c4fdc5…` | not recorded | not recorded | **Not for the study.** The founder's review (07) was of an earlier Attention build whose exact id was not recorded |
| MSG-1, REPLY-1 | Message, Reply | Codex to confirm commit/deployment/hash for the same deployment | | | Pending Codex |

Rows are copied from Codex's repository evidence; they are not verified against the live deployment (access is protected). Codex confirms them in writing (`CODEX_STUDY_PREP_REQUESTS.md` item 9) before a session is booked.

## Storage and retention (matches the consent script)
- **Prototypes:** save nothing.
- **Moderator notes:** retained, under the participant code only, in the founder's own storage; deleted on request; retention period `VERIFY` with the reviewer. Contact details for any thank-you live in a separate file the analyst never opens.

# Trial length: 7 versus 14 days (decision report)

**Date:** 15 October 2026. **Status:** read-only evaluation. The engine, evidence rules, thresholds, billing, Supabase, production and every deployment are unchanged. Evidence: `scripts/sim/trial-eval.ts` → `docs/sim/trial-evaluation.md`; `scripts/sim/trial-boundaries.ts` → `docs/sim/trial-boundaries.md`. Re-run with `npx tsx scripts/sim/trial-eval.ts` and `npx tsx scripts/sim/trial-boundaries.ts`.

## Recommendation
**Use a 14-day trial, started by the first completed rep, with an honest read-only expiry state.** This is a reasoned judgement from the engine's behaviour and the product's structure, **not** a conversion finding: there is no conversion data, and none is invented here. A 7-day trial would end before the product shows most of what makes it different. A 14-day trial still ends before most people would see an evidence-bound reading, so the trial must be sold on the practice and the memory, with honest expectation-setting, not on the Mirror reading.

## What the engine does inside each window
Method: the unchanged engine and Mirror read model, 12 synthetic profiles (stable; three stressed; three uncertain/disagreeing; two irregular; two highly engaged; one disengaging), 20 seeds each (240 runs per window), rest rule off as in the app. The window starts at the first completed rep. Synthetic users are inventions of the simulator: **these numbers describe the engine, not people.**

| Per run, averaged over all 240 | 7 days | 14 days | 21 days | 28 days |
|---|---|---|---|---|
| Completed reps | 6.6 | 12.3 | 18.0 | 24.1 |
| Distinct exercises | 6.3 | 11.5 | 14.4 | 16.3 |
| Immediate Mirror statements (no reading) | 12.0 | 14.8 | 15.6 | 16.1 |
| Runs shown at least one evidence-bound reading | **2%** | **17%** | 42% | 55% |
| Median day of the first reading (day 0 = first rep), among those who got one | 5 | 9 | 15 | 15 |
| Follow-ups on something the person named earlier (reps) | 0.1 | 0.8 | 1.5 (21 d) | n/a |

By behaviour (share of runs with at least one reading): at 7 days stable 0%, stressed 2%, uncertain 3%, irregular 3%, highly engaged 0%, disengaging 5%; at 14 days stable 0%, stressed 27%, uncertain 22%, irregular 13%, highly engaged 13%, disengaging 10%. A person with one recurring theme (the "repeated work stress" profile) reached 60% by day 14 and 90% by day 21; a stable person reached 10% by day 28 and otherwise never, by design.

### Eligibility versus delivery (kept separate, no tuning)
The engine's own per-day verdict has three states. In the 7-day and 14-day windows there were **no** cases of a reading being eligible and withheld (cooldown, weekly cap, repeated text, one reading per rep): every eligible reading was shown that day (5 of 5 runs at 7 days, 41 of 41 at 14). So the gap to "shown" is entirely the evidence rules not yet being met. The most common near-miss reasons on a person's last active day were not enough of their own history to compare yet (224 of 235 no-reading runs at 7 days), too few independent observations on too few days (164), and a follow-up lens being a test rather than independent evidence (102). These are the rules working as designed; none was changed.

### Profiles with no reading
At 7 days, 98% of runs had none; at 14 days 83% (199 of 240). Stable and "makes many commitments" profiles had none at 14 days in any seed; "frequently I don't know" and the one-week-absence profile had almost none. Disagreeing and highly engaged profiles reached 35% and 25%.

### What a person gets without a reading
In every no-reading run the Mirror was in the "sparse" state (never empty, never "populated") and held, on average, at 7 days: about 6 statements of what they said (their own choices, exact labels), 4.5 lines on what they practised, about 1 line on what Mirar has not been told, and 0.3 commitments; at 14 days about 8, 5.5, 1 and 0.6. Add the rep itself (12 reps across all six capacities by day 14 against 6.6 and 5–6 capacities at 7 days) and follow-ups on things they named (0.8 reps at 14 days against 0.1 at 7). **Whether any of this is valuable to a person is a hypothesis for human testing.** The "said" lines are the person's own choices read back, which may feel modest.

## Trial start: signup versus first completed rep
- **Signup start loses practice.** If the first rep is delayed by k days: at 7 days mean reps fall 6.6 → 5.6 (k=1) → 3.7 (k=3) → 1.9 (k=5); at 14 days 12.3 → 11.6 → 10.1 → 8.3. The chance of a reading falls too (14 days: 17% → 12% at k=3; 7 days: 2% → 0%). Under signup start, a 7-day trial is, for a person who starts on day 4, a 3-day trial.
- **First-completed-rep start is fairer** and matches how the engine counts (a rep is complete only when the engine says so; an abandoned one is recorded as skipped).
- **Cost of that choice:** the server must be told when the first rep is completed. Practice is device-local by design, so this is the **one practice-derived fact the server would hold**: a date. It needs plain disclosure and counsel review; nothing about content is sent. An offline first rep reports late: the trial then starts at server receipt (never earlier than what the server saw), which can only favour the person.
- **Why not simply start at first sign-in:** an account that never practises should not burn its trial.

### Calendar-day boundaries, time zones, interruptions (real runtime, injected clock)
From `docs/sim/trial-boundaries.md`:
- The engine's day is the **device's local calendar date**, one rep per date. A rep done at 23:58 blocks a second one at 23:59, and a new rep is available at 00:02 the next day.
- A device date moved **back** to a day already completed shows "done". Moved back two days to an empty date, the runtime served and stored a rep under the earlier date. So the **device clock must never define the trial**; only server time may.
- Forward jumps are harmless (an absence is just an absence).
- A first rep left **unfinished** resumes with answers kept if reopened the same day; the next day it is recorded as skipped (not completed) and a new rep is served. The trial would **not** have started. Starting the trial only on a completed first rep therefore handles interrupted onboarding correctly.

**Proposed rule.** The trial covers the **first N local calendar days**, day 1 being the day of the first completed rep, in the time zone the person had at that moment (stored with the start). `trial_ends_at` is an absolute instant: the end of local day N plus a **12-hour courtesy**, so travel across time zones never costs a practice day. Evaluation uses server time only. A rep begun before the end may be finished. This is deterministic, explainable and cannot be extended by changing the device clock.

## Expiry experience (account kept, history honest, no indefinite free practice)
1. **Nothing is deleted or hidden.** Sign-in works; the person sees their own history and the Mirror read model on this device, and can **save a file** and **delete the account**.
2. **No new reps.** The membership page states the price once, with Continue and Not now carrying equal weight. No countdown theatre, no guilt, no streak language, no "you will lose progress" (it would be false and coercive).
3. **A calm note** that history stays on this device, that clearing the browser removes it, and how to save a copy.
4. **Reactivation** brings the person straight back; no second trial.
5. **Why this is not indefinite free practice:** viewing a past is not practising; the engine does not serve reps without an active entitlement. (A technically determined person can bypass any client-side check; that limit is documented in the masterplan.)
6. **Mid-trial checkpoint** (recommended for 14 days): one factual mail and in-app note around day 7 saying what they have done and that the trial runs to date X; and at day 12 the "ends soon" note. Neither asks for payment details.

## Risks of each length (hypotheses, not data)
| Dimension | 7 days | 14 days |
|---|---|---|
| Engagement | Ends before follow-ups (0.1 reps) and before most exercise variety; the person decides on an incomplete product | Two full weeks; follow-ups (0.8), nearly full variety; risk of low-urgency drift and "I'll decide later" |
| Conversion timing | Earlier decision and earlier revenue; likely more "I haven't seen what it does" non-conversions | Revenue delayed by a week; decision made with more evidence; may suit a slow-burn product |
| Trust | A 98%-no-reading experience followed by a paywall may read as bait unless expectations are set | 83% still no reading; honest setting of expectations is still required, but the person has had a fair test of the practice and the memory |
| Cost | none marginal (client-side engine, Free tier) | none marginal; only delayed cash |
| Abuse | New email = new trial either way; cost to us is nil | same |
| Mirror dependence | Cannot rely on a reading | Cannot rely on a reading (17%) |

Mechanisms behind both: the Mirror speaks only when its evidence rules are met; thresholds were not changed for this evaluation and must not be changed to make a trial convert.

## What remains unproven
1. Whether real people practise daily, skip, or leave in the first 14 days, and how their answers differ from the simulator's invented behaviours.
2. Whether the immediate Mirror lines and the follow-up memory are valued, and whether their absence of a "reading" disappoints.
3. Whether 14 days converts better, worse or the same as 7; whether people postpone deciding; whether a day-7 checkpoint helps.
4. Willingness to pay ₹199/month or ₹1,499/year, stated or revealed.
5. Whether the time-zone/clock rule and first-rep signal behave as designed in production and are acceptable to users and counsel.
6. Whether 28-day experience (55% see a reading) suggests a paid membership may be easier to justify after the trial than within it.

## Proposed small human-validation protocol (ethical, minimal)
**Purpose:** learn how people experience the first 7 and 14 days and what they say they would do; **not** to prove effectiveness or estimate conversion.
- **Who:** about 24 adults (18+; the product's minimum age is 16, but the study is adult-only), recruited from the founder's network and waitlist who are not paying anything; no recruitment of people seeking treatment; plain consent stating this is **not therapy**, voluntary, can stop any time, no pressure, and showing the crisis resources (112; Tele-MANAS 14416) before and after.
- **Design:** random assignment, 12 per arm, to 7-day or 14-day access on a **staging build with simulated billing (no real money)**; same onboarding and content for both; the trial clock rule above.
- **Data (minimal, no practice content):** days practised, reps completed, reading shown yes/no (counts only), return after the arm's expiry within 3 days, and a short check-in at day 7, 14 and 21: What do you think Mirar does? What did you get from it? Would you pay for this at ₹199/month or ₹1,499/year (stated, hypothetical), and what would you need to see first? Plus two comprehension checks (can they say what a reading is based on) and one trust question. Participant ids are study codes; no email in the analytics; notes kept in the founder's own storage; withdrawal deletes their notes.
- **Safety:** a named person who can be contacted; if a participant reports distress the session pauses and resources are offered; no coercive incentives (a small thank-you not tied to any outcome).
- **Review:** an independent adviser (the same reviewer when appointed) looks at the consent and questions before the first participant.
- **Reporting:** descriptive and qualitative only; "of these 24 people". No statistical claim about conversion: with a baseline near 25% and a 10-point difference to detect at conventional thresholds one would need roughly 300 people per arm (my arithmetic), which the bootstrapped scale cannot supply yet.
- **Next step after the study:** a closed paid pilot with real money and a real refund path, tracking revealed behaviour (start, continue, cancel) rather than stated intentions, then reconsider the length with real numbers.

## Decision requested
Approve (or change) the 14-day first-completed-rep trial, the server-time rule with a 12-hour courtesy, the read-only expiry, the day-7 and day-12 notes, and the minimal first-rep signal (with disclosure) as the basis for the entitlement specification. No code is written until you approve.

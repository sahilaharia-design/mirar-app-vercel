
---

## The Everyday User

*Busy, reasonably happy, not looking to improve anything. Opens it when there is a spare minute; misses two days.*  
**SIMULATED persona.** Engine user seed: `first14-everyday-1`. Other seeds change which exercises are served; the aggregate table in section 3 shows how typical this run is.

#### Day 1 · Monday 19 October
**ENGINE served:** `foc_attention` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Focus” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Monday 19 October
> Good afternoon.
> Think about the last two hours. Did anything take more attention than it deserved?
> [Begin]
> There is no answer to perform. You can leave any time.
> Focus
> 25 seconds
> [What is an Inner Rep?] → “A small exercise, not a test. Notice what is real, exercise a capacity, then take that noticing into your day. “I don’t know” is a real answer. You can disagree with the mirror.”

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Think about the last two hours. Did anything take more attention than it deserved?” — options: [My phone] [Work] [Another person] [Overthinking] [Nothing in particular] [I don't know]  
   **SIMULATED answer:** “My phone”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Think about the last two hours. Did anything take more attention than it deserved?
> Your selected response: My phone
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

**UI — The Mirror tab after today, in full (`MirrorExperience.tsx`; statements are ENGINE/runtime `mirror-contract.ts` output):**
> The Mirror · no verdict on you
> A view with room around it.
> Practice, responses and possible readings. Each keeps its own source.
> A quiet Mirror does not need to be filled.
> Daily Inner Rep facts · not ability
> What has been exercised.
> 1 day of practice this month. No need for consecutive days.
> · A fact about practice: Focus: 1 rep completed. (2026-10-19)
> These are completed reps, not levels of emotional fitness.
> Mirar’s side of the window
> There need not be a reading.
> No personal explanation is supplied to fill the space. Practice can be useful without a reflection.
> Your side of the window
> Room to leave something open.
> · What remains open: No completed training reps yet in: Direction, Energy, Relationships, Growth, Action.
> Source material → [Read your selected responses] (collapsed; 1 statement) — The offered question stays with the selected response. Neither is a description of who you are.
> In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.

**EVAL:** Strongest possible opening for this person. One concrete, answerable question about the last two hours; five everyday options including “My phone” and “Nothing in particular”; one tap, ~25 seconds. No seriousness, no confusion. Friction: the completion screen simply repeats the tap back (see section 6, weakest moment 1). Tomorrow: nothing on screen hints at what tomorrow holds.

#### Day 2 · Tuesday 20 October
**ENGINE served:** `rel_appreciation` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Relationships” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Tuesday 20 October
> Good afternoon.
> Is there someone you appreciated today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Relationships
> 25 seconds
> 1 day of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is there someone you appreciated today?” — options: [Yes] [Not today] [I don't know]  
   **SIMULATED answer:** “Yes”
2. *words* — **ENGINE:** “A few words (optional)”  
   **SIMULATED answer:** (skipped)
3. *domain_chips* — **ENGINE:** “What's this mostly connected to?” — options: [Work] [Partner] [Family] [Friends] [Myself] [Body or health] [Money] [Time] [Technology] [Something else]  
   **SIMULATED answer:** chip “Work”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Is there someone you appreciated today?
> Your selected response: Yes
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “2 days of practice this month. No need for consecutive days.” · “· A fact about practice: Relationships: 1 rep completed. (2026-10-20)” · “· What remains open: No completed training reps yet in: Direction, Energy, Growth, Action.” · “Source material → [Read your selected responses] (collapsed; 2 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** Different from day 1 (new capacity: “Relationships”). The question is warm and easy. A “Yes” then opens two extra asks: an optional typed-words box and a ten-chip “What’s this mostly connected to?” (Work, Partner, … Money, Technology). For a busy person this turns a pleasant moment into form-filling; the persona skips the words and taps “Work” without much thought. The Mirror now lists two capacities.

#### Day 3 · Wednesday 21 October
**ENGINE served:** `gro_update` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~30s · capacity label “Growth” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Wednesday 21 October
> Good afternoon.
> Has anything changed how you see a situation lately?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Growth
> 30 seconds
> 2 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Has anything changed how you see a situation lately?” — options: [Yes, clearly] [A little] [Nothing comes to mind] [I don't know]  
   **SIMULATED answer:** “Nothing comes to mind”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> You can leave it here.
> The offered question: Has anything changed how you see a situation lately?
> Your selected response: Nothing comes to mind
> Your response to the offered question
> There is no need to turn this into another task.

*The Mirror tab after today, changes since the last time it was shown:* “3 days of practice this month. No need for consecutive days.” · “· A fact about practice: Growth: 1 rep completed. (2026-10-21)” · “· What remains open: No completed training reps yet in: Direction, Energy, Action.” · “Source material → [Read your selected responses] (collapsed; 3 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** A single tap. The question (“Has anything changed how you see a situation lately?”) is abstract for someone not looking to improve anything; “Nothing comes to mind” is an honest and easy answer, and the app accepts it with “You can leave it here.” Across 40 simulated Everyday seeds, day 3 is where heavier templates start to appear (about 38% of seeds are served `dir_know_act` or `gro_mistake` on day 3).

#### Day 4 · Thursday 22 October
**ENGINE served:** `en_pace` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~20s · capacity label “Energy” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Thursday 22 October
> Good afternoon.
> Which is closer to today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Energy
> 20 seconds
> 3 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Which is closer to today?” — options: [I pushed past what I had.] [I paced myself.] [I don't know]  
   **SIMULATED answer:** “I paced myself.”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Which is closer to today?
> Your selected response: I paced myself.
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “4 days of practice this month. No need for consecutive days.” · “· A fact about practice: Energy: 1 rep completed. (2026-10-22)” · “· What remains open: No completed training reps yet in: Direction, Action.” · “Source material → [Read your selected responses] (collapsed; 4 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** “Which is closer to today?” with two first-person statements (“I pushed past what I had.” / “I paced myself.”). Plain and quick, but the generic stem gives no hint of the topic until the options are read. Feels like a mild variation on day 1’s tap, not a new kind of experience.

#### Day 5 · Friday 23 October
**SIMULATED:** does not open the app today (a busy day). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened (a busy day). Nothing is lost and nothing is shown. The engine carries on from the next day opened.

#### Day 6 · Saturday 24 October
**ENGINE served:** `probe_anchor` · frame `base` · role `probe` · intensity `light` · sensitivity `low` · ~20s · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Saturday 24 October
> Good afternoon.
> What's taking up the most room in your head today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> 20 seconds
> 4 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “What's taking up the most room in your head today?” — options: [Work] [My partner] [Family] [Friends] [Money] [My body or health] [Myself] [Time] [Technology] [Something else] [Something significant happened] [Nothing in particular] [I don't know]  
   **SIMULATED answer:** “Work”
2. *yes_no* — **ENGINE:** “Want Mirar to check in on this now and then? You can stop any time.” — options: [Yes] [No]  
   **SIMULATED answer:** “No”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: What's taking up the most room in your head today?
> Your selected response: Work
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “5 days of practice this month. No need for consecutive days.” · “Source material → [Read your selected responses] (collapsed; 5 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** Return after a gap lands on the first heavier ask. In this engine the 5th completed rep is always the “open question” (`probe_anchor`, 100% of simulated seeds): “What’s taking up the most room in your head today?” with twelve options (Work, My partner, Family, Friends, Money, My body or health, Myself, Time, Technology, Something else, Something significant happened, Nothing in particular). The persona taps “Work”. The app then asks “Want Mirar to check in on this now and then?” — a standing commitment from someone who answered casually. The persona says No. This is the clearest “too much too early” moment (section 7).

#### Day 7 · Sunday 25 October
**ENGINE served:** `act_friction` · frame `lens` bound to `work` · role `training` · intensity `medium` · sensitivity `low` · ~30s · capacity label “Action” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Sunday 25 October
> Good afternoon.
> Is work getting in the way of something you meant to do?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Action
> 30 seconds
> 5 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is work getting in the way of something you meant to do?” — options: [Yes, a lot] [Somewhat] [Not today] [This isn't what's on my mind] [I don't know]  
   **SIMULATED answer:** “Not today”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> You can leave it here.
> The offered question: Is work getting in the way of something you meant to do?
> Your selected response: Not today
> Your response to the offered question
> There is no need to turn this into another task.

**UI — The Mirror tab after today, in full (`MirrorExperience.tsx`; statements are ENGINE/runtime `mirror-contract.ts` output):**
> The Mirror · no verdict on you
> A view with room around it.
> Practice, responses and possible readings. Each keeps its own source.
> A quiet Mirror does not need to be filled.
> Daily Inner Rep facts · not ability
> What has been exercised.
> 6 days of practice this month. No need for consecutive days.
> · A fact about practice: Energy: 1 rep completed. (2026-10-22)
> · A fact about practice: Focus: 1 rep completed. (2026-10-19)
> · A fact about practice: Growth: 1 rep completed. (2026-10-21)
> · A fact about practice: Relationships: 1 rep completed. (2026-10-20)
> These are completed reps, not levels of emotional fitness.
> Mirar’s side of the window
> There need not be a reading.
> No personal explanation is supplied to fill the space. Practice can be useful without a reflection.
> Your side of the window
> Room to leave something open.
> · What remains open: No completed training reps yet in: Direction, Action.
> Source material → [Read your selected responses] (collapsed; 6 statements) — The offered question stays with the selected response. Neither is a description of who you are.
> In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.

**EVAL:** Despite the No, the next rep is a work-themed lens: “Is work getting in the way of something you meant to do?” (Yes, a lot / Somewhat / Not today / This isn’t what’s on my mind). The options are honest and low-pressure, but the topic has become Work. The persona answers “Not today”.

#### Day 8 · Monday 26 October
**ENGINE served:** `foc_attention` · frame `lens` bound to `work` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Focus” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Monday 26 October
> Good afternoon.
> Did work pull at your attention today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Focus
> 25 seconds
> 6 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Did work pull at your attention today?” — options: [Yes, a lot] [Somewhat] [Not today] [This isn't what's on my mind] [I don't know]  
   **SIMULATED answer:** “Yes, a lot”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Did work pull at your attention today?
> Your selected response: Yes, a lot
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “7 days of practice this month. No need for consecutive days.” · “Source material → [Read your selected responses] (collapsed; 7 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** Another work lens: “Did work pull at your attention today?” The persona answers “Yes, a lot”. Two consecutive reps about work (and a third on day 14) after one casual tap can feel like the app is fixated on one subject. It is also the first time the product gives a hint of memory: it is following up on something they said.

#### Day 9 · Tuesday 27 October
**SIMULATED:** does not open the app today (a busy day). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened (a busy day).

#### Day 10 · Wednesday 28 October
**ENGINE served:** `dir_time` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Direction” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Wednesday 28 October
> Good afternoon.
> Did today's time go to what matters to you?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Direction
> 25 seconds
> 7 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Did today's time go to what matters to you?” — options: [Mostly] [Partly] [Not really] [I don't know]  
   **SIMULATED answer:** “Mostly”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Did today's time go to what matters to you?
> Your selected response: Mostly
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “8 days of practice this month. No need for consecutive days.” · “· A fact about practice: Direction: 1 rep completed. (2026-10-28)” · “· What remains open: No completed training reps yet in: Action.” · “Source material → [Read your selected responses] (collapsed; 8 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** Back to a light, topic-free question (“Did today’s time go to what matters to you?” Mostly / Partly / Not really). Reads as everyday, not clinical. Slight sense of “values” language. The answer “Mostly” gets the neutral echo.

#### Day 11 · Thursday 29 October
**ENGINE served:** `rel_connect` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Relationships” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Thursday 29 October
> Good afternoon.
> Is there someone you've been meaning to reach out to?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Relationships
> 25 seconds
> 8 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is there someone you've been meaning to reach out to?” — options: [My partner] [Family] [A friend] [No one right now] [I don't know]  
   **SIMULATED answer:** “No one right now”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> You can leave it here.
> The offered question: Is there someone you've been meaning to reach out to?
> Your selected response: No one right now
> Your response to the offered question
> There is no need to turn this into another task.

*The Mirror tab after today, changes since the last time it was shown:* “9 days of practice this month. No need for consecutive days.” · “· A fact about practice: Relationships: 2 reps completed. (2026-10-29)”

**EVAL:** “Is there someone you’ve been meaning to reach out to?” Four options (My partner / Family / A friend / No one right now). The persona picks “No one right now” and gets “You can leave it here. There is no need to turn this into another task.” — a notable moment of permission. For a different answer the app would create a reach-out intention and ask “When would you like to do it?”.

#### Day 12 · Friday 30 October
**ENGINE served:** `gro_noticed` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~20s · capacity label “Growth” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Friday 30 October
> Good afternoon.
> Did you notice or learn something today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Growth
> 20 seconds
> 9 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Did you notice or learn something today?” — options: [Something small] [Something that mattered] [Not today] [I don't know]  
   **SIMULATED answer:** “Something that mattered”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Did you notice or learn something today?
> Your selected response: Something that mattered
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “10 days of practice this month. No need for consecutive days.” · “· A fact about practice: Growth: 2 reps completed. (2026-10-30)”

**EVAL:** “Did you notice or learn something today?” (Something small / Something that mattered / Not today). Light and positive; the best kind of question for this person. Echo only.

#### Day 13 · Saturday 31 October
**ENGINE served:** `en_helped` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~20s · capacity label “Energy” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Saturday 31 October
> Good afternoon.
> What has helped you recharge lately?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Energy
> 20 seconds
> 10 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “What has helped you recharge lately?” — options: [Rest or sleep] [Moving my body] [Being with someone] [Time alone] [Nothing has helped yet] [I don't know]  
   **SIMULATED answer:** “Moving my body”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: What has helped you recharge lately?
> Your selected response: Moving my body
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “11 days of practice this month. No need for consecutive days.” · “· A fact about practice: Energy: 2 reps completed. (2026-10-31)”

**EVAL:** “What has helped you recharge lately?” Five easy options (Rest or sleep, Moving my body, Being with someone, Time alone, Nothing has helped yet). Light and almost a pleasant list. Genuinely relatable, but the app gives nothing back that the person did not already know.

#### Day 14 · Sunday 1 November
**ENGINE served:** `en_drain` · frame `lens` bound to `work` · role `training` · intensity `medium` · sensitivity `low` · ~30s · capacity label “Energy” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Sunday 1 November
> Good afternoon.
> Did work take your energy today?
> [Begin]
> There is no answer to perform. You can leave any time.
> Energy
> 30 seconds
> [What is an Inner Rep?] → “A small exercise, not a test. Notice what is real, exercise a capacity, then take that noticing into your day. “I don’t know” is a real answer. You can disagree with the mirror.”

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Did work take your energy today?” — options: [Yes, a lot] [Somewhat] [Not today] [This isn't what's on my mind] [I don't know]  
   **SIMULATED answer:** “Somewhat”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Did work take your energy today?
> Your selected response: Somewhat
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

**UI — The Mirror tab after today, in full (`MirrorExperience.tsx`; statements are ENGINE/runtime `mirror-contract.ts` output):**
> The Mirror · no verdict on you
> A view with room around it.
> Practice, responses and possible readings. Each keeps its own source.
> A quiet Mirror does not need to be filled.
> Daily Inner Rep facts · not ability
> What has been exercised.
> 1 day of practice this month. No need for consecutive days.
> · A fact about practice: Direction: 1 rep completed. (2026-10-28)
> · A fact about practice: Energy: 2 reps completed. (2026-10-31)
> · A fact about practice: Focus: 1 rep completed. (2026-10-19)
> · A fact about practice: Growth: 2 reps completed. (2026-10-30)
> · A fact about practice: Relationships: 2 reps completed. (2026-10-29)
> These are completed reps, not levels of emotional fitness.
> Mirar’s side of the window
> There need not be a reading.
> No personal explanation is supplied to fill the space. Practice can be useful without a reflection.
> Your side of the window
> Room to leave something open.
> · What remains open: No completed training reps yet in: Action.
> Source material → [Read your selected responses] (collapsed; 8 statements) — The offered question stays with the selected response. Neither is a description of who you are.
> In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.

**EVAL:** Third work-themed lens in eight days (“Did work take your energy today?”). The Mirror now shows only a per-capacity tally. Because day 14 is 1 November, the “days of practice this month” counter resets to 1 even though the person has practised on 12 of 14 days — a real, if cosmetic, effect of the month-based counter. After two weeks there is still no reading and nothing practical the person could not have written themselves.

---

## The Avoider

*Finds serious questions uncomfortable and will not perform introspection. Tries it for a few days and drifts away.*  
**SIMULATED persona.** Engine user seed: `first14-avoider-1`. Other seeds change which exercises are served; the aggregate table in section 3 shows how typical this run is.

#### Day 1 · Monday 19 October
**ENGINE served:** `foc_attention` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Focus” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Monday 19 October
> Good afternoon.
> Think about the last two hours. Did anything take more attention than it deserved?
> [Begin]
> There is no answer to perform. You can leave any time.
> Focus
> 25 seconds
> [What is an Inner Rep?] → “A small exercise, not a test. Notice what is real, exercise a capacity, then take that noticing into your day. “I don’t know” is a real answer. You can disagree with the mirror.”

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Think about the last two hours. Did anything take more attention than it deserved?” — options: [My phone] [Work] [Another person] [Overthinking] [Nothing in particular] [I don't know]  
   **SIMULATED answer:** “I don’t know”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> Room for not knowing.
> The offered question: Think about the last two hours. Did anything take more attention than it deserved?
> Your selected response: I don’t know
> Your response to the offered question
> Not knowing is a complete answer. Nothing more is asked of you.

**UI — The Mirror tab after today, in full (`MirrorExperience.tsx`; statements are ENGINE/runtime `mirror-contract.ts` output):**
> The Mirror · no verdict on you
> A view with room around it.
> Practice, responses and possible readings. Each keeps its own source.
> A quiet Mirror does not need to be filled.
> Daily Inner Rep facts · not ability
> What has been exercised.
> 1 day of practice this month. No need for consecutive days.
> · A fact about practice: Focus: 1 rep completed. (2026-10-19)
> These are completed reps, not levels of emotional fitness.
> Mirar’s side of the window
> There need not be a reading.
> No personal explanation is supplied to fill the space. Practice can be useful without a reflection.
> Your side of the window
> Room to leave something open.
> · What remains open: You answered “I don’t know” 1 of 1 times. That is respected, and nothing is assumed from it.
> · What remains open: No completed training reps yet in: Direction, Energy, Relationships, Growth, Action.
> In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.

**EVAL:** Same opener as everyone (100% of seeds). The persona taps “I don’t know”, which ends the rep at once. The completion screen says “Room for not knowing. Not knowing is a complete answer. Nothing more is asked of you.” That is the product at its most gentle and fits this person. It is also the whole payoff: the person has given nothing and received a kind sentence.

#### Day 2 · Tuesday 20 October
**ENGINE served:** `rel_appreciation` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Relationships” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Tuesday 20 October
> Good afternoon.
> Is there someone you appreciated today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Relationships
> 25 seconds
> 1 day of practice this month

**SIMULATED:** reads the question and leaves without answering (“Back to Today”). The engine records the unfinished rep as skipped when the app is next opened.

**EVAL:** The engine serves a relationship question (“Is there someone you appreciated today?”). For this persona it feels like being asked about feelings; they read it and leave. The simulated leaving rule (serious-feeling reps are abandoned about two times in three) is an assumption about this persona, not engine behaviour.

#### Day 3 · Wednesday 21 October
**ENGINE served:** `rel_appreciation` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Relationships” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Wednesday 21 October
> Good afternoon.
> Is there someone you appreciated today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Relationships
> 25 seconds
> 1 day of practice this month

**SIMULATED:** reads the question and leaves without answering (“Back to Today”). The engine records the unfinished rep as skipped when the app is next opened.

**EVAL:** The unfinished rep from day 2 was recorded as skipped when the app was opened, and the engine serves the identical question again (in 73% of simulated Avoider seeds a question the person already left is served again, typically on day 3). A person who just avoided a question is asked it again: the strongest repetition risk in the first week. The persona leaves again.

#### Day 4 · Thursday 22 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened. The simulated person is disengaging; from here the pattern is gaps.

#### Day 5 · Friday 23 October
**ENGINE served:** `rel_appreciation` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Relationships” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Friday 23 October
> Good afternoon.
> Is there someone you appreciated today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Relationships
> 25 seconds
> 1 day of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is there someone you appreciated today?” — options: [Yes] [Not today] [I don't know]  
   **SIMULATED answer:** “Not today”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> You can leave it here.
> The offered question: Is there someone you appreciated today?
> Your selected response: Not today
> Your response to the offered question
> There is no need to turn this into another task.

*The Mirror tab after today, changes since the last time it was shown:* “2 days of practice this month. No need for consecutive days.” · “· A fact about practice: Relationships: 1 rep completed. (2026-10-23)” · “· What remains open: You answered “I don’t know” 1 of 2 times. That is respected, and nothing is assumed from it.” · “· What remains open: No completed training reps yet in: Direction, Energy, Growth, Action.” · “Source material → [Read your selected responses] (collapsed; 1 statement) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** The same appreciation question, third time offered. The persona answers “Not today”, a light absent option. Closing: “You can leave it here. There is no need to turn this into another task.” This is the engine behaving well: the easy exit is a first-class answer.

#### Day 6 · Saturday 24 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened.

#### Day 7 · Sunday 25 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened.

#### Day 8 · Monday 26 October
**ENGINE served:** `en_helped` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~20s · capacity label “Energy” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Monday 26 October
> Good afternoon.
> What has helped you recharge lately?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Energy
> 20 seconds
> 2 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “What has helped you recharge lately?” — options: [Rest or sleep] [Moving my body] [Being with someone] [Time alone] [Nothing has helped yet] [I don't know]  
   **SIMULATED answer:** “Being with someone”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: What has helped you recharge lately?
> Your selected response: Being with someone
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “3 days of practice this month. No need for consecutive days.” · “· A fact about practice: Energy: 1 rep completed. (2026-10-26)” · “· What remains open: You answered “I don’t know” 1 of 3 times. That is respected, and nothing is assumed from it.” · “· What remains open: No completed training reps yet in: Direction, Growth, Action.” · “Source material → [Read your selected responses] (collapsed; 2 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** A light, positive, topic-free question (“What has helped you recharge lately?”). The persona answers “Being with someone”. This is the kind of exercise that could retain this person, but it arrives on the third completed rep of a week-long drift. The Mirror now has a line about their one “I don’t know”.

#### Day 9 · Tuesday 27 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened. Final state: three completed reps, two abandoned reps, no reading, no chip or thread asks. After day 8 the simulated person does not return; the engine has nothing to say about that.

#### Day 10 · Wednesday 28 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened.

#### Day 11 · Thursday 29 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened.

#### Day 12 · Friday 30 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened.

#### Day 13 · Saturday 31 October
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened.

#### Day 14 · Sunday 1 November
**SIMULATED:** does not open the app today (has drifted away). Nothing is served, nothing is recorded; the engine simply carries on from the next day opened.
**EVAL:** Not opened. Nothing in the product reaches out (there are no reminders in this build), so the product is silent while the person is gone.

---

## The Reflective User

*Already interested in emotional awareness. Opens it every day and is willing to go deeper. Carries real work pressure and a conversation with a partner they have been putting off.*  
**SIMULATED persona.** Engine user seed: `first14-reflective-1`. Other seeds change which exercises are served; the aggregate table in section 3 shows how typical this run is.

#### Day 1 · Monday 19 October
**ENGINE served:** `foc_attention` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Focus” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Monday 19 October
> Good afternoon.
> Think about the last two hours. Did anything take more attention than it deserved?
> [Begin]
> There is no answer to perform. You can leave any time.
> Focus
> 25 seconds
> [What is an Inner Rep?] → “A small exercise, not a test. Notice what is real, exercise a capacity, then take that noticing into your day. “I don’t know” is a real answer. You can disagree with the mirror.”

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Think about the last two hours. Did anything take more attention than it deserved?” — options: [My phone] [Work] [Another person] [Overthinking] [Nothing in particular] [I don't know]  
   **SIMULATED answer:** “Work”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Think about the last two hours. Did anything take more attention than it deserved?
> Your selected response: Work
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

**UI — The Mirror tab after today, in full (`MirrorExperience.tsx`; statements are ENGINE/runtime `mirror-contract.ts` output):**
> The Mirror · no verdict on you
> A view with room around it.
> Practice, responses and possible readings. Each keeps its own source.
> A quiet Mirror does not need to be filled.
> Daily Inner Rep facts · not ability
> What has been exercised.
> 1 day of practice this month. No need for consecutive days.
> · A fact about practice: Focus: 1 rep completed. (2026-10-19)
> These are completed reps, not levels of emotional fitness.
> Mirar’s side of the window
> There need not be a reading.
> No personal explanation is supplied to fill the space. Practice can be useful without a reflection.
> Your side of the window
> Room to leave something open.
> · What remains open: No completed training reps yet in: Direction, Energy, Relationships, Growth, Action.
> Source material → [Read your selected responses] (collapsed; 1 statement) — The offered question stays with the selected response. Neither is a description of who you are.
> In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.

**EVAL:** Same opener for everyone. The persona answers “Work”. Light and fine for this person, but for someone ready to go deeper the one-tap-and-echo format may feel shallow already.

#### Day 2 · Tuesday 20 October
**ENGINE served:** `rel_appreciation` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Relationships” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Tuesday 20 October
> Good afternoon.
> Is there someone you appreciated today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Relationships
> 25 seconds
> 1 day of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is there someone you appreciated today?” — options: [Yes] [Not today] [I don't know]  
   **SIMULATED answer:** “Yes”
2. *words* — **ENGINE:** “A few words (optional)”  
   **SIMULATED answer:** (types a few words; never stored)
3. *domain_chips* — **ENGINE:** “What's this mostly connected to?” — options: [Work] [Partner] [Family] [Friends] [Myself] [Body or health] [Money] [Time] [Technology] [Something else]  
   **SIMULATED answer:** chip “Work”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Is there someone you appreciated today?
> Your selected response: Yes
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “2 days of practice this month. No need for consecutive days.” · “· A fact about practice: Relationships: 1 rep completed. (2026-10-20)” · “· What remains open: No completed training reps yet in: Direction, Energy, Growth, Action.” · “Source material → [Read your selected responses] (collapsed; 2 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** “Yes” leads to a typed-words box (“A few words (optional)”) and the ten-chip context question. The persona types a few words (never stored) and taps “Work”. This is the first place the product invites more depth, and the Reflective user is the one who benefits from it. Note the words are discarded, which is disclosed under the box (“Optional. Not saved in this version.”).

#### Day 3 · Wednesday 21 October
**ENGINE served:** `dir_time` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Direction” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Wednesday 21 October
> Good afternoon.
> Did today's time go to what matters to you?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Direction
> 25 seconds
> 2 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Did today's time go to what matters to you?” — options: [Mostly] [Partly] [Not really] [I don't know]  
   **SIMULATED answer:** “Not really”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Did today's time go to what matters to you?
> Your selected response: Not really
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “3 days of practice this month. No need for consecutive days.” · “· A fact about practice: Direction: 1 rep completed. (2026-10-21)” · “· What remains open: No completed training reps yet in: Energy, Growth, Action.” · “Source material → [Read your selected responses] (collapsed; 3 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** “Did today’s time go to what matters to you?” answered “Not really”. A real values question, still one tap, light on its face, and relevant to this persona. The engine records a burden-tagged answer; the completion screen only echoes it.

#### Day 4 · Thursday 22 October
**ENGINE served:** `en_pace` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~20s · capacity label “Energy” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Thursday 22 October
> Good afternoon.
> Which is closer to today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Energy
> 20 seconds
> 3 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Which is closer to today?” — options: [I pushed past what I had.] [I paced myself.] [I don't know]  
   **SIMULATED answer:** “I paced myself.”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Which is closer to today?
> Your selected response: I paced myself.
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “4 days of practice this month. No need for consecutive days.” · “· A fact about practice: Energy: 1 rep completed. (2026-10-22)” · “· What remains open: No completed training reps yet in: Growth, Action.” · “Source material → [Read your selected responses] (collapsed; 4 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** A neutral pacing statement pair (“I paced myself.”). Quick. After a values answer on day 3, there is no sign the app noticed.

#### Day 5 · Friday 23 October
**ENGINE served:** `probe_anchor` · frame `base` · role `probe` · intensity `light` · sensitivity `low` · ~20s · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Friday 23 October
> Good afternoon.
> What's most on your mind today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> 20 seconds
> 4 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “What's most on your mind today?” — options: [Work] [My partner] [Family] [Friends] [Money] [My body or health] [Myself] [Time] [Technology] [Something else] [Something significant happened] [Nothing in particular] [I don't know]  
   **SIMULATED answer:** “Work”
2. *yes_no* — **ENGINE:** “Want Mirar to check in on this now and then? You can stop any time.” — options: [Yes] [No]  
   **SIMULATED answer:** “Yes”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: What's most on your mind today?
> Your selected response: Work
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “5 days of practice this month. No need for consecutive days.” · “Source material → [Read your selected responses] (collapsed; 5 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** The “open question” arrives on the 5th rep (100% of seeds). The persona names Work and says Yes to “Want Mirar to check in on this now and then?” This is where the product begins to feel like a companion that remembers.

#### Day 6 · Saturday 24 October
**ENGINE served:** `act_friction` · frame `lens` bound to `work` · role `training` · intensity `medium` · sensitivity `low` · ~30s · capacity label “Action” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Saturday 24 October
> Good afternoon.
> Is work getting in the way of something you meant to do?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Action
> 30 seconds
> 5 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is work getting in the way of something you meant to do?” — options: [Yes, a lot] [Somewhat] [Not today] [This isn't what's on my mind] [I don't know]  
   **SIMULATED answer:** “Somewhat”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Is work getting in the way of something you meant to do?
> Your selected response: Somewhat
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “6 days of practice this month. No need for consecutive days.” · “Source material → [Read your selected responses] (collapsed; 6 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** A work lens (“Is work getting in the way of something you meant to do?”, “Somewhat”). The follow-through on the day-5 topic is visible and relevant to this persona.

#### Day 7 · Sunday 25 October
**ENGINE served:** `foc_attention` · frame `lens` bound to `work` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Focus” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Sunday 25 October
> Good afternoon.
> Did work pull at your attention today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Focus
> 25 seconds
> 6 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Did work pull at your attention today?” — options: [Yes, a lot] [Somewhat] [Not today] [This isn't what's on my mind] [I don't know]  
   **SIMULATED answer:** “Yes, a lot”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Did work pull at your attention today?
> Your selected response: Yes, a lot
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

**UI — The Mirror tab after today, in full (`MirrorExperience.tsx`; statements are ENGINE/runtime `mirror-contract.ts` output):**
> The Mirror · no verdict on you
> A view with room around it.
> Practice, responses and possible readings. Each keeps its own source.
> A quiet Mirror does not need to be filled.
> Daily Inner Rep facts · not ability
> What has been exercised.
> 7 days of practice this month. No need for consecutive days.
> · A fact about practice: Direction: 1 rep completed. (2026-10-21)
> · A fact about practice: Energy: 1 rep completed. (2026-10-22)
> · A fact about practice: Focus: 1 rep completed. (2026-10-19)
> · A fact about practice: Relationships: 1 rep completed. (2026-10-20)
> These are completed reps, not levels of emotional fitness.
> Mirar’s side of the window
> There need not be a reading.
> No personal explanation is supplied to fill the space. Practice can be useful without a reflection.
> Your side of the window
> Room to leave something open.
> · What remains open: No completed training reps yet in: Growth, Action.
> Source material → [Read your selected responses] (collapsed; 7 statements) — The offered question stays with the selected response. Neither is a description of who you are.
> In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.

**EVAL:** A second work lens on attention, “Yes, a lot”. For someone who accepted a check-in this feels like continuity, not fixation. Evidence is accumulating inside the engine but nothing is shown.

#### Day 8 · Monday 26 October
**ENGINE served:** `gro_update` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~30s · capacity label “Growth” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Monday 26 October
> Good afternoon.
> Has anything changed how you see a situation lately?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Growth
> 30 seconds
> 7 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Has anything changed how you see a situation lately?” — options: [Yes, clearly] [A little] [Nothing comes to mind] [I don't know]  
   **SIMULATED answer:** “Yes, clearly”
2. *domain_chips* — **ENGINE:** “What's this mostly connected to?” — options: [Work] [Partner] [Family] [Friends] [Myself] [Body or health] [Money] [Time] [Technology] [Something else]  
   **SIMULATED answer:** chip “Myself”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Has anything changed how you see a situation lately?
> Your selected response: Yes, clearly
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “8 days of practice this month. No need for consecutive days.” · “· A fact about practice: Growth: 1 rep completed. (2026-10-26)” · “· What remains open: No completed training reps yet in: Action.” · “Source material → [Read your selected responses] (collapsed; 8 statements) — The offered question stays with the selected response. Neither is a description of who you are.”

**EVAL:** A “situation changed” question with a domain chip for a clearly answered “Yes, clearly” (the persona taps “Myself”). Richest day so far in what the persona gives, still without any reflection back.

#### Day 9 · Tuesday 27 October
**ENGINE served:** `presence` · frame `base` · role `presence` · intensity `light` · sensitivity `low` · ~10s · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Tuesday 27 October
> Good afternoon.
> Does anything need your attention today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> 10 seconds
> 8 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Does anything need your attention today?” — options: [Nothing right now] [Something does] [I don't know]  
   **SIMULATED answer:** “Something does”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Does anything need your attention today?
> Your selected response: Something does
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “9 days of practice this month. No need for consecutive days.” · “· A fact about practice: Direction: 2 reps completed. (2026-10-27)”

**EVAL:** “Does anything need your attention today?” with only two options (Nothing right now / Something does). The persona answers “Something does”, and receives only the neutral echo. The most open-ended ask arrives with the smallest response: a missed moment.

#### Day 10 · Wednesday 28 October
**ENGINE served:** `en_helped` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~20s · capacity label “Energy” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Wednesday 28 October
> Good afternoon.
> What has helped you recharge lately?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Energy
> 20 seconds
> 9 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “What has helped you recharge lately?” — options: [Rest or sleep] [Moving my body] [Being with someone] [Time alone] [Nothing has helped yet] [I don't know]  
   **SIMULATED answer:** “Rest or sleep”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: What has helped you recharge lately?
> Your selected response: Rest or sleep
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “10 days of practice this month. No need for consecutive days.” · “· A fact about practice: Energy: 2 reps completed. (2026-10-28)”

**EVAL:** A light recharge question after several heavier days: a good rhythm for this persona.

#### Day 11 · Thursday 29 October
**ENGINE served:** `dir_know_act` · frame `base` · role `training` · intensity `medium` · sensitivity `low` · ~25s · capacity label “Direction” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Thursday 29 October
> Good afternoon.
> Which is closer to today?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Direction
> 25 seconds
> 10 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Which is closer to today?” — options: [I need more clarity.] [I already know. I just haven't acted.] [I don't know]  
   **SIMULATED answer:** “I already know. I just haven't acted.”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Which is closer to today?
> Your selected response: I already know. I just haven't acted.
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “11 days of practice this month. No need for consecutive days.” · “· A fact about practice: Direction: 3 reps completed. (2026-10-29)”

**EVAL:** “I already know. I just haven’t acted.” (versus “I need more clarity.”). Medium-intensity, direct and relevant. No next step is offered beyond the echo.

#### Day 12 · Friday 30 October
**ENGINE served:** `cont_thread` · frame `thread_check` bound to `work` · role `continuity` · intensity `light` · sensitivity `low` · ~15s · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Friday 30 October
> Good afternoon.
> Is work still weighing on you?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> 15 seconds
> 11 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is work still weighing on you?” — options: [Yes, a lot] [Somewhat] [Not today] [This isn't what's on my mind] [I don't know]  
   **SIMULATED answer:** “Yes, a lot”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Is work still weighing on you?
> Your selected response: Yes, a lot
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “12 days of practice this month. No need for consecutive days.”

**EVAL:** The check-in the persona accepted on day 5 finally appears (“Is work still weighing on you?”, “Yes, a lot”). This is the first time the product visibly keeps a promise, seven days after it was made. It is the strongest continuity moment in this journey.

#### Day 13 · Saturday 31 October
**ENGINE served:** `dir_time` · frame `lens` bound to `work` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Direction” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Saturday 31 October
> Good afternoon.
> Did work pull you away from what matters to you?
> Room for today. No need to catch up.
> [Begin]
> There is no answer to perform. You can leave any time.
> Direction
> 25 seconds
> 12 days of practice this month

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Did work pull you away from what matters to you?” — options: [Yes, a lot] [Somewhat] [Not today] [This isn't what's on my mind] [I don't know]  
   **SIMULATED answer:** “Yes, a lot”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> This session, in view.
> The offered question: Did work pull you away from what matters to you?
> Your selected response: Yes, a lot
> Your response to the offered question
> The offered question and selected response stay together. No further conclusion is added.

*The Mirror tab after today, changes since the last time it was shown:* “13 days of practice this month. No need for consecutive days.”

**EVAL:** A third work lens (“Did work pull you away from what matters to you?”, “Yes, a lot”). For this persona it is on-topic; it also means seven of the fourteen reps involve work (as the topic asked about, or as the person’s own answer). The engine now holds several independent observations about work but none of them has produced a reading in 14 days.

#### Day 14 · Sunday 1 November
**ENGINE served:** `rel_connect` · frame `base` · role `training` · intensity `light` · sensitivity `low` · ~25s · capacity label “Relationships” · source `lib/innerRep/v2/templates.ts`

**UI — Today screen (phone width), `DailyExperience.tsx`:**
> Sunday 1 November
> Good afternoon.
> Is there someone you've been meaning to reach out to?
> [Begin]
> There is no answer to perform. You can leave any time.
> Relationships
> 25 seconds
> [What is an Inner Rep?] → “A small exercise, not a test. Notice what is real, exercise a capacity, then take that noticing into your day. “I don’t know” is a real answer. You can disagree with the mirror.”

**ENGINE steps shown, with SIMULATED answers:**
1. *choice* — **ENGINE:** “Is there someone you've been meaning to reach out to?” — options: [My partner] [Family] [A friend] [No one right now] [I don't know]  
   **SIMULATED answer:** “Family”
2. *timeframe* — **ENGINE:** “When would you like to do it?” — options: [Today] [Tomorrow] [This week] [Pick a date] [No deadline]  
   **SIMULATED answer:** “Tomorrow”

**UI — completion screen (`IntegrationMoment.tsx`, built from the runtime receipt):**
> Done for today.
> Take it into life
> Something you chose to carry.
> The offered question: Is there someone you've been meaning to reach out to?
> Your selected response: Family
> Your response to the offered question
> Your chosen intention: Reach out to your family
> Tomorrow
> The intention is yours. Its outcome is yours to name.

**UI — The Mirror tab after today, in full (`MirrorExperience.tsx`; statements are ENGINE/runtime `mirror-contract.ts` output):**
> The Mirror · no verdict on you
> A view with room around it.
> Practice, responses and possible readings. Each keeps its own source.
> A quiet Mirror does not need to be filled.
> Daily Inner Rep facts · not ability
> What has been exercised.
> 1 day of practice this month. No need for consecutive days.
> · A fact about practice: Direction: 3 reps completed. (2026-10-29)
> · A fact about practice: Energy: 2 reps completed. (2026-10-28)
> · A fact about practice: Focus: 1 rep completed. (2026-10-19)
> · A fact about practice: Growth: 1 rep completed. (2026-10-26)
> · A fact about practice: Relationships: 2 reps completed. (2026-11-01)
> These are completed reps, not levels of emotional fitness.
> A chosen intention
> Only what was genuinely chosen.
> · Your selected response: You chose to carry: Reach out to your family (around 2026-11-02). (2026-11-01)
> An intention is not an outcome. A supplied follow-up lets you name what happened.
> Mirar’s side of the window
> There need not be a reading.
> No personal explanation is supplied to fill the space. Practice can be useful without a reflection.
> Your side of the window
> Room to leave something open.
> · What remains open: No completed training reps yet in: Action.
> Source material → [Read your selected responses] (collapsed; 8 statements) — The offered question stays with the selected response. Neither is a description of who you are.
> In this beta, practice stays on this device. It is not synced. Signing out clears it. Optional words are not saved.

**EVAL:** “Is there someone you’ve been meaning to reach out to?” → Family → “When would you like to do it?” → Tomorrow. The completion screen shows “Something you chose to carry.” and the Mirror gains “A chosen intention”. This is the one place where a Reflective user gets something tangible and forward-looking. The follow-up on it arrives after the 14-day window. Even so, a person who engaged on all fourteen days and kept naming work has received no Honest Mirror reading yet.
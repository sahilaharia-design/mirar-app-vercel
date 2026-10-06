import { Capacity, Domain, Option, Template } from './types';

// ─── The 23 MVP templates ─────────────────────────────────────────────────────
// Capacity · sub-capacity · mechanism are fixed per template. Domain and
// orientation are NOT authored into prompts; they come from the options chosen,
// chips the user taps, or the binding at serve time (the `lens` frame).
// Every choice rep gets "I don't know" from the UI; it is not listed here.
const o = (id: string, label: string, x: Partial<Option> = {}): Option => ({ id, label, ...x });
const nothing = (label: string, id = 'nothing'): Option => o(id, label, { polarity: 'absent', kind: 'nothing' });

const base = { version: 1 as const, role: 'training' as const, intensity: 'light' as const, sensitivity: 'low' as const, positiveCompatible: true, domainRole: 'none' as const, capture: { domain: 'never' as const, orientation: 'never' as const }, seconds: 30 };

export const TEMPLATES: Template[] = [
  // ── Focus ──
  { ...base, id: 'foc_attention', capacity: 'focus', sub_capacity: 'attention_drain', mechanism: 'recognition', interaction: 'choice', domainRole: 'issue', hasLens: true, seconds: 25, tags: ['attention'],
    capture: { domain: 'if_burden', orientation: 'never' },
    prompt: 'Think about the last two hours. Did anything take more attention than it deserved?',
    options: [o('phone', 'My phone', { domain: 'technology' }), o('work', 'Work', { domain: 'work' }), o('person', 'Another person', { burden: true }), o('overthinking', 'Overthinking', { domain: 'self', burden: true }), nothing('Nothing in particular')] },
  { ...base, id: 'foc_loops', capacity: 'focus', sub_capacity: 'unfinished_loops', mechanism: 'inventory', interaction: 'choice', intensity: 'light', domainRole: 'issue', seconds: 20, tags: ['clutter'],
    capture: { domain: 'if_burden', orientation: 'never' },
    prompt: 'How many unfinished things are running in the background of your head right now?',
    options: [nothing('Basically none', 'none'), o('few', 'One or two'), o('several', 'Several', { burden: true }), o('many', 'Too many to count', { burden: true })] },
  { ...base, id: 'foc_settle', capacity: 'focus', sub_capacity: 'settling_vs_switching', mechanism: 'contrast', interaction: 'compare', seconds: 20, tags: ['attention'],
    prompt: 'Which is closer to today?',
    options: [o('settled', 'I could settle into one thing.', { stance: { key: 'focus_state', side: 'settled' } }), o('switching', 'I kept switching between things.', { burden: true, stance: { key: 'focus_state', side: 'switching' } })] },
  // ── Energy ──
  { ...base, id: 'en_drain', capacity: 'energy', sub_capacity: 'depletion', mechanism: 'recognition', interaction: 'choice', domainRole: 'issue', hasLens: true, intensity: 'medium', seconds: 30, tags: ['energy'],
    capture: { domain: 'never', orientation: 'never' },
    prompt: 'What took the most out of you today, if anything?',
    options: [o('work', 'Work', { domain: 'work', burden: true }), o('partner', 'My partner', { domain: 'partner', burden: true }), o('family', 'Family', { domain: 'family', burden: true }), o('friends', 'Friends', { domain: 'friends', burden: true }), o('money', 'Money', { domain: 'money', burden: true }), o('body', 'My body', { domain: 'body_health', burden: true }), o('thoughts', 'My own thoughts', { domain: 'self', burden: true }), nothing('Nothing — I feel fine')] },
  { ...base, id: 'en_helped', capacity: 'energy', sub_capacity: 'recovery', mechanism: 'inventory', interaction: 'choice', domainRole: 'resource', seconds: 20, tags: ['positive'],
    prompt: 'What has helped you recharge lately?',
    options: [o('rest', 'Rest or sleep', { domain: 'rest' }), o('movement', 'Moving my body', { domain: 'body_health' }), o('someone', 'Being with someone', { domain: 'friends' }), o('alone', 'Time alone', { domain: 'self' }), o('nothing_yet', 'Nothing has helped yet', { burden: true })] },
  { ...base, id: 'en_pace', capacity: 'energy', sub_capacity: 'pacing', mechanism: 'contrast', interaction: 'compare', seconds: 20, tags: ['pacing'],
    prompt: 'Which is closer to today?',
    options: [o('pushing', 'I pushed past what I had.', { burden: true, stance: { key: 'pace', side: 'pushing' } }), o('pacing', 'I paced myself.', { stance: { key: 'pace', side: 'pacing' } })] },
  // ── Relationships ──
  { ...base, id: 'rel_boundary', capacity: 'relationships', sub_capacity: 'boundaries', mechanism: 'attribution', interaction: 'choice', domainRole: 'issue', hasLens: true, intensity: 'medium', sensitivity: 'medium', seconds: 35, tags: ['mood'],
    capture: { domain: 'never', orientation: 'never' },
    prompt: 'Is someone else\'s mood affecting yours today?',
    options: [o('partner', 'My partner', { domain: 'partner', burden: true }), o('family', 'Family', { domain: 'family', burden: true }), o('friends', 'A friend', { domain: 'friends', burden: true }), o('work', 'Someone at work', { domain: 'work', burden: true }), nothing('No one', 'nobody')],
    followUp: { prompt: 'How much of the mood is yours?', options: [o('mine', 'Mostly mine'), o('partly', 'Partly'), o('theirs', 'Mostly theirs', { burden: true })] } },
  { ...base, id: 'rel_appreciation', capacity: 'relationships', sub_capacity: 'appreciation', mechanism: 'appreciation', interaction: 'words', domainRole: 'resource', seconds: 25, tags: ['positive'],
    capture: { domain: 'if_present', orientation: 'never' },
    prompt: 'Is there someone you appreciated today?',
    words: { prompt: 'A few words (optional)', maxChars: 80 },
    options: [o('yes', 'Yes', { polarity: 'present' }), nothing('Not today')] },
  { ...base, id: 'rel_connect', capacity: 'relationships', sub_capacity: 'connection', mechanism: 'acknowledgment', interaction: 'acknowledge', domainRole: 'issue', seconds: 25, tags: ['connection'],
    prompt: 'Is there someone you\'ve been meaning to reach out to?',
    options: [o('partner', 'My partner', { domain: 'partner', creates: 'commitment', commitKind: 'reach_out' }), o('family', 'Family', { domain: 'family', creates: 'commitment', commitKind: 'reach_out' }), o('friends', 'A friend', { domain: 'friends', creates: 'commitment', commitKind: 'reach_out' }), nothing('No one right now', 'no_one')] },
  // ── Growth ──
  { ...base, id: 'gro_update', capacity: 'growth', sub_capacity: 'updating_beliefs', mechanism: 'reappraisal', interaction: 'choice', domainRole: 'issue', hasLens: true, seconds: 30, tags: ['belief'],
    capture: { domain: 'if_present', orientation: 'never' },
    prompt: 'Has anything changed how you see a situation lately?',
    options: [o('clearly', 'Yes, clearly', { polarity: 'present' }), o('little', 'A little', { polarity: 'present' }), nothing('Nothing comes to mind', 'none')] },
  { ...base, id: 'gro_mistake', capacity: 'growth', sub_capacity: 'facing_mistakes', mechanism: 'contrast', interaction: 'compare', intensity: 'medium', sensitivity: 'medium', seconds: 25, tags: ['mistake'],
    prompt: 'Which is closer to today?',
    options: [o('avoid', "There's something I got wrong that I'd rather not look at.", { burden: true, stance: { key: 'mistake', side: 'avoid' } }), o('face', 'I can look at what I got wrong without flinching.', { stance: { key: 'mistake', side: 'face' } })] },
  { ...base, id: 'gro_noticed', capacity: 'growth', sub_capacity: 'noticing', mechanism: 'recognition', interaction: 'choice', seconds: 20, tags: ['positive'],
    prompt: 'Did you notice or learn something today?',
    options: [o('small', 'Something small'), o('big', 'Something that mattered'), nothing('Not today')] },
  // ── Direction ──
  { ...base, id: 'dir_know_act', capacity: 'direction', sub_capacity: 'clarity_vs_action', mechanism: 'contrast', interaction: 'compare', intensity: 'medium', seconds: 25, tags: ['direction'],
    prompt: 'Which is closer to today?',
    options: [o('need_clarity', 'I need more clarity.', { stance: { key: 'direction', side: 'need_clarity' } }), o('already_know', "I already know. I just haven't acted.", { stance: { key: 'direction', side: 'already_know' } })] },
  { ...base, id: 'dir_fits', capacity: 'direction', sub_capacity: 'what_still_fits', mechanism: 'recognition', interaction: 'choice', domainRole: 'issue', seconds: 25, tags: ['direction'],
    capture: { domain: 'if_burden', orientation: 'never' },
    prompt: 'Does the direction you\'re heading still fit?',
    // durable stance: a statement about direction, not a daily state — the only kind a contradiction check may use
    options: [o('yes', 'Yes, it fits', { stance: { key: 'fit', side: 'fits', durable: true } }), o('mostly', 'Mostly', { stance: { key: 'fit', side: 'fits', durable: true } }), o('not_really', 'Not really', { burden: true, stance: { key: 'fit', side: 'outgrown', durable: true } }), o('outgrown', "I've outgrown it", { burden: true, stance: { key: 'fit', side: 'outgrown', durable: true } })] },
  { ...base, id: 'dir_time', capacity: 'direction', sub_capacity: 'time_vs_values', mechanism: 'attribution', interaction: 'choice', domainRole: 'issue', hasLens: true, seconds: 25, tags: ['values'],
    capture: { domain: 'if_burden', orientation: 'never' },
    prompt: 'Did today\'s time go to what matters to you?',
    options: [o('mostly', 'Mostly'), o('partly', 'Partly'), o('not_really', 'Not really', { burden: true })] },
  // ── Action ──
  { ...base, id: 'act_tiny', capacity: 'action', sub_capacity: 'intentional_choice', mechanism: 'micro_commit', interaction: 'choice', seconds: 25, tags: ['action'],
    prompt: 'Pick one small thing for the next day, or choose none.',
    options: [o('reply', 'Reply to one message', { creates: 'commitment', commitKind: 'reach_out' }), o('outside', 'Five minutes outside', { creates: 'commitment', commitKind: 'start' }), o('start', 'Start something for two minutes', { creates: 'commitment', commitKind: 'start' }), nothing('Nothing — I am resting, on purpose', 'rest_on_purpose')] },
  { ...base, id: 'act_credit', capacity: 'action', sub_capacity: 'agency', mechanism: 'appreciation', interaction: 'choice', seconds: 20, tags: ['positive'],
    prompt: 'Did you do something today you can give yourself credit for?',
    options: [o('yes', 'Yes'), o('maybe', 'Maybe'), nothing('Not today', 'no')],
    followUp: { prompt: 'What was it about?', options: [o('showed_up', 'I showed up'), o('asked_help', 'I asked for help'), o('let_go', 'I let something go'), o('kept_going', 'I kept going')] } },
  { ...base, id: 'act_friction', capacity: 'action', sub_capacity: 'starting_friction', mechanism: 'recognition', interaction: 'choice', domainRole: 'issue', hasLens: true, intensity: 'medium', seconds: 30, tags: ['action'],
    capture: { domain: 'if_burden', orientation: 'never' },
    prompt: "What's the hardest part of starting something right now?",
    options: [o('time', 'Finding the time', { domain: 'time', burden: true }), o('energy', 'Having the energy', { domain: 'body_health', burden: true }), o('worry', 'Something about it worries me', { burden: true }), o('unclear', "I'm not sure how to start", { burden: true }), nothing("Starting isn't the problem", 'not_a_problem')] },
  // ── Continuity (served only because something is open) ──
  { ...base, id: 'cont_commitment', role: 'continuity', capacity: 'action', sub_capacity: 'follow_through', mechanism: 'commitment_check', interaction: 'check', positiveCompatible: true, seconds: 15, tags: ['commitment'],
    prompt: 'You mentioned you might do something. How is that going?',
    options: [o('done', 'Done'), o('partly', 'Partly'), o('not_yet', 'Not yet, later'), o('changed_mind', "I've changed my mind"), o('dropped', "I've decided not to")] },
  { ...base, id: 'cont_thread', role: 'continuity', capacity: 'direction', sub_capacity: 'open_thread', mechanism: 'thread_check', interaction: 'check', seconds: 15, tags: ['thread'],
    prompt: 'Is this still weighing on you?',
    options: [o('a_lot', 'Yes, a lot', { polarity: 'present', burden: true }), o('somewhat', 'Somewhat', { polarity: 'present' }), o('not_today', 'Not today', { polarity: 'absent', kind: 'nothing' }), o('not_this', "This isn't what's on my mind", { polarity: 'absent', kind: 'not_this' })] },
  { ...base, id: 'cont_event', role: 'continuity', capacity: 'direction', sub_capacity: 'significant_event', mechanism: 'event_check', interaction: 'check', seconds: 15, tags: ['event'],
    prompt: 'How is that sitting with you now?',
    options: [o('heavier', 'Heavier', { polarity: 'present', burden: true }), o('same', 'About the same', { polarity: 'present' }), o('lighter', 'Lighter', { polarity: 'present' }), o('settled', 'Settled', { polarity: 'absent', kind: 'nothing' })] },
  // ── Calibration + presence ──
  { ...base, id: 'probe_anchor', role: 'probe', capacity: 'direction', sub_capacity: 'open_probe', mechanism: 'probe', interaction: 'probe', domainRole: 'issue', seconds: 20, tags: ['probe'],
    capture: { domain: 'never', orientation: 'never' },
    prompt: "What's most on your mind today?",
    promptVariants: ["What's most on your mind today?", "What's taking up the most room in your head today?", 'If you named one thing on your mind right now, what would it be?'],
    options: [o('work', 'Work', { domain: 'work' }), o('partner', 'My partner', { domain: 'partner' }), o('family', 'Family', { domain: 'family' }), o('friends', 'Friends', { domain: 'friends' }), o('money', 'Money', { domain: 'money' }), o('body', 'My body or health', { domain: 'body_health' }), o('self', 'Myself', { domain: 'self' }), o('time', 'Time', { domain: 'time' }), o('technology', 'Technology', { domain: 'technology' }), o('other', 'Something else', { domain: 'other' }), o('event', 'Something significant happened', { flagEvent: true, domain: 'unknown' }), nothing('Nothing in particular')] },
  { ...base, id: 'presence', role: 'presence', capacity: 'direction', sub_capacity: 'ease', mechanism: 'acknowledgment', interaction: 'acknowledge', domainRole: 'issue', seconds: 10, tags: ['presence'],
    capture: { domain: 'if_present', orientation: 'never' },
    prompt: 'Does anything need your attention today?',
    options: [nothing('Nothing right now'), o('something', 'Something does', { polarity: 'present', burden: true })] },
];

export const TEMPLATE_BY_ID: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

// ─── Lens frames: one per capacity, hosted by the template with hasLens ───────
// A lens asks whether a *given domain* touches this capacity today. It is the
// honest test: "not today" / "this isn't what's on my mind" are first-class.
export const LENS_HOST: Record<Capacity, string> = {
  focus: 'foc_attention', energy: 'en_drain', relationships: 'rel_boundary', growth: 'gro_update', direction: 'dir_time', action: 'act_friction',
};
export const DOMAIN_PHRASE: Record<Domain, string> = {
  work: 'work', partner: 'your partner', family: 'your family', friends: 'your friends', self: 'your own thoughts',
  body_health: 'your body', money: 'money', time: 'time pressure', technology: 'your phone and screens', rest: 'rest', other: 'that', unknown: 'that',
};
export const LENS_PROMPT: Record<Capacity, (d: string) => string> = {
  focus: (d) => `Did ${d} pull at your attention today?`,
  energy: (d) => `Did ${d} take your energy today?`,
  relationships: (d) => `Did ${d} come up in how you were with people today?`,
  growth: (d) => `Is ${d} changing how you see something?`,
  direction: (d) => `Did ${d} pull you away from what matters to you?`,
  action: (d) => `Is ${d} getting in the way of something you meant to do?`,
};
export const LENS_OPTIONS = (domain: Domain): Option[] => [
  { id: 'a_lot', label: 'Yes, a lot', domain, polarity: 'present', burden: true },
  { id: 'somewhat', label: 'Somewhat', domain, polarity: 'present' },
  { id: 'not_today', label: 'Not today', domain, polarity: 'absent', kind: 'nothing' },
  { id: 'not_this', label: "This isn't what's on my mind", domain, polarity: 'absent', kind: 'not_this' },
];
// Natural fit between a domain and a capacity (which lens to try first). Only
// a preference: every capacity is eligible over time.
export const AFFINITY: Record<Domain, Capacity[]> = {
  work: ['action', 'focus', 'energy', 'direction', 'growth', 'relationships'],
  partner: ['relationships', 'energy', 'direction', 'focus', 'growth', 'action'],
  family: ['relationships', 'energy', 'direction', 'growth', 'focus', 'action'],
  friends: ['relationships', 'energy', 'growth', 'direction', 'focus', 'action'],
  self: ['growth', 'direction', 'focus', 'energy', 'action', 'relationships'],
  body_health: ['energy', 'action', 'focus', 'direction', 'growth', 'relationships'],
  money: ['direction', 'action', 'focus', 'energy', 'growth', 'relationships'],
  time: ['action', 'focus', 'direction', 'energy', 'growth', 'relationships'],
  technology: ['focus', 'energy', 'action', 'direction', 'growth', 'relationships'],
  rest: ['energy', 'focus', 'action', 'direction', 'growth', 'relationships'],
  other: ['direction', 'growth', 'focus', 'energy', 'action', 'relationships'],
  unknown: ['direction', 'growth', 'focus', 'energy', 'action', 'relationships'],
};

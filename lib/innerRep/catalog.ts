import { Exercise } from './types';

// ─── Exercise catalog (v1, 14 reps) ───────────────────────────────────────────
// Content lives in code on purpose: reviewable in git, no SQL step to ship or
// change a rep. Every choice rep gets an automatic "I don't know" in the UI —
// it is a legitimate answer, so it is not listed per exercise.
// Mix is deliberately not problem-hunting: several reps are positive/neutral
// and one is explicitly "nothing needs attention today".
const base = {
  requires_history: false,
  minimum_history: 0,
  repetition_window: 6,
  follow_up_possible: false,
  bias_risk: 'low' as const,
  sensitivity: 'low' as const,
  positive_state_compatible: true,
  action_oriented: false,
  reflection_oriented: true,
};

export const CATALOG: Exercise[] = [
  // ── Focus ──────────────────────────────────────────────────────────────────
  {
    ...base, id: 'foc_attention', capacity: 'focus', sub_capacity: 'attention_drain',
    mechanism: 'recognition', interaction_type: 'choice_then_reflection', intensity: 'light',
    follow_up_possible: true, follow_up_type: 'choice', estimated_duration: 40,
    tags: ['attention', 'recent_past'],
    prompt: 'Think about the last two hours. What took more attention than it deserved?',
    options: [
      { id: 'phone', label: 'My phone', key: 'attention_sink', tag: 'phone' },
      { id: 'work', label: 'Work', key: 'attention_sink', tag: 'work' },
      { id: 'person', label: 'Another person', key: 'attention_sink', tag: 'person' },
      { id: 'overthinking', label: 'Overthinking', key: 'attention_sink', tag: 'overthinking' },
      { id: 'nothing', label: 'Nothing in particular', key: 'attention_sink', tag: 'nothing' },
    ],
    follow_up: {
      prompt: 'What were you hoping to get from it?',
      options: [
        { id: 'relief', label: 'Relief' },
        { id: 'information', label: 'Information' },
        { id: 'connection', label: 'Connection' },
        { id: 'avoiding', label: 'A way to avoid something' },
        { id: 'nothing', label: 'Nothing, really' },
      ],
    },
  },
  {
    ...base, id: 'foc_loops', capacity: 'focus', sub_capacity: 'unfinished_loops',
    mechanism: 'inventory', interaction_type: 'choice', intensity: 'light', estimated_duration: 20,
    tags: ['mental_clutter'],
    prompt: 'How many unfinished things are running in the background of your head right now?',
    options: [
      { id: 'none', label: 'Basically none', key: 'open_loops', tag: 'none' },
      { id: 'few', label: 'One or two', key: 'open_loops', tag: 'few' },
      { id: 'several', label: 'Several', key: 'open_loops', tag: 'several', burden: true },
      { id: 'many', label: 'Too many to count', key: 'open_loops', tag: 'many', burden: true },
    ],
  },
  // ── Energy ─────────────────────────────────────────────────────────────────
  {
    ...base, id: 'en_drain_restore', capacity: 'energy', sub_capacity: 'depletion_restoration',
    mechanism: 'recognition', interaction_type: 'choice_then_reflection', intensity: 'light',
    follow_up_possible: true, follow_up_type: 'choice', estimated_duration: 40,
    tags: ['depletion', 'restoration'],
    prompt: 'What took the most out of you today?',
    options: [
      { id: 'work', label: 'Work', key: 'drain_source', tag: 'work', burden: true },
      { id: 'people', label: 'People', key: 'drain_source', tag: 'people', burden: true },
      { id: 'thoughts', label: 'My own thoughts', key: 'drain_source', tag: 'thoughts', burden: true },
      { id: 'body', label: 'My body', key: 'drain_source', tag: 'body', burden: true },
      { id: 'nothing', label: 'Nothing — I feel fine', key: 'drain_source', tag: 'nothing' },
    ],
    follow_up: {
      prompt: 'Did anything today give some energy back?',
      options: [
        { id: 'yes', label: 'Yes, something did', key: 'restored', tag: 'yes' },
        { id: 'little', label: 'A little', key: 'restored', tag: 'little' },
        { id: 'no', label: 'Not really', key: 'restored', tag: 'no', burden: true },
      ],
    },
  },
  {
    ...base, id: 'en_reset', capacity: 'energy', sub_capacity: 'recovery',
    mechanism: 'recall', interaction_type: 'choice', intensity: 'light', estimated_duration: 20,
    tags: ['recovery', 'restoration'],
    prompt: 'What helped you reset the last time you felt worn down?',
    options: [
      { id: 'rest', label: 'Rest or sleep', key: 'reset_helper', tag: 'rest' },
      { id: 'movement', label: 'Moving my body', key: 'reset_helper', tag: 'movement' },
      { id: 'someone', label: 'Being with someone', key: 'reset_helper', tag: 'someone' },
      { id: 'alone', label: 'Time alone', key: 'reset_helper', tag: 'alone' },
      { id: 'nothing', label: 'Nothing has helped yet', key: 'reset_helper', tag: 'nothing', burden: true },
    ],
  },
  // ── Relationships ──────────────────────────────────────────────────────────
  {
    ...base, id: 'rel_boundary', capacity: 'relationships', sub_capacity: 'boundaries',
    mechanism: 'recognition', interaction_type: 'choice_then_reflection', intensity: 'medium',
    sensitivity: 'medium', follow_up_possible: true, follow_up_type: 'choice', estimated_duration: 45,
    tags: ['boundaries', 'emotional_spillover'],
    prompt: 'Whose mood affected yours most today?',
    options: [
      { id: 'close', label: 'Someone close to me', key: 'mood_source', tag: 'close' },
      { id: 'work', label: 'Someone at work', key: 'mood_source', tag: 'work' },
      { id: 'online', label: 'Someone online', key: 'mood_source', tag: 'online' },
      { id: 'nobody', label: 'Nobody', key: 'mood_source', tag: 'nobody' },
    ],
    follow_up: {
      prompt: 'Was it yours to carry?',
      options: [
        { id: 'yes', label: 'Yes', key: 'was_mine', tag: 'yes' },
        { id: 'partly', label: 'Partly', key: 'was_mine', tag: 'partly' },
        { id: 'probably_not', label: 'Probably not', key: 'was_mine', tag: 'probably_not', burden: true },
      ],
    },
  },
  {
    ...base, id: 'rel_appreciation', capacity: 'relationships', sub_capacity: 'appreciation',
    mechanism: 'recall', interaction_type: 'words', intensity: 'light', words_max: 5,
    estimated_duration: 30, tags: ['appreciation', 'connection', 'positive'],
    prompt: 'Who made your day a little easier recently? Name them — five words or fewer.',
    closing: 'Noted. That is worth knowing about your own life.',
  },
  // ── Growth ─────────────────────────────────────────────────────────────────
  {
    ...base, id: 'gro_update', capacity: 'growth', sub_capacity: 'updating_beliefs',
    mechanism: 'comparison_over_time', interaction_type: 'choice', intensity: 'medium',
    estimated_duration: 25, tags: ['belief_update', 'identity_evolution'],
    prompt: 'Is there something you believed a year ago that you see differently now?',
    options: [
      { id: 'clearly', label: 'Yes, clearly', key: 'belief_shift', tag: 'clearly' },
      { id: 'little', label: 'A little', key: 'belief_shift', tag: 'little' },
      { id: 'none', label: 'Nothing comes to mind', key: 'belief_shift', tag: 'none' },
    ],
  },
  {
    ...base, id: 'gro_mistake', capacity: 'growth', sub_capacity: 'facing_mistakes',
    mechanism: 'self_narrative', interaction_type: 'compare', intensity: 'medium',
    sensitivity: 'medium', bias_risk: 'medium', estimated_duration: 25,
    tags: ['mistakes', 'tolerating_discomfort'],
    prompt: 'Which feels closer to true today?',
    statements: [
      { id: 'avoid', label: "There's something I got wrong that I'd rather not look at.", key: 'mistake_stance', tag: 'avoid' },
      { id: 'face', label: 'I can look at what I got wrong without flinching.', key: 'mistake_stance', tag: 'face' },
    ],
  },
  // ── Direction ──────────────────────────────────────────────────────────────
  {
    ...base, id: 'dir_know_vs_act', capacity: 'direction', sub_capacity: 'clarity_vs_action',
    mechanism: 'self_narrative', interaction_type: 'compare', intensity: 'medium',
    bias_risk: 'medium', estimated_duration: 25, tags: ['clarity', 'avoidance'],
    prompt: 'Which statement feels more true today?',
    statements: [
      { id: 'need_clarity', label: 'I need more clarity.', key: 'direction_stance', tag: 'need_clarity' },
      { id: 'already_know', label: "I already know. I just haven't acted.", key: 'direction_stance', tag: 'already_know' },
    ],
  },
  {
    ...base, id: 'dir_still_fits', capacity: 'direction', sub_capacity: 'what_still_fits',
    mechanism: 'inventory', interaction_type: 'choice', intensity: 'light', estimated_duration: 25,
    tags: ['values', 'fit'],
    prompt: 'Think of one thing you spend time on most weeks. Does it still fit you?',
    options: [
      { id: 'yes', label: 'Yes, it fits', key: 'still_fits', tag: 'yes' },
      { id: 'mostly', label: 'Mostly', key: 'still_fits', tag: 'mostly' },
      { id: 'not_really', label: 'Not really', key: 'still_fits', tag: 'not_really' },
      { id: 'outgrown', label: "I've outgrown it", key: 'still_fits', tag: 'outgrown' },
    ],
  },
  // ── Action ─────────────────────────────────────────────────────────────────
  {
    ...base, id: 'act_followthrough', capacity: 'action', sub_capacity: 'follow_through',
    mechanism: 'behavioral_confrontation', interaction_type: 'choice_then_reflection',
    intensity: 'medium', sensitivity: 'medium', follow_up_possible: true, follow_up_type: 'choice',
    action_oriented: true, estimated_duration: 40, tags: ['avoidance', 'follow_through'],
    prompt: "Is there something you said you'd do that you haven't done yet?",
    options: [
      { id: 'yes', label: 'Yes', key: 'open_commitment', tag: 'yes', burden: true },
      { id: 'kind_of', label: 'Kind of', key: 'open_commitment', tag: 'kind_of' },
      { id: 'no', label: 'No — I\'m up to date', key: 'open_commitment', tag: 'no' },
      { id: 'changed_mind', label: "I've changed my mind about it", key: 'open_commitment', tag: 'changed_mind' },
    ],
    follow_up: {
      prompt: "What's in the way?",
      options: [
        { id: 'time', label: 'Time' },
        { id: 'energy', label: 'Energy' },
        { id: 'fear', label: 'Something about it worries me' },
        { id: 'unclear', label: "I'm not sure how to start" },
        { id: 'dont_care', label: "I don't care about it anymore" },
      ],
    },
  },
  {
    ...base, id: 'act_tiny', capacity: 'action', sub_capacity: 'intentional_choice',
    mechanism: 'commitment', interaction_type: 'choice', intensity: 'light', action_oriented: true,
    estimated_duration: 20, tags: ['intention', 'momentum'],
    prompt: 'Pick one small thing you will actually do before tonight.',
    options: [
      { id: 'reply', label: 'Reply to one message', key: 'tiny_choice', tag: 'reply' },
      { id: 'outside', label: 'Five minutes outside', key: 'tiny_choice', tag: 'outside' },
      { id: 'start', label: 'Start something for two minutes', key: 'tiny_choice', tag: 'start' },
      { id: 'rest', label: 'Nothing — I am resting, on purpose', key: 'tiny_choice', tag: 'rest' },
    ],
    closing: 'Chosen. That is the whole rep.',
  },
  // ── Positive / neutral ─────────────────────────────────────────────────────
  {
    ...base, id: 'pos_credit', capacity: 'action', sub_capacity: 'agency',
    mechanism: 'attribution', interaction_type: 'choice_then_reflection', intensity: 'light',
    follow_up_possible: true, follow_up_type: 'choice', estimated_duration: 35,
    tags: ['agency', 'positive', 'progress'],
    prompt: "Was there something today that went better than you're giving yourself credit for?",
    options: [
      { id: 'yes', label: 'Yes', key: 'credit', tag: 'yes' },
      { id: 'maybe', label: 'Maybe', key: 'credit', tag: 'maybe' },
      { id: 'no', label: 'Not today', key: 'credit', tag: 'no' },
    ],
    follow_up: {
      prompt: 'What did you do that helped it go that way?',
      options: [
        { id: 'showed_up', label: 'I showed up' },
        { id: 'asked_help', label: 'I asked for help' },
        { id: 'let_go', label: 'I let something go' },
        { id: 'kept_going', label: 'I kept going' },
        { id: 'luck', label: 'Mostly luck' },
      ],
    },
  },
  {
    ...base, id: 'neutral_nothing', capacity: 'direction', sub_capacity: 'ease',
    mechanism: 'acknowledgement', interaction_type: 'acknowledge', intensity: 'light',
    estimated_duration: 10, tags: ['neutral', 'ease', 'positive'],
    prompt: 'Does anything need your attention today?',
    options: [
      { id: 'nothing', label: 'Nothing right now', key: 'attention_needed', tag: 'nothing' },
      { id: 'something', label: 'Something does', key: 'attention_needed', tag: 'something' },
    ],
    closing: 'Good. Go live your day.',
  },
];

export const CATALOG_BY_ID: Record<string, Exercise> = Object.fromEntries(CATALOG.map((e) => [e.id, e]));

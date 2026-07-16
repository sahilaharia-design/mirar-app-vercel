export default {
  // ─── Navigation ──────────────────────────────────────────────────────────────
  nav: {
    today: 'Today',
    signals: 'Signals',
    mirror: 'Mirror',
    profile: 'Profile',
  },

  // ─── Welcome-back banner (shown once after the rebuild) ────────────────────────
  welcome_back: {
    title: "We've rebuilt Mirar.",
    body: 'Simpler, faster, and closer to the daily practice it was meant to be. If something feels off — or right — we\'d genuinely like to hear it.',
    cta: 'Write to us',
    dismiss_a11y: 'Dismiss',
  },

  // ─── Common ───────────────────────────────────────────────────────────────────
  common: {
    day: 'Day {{n}}',
    cycle: 'Cycle {{n}}',
    calibrating: 'Still forming',
    calibrating_subtext: 'A few reflections help the pattern appear',
    your_alignment_today: "Today's mirror",
    your_signals: "What's been showing up",
    record_checkin: 'Record check-in',
    start_checkin: "Start today's mirror",
    back_to_today: 'Back to today',
    checkin_recorded: 'Check-in recorded',
    recorded: 'Recorded',
    loading: 'Loading...',
    signal_ready: "Today's mirror is ready.",
    chapter_label: 'Chapter {{n}}',
    day_label: 'Day {{day}}',
  },

  // ─── Daily check-in ─────────────────────────────────────────────────────────
  checkin: {
    helper_text: 'Choose what feels closest. There is no right answer.',
    zone_under_load: 'Under load',
    zone_settling: 'Settling',
    zone_forming: 'Forming',
    zone_steady: 'Steady',
    signature_label: '14-day signature',
    drift_label: 'drift · {{n}}d',
    reflection_label: "Today's reflection",
    reflection_loading: 'Letting the reflection settle…',
    themes_touched: 'What today touched',
    your_reading: 'Your reading',
    tomorrow_label: 'Tomorrow',
    tomorrow_fallback: 'Another question is forming. Return tomorrow to see what shifts.',
    return_when_ready: "Return when you're ready",
    close: 'Close',
    close_a11y: 'Close mirror reading',
    delta_steady: '— steady',
    delta_up: 'shifted +{{n}}',
    delta_down: 'shifted {{n}}',
    why_recurring_tension: '{{theme}} has been carrying weight for a few days — that\'s part of what today\'s reading is picking up.',
    why_shift_down: '{{theme}} has been drifting lower — that\'s what today\'s reading is picking up.',
    why_growth: '{{theme}} has been steadily opening up — that\'s part of what\'s showing today.',
    why_shift_up: '{{theme}} moved up recently — that\'s part of what\'s showing today.',
    why_steady: '{{theme}} has been holding steady — that\'s part of what\'s showing today.',
    why_fallback: '{{theme}} is part of what today\'s reading is built from.',
    cold_start_note: '{{theme}} is now part of what Mirar is listening for.',
    fallback_mirror: '{{theme1}} and {{theme2}} were visible in today’s reflection. {{statusLine}}',
    fallback_status_line: 'Alignment registered at {{status}} today.',
    level_low: 'Low signal',
    level_mid: 'Mid signal',
    level_high: 'High signal',
    reading_steady: 'Reading held steady',
    reading_up: 'Reading moved up {{n}} points',
    reading_down: 'Reading shifted down {{n}} points',
    mirror_signal_label: 'Mirror signal · Reflection {{n}}',
    what_touched: 'What this check-in touched',
    tomorrow_explore: 'Tomorrow, Mirar will explore',
    default_glimmer: 'Signal recorded.',
  },

  // ─── Status Labels ────────────────────────────────────────────────────────────
  status: {
    aligned: 'Aligned',
    forming: 'Forming',
    stabilizing: 'Stabilizing',
    under_load: 'Under Load',
    no_reading: 'No Reading',
    calibrating: 'Still forming',
  },

  // ─── Theme detail sheet ────────────────────────────────────────────────────
  theme_detail: {
    back_to_signals_a11y: 'Back to signals',
    back_signals: 'Signals',
    reflection_area: 'Reflection area',
    now: 'Now',
    reflections: 'Reflections',
    recorded_count: '{{n}} recorded',
    recent_pattern: 'Recent reflection pattern',
    what_showed_up: 'What showed up',
    obs_not_enough: 'Not enough reflections yet.',
    obs_distribution: '{{midHigh}} of {{total}} signals held mid or above.',
    obs_pressure: 'Pressure appeared across {{n}} reflections.',
    obs_steadiness: '{{n}} reflections showed steadiness.',
    obs_forming_vary: 'The readings vary. The pattern is still forming.',
    obs_trend_down: 'The reading has carried more pressure recently.',
    obs_trend_up: 'The reading has shown more steadiness recently.',
    meta_still_forming: 'still forming',
    meta_recent_reflections: 'recent reflections',
    meta_pattern_present: 'pattern present',
    meta_holding_steady: 'holding steady',
    meta_recent_shift: 'recent shift',
  },

  // ─── Alignment/signal status labels (distinct domain from per-theme `status`) ─
  signal_labels: {
    under_load: 'Under Load',
    aligned: 'Aligned',
    steady: 'Steady',
    settling: 'Settling',
    still_forming: 'Still forming',
    drifting: 'Drifting',
    listening: 'Listening',
  },

  // ─── Guidance tooltips ─────────────────────────────────────────────────────
  guidance_tooltips: {
    signal: 'A signal is a small reflection based on your answer. It is not a score or diagnosis.',
    pattern: 'A pattern is what starts to repeat across your signals over time.',
    reflection_summary: 'A summary reflects what your recent answers have been pointing toward. Read it as a mirror, not a verdict.',
    todays_mirror: 'Today’s mirror is one simple question, one answer, and one small signal.',
    under_load: 'Under Load means your answers may be pointing to pressure, effort, or emotional weight. It does not mean something is wrong.',
    steady: 'Steady means your answers suggest enough clarity or balance to continue.',
    drifting: 'Drifting means your answers may be pointing to movement without full clarity or connection.',
    aligned: 'Aligned means today’s answer points toward clarity, steadiness, or inner agreement.',
    still_forming: 'Mirar needs a few reflections before it can show a useful pattern.',
    recent_reflections: 'Recent reflections are your latest daily mirrors. They help Mirar notice what is repeating.',
    whats_showing_up: 'What’s been showing up is a simple read of your recent signals, not a performance dashboard.',
    settling: 'Settling means today’s answer points toward movement that is becoming clearer, but may not feel fully steady yet.',
  },

  // ─── Guide modal ────────────────────────────────────────────────────────────
  guide_modal: {
    eyebrow: 'The Mirror Guide',
    title: 'How Mirar works',
    intro_text: 'One answer becomes a signal. Repeated signals become a pattern. Patterns become a mirror.',
  },

  // ─── Guide modal FAQ cards ─────────────────────────────────────────────────
  guide_cards: [
    { title: 'What is Mirar?', body: 'Mirar is a 2-minute daily mirror for your inner state. Each day, it asks one simple question and reflects back a small signal.' },
    { title: 'What is a daily mirror?', body: 'A daily mirror is a small pause where you choose what feels closest today. You do not need to write, explain, or fix anything.' },
    { title: 'What is a signal?', body: 'A signal is a small reflection based on your answer. It is not a score, diagnosis, or advice.' },
    { title: 'What is a pattern?', body: 'A pattern is what starts to repeat across your signals. One answer shows a moment. Repeated answers can show what has been quietly building.' },
    { title: 'Why one question a day?', body: 'Because Mirar is designed to be light enough to return to. The value is not in answering more. The value is in noticing a little, consistently.' },
    { title: 'Is this therapy?', body: 'No. Mirar is not therapy, diagnosis, or mental health treatment. It is a reflection system that helps you notice your internal patterns.' },
    { title: 'What happens if I miss a day?', body: 'Nothing breaks. There are no streaks to protect and no days to catch up. When you return, Mirar continues from where you left off.' },
    { title: 'How should I read my summary?', body: 'Read it as a mirror, not a verdict. Your summary reflects what your recent answers have been pointing toward.' },
    { title: 'How does Mirar help over time?', body: 'Mirar helps you notice the states you keep returning to: where you feel steady, where you feel stretched, where you feel unclear, and where something may be asking for attention.' },
  ],

  // ─── Signals tab ───────────────────────────────────────────────────────────
  signals_tab: {
    cross_load_many: '{{n}} areas are carrying load at the same time. The pattern is worth holding gently.',
    cross_load_two: '{{a}} and {{b}} are both showing pressure. These often move together.',
    cross_aligned_many: '{{n}} areas are showing steadiness in recent reflections.',
    cross_aligned_two: '{{a}} and {{b}} are both holding steady right now.',
    guide_title: 'Signals are small reflections from your daily mirrors.',
    guide_text: 'When they repeat, they start to show a pattern.',
    guide_hint: 'Your signals are still forming. A few more reflections will make this clearer.',
    how_this_works: 'How this works',
    whats_showing_up: 'What’s showing up',
    recent_reflections: 'Recent reflections',
    reflections_in_window: 'Reflections in this window',
    recent_signals: 'Recent signals',
    view_detail_a11y: 'View {{name}} detail',
    your_pattern: 'Your pattern',
  },

  // ─── Theme signal row (signals tab list item) ──────────────────────────────
  theme_signal_row: {
    signal_area: 'signal area',
    delta_more_steady: 'showing more steadiness',
    delta_more_pressure: 'showing more pressure',
    reflection_count_one: '{{count}} reflection',
    reflection_count_other: '{{count}} reflections',
  },

  // ─── Theme block (report detail theme list) ────────────────────────────────
  theme_block: {
    based_on_reflections: 'based on reflections',
  },

  // ─── Account-creation transition screen (post magic-link, pre-onboarding) ──
  account_setup: {
    creating: 'Setting up your mirror…',
    done_title: "You're in.",
    done_sub: 'Your practice begins now.',
    error_text: 'Something went wrong. Please close and try again.',
  },

  // ─── Journal expander (check-in step 2, private note) ──────────────────────
  journal_expander: {
    captured: 'Captured · {{time}}',
    answer_captured: 'ANSWER CAPTURED',
    input_label: 'Add a private line, only if you want.',
    input_helper: 'This is optional. Your answer is enough.',
    input_placeholder: 'Add a sentence if it helps. Your answer is enough.',
    held_privately: 'HELD PRIVATELY',
    skip_a11y: 'Skip journal entry',
    record_a11y: 'Record signal',
    skip: 'Skip',
    recording: 'Recording…',
    record_mirror: 'Record today’s mirror',
  },

  // ─── Theme shift card (mirror screen theme touched) ────────────────────────
  theme_shift_card: {
    area_touched: 'area touched',
    level_present: 'present',
    level_visible: 'visible',
    level_strongly_visible: 'strongly visible',
  },

  // ─── First-day welcome card (home tab, before first check-in) ──────────────
  first_day_welcome: {
    heading: 'Your first mirror is ready.',
    body: 'Mirar reads patterns, not moments. A few daily pauses help what has been shifting become easier to notice.',
  },

  // ─── Cycle arc (28-day grid on signals tab) ────────────────────────────────
  cycle_arc: {
    label: 'Reflection pattern',
    forming: 'Your pattern is forming',
    legend_notice: 'Notice',
    legend_adjust: 'Adjust',
    legend_move: 'Move',
    legend_reflect: 'Reflect',
  },

  // ─── Stage Labels (internal — not shown as "Stage N" to user) ────────────────
  stages: {
    awareness: 'First Signals',
    realignment: 'Patterns Emerge',
    action: 'Signal in Action',
    reflection: 'Mirror Deepens',
  },

  // ─── Report detail screen ──────────────────────────────────────────────────
  report_detail: {
    full_cycle_label: 'Full Cycle Mirror',
    stage_description: {
      '0': 'Full pattern summary',
      '1': 'What became noticeable',
      '2': 'Where adjustment signals appeared',
      '3': 'Where movement occurred',
      '4': 'What remained visible by the end of the cycle',
    },
    back_reports: 'Reports',
    not_found: 'Report not found.',
    coverage_text: '{{coverage}} of {{total}} reflections included',
    your_summary_label: 'Your reflection summary',
    value_intro_text: 'Based on your recent reflections, this is what Mirar noticed.',
    what_kept_showing_up: 'What kept showing up',
    strongest_signal_label: 'Your strongest signal',
    meaning_title: 'What this may help you notice',
    meaning_toggle_open: 'What does this mean?',
    meaning_text: 'This does not mean anything is wrong. It simply gives language to something that may have been running quietly in the background.',
    how_to_read_label: 'How to read this',
    strongest_signals_title: 'Strongest signals',
    gentle_checks_title: 'Gentle checks',
    disclaimer_text: 'Read this as a mirror, not a verdict. No recommendations or behavioral guidance are present.',
  },

  // ─── Theme Names ──────────────────────────────────────────────────────────────
  themes: {
    IAP: 'Direction',
    EWB: 'Energy',
    FAF: 'Attention',
    RC: 'Connection',
    GAL: 'Growth',
    RA: 'Movement',
    IAP_short: 'What feels true, chosen, and internally clear',
    EWB_short: 'Capacity, heaviness, steadiness, and recovery',
    FAF_short: 'Where your mind keeps returning',
    RC_short: 'How honest and spacious relationships feel',
    GAL_short: 'Openness, change, and what is becoming visible',
    RA_short: 'Small steps, hesitation, and follow-through',
  },

  // ─── Tooltips ─────────────────────────────────────────────────────────────────
  tooltips: {
    alignment_ring: 'This is your daily reading — a reflection of the signals your check-ins have made visible.',
    theme_signals: 'These areas mirror different parts of your inner state. Tap one to see what has been showing up.',
    checkin_card: 'Your daily mirror takes less than 2 minutes. One question, one answer, one reflection.',
    cycle_info: 'Your signals build clarity over time. The longer you check in, the more accurately Mirar reads your patterns.',
  },

  // ─── Insights (Mirror Observations) ───────────────────────────────────────────
  insights: {
    mirror_notice: 'A small signal',
    first_day: 'Your first reflection is here. Mirar begins noticing patterns after a few daily pauses.',
    second_day: 'Two reflections in. The pattern is still forming.',
    third_day: 'A small pattern window is opening. Keep reading this gently.',
    calibrating_mirror: 'Your mirror is still forming. Each reflection adds a little more shape.',
    under_load: 'Some signals are showing pressure. Read this as a mirror, not a verdict.',
    under_load_two: '{{a}} and {{b}} are showing pressure in recent reflections. Read this as a mirror, not a verdict.',
    under_load_one: '{{name}} is carrying some weight in recent reflections.',
    strong_alignment: 'Several recent reflections are showing steadiness.',
    aligned_many: '{{a}} and {{b}} — among others — are showing steadiness in recent reflections.',
    aligned_one: '{{name}} is the steadiest signal right now.',
    forming_patterns: 'A pattern is starting to show across recent reflections.',
    forming_many: '{{a}} and {{b}} are starting to form a pattern.',
    no_reading_many: '{{n}} areas are still forming. Each daily pause adds definition to your mirror.',
    signals_building: 'Your recent reflections are beginning to take shape.',
    active_areas: 'Your recent reflections are active across {{n}} areas. The mirror is still forming.',
  },

  // ─── Today screen ─────────────────────────────────────────────────────────────
  today: {
    ready_title: "Today's mirror is ready.",
    ready_sub: 'One question. One answer. One small signal.',
    ready_hint: 'Choose what feels closest. There is no right answer.',
    pattern_hint: 'Your pattern will appear after a few reflections.',
    how_link: 'How Mirar works',
    daily_pause: 'Daily pause',
    recent_pattern: 'Recent pattern',
    context_with_count: "Today's mirror · {{count}} recent reflections",
    trend_steady: 'Steady',
    trend_up: '+{{n}} this week',
    trend_down: '{{n}} this week',
  },

  // ─── Awareness (pattern engine output) ─────────────────────────────────────────
  awareness: {
    title: "Today's awareness",
    patterns_title: 'Your patterns',
    attention_label: 'Worth your attention',
    changing_label: 'What is changing',
    holding_label: 'What is holding',
    repeats_label: 'What repeats',
    building_label: 'What is building',
    tone_steady: 'Your recent signals are holding steady.',
    tone_mixed: 'Your signals are mixed this week — some areas steady, some stretched.',
    tone_under_pressure: 'Several of your signals are carrying load right now.',
    tone_forming: 'Your pattern is still forming. {{count}} reflections so far — it sharpens with each one.',
    recurring_tension: '{{theme}} has shown pressure repeatedly. It may be what you are carrying.',
    shift_down: '{{theme}} has shifted downward this week.',
    shift_up: '{{theme}} has been lifting this week.',
    growth: '{{theme}} is building steadily.',
    steady: '{{theme}} is holding steady — a quiet strength.',
    forming: 'Still forming.',
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────────
  auth: {
    title: 'Mirar',
    tagline: 'Your internal alignment, made visible.',
    tagline_short: 'Two minutes a day. A mirror for your inner state.',
    subtitle: 'Daily emotional hygiene for your mind — a two-minute reading of your inner state. Not advice, not therapy. Just an honest mirror, every day.',
    heading: 'Sign in to Mirar.',
    login_subtitle: "Enter your email. We'll send you a link — no password needed.",
    email_placeholder: 'Your email address',
    send_link: 'Send sign-in link',
    sending: 'Sending...',
    check_email: 'Check your email',
    link_sent: "We've sent a sign-in link to {{email}}",
    link_validity: 'The link is valid for 60 minutes and can only be used once.',
    link_expired: 'That link has expired or was already used. Enter your email to get a new one.',
    open_email: 'Open email app',
    try_again: 'Try a different email',
    disclaimer: 'No password needed. One tap to sign in.',
    cta_label: 'Begin your daily mirror',
    cta_early_access: 'Get early access',
    privacy_note: 'Your email is used only for delivery. It never appears in your signal data.',
    privacy_badge: 'No passwords. No tracking. Your signal belongs to you.',
    beta_tag: 'Private Beta',
    feature_1_title: 'A daily habit, like brushing your teeth',
    feature_1_desc: 'One question a day. Two minutes. Small daily upkeep that keeps drift from quietly building.',
    feature_2_title: 'Six dimensions of alignment',
    feature_2_desc: 'Purpose, energy, focus, relationships, growth, and resilience — tracked continuously.',
    feature_3_title: 'See patterns before they become problems',
    feature_3_desc: 'Daily signal data reveals drift, alignment, and where your internal state is actually heading.',
  },

  // ─── Onboarding ───────────────────────────────────────────────────────────────
  onboarding: {
    language_prompt: 'Choose your language',
    slide1_title: 'Your inner state shifts every day.',
    slide1_body: 'Most days, you never notice. Mirar does — two minutes at a time.',
    slide2_title: 'Signal, not journal.',
    slide2_body: 'A few questions. A mirror that shows what\'s forming, what\'s steady, and what\'s quietly changing.',
    slide3_title: 'Not advice. Not coaching.',
    slide3_body: 'A clean read of your internal signals. Private. Yours alone. Gets sharper the longer you use it.',
    slide4_title: 'A mirror. Not a mentor.',
    slide4_body: 'After each check-in, you get one short reflection. Not advice — recognition.',
    slide5_title: 'Your signal belongs to you.',
    slide5_body: 'Your Mirar ID helps keep your reflection history separate inside the app.',
    begin: 'Start',
    beginning: 'Setting up...',
    continue: 'Continue',
  },

  // ─── Profile ─────────────────────────────────────────────────────────────────
  profile: {
    title: 'Profile',
    mirar_id: 'Mirar ID',
    practice: 'Your practice',
    cycle_label: 'Cycle {{n}} · Day {{day}}',
    language: 'Language',
    dark_mode: 'Dark mode',
    sign_out: 'Sign out',
    signing_out: 'Signing out...',
    member_since: 'Member since {{date}}',
    sign_out_confirm: 'You will be signed out of Mirar. Your signal data is preserved.',
    cancel: 'Cancel',
    id_help: 'Your Mirar ID helps separate your reflection history from your public identity inside the app.',
    id_note: 'Your Mirar ID helps keep your reflection history separate inside the app.',
    guide_desc: 'What signals mean, how patterns form, and how to read summaries.',
    open: 'Open',
    practicing_since: 'Practicing since',
    days_practiced: 'Days practiced',
    today_label: 'Today',
    daily_mirror: 'Daily mirror',
    current_pattern: 'Current pattern',
    settings_label: 'Settings',
    daily_reminder: 'Daily mirror reminder',
    summary_notifications: 'Summary notifications',
    on: 'On',
    off: 'Off',
    reflection_notes: 'Reflection notes',
    note_count_one: '{{count}} note',
    note_count_other: '{{count}} notes',
    hide: 'Hide',
    show: 'Show',
    reflection_n: 'Reflection {{n}}',
    more_notes_one: '+{{count}} more note',
    more_notes_other: '+{{count}} more notes',
    support_mirar: 'Contact Mirar',
    support_sub: 'Questions, feedback, or want to support what we\'re building — write to us anytime.',
  },

  // ─── Language Names (shown in selector) ───────────────────────────────────────
  languages: {
    en: 'English',
    hi: 'हिंदी',
    gu: 'ગુજરાતી',
  },

  // ─── Reports ─────────────────────────────────────────────────────────────────
  reports: {
    title: 'Mirror',
    no_reports: 'Reflection summaries appear after a few daily pauses.',
    locked: 'Still forming',
    coverage: '{{n}} of 7 days',
    chapter_label: 'Chapter {{n}} · {{label}}',
    page_title: 'Reflection summaries',
    page_desc: 'Summaries show what kept repeating across your reflections. Read them as a mirror, not a verdict.',
    progress_label: 'Day {{day}} of 7 — your first summary generates after 7 check-ins.',
    summaries_label: 'Summaries',
    full_pattern_label: 'Full pattern',
    footer_note: 'Reflection summaries only. Mirar reflects — you interpret.',
    ready_date: 'Ready {{date}}',
  },

  // ─── Assessment flow (pre-auth onboarding) ───────────────────────────────────
  assess: {
    q1_title: 'What brought you here today?',
    q1_sub: 'Select all that apply.',
    q2_title: 'Which of these feel most true right now?',
    q2_sub: 'Choose up to 3.',
    q3_title: 'How often do you check in with yourself?',
    q3_options: {
      almost_never: 'Almost never',
      occasionally: 'Occasionally, when things go wrong',
      regularly: 'Regularly, but not systematically',
      has_practice: 'I already have a practice',
    },
    q4_title: 'When did you last feel fully yourself?',
    q4_placeholder: 'A moment, a period, a feeling — whatever comes.',
    q4_input_placeholder: 'Write what comes...',
    q4_skip: 'Skip for now',
    reflection_title: 'Here\'s what we noticed.',
    reflection_step_label: 'Your reflection',
    reflection_closer: 'Your practice starts here. Two minutes a day.',
    reflection_privacy: 'Your answers are stored privately and never shared.\nThey help Mirar personalize your daily questions.',
    reflection_cta: 'Create your account',
    reflection_footer_note: 'No credit card. Your signal belongs to you.',
    reflection_default: "What you've just named is the beginning. Most people never stop long enough to notice the quiet signals — you already have. Mirar will help you keep noticing.",
    reflection_dimensions: {
      IAP: "What you're noticing is real. Many people move through life without pausing to check if the direction still fits. Mirar won't tell you which direction to take — it will help you see where you actually are.",
      EWB: "The gap between what your life demands and what you have to give is one of the first signals Mirar tracks. Naming it is the first step.",
      FAF: "Scattered attention is rarely about discipline. It's usually a signal that something else is pulling. Mirar helps you see what's competing for your focus.",
      RC: "Relationships carry weight that's easy to normalize. Mirar gives you a way to notice when a connection has been quietly draining — before it becomes a crisis.",
      GAL: "Feeling stuck is almost always a signal, not a failing. Mirar helps you distinguish between resting and drifting — they feel similar from the inside.",
      RA: "The freeze response is intelligent — it just needs to be understood, not overcome. Mirar helps you see the pattern so you can work with it.",
    },
    step: 'Step {{n}} of 5',
  },

  // ─── Shared option/dimension text (assess quiz + onboarding wizard) ──────────
  shared: {
    q1_options: {
      understand: 'I want to understand myself better',
      off: "I feel off but can't name it",
      habit: 'I want to build a daily self-check-in habit',
      transition: "I'm going through a major transition",
      reactivity: 'I want to reduce emotional reactivity',
      recommended: 'Someone recommended Mirar to me',
      curious: "I'm just curious what this is",
    },
    q2_dimensions: {
      IAP: { name: 'Direction', desc: "I'm not sure what I'm building toward." },
      EWB: { name: 'Energy', desc: "My energy doesn't match what my life requires." },
      FAF: { name: 'Attention', desc: 'I struggle to focus on what actually matters.' },
      RC: { name: 'Connection', desc: 'Key relationships feel strained or distant.' },
      GAL: { name: 'Growth', desc: "I've stopped learning or feel stuck." },
      RA: { name: 'Movement', desc: 'I freeze when things get hard.' },
    },
  },

  // ─── Onboarding wizard (6-beat progressive reveal, post-signup) ──────────────
  wizard: {
    welcome_title: 'Welcome to Mirar.',
    welcome_body: 'A mirror for your inner state.',
    welcome_muted: "Not a journal. Not a therapist. Not a coach.\n\nA daily signal that reflects what's actually happening inside —\nbefore it affects everything outside.",
    begin: 'Begin →',
    how_title: 'Two minutes.\nEvery morning.',
    how_q_title: 'One question',
    how_q_desc: 'Chosen for where you are in your practice.',
    how_a_title: 'One honest answer',
    how_a_desc: 'No right answers. Only true ones.',
    how_s_title: 'One signal',
    how_s_desc: 'Recorded, tracked, reflected back over time.',
    how_muted: "Mirar doesn't tell you what to feel.\nIt asks you to notice what you already do.",
    understood: 'Understood →',
    q1_title: 'What brought you to Mirar?',
    q1_sub: 'Select all that feel true.',
    continue: 'Continue →',
    reveal_understand: "Good. That's exactly what daily noticing builds.",
    reveal_off: "That's exactly what Mirar is built to notice.",
    reveal_habit: "Two minutes a day is enough. Let's start.",
    reveal_transition: 'Transitions are where signal matters most.',
    reveal_reactivity: 'Noticing early is how reactivity softens.',
    reveal_recommended: "Let's see what they noticed.",
    reveal_curious: "Fair — let's show you, not just tell you.",
    reveal_default: "Let's see what Mirar notices.",
    tap_hint: 'Tap to continue',
    q2_progress: '{{current}} of {{total}}',
    q2_true: "That's true for me",
    q2_skip: 'Not this one',
    signal_title: "Here's what Mirar is already noticing.",
    noted_tag: 'Noted',
    signal_muted: "This isn't a score. It's a starting point.\nTomorrow, your first real signal begins.",
    finish: 'Begin your first real check-in →',
  },

  // ─── Welcome reflection ───────────────────────────────────────────────────────
  welcome: {
    title: 'What feels most true about your life today?',
    placeholder: 'Write what comes. There\'s no right answer.',
    cta: 'Begin',
    skip: 'I\'ll reflect tomorrow',
    hint: 'This is the first signal Mirar reads. It doesn\'t need to be perfect.',
  },

  // ─── Landing Page (web) ───────────────────────────────────────────────────
  landing: {
    // Hero
    hero_title: 'Emotional fitness starts\nwith emotional hygiene.',
    hero_sub: 'You care for your body every day. Mirar is the two-minute daily practice for your inner world — an AI mirror that turns reflection into signals, patterns, and awareness.',
    hero_cta: 'Start building emotional fitness',
    hero_badge: 'No password · No tracking · Private Beta',

    // Recognition
    recognition_heading: 'SOME DAYS, NOTHING IS WRONG.',
    recognition_sub: 'But something feels slightly off.',
    recognition_1: 'Decisions take longer than they should.',
    recognition_2: 'You move forward. But not with clarity.',
    recognition_3: 'You know something has shifted.\nYou\'re just not sure when.',
    recognition_cta: 'That\'s what Mirar is for — a two-minute daily reading that catches drift early.',

    // What alignment feels like
    feels_like_heading: 'WHAT EMOTIONAL FITNESS GIVES YOU.',
    feels_like_1: 'You understand yourself better.',
    feels_like_2: 'You recognize your recurring patterns.',
    feels_like_3: 'Overwhelm shows up less — and settles faster.',
    feels_like_4: 'Relationships get clearer.',
    feels_like_5: 'Decisions come easier. You already know.',

    // How alignment compounds
    compounds_heading: 'EMOTIONAL FITNESS COMPOUNDS.',
    compounds_1_time: 'Day by day',
    compounds_1_body: 'you notice patterns earlier.',
    compounds_2_time: 'Week by week',
    compounds_2_body: 'your attention shifts toward what matters.',
    compounds_3_time: 'Month by month',
    compounds_3_body: 'your direction becomes easier to recognize.',
    compounds_4_time: 'Year by year',
    compounds_4_body: 'you stop living someone else\'s timeline.',

    // How it works (poetic)
    how_heading: 'HOW MIRAR WORKS.',
    how_day_label: 'Each day',
    how_day_body: 'one reflection.',
    how_week_label: 'Reflections',
    how_week_body: 'become signals.',
    how_cycle_label: 'Signals',
    how_cycle_body: 'become patterns.',
    how_lifetime_label: 'Patterns',
    how_lifetime_body: 'become awareness — of who you are becoming.',

    // Privacy
    privacy_heading: 'YOUR SIGNAL IS YOURS.',
    privacy_body: 'Your Mirar ID helps separate your reflection history from your public identity inside the app.\nNo passwords. Your signal belongs to you.',

    // Final CTA
    cta_heading: 'START BUILDING EMOTIONAL FITNESS.',
    cta_badge: 'Private Beta · Less than 2 minutes daily · Pay what feels right',
  },
} as const;

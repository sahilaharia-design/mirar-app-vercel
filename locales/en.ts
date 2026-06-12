export default {
  // ─── Navigation ──────────────────────────────────────────────────────────────
  nav: {
    today: 'Today',
    signals: 'Signals',
    mirror: 'Mirror',
    profile: 'Profile',
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

  // ─── Status Labels ────────────────────────────────────────────────────────────
  status: {
    aligned: 'Aligned',
    forming: 'Forming',
    stabilizing: 'Stabilizing',
    under_load: 'Under Load',
    no_reading: 'No Reading',
    calibrating: 'Still forming',
  },

  // ─── Stage Labels (internal — not shown as "Stage N" to user) ────────────────
  stages: {
    awareness: 'First Signals',
    realignment: 'Patterns Emerge',
    action: 'Signal in Action',
    reflection: 'Mirror Deepens',
  },

  // ─── Theme Names ──────────────────────────────────────────────────────────────
  themes: {
    IAP: 'Direction',
    EWB: 'Energy',
    FAF: 'Attention',
    RC: 'Connection',
    GAL: 'Growth',
    RA: 'Movement',
    IAP_short: 'Direction',
    EWB_short: 'Energy',
    FAF_short: 'Attention',
    RC_short: 'Connection',
    GAL_short: 'Growth',
    RA_short: 'Movement',
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
    strong_alignment: 'Several recent reflections are showing steadiness.',
    forming_patterns: 'A pattern is starting to show across recent reflections.',
    signals_building: 'Your recent reflections are beginning to take shape.',
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
    subtitle: 'Daily emotional hygiene for your mind — a two-minute reading of your inner state. Not advice, not therapy. Just an honest mirror, every day.',
    email_placeholder: 'Your email address',
    send_link: 'Send sign-in link',
    sending: 'Sending...',
    check_email: 'Check your email',
    link_sent: "We've sent a sign-in link to {{email}}",
    link_validity: 'The link is valid for 60 minutes and can only be used once.',
    open_email: 'Open email app',
    try_again: 'Try a different email',
    disclaimer: 'No password needed. One tap to sign in.',
    cta_label: 'Begin your daily mirror',
    privacy_note: 'Your email is used only for delivery. It never appears in your signal data.',
    privacy_badge: 'No passwords. No tracking. Your signal belongs to you.',
    beta_tag: 'Private Beta · Cycle 1',
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
    slide1_title: 'You take care of your body. What about your inner world?',
    slide1_body: 'Emotional fitness works like physical fitness — built through small daily practice, not big occasional effort.',
    slide2_title: 'Emotional hygiene: two minutes a day.',
    slide2_body: 'One question. One honest answer. Mirar turns your answers into signals and patterns — and shows you what is shifting inside before you would notice it yourself.',
    slide3_title: 'A mirror, not a mentor.',
    slide3_body: 'No advice. No grades. No program to finish. You return because you keep learning something true about yourself.',
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
    cycle: 'Current cycle',
    cycle_label: 'Cycle {{n}} · Day {{day}}',
    language: 'Language',
    dark_mode: 'Dark mode',
    sign_out: 'Sign out',
    signing_out: 'Signing out...',
    member_since: 'Member since {{date}}',
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
    cta_badge: 'Private Beta · Less than 2 minutes daily · Free',
  },
} as const;

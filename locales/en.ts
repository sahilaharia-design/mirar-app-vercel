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
    calibrating: 'Calibrating',
    calibrating_subtext: '3 check-ins needed',
    your_alignment_today: 'Your alignment reading',
    your_signals: 'Your Signals',
    record_checkin: 'Record check-in',
    start_checkin: 'Begin your check-in',
    back_to_today: 'Back to today',
    checkin_recorded: 'Check-in recorded',
    recorded: 'Recorded',
    loading: 'Loading...',
    signal_ready: 'Your daily signal is ready.',
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
    calibrating: 'Calibrating',
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
    IAP: 'Inner Alignment & Purpose',
    EWB: 'Energy & Well-being',
    FAF: 'Focus & Flow',
    RC: 'Relational Capital',
    GAL: 'Growth & Learning',
    RA: 'Resilience & Action',
    IAP_short: 'Inner Alignment',
    EWB_short: 'Energy',
    FAF_short: 'Focus',
    RC_short: 'Relational',
    GAL_short: 'Growth',
    RA_short: 'Resilience',
  },

  // ─── Tooltips ─────────────────────────────────────────────────────────────────
  tooltips: {
    alignment_ring: 'This is your alignment reading — a reflection of your internal signals across all six themes. It shifts as your signals shift.',
    theme_signals: 'These six themes mirror different dimensions of your internal state. Tap any theme to see what your signals are showing.',
    checkin_card: 'Your daily check-in takes 2-3 minutes. Each question surfaces a signal from one of your six alignment themes.',
    cycle_info: 'Your signals build clarity over time. The longer you check in, the more accurately Mirar reads your patterns.',
  },

  // ─── Insights (Mirror Observations) ───────────────────────────────────────────
  insights: {
    mirror_notice: 'Your mirror notices',
    first_day: 'First signal recorded. Mirar begins pattern detection after 3–5 consecutive check-ins.',
    second_day: 'Two signals in. No pattern yet — pattern detection requires at least 3 consecutive days.',
    third_day: 'Day 3 registered. Early pattern window opening. Keep the streak to establish baseline.',
    calibrating_mirror: 'Signal data is building. Pattern detection requires 3–5 consecutive readings.',
    under_load: 'Some of your signals are showing pressure. The mirror is holding space — no action needed yet.',
    strong_alignment: 'Your signals are showing strong internal alignment across multiple themes right now.',
    forming_patterns: 'Patterns are starting to form across your themes. Your mirror is beginning to take shape.',
    signals_building: 'Your signals are active and building. The mirror gets more precise with each check-in.',
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────────
  auth: {
    title: 'Mirar',
    tagline: 'Your internal alignment, made visible.',
    subtitle: 'A daily mirror for your emotional and mental state — not advice, not therapy, just an honest reading of where you are.',
    email_placeholder: 'Your email address',
    send_link: 'Send sign-in link',
    sending: 'Sending...',
    check_email: 'Check your email',
    link_sent: "We've sent a sign-in link to {{email}}",
    link_validity: 'The link is valid for 60 minutes and can only be used once.',
    open_email: 'Open email app',
    try_again: 'Try a different email',
    disclaimer: 'No password needed. One tap to sign in.',
    cta_label: 'Begin your alignment reading',
    privacy_note: 'Your email is used only for delivery. It never appears in your signal data.',
    privacy_badge: 'No passwords. No tracking. Your signal belongs to you.',
    beta_tag: 'Private Beta · Cycle 1',
    feature_1_title: 'Read your internal signals daily',
    feature_1_desc: 'One question per day. 2-3 minutes. A mirror that reads what you cannot see yourself.',
    feature_2_title: 'Six dimensions of alignment',
    feature_2_desc: 'Purpose, energy, focus, relationships, growth, and resilience — tracked continuously.',
    feature_3_title: 'See patterns before they become problems',
    feature_3_desc: 'Daily signal data reveals drift, alignment, and where your internal state is actually heading.',
  },

  // ─── Onboarding ───────────────────────────────────────────────────────────────
  onboarding: {
    language_prompt: 'Choose your language',
    slide1_title: "You already know something's off.",
    slide1_body: "Before it becomes burnout. Before the decision you regret. Before you realize you've been running on empty for weeks. You felt it — you just didn't have a way to read it yet.",
    slide2_title: 'Mirar reads what you cannot see yourself.',
    slide2_body: 'One daily check-in. 2–3 minutes. Six internal signals tracked continuously — patterns surface before they compound into drift, reactive decisions, or shutdown.',
    slide3_title: 'Six signals. Tracked every day.',
    slide3_body: null,
    slide4_title: 'A mirror. Not a mentor.',
    slide4_body: 'After each check-in, you get a one-line AI read of what your signals showed. Not advice — a reflection. The longer you check in, the more accurately Mirar reads your patterns.',
    slide5_title: 'Your signal belongs to you.',
    slide5_body: "Identified only by your Mirar ID — not your name, not your email. Signal data is never shared, never interpreted by anyone but you.",
    begin: 'Begin first check-in',
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
    no_reports: 'Mirror readings appear as your signal data builds.',
    locked: 'Building...',
    coverage: '{{n}} of 7 days',
    chapter_label: 'Chapter {{n}} · {{label}}',
  },

  // ─── Landing Page (web) ───────────────────────────────────────────────────
  landing: {
    // Hero
    hero_title: 'Your internal alignment,\nmade visible.',
    hero_sub: 'A daily mirror for your inner state.\n2–3 minutes. Continuous. For life.',
    hero_cta: 'Begin your daily reading',
    hero_badge: 'No password · No tracking · Private Beta',

    // Recognition
    recognition_heading: 'SOME DAYS, NOTHING IS WRONG.',
    recognition_sub: 'But something feels slightly off.',
    recognition_1: 'Decisions take longer than they should.',
    recognition_2: 'You move forward. But not with clarity.',
    recognition_3: 'You know something has shifted.\nYou\'re just not sure when.',
    recognition_cta: 'That\'s what Mirar is for.',

    // What alignment feels like
    feels_like_heading: 'THIS IS WHAT ALIGNMENT FEELS LIKE.',
    feels_like_1: 'You trust quieter signals.',
    feels_like_2: 'Energy returns without forcing productivity.',
    feels_like_3: 'Conversations become clearer.',
    feels_like_4: 'Boundaries feel natural.',
    feels_like_5: 'You stop postponing decisions you already know.',

    // How alignment compounds
    compounds_heading: 'ALIGNMENT COMPOUNDS.',
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
    how_week_label: 'Each week',
    how_week_body: 'one signal.',
    how_cycle_label: 'Each cycle',
    how_cycle_body: 'one mirror.',
    how_lifetime_label: 'Over time',
    how_lifetime_body: 'a map of who you are becoming.',

    // Privacy
    privacy_heading: 'YOUR SIGNAL IS YOURS.',
    privacy_body: 'You are your Mirar ID. Your email is never stored in your signal data.\nNo passwords. No tracking. Signal data belongs to you alone.',

    // Final CTA
    cta_heading: 'START NOTICING.',
    cta_badge: 'Private Beta · 2–3 minutes daily · Free',
  },
} as const;

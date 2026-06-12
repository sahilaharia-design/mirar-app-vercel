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
    slide1_title: 'Mirar asks one simple question each day.',
    slide1_body: 'No pressure. No program to complete. Daily hygiene for your inner state — like brushing your teeth.',
    slide2_title: 'It helps you notice what is shifting inside you.',
    slide2_body: 'Your answers create signals over time: where things feel steady, stretched, unclear, or quietly opening.',
    slide3_title: 'Takes less than 2 minutes.',
    slide3_body: 'Choose what feels closest. Mirar reflects one short signal back — and the daily habit builds emotional fitness.',
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
    hero_title: 'Your internal alignment,\nmade visible.',
    hero_sub: 'Daily emotional hygiene for your inner state.\nTwo minutes a day — like brushing your teeth, but for your mind.',
    hero_cta: 'Start your daily mirror',
    hero_badge: 'No password · No tracking · Private Beta',

    // Recognition
    recognition_heading: 'SOME DAYS, NOTHING IS WRONG.',
    recognition_sub: 'But something feels slightly off.',
    recognition_1: 'Decisions take longer than they should.',
    recognition_2: 'You move forward. But not with clarity.',
    recognition_3: 'You know something has shifted.\nYou\'re just not sure when.',
    recognition_cta: 'That\'s what Mirar is for — a two-minute daily reading that catches drift early.',

    // What alignment feels like
    feels_like_heading: 'THIS IS WHAT ALIGNMENT FEELS LIKE.',
    feels_like_1: 'You trust quieter signals.',
    feels_like_2: 'Energy returns without forcing productivity.',
    feels_like_3: 'Conversations become clearer.',
    feels_like_4: 'Boundaries feel natural.',
    feels_like_5: 'You stop postponing decisions you already know.',

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
    how_week_label: 'Each week',
    how_week_body: 'one signal.',
    how_cycle_label: 'Each cycle',
    how_cycle_body: 'one mirror.',
    how_lifetime_label: 'Over time',
    how_lifetime_body: 'a map of who you are becoming.',

    // Privacy
    privacy_heading: 'YOUR SIGNAL IS YOURS.',
    privacy_body: 'Your Mirar ID helps separate your reflection history from your public identity inside the app.\nNo passwords. Your signal belongs to you.',

    // Final CTA
    cta_heading: 'START NOTICING.',
    cta_badge: 'Private Beta · Less than 2 minutes daily · Free',
  },
} as const;

// ─── Dev-only mock Supabase client ─────────────────────────────────────────────
// Activated by EXPO_PUBLIC_DEV_MOCK=1 (see lib/supabase.ts). Provides a fully
// signed-in session and a realistic 14-day data history entirely in memory, so
// the complete signed-in experience (dashboard, patterns, awareness, check-in,
// mirror reveal, reports) can be reviewed, demoed, and screenshotted without a
// backend. Never active in production: requires the env flag at build time.
//
// Day 14 state: 13 completed reflections; today's check-in pending.
// The fixture shape is tuned so the pattern engine has something honest to say:
//   - Energy (EWB): repeatedly Low in the recent week → recurring tension
//   - Direction (IAP): mostly High → steady strength
//   - Movement (RA): Low early, High recently → upward shift / growth
//   - Attention (FAF): mixed
//   - Connection (RC), Growth (GAL): sparse

const MOCK_USER_ID = 'mock-user-0000-0000-000000000001';
const MOCK_CYCLE_ID = 'mock-cycle-0000-0000-000000000001';
const TODAY_DAY_NUMBER = 14;

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const dateStr = (d: Date) => d.toISOString().split('T')[0];

const cycleStart = daysAgo(TODAY_DAY_NUMBER - 1);

// ── Question bank (representative) ────────────────────────────────────────────
type MockOption = {
  id: string; question_id: string; option_number: number; option_text: string;
  theme_1_code: string; theme_1_level: string; theme_1_points: number;
  theme_2_code: string; theme_2_level: string; theme_2_points: number;
  option_text_hi?: string; option_text_gu?: string;
};

function opt(qid: string, n: number, text: string, t1: [string, string, number], t2: [string, string, number]): MockOption {
  return {
    id: `${qid}-opt-${n}`, question_id: qid, option_number: n, option_text: text,
    theme_1_code: t1[0], theme_1_level: t1[1], theme_1_points: t1[2],
    theme_2_code: t2[0], theme_2_level: t2[1], theme_2_points: t2[2],
  };
}

const QUESTIONS = [
  {
    id: 'mock-q-1', day_number: 14, stage: 2, active: true,
    prompt_text: 'Right now, inside, I notice...',
    mirror_glimmer: 'Something was named today that wasn’t named yesterday.',
    tomorrow_tease: 'Tomorrow: what your attention keeps returning to.',
    journal_prompt: null, theme_1: 'IAP', theme_2: 'RA',
    options: [] as MockOption[],
  },
  {
    id: 'mock-q-2', day_number: 13, stage: 2, active: true,
    prompt_text: 'What thought keeps coming back to you?',
    mirror_glimmer: 'Recurring thoughts are signals waiting to be read.',
    tomorrow_tease: 'Tomorrow: something you’ve been carrying for others.',
    journal_prompt: null, theme_1: 'FAF', theme_2: 'GAL',
    options: [] as MockOption[],
  },
];

QUESTIONS[0].options = [
  opt('mock-q-1', 1, 'Something doesn’t fit anymore, and I’ve known it for a while.', ['IAP', 'Low', 1], ['RA', 'Medium', 2]),
  opt('mock-q-1', 2, 'I’m tired from pretending to be who I’m not.', ['IAP', 'Low', 1], ['EWB', 'Low', 1]),
  opt('mock-q-1', 3, 'I’m waiting for my life to change but not doing anything about it.', ['IAP', 'Medium', 2], ['RA', 'Low', 1]),
  opt('mock-q-1', 4, 'I’m not sure what I feel — I’m kind of numb.', ['IAP', 'Low', 1], ['EWB', 'Low', 1]),
  opt('mock-q-1', 5, 'I think something needs to shift, even if I don’t know what yet.', ['IAP', 'Medium', 2], ['RA', 'Low', 1]),
];
QUESTIONS[1].options = [
  opt('mock-q-2', 1, 'A choice I made that I keep second-guessing.', ['FAF', 'Low', 1], ['GAL', 'Medium', 2]),
  opt('mock-q-2', 2, 'Something I’m worried might happen.', ['FAF', 'Low', 1], ['GAL', 'Medium', 2]),
  opt('mock-q-2', 3, 'How different I feel from how I thought I’d be.', ['FAF', 'Medium', 2], ['GAL', 'Low', 1]),
  opt('mock-q-2', 4, 'A change I want but don’t know how to make.', ['FAF', 'Medium', 2], ['GAL', 'High', 3]),
  opt('mock-q-2', 5, 'Honestly, my mind is quieter these days.', ['FAF', 'High', 3], ['GAL', 'Medium', 2]),
];

// ── History fixtures: 13 completed days ───────────────────────────────────────
// [day, theme1(code,level,pts), theme2(code,level,pts)]
const HISTORY: Array<[number, [string, string, number], [string, string, number]]> = [
  [1,  ['EWB', 'Medium', 2], ['IAP', 'High', 3]],
  [2,  ['IAP', 'High', 3],   ['RA', 'Low', 1]],
  [3,  ['FAF', 'Medium', 2], ['EWB', 'Medium', 2]],
  [4,  ['RC', 'Medium', 2],  ['IAP', 'High', 3]],
  [5,  ['EWB', 'Low', 1],    ['RA', 'Low', 1]],
  [6,  ['IAP', 'High', 3],   ['FAF', 'Medium', 2]],
  [7,  ['GAL', 'Medium', 2], ['EWB', 'Low', 1]],
  [8,  ['EWB', 'Low', 1],    ['IAP', 'High', 3]],
  [9,  ['RA', 'High', 3],    ['FAF', 'Low', 1]],
  [10, ['EWB', 'Low', 1],    ['RC', 'Medium', 2]],
  [11, ['IAP', 'High', 3],   ['RA', 'High', 3]],
  [12, ['EWB', 'Low', 1],    ['FAF', 'Medium', 2]],
  [13, ['RA', 'High', 3],    ['IAP', 'High', 3]],
];

// Build per-day synthetic options so the pattern engine reads the right themes
const historyOptions: MockOption[] = [];
const responses = HISTORY.map(([day, t1, t2]) => {
  const oid = `mock-hist-opt-${day}`;
  historyOptions.push({
    id: oid, question_id: `mock-hist-q-${day}`, option_number: 1,
    option_text: 'Reflection recorded.',
    theme_1_code: t1[0], theme_1_level: t1[1], theme_1_points: t1[2],
    theme_2_code: t2[0], theme_2_level: t2[1], theme_2_points: t2[2],
  });
  return {
    id: `mock-resp-${day}`,
    user_id: MOCK_USER_ID,
    cycle_id: MOCK_CYCLE_ID,
    question_id: `mock-hist-q-${day}`,
    option_id: oid,
    day_number: day,
    journal_text: day % 5 === 0 ? 'A quieter day than it looked from outside.' : null,
    submitted_at: daysAgo(TODAY_DAY_NUMBER - day).toISOString(),
    alignment_score_at_time: 40 + day * 2,
  };
});

const alignmentScores = HISTORY.map(([day]) => {
  const score = Math.max(20, Math.min(85, 38 + day * 2 + (day % 3 === 0 ? -6 : 4)));
  return {
    user_id: MOCK_USER_ID,
    date: dateStr(daysAgo(TODAY_DAY_NUMBER - day)),
    score,
    status_label: score < 38 ? 'Under Load' : score < 50 ? 'Stabilizing' : score < 75 ? 'Forming' : 'Aligned',
    trend: day % 3 === 0 ? 'down' : 'up',
    mirror_text: day >= 12
      ? 'Energy is registering low while Movement holds steady. The same pressure has surfaced three times this week.'
      : null,
  };
});

// ── Mutable tables ────────────────────────────────────────────────────────────
const db: Record<string, any[]> = {
  users: [{
    id: MOCK_USER_ID,
    mirar_id: 'DEMO4site9',
    email: 'demo@mirar.life',
    language: 'en',
    onboarding_completed: true,
    cycle_start_date: cycleStart.toISOString(),
    current_cycle: 1,
    created_at: cycleStart.toISOString(),
  }],
  cycles: [{
    id: MOCK_CYCLE_ID,
    user_id: MOCK_USER_ID,
    cycle_number: 1,
    start_date: dateStr(cycleStart),
    stage1_start: cycleStart.toISOString(),
    status: 'active',
  }],
  questions: QUESTIONS,
  options: [...QUESTIONS.flatMap((q) => q.options), ...historyOptions],
  responses,
  alignment_scores: alignmentScores,
  reports: [{
    id: 'mock-report-1',
    user_id: MOCK_USER_ID,
    cycle_id: MOCK_CYCLE_ID,
    stage: 1,
    status: 'generated',
    coverage: 7,
    coverage_total: 7,
    summary_text: 'First reflections summary. 7/7 reflections included. 2 areas showed steadiness.',
    primary_signals: 'Direction — steady signal presence.\nMovement — moderate signal presence.\nEnergy — pressure present.',
    calibration_checks: 'Energy — pressure appeared repeatedly.\nDirection — steadiness appeared repeatedly.',
    full_report_text: 'MIRAR REFLECTION SUMMARY — FIRST REFLECTIONS\nMirar ID: DEMO4site9\n\nWindow: First reflections\n"What became noticeable"\n\n7 of 7 reflections included.\n\n──────────────────────────────\nWHAT SHOWED UP\n──────────────────────────────\n\nDirection\nReading: Aligned\nDirection appeared steadily across this reflection window.\n\nEnergy\nReading: Under Load\nEnergy showed pressure across this reflection window.\n\nAttention\nReading: Stabilizing\nAttention appeared intermittently.\n\nConnection\nReading: Forming\nConnection appeared with moderate regularity.\n\nGrowth\nReading: Forming\nGrowth appeared with moderate regularity.\n\nMovement\nReading: Stabilizing\nMovement appeared intermittently.\n\n──────────────────────────────\nSTRONGEST SIGNALS\n──────────────────────────────\n• 7 of 7 reflections included.\n• Direction — steady signal presence.\n• Connection — moderate signal presence.\n• Movement — settling signal pattern.\n\n──────────────────────────────\nGENTLE CHECKS\n──────────────────────────────\n• Energy — pressure appeared repeatedly.\n• Direction — steadiness appeared repeatedly.',
    generated_at: daysAgo(6).toISOString(),
  }],
  theme_scores: [
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 1, theme_code: 'IAP', signal_count: 5, average_score: 2.8, status: 'Aligned', low_count: 0, medium_count: 1, high_count: 4 },
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 1, theme_code: 'EWB', signal_count: 4, average_score: 1.0, status: 'Under Load', low_count: 4, medium_count: 0, high_count: 0 },
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 1, theme_code: 'RA', signal_count: 4, average_score: 2.5, status: 'Aligned', low_count: 0, medium_count: 1, high_count: 3 },
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 1, theme_code: 'FAF', signal_count: 3, average_score: 1.7, status: 'Stabilizing', low_count: 1, medium_count: 2, high_count: 0 },
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 2, theme_code: 'IAP', signal_count: 5, average_score: 2.8, status: 'Aligned', low_count: 0, medium_count: 1, high_count: 4 },
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 2, theme_code: 'EWB', signal_count: 4, average_score: 1.0, status: 'Under Load', low_count: 4, medium_count: 0, high_count: 0 },
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 2, theme_code: 'RA', signal_count: 4, average_score: 2.5, status: 'Aligned', low_count: 0, medium_count: 1, high_count: 3 },
    { user_id: MOCK_USER_ID, cycle_id: MOCK_CYCLE_ID, stage: 2, theme_code: 'FAF', signal_count: 3, average_score: 1.7, status: 'Stabilizing', low_count: 1, medium_count: 2, high_count: 0 },
  ],
  user_state: [{
    user_id: MOCK_USER_ID,
    streak_length: 13,
    total_reflections: 13,
    context_message: null,
    latest_signal_text: 'Energy signals held low this week while Movement lifted.',
  }],
  weekly_signals: [],
  push_tokens: [],
  question_history: [],
  structured_signals: [],
};

const mockSession = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user: { id: MOCK_USER_ID, email: 'demo@mirar.life' },
};

// ── Chainable query builder over the in-memory tables ─────────────────────────
class MockQuery {
  private table: string;
  private filters: Array<(row: any) => boolean> = [];
  private orderKey: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private mode: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private single_ = false;
  private maybe = false;
  private selectArg = '*';

  constructor(table: string) { this.table = table; }

  select(arg = '*') { this.selectArg = arg; return this; }
  eq(col: string, val: any) { this.filters.push((r) => r[col] === val); return this; }
  in(col: string, vals: any[]) { this.filters.push((r) => vals.includes(r[col])); return this; }
  gte(col: string, val: any) { this.filters.push((r) => r[col] >= val); return this; }
  lte(col: string, val: any) { this.filters.push((r) => r[col] <= val); return this; }
  not(col: string, operator: string, val: any) {
    if (operator === 'is' && val === null) {
      this.filters.push((r) => r[col] !== null && r[col] !== undefined);
    } else {
      this.filters.push((r) => r[col] !== val);
    }
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) { this.orderKey = col; this.orderAsc = opts?.ascending !== false; return this; }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.single_ = true; return this; }
  maybeSingle() { this.maybe = true; return this; }
  insert(payload: any) { this.mode = 'insert'; this.payload = payload; return this; }
  upsert(payload: any, _opts?: any) { this.mode = 'upsert'; this.payload = payload; return this; }
  update(payload: any) { this.mode = 'update'; this.payload = payload; return this; }
  delete() { this.mode = 'delete'; return this; }

  private run(): { data: any; error: any } {
    const rows = db[this.table] ?? [];
    if (this.mode === 'insert' || this.mode === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const item of items) {
        rows.push({ id: `mock-${this.table}-${rows.length + 1}`, ...item });
      }
      db[this.table] = rows;
      const data = this.single_ || this.maybe ? items[0] : items;
      return { data, error: null };
    }
    if (this.mode === 'update') {
      let updated: any[] = [];
      db[this.table] = rows.map((r) => {
        if (this.filters.every((f) => f(r))) { const next = { ...r, ...this.payload }; updated.push(next); return next; }
        return r;
      });
      return { data: updated, error: null };
    }
    if (this.mode === 'delete') {
      db[this.table] = rows.filter((r) => !this.filters.every((f) => f(r)));
      return { data: null, error: null };
    }
    let out = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.orderKey) {
      const k = this.orderKey;
      out = [...out].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0) * (this.orderAsc ? 1 : -1));
    }
    if (this.limitN !== null) out = out.slice(0, this.limitN);
    // Emulate the `questions.select('*, options(*)')` join
    if (this.table === 'questions' && this.selectArg.includes('options')) {
      out = out.map((q) => ({ ...q, options: db.options.filter((o) => o.question_id === q.id) }));
    }
    if (this.single_ || this.maybe) {
      const row = out[0] ?? null;
      if (this.single_ && !row) return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      return { data: row, error: null };
    }
    return { data: out, error: null };
  }

  then(resolve: (v: { data: any; error: any }) => any, reject?: any) {
    try { return Promise.resolve(this.run()).then(resolve, reject); }
    catch (e) { return Promise.reject(e); }
  }
}

// ── Mock client ───────────────────────────────────────────────────────────────
export const mockSupabase: any = {
  from: (table: string) => new MockQuery(table),

  auth: {
    getSession: async () => ({ data: { session: mockSession }, error: null }),
    getUser: async () => ({ data: { user: mockSession.user }, error: null }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOtp: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    setSession: async () => ({ data: { session: mockSession }, error: null }),
    refreshSession: async () => ({ data: { session: mockSession }, error: null }),
  },

  functions: {
    invoke: async (name: string, opts?: { body?: any }) => {
      if (name === 'select-daily-question') {
        return { data: { question: { ...QUESTIONS[0], options: db.options.filter((o) => o.question_id === QUESTIONS[0].id) } }, error: null };
      }
      if (name === 'process-checkin') {
        const body = opts?.body ?? {};
        db.responses.push({
          id: `mock-resp-today`,
          user_id: MOCK_USER_ID,
          cycle_id: MOCK_CYCLE_ID,
          question_id: body.question_id,
          option_id: body.option_id,
          day_number: body.day_number ?? TODAY_DAY_NUMBER,
          journal_text: body.journal_text ?? null,
          submitted_at: new Date().toISOString(),
        });
        const today = dateStr(new Date());
        db.alignment_scores.push({
          user_id: MOCK_USER_ID, date: today, score: 58, status_label: 'Forming', trend: 'up',
          mirror_text: 'Direction is holding steady while Energy registers low. The same pressure pattern has surfaced across this week.',
        });
        return { data: { alignmentScore: 58, statusLabel: 'Forming', trend: 'up' }, error: null };
      }
      if (name === 'generate-report') return { data: { ok: true, report_id: 'mock-report-1' }, error: null };
      return { data: {}, error: null };
    },
  },
};

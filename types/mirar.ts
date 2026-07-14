// ─── Theme Codes ─────────────────────────────────────────────────────────────
export type ThemeCode = 'IAP' | 'EWB' | 'FAF' | 'RC' | 'GAL' | 'RA';

export type SignalLevel = 'Low' | 'Medium' | 'High';
export type SignalPoints = 1 | 2 | 3;

export type ThemeStatus =
  | 'Under Load'
  | 'Stabilizing'
  | 'Forming'
  | 'Aligned'
  | 'No Reading';

export type AlignmentStatus =
  | 'Calibrating'
  | 'Under Load'
  | 'Stabilizing'
  | 'Forming'
  | 'Aligned';

export type AlignmentTrend = 'up' | 'down' | 'steady' | 'new';
export type StageAffinity = 'awareness' | 'realignment' | 'action' | 'reflection' | 'any';
export type ColorScheme = 'light' | 'dark' | 'system';
export type StageStatus = 'WAITING' | 'DUE' | 'GENERATED';
export type CycleStatus = 'active' | 'completed' | 'paused';

// ─── Theme Metadata ───────────────────────────────────────────────────────────
export interface ThemeMeta {
  code: ThemeCode;
  name: string;
  shortDescription: string;
}

// ─── Database Row Types ───────────────────────────────────────────────────────
export interface UserRow {
  id: string;
  mirar_id: string;
  email: string;
  created_at: string;
  current_cycle: number;
  cycle_start_date: string | null;
  onboarding_completed: boolean;
}

export interface CycleRow {
  id: string;
  user_id: string;
  cycle_number: number;
  start_date: string;
  stage1_start: string | null;
  stage2_start: string | null;
  stage3_start: string | null;
  stage4_start: string | null;
  status: CycleStatus;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  day_number: number | null;
  stage: number;
  prompt_text: string;
  helper_text: string | null;
  journal_prompt: string | null;
  mirror_glimmer: string | null;
  tomorrow_tease: string | null;
  theme_1: ThemeCode;
  theme_2: ThemeCode;
  depth_level: number;
  stage_affinity: StageAffinity;
  active: boolean;
  created_at: string;
}

export interface OptionRow {
  id: string;
  question_id: string;
  option_number: number; // 1–5
  option_text: string;
  theme_1_code: ThemeCode;
  theme_1_level: SignalLevel;
  theme_1_points: SignalPoints;
  theme_2_code: ThemeCode;
  theme_2_level: SignalLevel;
  theme_2_points: SignalPoints;
  signal_note: string | null;
  created_at: string;
}

export interface ResponseRow {
  id: string;
  user_id: string;
  cycle_id: string;
  question_id: string;
  option_id: string;
  day_number: number;
  journal_text: string | null;
  submitted_at: string;
}

export interface ThemeScoreRow {
  id: string;
  user_id: string;
  cycle_id: string;
  stage: number; // 1–4, or 0 for overall
  theme_code: ThemeCode;
  signal_count: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  average_score: number | null;
  status: ThemeStatus;
  computed_at: string;
}

export interface AlignmentScoreRow {
  id: string;
  user_id: string;
  date: string;
  score: number;
  status_label: AlignmentStatus;
  trend: AlignmentTrend;
  mirror_text: string | null;
  computed_at: string;
}

// Submitted option's signal breakdown — for "What Shifted" post-check-in
export interface SubmittedSignal {
  theme1Code: ThemeCode;
  theme1Level: SignalLevel;
  theme2Code: ThemeCode;
  theme2Level: SignalLevel;
  scoreBefore: number | null;
  scoreAfter: number | null;
  tomorrowTease: string | null;
  // Identity-vector pattern flag for each touched theme, read from
  // alignment_identity_vectors as of just before this check-in (may be
  // null for new users or before the identity vector has ever run).
  theme1PatternFlag: string | null;
  theme2PatternFlag: string | null;
}

export interface QuestionHistoryRow {
  id: string;
  user_id: string;
  question_id: string;
  cycle_id: string;
  day_number: number;
  served_at: string;
}

export interface ReportRow {
  id: string;
  user_id: string;
  cycle_id: string;
  stage: number; // 1–4 or 0 for overall
  coverage: number;
  coverage_total: number;
  primary_signals: string | null;
  calibration_checks: string | null;
  summary_text: string | null;
  full_report_text: string | null;
  status: 'pending' | 'generated' | 'delivered';
  due_at: string | null;
  generated_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface PushTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
}

// ─── App-Level Composite Types ────────────────────────────────────────────────
export interface QuestionWithOptions extends QuestionRow {
  options: OptionRow[];
}

export interface ThemeScore {
  code: ThemeCode;
  name: string;
  status: ThemeStatus;
  average: number | null;
  lowCount: number;
  mediumCount: number;
  highCount: number;
  signalCount: number;
}

export interface StageOverview {
  stage: number;
  label: string;
  description: string;
  dayRange: [number, number];
  startDate: string | null;
  coverage: number; // 0–7
  status: StageStatus;
  themeScores: ThemeScore[];
  reportId: string | null;
  reportStatus: 'pending' | 'generated' | 'delivered' | null;
}

export interface CycleOverview {
  cycleId: string;
  cycleNumber: number;
  startDate: string;
  currentDay: number; // 1–28
  currentStage: number; // 1–4
  totalCoverage: number; // 0–28
  stages: StageOverview[];
}

export interface CheckInState {
  questionId: string | null;
  question: QuestionWithOptions | null;
  selectedOptionId: string | null;
  journalText: string;
  isSubmitting: boolean;
  isCompleted: boolean; // already completed today
  completedOptionId: string | null;
  completedAt: string | null;
  submittedSignal: SubmittedSignal | null; // populated after submission
}

// ─── Report Display Types ─────────────────────────────────────────────────────
export interface ReportDisplay {
  report: ReportRow;
  stage: number;
  stageLabel: string;
  coverage: number;
  coverageTotal: number;
  themeBlocks: ThemeBlock[];
  primarySignals: string[];
  calibrationChecks: string[];
  summaryText: string | null;
}

export interface ThemeBlock {
  code: ThemeCode;
  name: string;
  status: ThemeStatus;
  averageScore: number | null;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface AuthSession {
  userId: string;
  mirarid: string;
  email: string;
  accessToken: string;
}

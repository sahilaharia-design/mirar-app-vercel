import { ThemeCode, ThemeMeta, ThemeStatus, AlignmentStatus } from '../types/mirar';

// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Backgrounds
  cream: '#F0EDE8',
  creamDark: '#E8E4DE',
  creamLight: '#F7F5F2',

  // Text
  slate: '#4A4A55',
  slateMid: '#6B6B78',
  slateLight: '#9494A0',
  slateXLight: '#C4C4CC',

  // Status
  aligned: '#5A8A6A',     // Warm green
  alignedBg: '#EAF4EC',
  forming: '#B07A2A',     // Warm amber
  formingBg: '#FBF3E4',
  stabilizing: '#4A7CA8', // Soft blue
  stabilizingBg: '#E8F2FA',
  underLoad: '#B85A4A',   // Muted coral
  underLoadBg: '#FAE8E5',
  noReading: '#9494A0',   // Light gray
  noReadingBg: '#F0F0F2',

  // Accent gradient endpoints (for BrandOval)
  gradientStart: '#8BA5D4', // Soft blue-lavender
  gradientEnd: '#E8B89A',   // Warm peach

  // Warm accents
  warmGlow: '#F4E8D1',
  warmGlowLight: '#FAF4EA',
  accentTeal: '#5A9E8F',
  shimmer: 'rgba(255,255,255,0.15)',
  teal: '#5A9E8F',

  // UI
  white: '#FFFFFF',
  border: '#E0DDD8',
  borderLight: '#EAE7E2',
  overlay: 'rgba(74,74,85,0.4)',
  transparent: 'transparent',

  // Shadows
  shadowColor: '#4A4A55',

  // ─── V3 · Linen & Brass tokens ──────────────────────────────────────────────
  ink: '#2A2A30',
  paper: '#FAF7F2',
  rule: '#D8D3CC',
  ruleLight: '#E6E1D9',
  brass: '#8C7339',
  signalLow: '#B85A4A',
  signalMid: '#B07A2A',
  signalHigh: '#5A8A6A',
  signalCalm: '#6A8BB5',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 48,
  '5xl': 58,
  '6xl': 72,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// ─── Theme Metadata ───────────────────────────────────────────────────────────
export const THEMES: Record<ThemeCode, ThemeMeta> = {
  IAP: {
    code: 'IAP',
    name: 'Direction',
    shortDescription: 'What feels true, chosen, and internally clear',
  },
  EWB: {
    code: 'EWB',
    name: 'Energy',
    shortDescription: 'Capacity, heaviness, steadiness, and recovery',
  },
  FAF: {
    code: 'FAF',
    name: 'Attention',
    shortDescription: 'Where your mind keeps returning',
  },
  RC: {
    code: 'RC',
    name: 'Connection',
    shortDescription: 'How honest and spacious relationships feel',
  },
  GAL: {
    code: 'GAL',
    name: 'Growth',
    shortDescription: 'Openness, change, and what is becoming visible',
  },
  RA: {
    code: 'RA',
    name: 'Movement',
    shortDescription: 'Small steps, hesitation, and follow-through',
  },
};

export const THEME_ORDER: ThemeCode[] = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'];

// ─── Scoring Thresholds ───────────────────────────────────────────────────────
export const SIGNAL_POINTS: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export const STATUS_THRESHOLDS: Array<{ max: number; status: ThemeStatus }> = [
  { max: 1.5, status: 'Under Load' },
  { max: 2.0, status: 'Stabilizing' },
  { max: 2.5, status: 'Forming' },
  { max: Infinity, status: 'Aligned' },
];

// ─── Cycle / Stage Structure ──────────────────────────────────────────────────
export const STAGES = [
  { number: 1, label: 'First Signals', description: 'What became noticeable', days: [1, 7] as [number, number] },
  { number: 2, label: 'Patterns Emerge', description: 'Where adjustment signals appeared', days: [8, 14] as [number, number] },
  { number: 3, label: 'Signal in Action', description: 'Where movement occurred', days: [15, 21] as [number, number] },
  { number: 4, label: 'Mirror Deepens', description: 'What remained visible by the end of the cycle', days: [22, 28] as [number, number] },
] as const;

export const CYCLE_DAYS = 28;
export const STAGE_DAYS = 7;
// Report generates after stage start + 6 days + 20 hours
export const REPORT_DELAY_MS = (6 * 24 + 20) * 60 * 60 * 1000;

// ─── Status Display Config ────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  ThemeStatus,
  { label: string; color: string; bg: string }
> = {
  Aligned: { label: 'Aligned', color: COLORS.aligned, bg: COLORS.alignedBg },
  Forming: { label: 'Forming', color: COLORS.forming, bg: COLORS.formingBg },
  Stabilizing: { label: 'Stabilizing', color: COLORS.stabilizing, bg: COLORS.stabilizingBg },
  'Under Load': { label: 'Under Load', color: COLORS.underLoad, bg: COLORS.underLoadBg },
  'No Reading': { label: 'No Reading', color: COLORS.noReading, bg: COLORS.noReadingBg },
};

// ─── Alignment Score Thresholds (0–100) ──────────────────────────────────────
export const ALIGNMENT_THRESHOLDS: Array<{ max: number; status: AlignmentStatus; color: string }> = [
  { max: 38,       status: 'Under Load',   color: '#C47058' },
  { max: 50,       status: 'Stabilizing',  color: '#6B8FB5' },
  { max: 75,       status: 'Forming',      color: '#D4A843' },
  { max: Infinity, status: 'Aligned',      color: '#5B8C5A' },
];

export function getAlignmentColor(score: number | null): string {
  if (score === null) return '#C8C4BF';
  for (const t of ALIGNMENT_THRESHOLDS) {
    if (score < t.max) return t.color;
  }
  return '#5B8C5A';
}

export function getAlignmentStatus(score: number | null): AlignmentStatus {
  if (score === null) return 'Calibrating';
  for (const t of ALIGNMENT_THRESHOLDS) {
    if (score < t.max) return t.status;
  }
  return 'Aligned';
}

// ─── Dark Mode Colors ─────────────────────────────────────────────────────────
export const DARK_COLORS = {
  // Backgrounds
  cream: '#1A1A1F',
  creamDark: '#131318',
  creamLight: '#22222A',

  // Text
  slate: '#E8E4DF',
  slateMid: '#B8B4B0',
  slateLight: '#7A7A88',
  slateXLight: '#4A4A58',

  // Status (brightened for dark bg)
  aligned: '#6BA86A',
  alignedBg: '#1A2E1A',
  forming: '#D4B043',
  formingBg: '#2A2310',
  stabilizing: '#6B9FD4',
  stabilizingBg: '#101E2E',
  underLoad: '#D47060',
  underLoadBg: '#2E1510',
  noReading: '#5A5A68',
  noReadingBg: '#252530',

  // Accent gradient (same — pops on dark)
  gradientStart: '#8BA5D4',
  gradientEnd: '#E8B89A',

  // Warm accents
  warmGlow: '#2A2518',
  warmGlowLight: '#252018',
  accentTeal: '#4A8E7F',
  shimmer: 'rgba(255,255,255,0.06)',
  teal: '#4A8E7F',

  // UI
  white: '#252528',
  border: '#2E2E38',
  borderLight: '#252530',
  overlay: 'rgba(0,0,0,0.6)',
  transparent: 'transparent',

  // Shadows
  shadowColor: '#000000',

  // ─── V3 · Linen & Brass tokens (dark) ─────────────────────────────────────
  ink: '#EDEAE3',
  paper: '#1E1E24',
  rule: '#38383F',
  ruleLight: '#2C2C33',
  brass: '#C9A860',
  signalLow: '#D47060',
  signalMid: '#D4B043',
  signalHigh: '#6BA86A',
  signalCalm: '#6B9FD4',
} as const;

// ─── Theme Accent Colors (6 themes, light + dark variants) ───────────────────
export const THEME_COLORS: Record<ThemeCode, { light: string; dark: string }> = {
  IAP: { light: '#7C6FA0', dark: '#A08CC8' }, // purple — direction/purpose
  EWB: { light: '#C07840', dark: '#E09050' }, // amber — energy
  FAF: { light: '#4A7CA8', dark: '#6A9CC8' }, // blue — focus
  RC:  { light: '#6A9870', dark: '#8AB890' }, // green — relationships
  GAL: { light: '#A0884A', dark: '#C0A860' }, // gold — growth
  RA:  { light: '#B85A4A', dark: '#D87A6A' }, // red-orange — resilience
};

// ─── Notification Copy ────────────────────────────────────────────────────────
export const NOTIFICATION_COPY = {
  dailyReminder: (_day: number) => `Your mirror is ready today. Takes less than 2 minutes.`,
  stageReady: (_stage: number) => `A new reflection summary is ready.`,
  cycleComplete: 'Your full pattern summary is ready.',
} as const;

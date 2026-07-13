/**
 * ThemeDetailSheet — V3 · Linen & Brass
 *
 * Modal detail screen for a single alignment theme.
 * Presented as a bottom sheet from the Signals tab when a theme card is tapped.
 *
 * Layout:
 * ─ Ambient gradient header (top-left blue / top-right warm)
 * ─ Header strip: ← Signals  |  CODE · Cycle N  (caps)
 * ─ Theme name 36px serif, italic brass "&" ampersand
 * ─ Short description 13px slateMid
 * ─ Brass underline 40px
 * ─ Current reading: 54px serif status + brass trend badge + Coverage counter
 * ─ Threshold bar (gradient strip, 5 ticks, static marker)
 * ─ 28-day daily signature SVG
 * ─ Observed rows (2–3, derived from data)
 *
 * Light-mode only — uses COLORS directly, no useColors().
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  SPACING,
  CYCLE_DAYS,
} from '../../lib/constants';
import {
  V3_SETTLE_EASING,
  V3_SETTLE_DURATION,
  V3_STAGGER_MS,
  V3_UNDERLINE_EASING,
  V3_UNDERLINE_DURATION,
  V3_UNDERLINE_DELAY,
  V3_REDUCED_FADE_DURATION,
} from '../../lib/animations';
import { ThemeCode, ThemeStatus, ThemeScore, StageOverview } from '../../types/mirar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThemeDataPoint {
  day: number;
  average: number | null;
}

interface ObsRow {
  text: string;
  meta: string;
  brass: boolean;
}

export interface ThemeDetailSheetProps {
  visible: boolean;
  themeCode: ThemeCode | null;
  cycleNumber?: number;
  currentDay?: number;
  stageOverviews?: StageOverview[];
  themeHistories?: Record<ThemeCode, ThemeDataPoint[]> | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 26;
const USABLE_W = SCREEN_W - H_PAD * 2;

function levelNum(avg: number | null): 1 | 2 | 3 | null {
  if (avg === null) return null;
  if (avg < 1.5) return 1;
  if (avg < 2.5) return 2;
  return 3;
}

const STATUS_KEY: Record<ThemeStatus, string> = {
  Aligned: 'status.aligned',
  Forming: 'status.forming',
  Stabilizing: 'status.stabilizing',
  'Under Load': 'status.under_load',
  'No Reading': 'status.no_reading',
};

/** Convert theme average (1–3) to bar position 0–100 */
function avgToBarPct(avg: number | null): number {
  if (avg === null) return 50;
  return Math.min(100, Math.max(0, ((avg - 1) / 2) * 100));
}

/** Derive trend badge text from history */
function trendBadge(history: ThemeDataPoint[]): string | null {
  const valid = history.filter((h) => h.average !== null);
  if (valid.length < 3) return null;
  const recent = valid.slice(-3).map((h) => h.average as number);
  const delta = recent[2] - recent[0];
  if (delta <= -0.3) return `↓ ${valid.length}d`;
  if (delta >= 0.3) return `↑ ${valid.length}d`;
  return null;
}

/** Build 2–3 observed rows from real data */
function buildObservations(t: (key: string, opts?: any) => string, score: ThemeScore, history: ThemeDataPoint[]): ObsRow[] {
  const obs: ObsRow[] = [];
  const { lowCount, mediumCount, highCount, signalCount, status } = score;

  if (signalCount === 0) {
    obs.push({ text: t('theme_detail.obs_not_enough'), meta: t('theme_detail.meta_still_forming'), brass: false });
    return obs;
  }

  // Row 1: Distribution statement
  const midHigh = mediumCount + highCount;
  obs.push({
    text: t('theme_detail.obs_distribution', { midHigh, total: signalCount }),
    meta: t('theme_detail.meta_recent_reflections'),
    brass: false,
  });

  // Row 2: Status-driven pattern
  if (status === 'Under Load' && lowCount >= 2) {
    obs.push({
      text: t('theme_detail.obs_pressure', { n: lowCount }),
      meta: t('theme_detail.meta_pattern_present'),
      brass: true,
    });
  } else if (status === 'Aligned' && highCount >= 2) {
    obs.push({
      text: t('theme_detail.obs_steadiness', { n: highCount }),
      meta: t('theme_detail.meta_holding_steady'),
      brass: false,
    });
  } else if (status === 'Forming' || status === 'Stabilizing') {
    obs.push({
      text: t('theme_detail.obs_forming_vary'),
      meta: t('theme_detail.meta_still_forming'),
      brass: false,
    });
  }

  // Row 3: Trend observation from history
  const validH = history.filter((h) => h.average !== null);
  if (validH.length >= 3) {
    const recent = validH.slice(-3).map((h) => h.average as number);
    const delta = recent[2] - recent[0];
    if (delta <= -0.3) {
      obs.push({
        text: t('theme_detail.obs_trend_down'),
        meta: t('theme_detail.meta_recent_shift'),
        brass: true,
      });
    } else if (delta >= 0.3) {
      obs.push({
        text: t('theme_detail.obs_trend_up'),
        meta: t('theme_detail.meta_recent_shift'),
        brass: false,
      });
    }
  }

  return obs.slice(0, 3);
}

/** Split "Focus & Flow" → ["Focus ", "&", " Flow"] */
function splitThemeName(name: string): [string, string, string] | null {
  const idx = name.indexOf(' & ');
  if (idx < 0) return null;
  return [name.slice(0, idx + 1), '&', name.slice(idx + 2)];
}

// ─── Animated section wrapper ─────────────────────────────────────────────────

function FadeSlide({
  children,
  delayMs,
  reducedMotion,
  style,
}: {
  children: React.ReactNode;
  delayMs: number;
  reducedMotion: boolean;
  style?: object;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(reducedMotion ? 0 : 6);

  useEffect(() => {
    const duration = reducedMotion ? V3_REDUCED_FADE_DURATION : V3_SETTLE_DURATION;
    const easing = reducedMotion ? undefined : V3_SETTLE_EASING;
    opacity.value = withDelay(delayMs, withTiming(1, { duration, easing }));
    if (!reducedMotion) {
      translateY.value = withDelay(delayMs, withTiming(0, { duration, easing: V3_SETTLE_EASING }));
    }
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── Daily Signature SVG ──────────────────────────────────────────────────────

function DailySignature({
  history,
  currentDay,
}: {
  history: ThemeDataPoint[];
  currentDay: number;
}) {
  const W = USABLE_W;
  const H = 72;
  const midY = 36;

  // Build a lookup: day → level
  const levelMap: Record<number, 1 | 2 | 3 | null> = {};
  for (const pt of history) {
    levelMap[pt.day] = levelNum(pt.average);
  }

  const xOf = (i: number) => H_PAD + i * ((W - 0) / 27); // i = 0..27

  // Stage 1 midpoint: day 7 (index 6), Stage 2 midpoint: day 14 (index 13)
  // Divider at index 13 (day 14, halfway)
  const dividerX = xOf(13);
  const stageLabel1X = xOf(6);
  const stageLabel2X = xOf(20);

  return (
    <Svg width={SCREEN_W} height={H + 16} style={{ marginLeft: -H_PAD }}>
      {/* Baseline */}
      <Line
        x1={H_PAD}
        y1={midY}
        x2={SCREEN_W - H_PAD}
        y2={midY}
        stroke={COLORS.ruleLight}
        strokeWidth={1}
      />

      {/* Day bars */}
      {Array.from({ length: CYCLE_DAYS }).map((_, i) => {
        const day = i + 1;
        const x = xOf(i);
        const done = day <= currentDay;
        const lv = levelMap[day] ?? null;

        if (!done) {
          // Future stub
          return (
            <Line
              key={day}
              x1={x}
              y1={midY - 3}
              x2={x}
              y2={midY + 3}
              stroke={COLORS.slateXLight}
              strokeWidth={1}
            />
          );
        }

        if (lv === null) {
          // Completed day but no data — short neutral stub
          return (
            <Line
              key={day}
              x1={x}
              y1={midY - 4}
              x2={x}
              y2={midY + 4}
              stroke={COLORS.rule}
              strokeWidth={1}
              strokeLinecap="round"
            />
          );
        }

        const len = lv === 3 ? 22 : lv === 2 ? 12 : 5;
        const color = lv === 3 ? COLORS.signalHigh : lv === 2 ? COLORS.slate : COLORS.signalLow;
        return (
          <Line
            key={day}
            x1={x}
            y1={midY - len}
            x2={x}
            y2={midY + len}
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        );
      })}

      {/* Gentle divider between recent reflection windows */}
      <Line
        x1={dividerX}
        y1={8}
        x2={dividerX}
        y2={H - 6}
        stroke={COLORS.brass}
        strokeWidth={1}
        strokeDasharray="1,3"
      />

      {/* Window labels */}
      <SvgText
        x={stageLabel1X}
        y={6}
        fontSize={7}
        fontFamily={Platform.OS === 'ios' ? 'System' : 'sans-serif'}
        letterSpacing={1.2}
        fill={COLORS.slateLight}
        textAnchor="middle"
      >
        RECENT
      </SvgText>
      <SvgText
        x={stageLabel2X}
        y={6}
        fontSize={7}
        fontFamily={Platform.OS === 'ios' ? 'System' : 'sans-serif'}
        letterSpacing={1.2}
        fill={COLORS.slateLight}
        textAnchor="middle"
      >
        EARLIER
      </SvgText>
    </Svg>
  );
}

// ─── Threshold Bar (static) ───────────────────────────────────────────────────

function ThresholdBar({ average }: { average: number | null }) {
  const [barWidth, setBarWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const pct = avgToBarPct(average);
  const markerLeft = barWidth > 0 ? (pct / 100) * barWidth - 10 : -999;

  return (
    <View style={styles.threshBar} onLayout={handleLayout}>
      <LinearGradient
        colors={[COLORS.signalLow, COLORS.signalCalm, COLORS.signalMid, COLORS.signalHigh]}
        locations={[0, 0.38, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.threshGradient}
      />
      {[0, 38, 50, 75, 100].map((p) => (
        <View key={p} style={[styles.threshTick, { left: `${p}%` as any }]} />
      ))}
      {barWidth > 0 && (
        <View style={[styles.threshMarker, { left: markerLeft }]} />
      )}
    </View>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export function ThemeDetailSheet({
  visible,
  themeCode,
  cycleNumber = 1,
  currentDay = 1,
  stageOverviews = [],
  themeHistories,
  onClose,
}: ThemeDetailSheetProps) {
  const { t } = useTranslation();
  const reducedMotion = useRef(false);
  const underlineScale = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reducedMotion.current = v;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      reducedMotion.current = v;
    });
    return () => sub.remove();
  }, []);

  // Reset underline on each open
  useEffect(() => {
    if (!visible) return;
    underlineScale.value = 0;
    const delay = reducedMotion.current ? 0 : V3_UNDERLINE_DELAY;
    const duration = reducedMotion.current ? V3_REDUCED_FADE_DURATION : V3_UNDERLINE_DURATION;
    underlineScale.value = withDelay(delay + 200, withTiming(1, {
      duration,
      easing: V3_UNDERLINE_EASING,
    }));
  }, [visible]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: underlineScale.value }],
  }));

  if (!themeCode) return null;

  const themeName = t(`themes.${themeCode}`);
  const themeShortDesc = t(`themes.${themeCode}_short`);
  const history: ThemeDataPoint[] = themeHistories?.[themeCode] ?? [];

  // Aggregate ThemeScore across all stage overviews for this theme
  let aggregateScore: ThemeScore | null = null;
  for (const stage of stageOverviews) {
    const ts = stage.themeScores.find((s) => s.code === themeCode);
    if (ts) {
      if (!aggregateScore) {
        aggregateScore = { ...ts };
      } else {
        const previousScore: ThemeScore = aggregateScore;
        aggregateScore = {
          ...previousScore,
          lowCount: previousScore.lowCount + ts.lowCount,
          mediumCount: previousScore.mediumCount + ts.mediumCount,
          highCount: previousScore.highCount + ts.highCount,
          signalCount: previousScore.signalCount + ts.signalCount,
          average: ts.average, // use most recent stage's average
          status: ts.status,   // use most recent stage's status
        };
      }
    }
  }

  const currentStatus: ThemeStatus = aggregateScore?.status ?? 'No Reading';
  const currentAverage: number | null = aggregateScore?.average ?? null;
  const totalSignals = aggregateScore?.signalCount ?? 0;
  const badge = trendBadge(history);
  const observations = aggregateScore ? buildObservations(t, aggregateScore, history) : [];
  const nameParts = splitThemeName(themeName);

  const stagger = (i: number) => i * V3_STAGGER_MS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Ambient gradient header */}
        <LinearGradient
          colors={[
            'rgba(139,165,212,0.09)',
            'rgba(232,184,154,0.13)',
            'transparent',
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={styles.ambientGradient}
          pointerEvents="none"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header strip ───────────────────────────────────────────── */}
          <FadeSlide delayMs={stagger(0)} reducedMotion={reducedMotion.current}>
            <View style={styles.headerStrip}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel={t('theme_detail.back_to_signals_a11y')}
              >
                <Text style={styles.capsLabel}>← {t('theme_detail.back_signals')}</Text>
              </TouchableOpacity>
              <Text style={styles.capsLabel}>
                {t('theme_detail.reflection_area')}
              </Text>
            </View>
            <View style={styles.rule} />
          </FadeSlide>

          {/* ── Theme title ─────────────────────────────────────────────── */}
          <FadeSlide delayMs={stagger(1)} reducedMotion={reducedMotion.current} style={styles.titleSection}>
            <Text style={styles.themeName} adjustsFontSizeToFit={false}>
              {nameParts ? (
                <>
                  <Text style={styles.themeNamePlain}>{nameParts[0]}</Text>
                  <Text style={styles.themeNameAmp}>{'&'}</Text>
                  <Text style={styles.themeNamePlain}>{nameParts[2]}</Text>
                </>
              ) : (
                <Text style={styles.themeNamePlain}>{themeName}</Text>
              )}
            </Text>
            <Text style={styles.themeDesc}>{themeShortDesc}</Text>
            <Animated.View style={[styles.brasUnderline, underlineStyle]} />
          </FadeSlide>

          {/* ── Current reading + coverage ──────────────────────────────── */}
          <FadeSlide delayMs={stagger(2)} reducedMotion={reducedMotion.current} style={styles.readingSection}>
            <View style={styles.readingRow}>
              {/* Left: status label + trend */}
              <View>
                <Text style={styles.capsLabel}>{t('theme_detail.now')}</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.statusNum}>{t(STATUS_KEY[currentStatus])}</Text>
                  {badge ? (
                    <Text style={styles.trendBadge}>{badge}</Text>
                  ) : null}
                </View>
              </View>
              {/* Right: coverage */}
              <View style={styles.coverageBlock}>
                <Text style={styles.capsLabel}>{t('theme_detail.reflections')}</Text>
                <Text style={styles.coverageNum}>
                  {t('theme_detail.recorded_count', { n: totalSignals })}
                </Text>
              </View>
            </View>

            {/* Threshold bar */}
            <View style={styles.threshWrapper}>
              <ThresholdBar average={currentAverage} />
            </View>
          </FadeSlide>

          {/* ── Daily signature ─────────────────────────────────────────── */}
          <FadeSlide delayMs={stagger(3)} reducedMotion={reducedMotion.current} style={styles.signatureSection}>
            <Text style={[styles.capsLabel, { marginBottom: 10 }]}>
              {t('theme_detail.recent_pattern')}
            </Text>
            <DailySignature history={history} currentDay={currentDay} />
          </FadeSlide>

          {/* ── Observed rows ───────────────────────────────────────────── */}
          {observations.length > 0 && (
            <FadeSlide delayMs={stagger(4)} reducedMotion={reducedMotion.current} style={styles.observedSection}>
              <Text style={[styles.capsLabel, { marginBottom: 10 }]}>{t('theme_detail.what_showed_up')}</Text>
              <View style={styles.obsCard}>
                {observations.map((obs, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.obsDivider} />}
                    <View style={styles.obsRow}>
                      <View style={styles.obsTextBlock}>
                        <Text
                          style={[
                            styles.obsText,
                            obs.brass && styles.obsTextItalic,
                          ]}
                        >
                          {obs.text}
                        </Text>
                        <Text
                          style={[
                            styles.obsMeta,
                            obs.brass && { color: COLORS.brass },
                          ]}
                        >
                          {obs.meta}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </FadeSlide>
          )}

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  ambientGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    zIndex: 1,
  },
  scroll: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 56,
    paddingBottom: 24,
  },

  // Header strip
  headerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  rule: {
    height: 1,
    backgroundColor: COLORS.ruleLight,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  capsLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.slateLight,
  },

  // Theme title section
  titleSection: {
    marginBottom: 22,
  },
  themeName: {
    fontSize: 36,
    lineHeight: 36 * 1.05,
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  themeNamePlain: {
    fontFamily: FONTS.display,
    fontSize: 36,
    color: COLORS.ink,
  },
  themeNameAmp: {
    fontFamily: FONTS.displayItalic,
    fontSize: 36,
    color: COLORS.brass,
    fontStyle: 'italic',
  },
  themeDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.slateMid,
    marginTop: 6,
    lineHeight: 13 * 1.5,
  },
  brasUnderline: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.brass,
    marginTop: 10,
    transformOrigin: 'left',
  },

  // Reading section
  readingSection: {
    marginBottom: 22,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  statusNum: {
    fontFamily: FONTS.display,
    fontSize: 54,
    lineHeight: 54,
    color: COLORS.ink,
    letterSpacing: -1.5,
  },
  trendBadge: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.brass,
    textTransform: 'uppercase',
  },
  coverageBlock: {
    alignItems: 'flex-end',
  },
  coverageNum: {
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 26,
    color: COLORS.ink,
    marginTop: 4,
  },

  // Threshold bar
  threshWrapper: {
    height: 28,
    marginTop: 0,
  },
  threshBar: {
    position: 'relative',
    height: 28,
    justifyContent: 'center',
  },
  threshGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 11,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  threshTick: {
    position: 'absolute',
    top: 5,
    width: 1,
    height: 18,
    backgroundColor: COLORS.slateMid,
    opacity: 0.45,
  },
  threshMarker: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.paper,
    borderWidth: 2,
    borderColor: COLORS.ink,
  },

  // Signature section
  signatureSection: {
    marginBottom: 22,
  },

  // Observed rows
  observedSection: {
    marginBottom: 0,
  },
  obsCard: {
    backgroundColor: COLORS.paper,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.ruleLight,
  },
  obsDivider: {
    height: 1,
    backgroundColor: COLORS.ruleLight,
  },
  obsRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  obsTextBlock: {
    flex: 1,
  },
  obsText: {
    fontFamily: FONTS.display,
    fontSize: 16,
    lineHeight: 16 * 1.35,
    color: COLORS.ink,
  },
  obsTextItalic: {
    fontFamily: FONTS.displayItalic,
    fontStyle: 'italic',
  },
  obsMeta: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: COLORS.slateLight,
    marginTop: 3,
  },
});

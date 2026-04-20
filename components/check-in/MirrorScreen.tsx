import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  AccessibilityInfo,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeShiftCard } from './ThemeShiftCard';
import {
  COLORS,
  FONTS,
  CYCLE_DAYS,
  getAlignmentStatus,
  THEMES,
} from '../../lib/constants';
import {
  V3_SETTLE_EASING,
  V3_SETTLE_DURATION,
  V3_STAGGER_MS,
  V3_UNDERLINE_EASING,
  V3_UNDERLINE_DURATION,
  V3_UNDERLINE_DELAY,
  V3_MARKER_EASING,
  V3_MARKER_DURATION,
  V3_MARKER_DELAY,
  V3_REDUCED_FADE_DURATION,
} from '../../lib/animations';
import { supabase } from '../../lib/supabase';
import { ThemeCode, SignalLevel } from '../../types/mirar';

// Declared at module level — must not be inside a component to avoid re-creation on every render
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── Prop contract (unchanged from previous version) ───────────────────────────
interface MirrorScreenProps {
  userId: string;
  dayNumber: number;
  cycleNumber: number;
  alignmentScore: number | null;
  scoreBefore: number | null;
  theme1Code: ThemeCode;
  theme1Level: SignalLevel;
  theme2Code: ThemeCode;
  theme2Level: SignalLevel;
  /** Accepted for back-compat. V3 footer shows static "Tomorrow at dawn" instead. */
  tomorrowTease: string | null;
  onDone: () => void;
}

// ── Signature helpers ─────────────────────────────────────────────────────────
function markLen(score: number | null): number {
  if (score === null) return 2;
  if (score >= 75) return 20;
  if (score >= 38) return 10;
  return 4;
}

function markColor(score: number | null): string {
  if (score === null) return COLORS.slateXLight;
  if (score >= 75) return COLORS.signalHigh;
  if (score >= 38) return COLORS.slate;
  return COLORS.signalLow;
}

// ── Delta helpers ─────────────────────────────────────────────────────────────
function deltaLabel(before: number | null, after: number | null): string {
  if (after === null || before === null) return '';
  const d = after - before;
  if (Math.abs(d) <= 2) return '— steady';
  return d > 0 ? `Δ +${Math.round(d)}` : `Δ ${Math.round(d)} · drifting`;
}

function deltaColor(before: number | null, after: number | null): string {
  if (after === null || before === null) return COLORS.slateLight;
  const d = after - before;
  if (Math.abs(d) <= 2) return COLORS.slateLight;
  return d > 0 ? COLORS.signalHigh : COLORS.brass;
}

// ── Fallback mirror text (AI generation timed out) ────────────────────────────
function buildFallbackMirror(
  score: number | null,
  t1: ThemeCode, l1: SignalLevel,
  t2: ThemeCode, l2: SignalLevel,
): string {
  const t1Name = THEMES[t1]?.name ?? t1;
  const t2Name = THEMES[t2]?.name ?? t2;
  const levelMap: Record<SignalLevel, string> = {
    Low: 'low signal levels',
    Medium: 'mid signal levels',
    High: 'high signal levels',
  };
  const status = score !== null ? getAlignmentStatus(score) : null;
  const statusLine = status ? `Alignment registered at ${status.toLowerCase()} today.` : '';
  return `${t1Name} registered ${levelMap[l1]}. ${t2Name} registered ${levelMap[l2]}. ${statusLine}`.trim();
}

// ── ThresholdBar ──────────────────────────────────────────────────────────────
function ThresholdBar({
  score,
  reduceMotion,
}: {
  score: number | null;
  reduceMotion: boolean;
}) {
  const markerLeft = useSharedValue(-24);
  const markerAnimated = useRef(false);

  const markerCircleStyle = useAnimatedStyle(() => ({ left: markerLeft.value }));
  // Inner dot is centered inside the 24px circle: offset = (24 - 8) / 2 = 8
  const markerDotStyle = useAnimatedStyle(() => ({ left: markerLeft.value + 8 }));

  const handleBarLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (markerAnimated.current || score === null) return;
      const width = e.nativeEvent.layout.width;
      if (width <= 0) return;
      markerAnimated.current = true;
      const target = Math.max(0, width * (score / 100) - 12);
      const start = Math.max(0, width * 0.12 - 12);
      markerLeft.value = start;
      markerLeft.value = reduceMotion
        ? target
        : withDelay(
            V3_MARKER_DELAY,
            withTiming(target, { duration: V3_MARKER_DURATION, easing: V3_MARKER_EASING }),
          );
    },
    [score, reduceMotion],
  );

  return (
    <View>
      {/* Bar + marker */}
      <View style={styles.barContainer} onLayout={handleBarLayout}>
        <LinearGradient
          colors={[COLORS.signalLow, COLORS.signalCalm, COLORS.signalMid, COLORS.signalHigh]}
          locations={[0, 0.38, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.barGradient}
        />
        {[0, 38, 50, 75, 100].map((p) => (
          <View key={p} style={[styles.tick, { left: `${p}%` as any }]} />
        ))}
        {score !== null && (
          <>
            <Animated.View style={[styles.markerOuter, markerCircleStyle]} />
            <Animated.View style={[styles.markerDot, markerDotStyle]} />
          </>
        )}
      </View>
      {/* Zone labels */}
      <View style={styles.barLabels}>
        {['Under load', 'Stabilizing', 'Forming', 'Aligned'].map((l) => (
          <Text key={l} style={styles.barLabel}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// ── DaySignature ──────────────────────────────────────────────────────────────
// 14 vertical marks encoding magnitude; brass drift arc if last 3 show sustained low.
function DaySignature({
  history,
  reduceMotion,
}: {
  history: (number | null)[];
  reduceMotion: boolean;
}) {
  const arcDash = useSharedValue(50);

  const lastThree = [history[11] ?? null, history[12] ?? null, history[13] ?? null];
  const driftLow = lastThree.filter((v) => v !== null && v < 38).length;
  const driftDown =
    lastThree[0] !== null &&
    lastThree[1] !== null &&
    lastThree[2] !== null &&
    lastThree[2]! < lastThree[1]! &&
    lastThree[1]! < lastThree[0]!;
  const showArc = driftLow >= 2 || driftDown;

  // Count consecutive trailing days below forming threshold
  let driftDays = 0;
  for (let i = 13; i >= 0; i--) {
    if (history[i] !== null && history[i]! < 50) driftDays++;
    else break;
  }

  useEffect(() => {
    if (!showArc) return;
    arcDash.value = reduceMotion ? 0 : withDelay(900, withTiming(0, { duration: 900 }));
  }, [showArc, reduceMotion]);

  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: arcDash.value }));

  const VW = 334;
  const STEP = (VW - 20) / 13;
  const CY = 30; // center baseline y

  return (
    <View>
      <View style={styles.sigHeader}>
        <Text style={styles.sigCaps}>14-day signature</Text>
        {showArc && driftDays > 0 && (
          <Text style={[styles.sigCaps, { color: COLORS.brass }]}>
            ↘ drift · {driftDays}d
          </Text>
        )}
      </View>
      <Svg width="100%" height={60} viewBox={`0 0 ${VW} 60`} preserveAspectRatio="none">
        {/* Center baseline */}
        <Line
          x1="0" y1={CY} x2={VW} y2={CY}
          stroke={COLORS.ruleLight} strokeWidth="1" strokeDasharray="1 3"
        />
        {/* Day marks */}
        {history.map((score, i) => {
          const x = 10 + i * STEP;
          const len = markLen(score);
          const color = markColor(score);
          return (
            <Line
              key={i}
              x1={x} y1={CY - len} x2={x} y2={CY + len}
              stroke={color} strokeWidth="1.5" strokeLinecap="round"
            />
          );
        })}
        {/* Brass drift arc under marks 11-13 */}
        {showArc && (
          <AnimatedPath
            d="M 276 44 Q 300 54 324 48"
            fill="none"
            stroke={COLORS.brass}
            strokeWidth="1"
            strokeDasharray={50}
            animatedProps={arcProps}
          />
        )}
      </Svg>
    </View>
  );
}

// ── MirrorCard ────────────────────────────────────────────────────────────────
function MirrorCard({ text, isLoading }: { text: string | null; isLoading: boolean }) {
  return (
    <View style={styles.mirrorCard}>
      <Text style={styles.mirrorLabel}>Mirror · today</Text>
      {isLoading ? (
        <Text style={styles.mirrorCalibrating}>Calibrating signal synthesis…</Text>
      ) : (
        <Text style={styles.mirrorText}>{text}</Text>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function MirrorScreen({
  userId,
  dayNumber,
  cycleNumber,
  alignmentScore,
  scoreBefore,
  theme1Code,
  theme1Level,
  theme2Code,
  theme2Level,
  onDone,
}: MirrorScreenProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mirrorText, setMirrorText] = useState<string | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(true);
  // 14-day history: index 0 = 13 days ago, index 13 = today
  const [history14, setHistory14] = useState<(number | null)[]>(Array(14).fill(null));

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 6;

  // Reduce-motion detection
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (mounted) setReduceMotion(v); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; sub.remove(); };
  }, []);

  // Poll for mirror_text + fetch 14-day history
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('alignment_scores')
        .select('date, score')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(14);
      if (data?.length) {
        const arr: (number | null)[] = Array(14).fill(null);
        data.forEach((row, i) => {
          // data[0] = today (most recent), place at index 13
          const idx = 13 - i;
          if (idx >= 0) arr[idx] = row.score ?? null;
        });
        setHistory14(arr);
      }
    };

    const poll = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('alignment_scores')
        .select('mirror_text')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (data?.mirror_text) {
        setMirrorText(data.mirror_text);
        setMirrorLoading(false);
        return;
      }
      attemptsRef.current++;
      if (attemptsRef.current < MAX_ATTEMPTS) {
        pollRef.current = setTimeout(poll, 2000);
      } else {
        setMirrorText(buildFallbackMirror(alignmentScore, theme1Code, theme1Level, theme2Code, theme2Level));
        setMirrorLoading(false);
      }
    };

    fetchHistory();
    pollRef.current = setTimeout(poll, 1500);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [userId]);

  // ── Settle animations (6 sections, 100ms stagger) ─────────────────────────
  const s0Op = useSharedValue(0); const s0Y = useSharedValue(4); // strip
  const s1Op = useSharedValue(0); const s1Y = useSharedValue(4); // hero
  const s2Op = useSharedValue(0); const s2Y = useSharedValue(4); // threshold bar
  const s3Op = useSharedValue(0); const s3Y = useSharedValue(4); // signature
  const s4Op = useSharedValue(0); const s4Y = useSharedValue(4); // mirror card
  const s5Op = useSharedValue(0); const s5Y = useSharedValue(4); // footer

  const underlineScale = useSharedValue(0);

  useEffect(() => {
    const settle = { duration: V3_SETTLE_DURATION, easing: V3_SETTLE_EASING };
    const pairs = [
      [s0Op, s0Y], [s1Op, s1Y], [s2Op, s2Y],
      [s3Op, s3Y], [s4Op, s4Y], [s5Op, s5Y],
    ] as const;

    if (reduceMotion) {
      pairs.forEach(([op, ty]) => {
        op.value = withTiming(1, { duration: V3_REDUCED_FADE_DURATION });
        ty.value = 0;
      });
      underlineScale.value = 1;
      return;
    }
    pairs.forEach(([op, ty], i) => {
      op.value = withDelay(i * V3_STAGGER_MS, withTiming(1, settle));
      ty.value = withDelay(i * V3_STAGGER_MS, withTiming(0, settle));
    });
    underlineScale.value = withDelay(
      V3_UNDERLINE_DELAY,
      withTiming(1, { duration: V3_UNDERLINE_DURATION, easing: V3_UNDERLINE_EASING }),
    );
  }, [reduceMotion]);

  const s0Style = useAnimatedStyle(() => ({ opacity: s0Op.value, transform: [{ translateY: s0Y.value }] }));
  const s1Style = useAnimatedStyle(() => ({ opacity: s1Op.value, transform: [{ translateY: s1Y.value }] }));
  const s2Style = useAnimatedStyle(() => ({ opacity: s2Op.value, transform: [{ translateY: s2Y.value }] }));
  const s3Style = useAnimatedStyle(() => ({ opacity: s3Op.value, transform: [{ translateY: s3Y.value }] }));
  const s4Style = useAnimatedStyle(() => ({ opacity: s4Op.value, transform: [{ translateY: s4Y.value }] }));
  const s5Style = useAnimatedStyle(() => ({ opacity: s5Op.value, transform: [{ translateY: s5Y.value }] }));
  const underlineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: underlineScale.value }] }));

  // ── Derived display values ────────────────────────────────────────────────
  const status = getAlignmentStatus(alignmentScore);
  const dLabel = deltaLabel(scoreBefore, alignmentScore);
  const dColor = deltaColor(scoreBefore, alignmentScore);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top strip ───────────────────────────────────────────────────── */}
      <Animated.View style={[styles.strip, s0Style]}>
        <Text style={styles.caps}>
          <Text style={styles.capsLight}>Day </Text>
          <Text style={styles.capsInk}>{dayNumber}</Text>
          <Text style={styles.capsLight}> / {CYCLE_DAYS}</Text>
          {cycleNumber > 1 && <Text style={styles.capsLight}> · Cycle {cycleNumber}</Text>}
        </Text>
        <Text style={styles.caps}>Recorded</Text>
      </Animated.View>
      <View style={styles.rule} />

      {/* ── Hero: score + status + delta ────────────────────────────────── */}
      <Animated.View style={[styles.heroBlock, s1Style]}>
        <Text style={styles.heroMeta}>Today's reading</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroScore} accessibilityRole="text">
            {alignmentScore ?? '—'}
          </Text>
          <View style={styles.heroMeta2}>
            <Text style={styles.heroStatus}>{status}</Text>
            {dLabel ? (
              <Text style={[styles.heroDelta, { color: dColor }]}>{dLabel}</Text>
            ) : null}
          </View>
        </View>
        <Animated.View style={[styles.underline, underlineStyle]} />
      </Animated.View>

      {/* ── Threshold bar + marker ───────────────────────────────────────── */}
      <Animated.View style={s2Style}>
        <ThresholdBar score={alignmentScore} reduceMotion={reduceMotion} />
      </Animated.View>

      {/* ── 14-day signature ─────────────────────────────────────────────── */}
      <Animated.View style={s3Style}>
        <DaySignature history={history14} reduceMotion={reduceMotion} />
      </Animated.View>

      {/* ── Mirror card ──────────────────────────────────────────────────── */}
      <Animated.View style={s4Style}>
        <MirrorCard text={mirrorText} isLoading={mirrorLoading} />
      </Animated.View>

      {/* ── Themes read today ────────────────────────────────────────────── */}
      <Animated.View style={s4Style}>
        <View style={styles.themeSection}>
          <Text style={styles.caps}>Themes read today</Text>
          <View style={styles.themeCards}>
            <ThemeShiftCard
              themeCode={theme1Code}
              themeName={THEMES[theme1Code]?.name ?? theme1Code}
              signalLevel={theme1Level}
              shortDescription={dayNumber <= 7 ? (THEMES[theme1Code]?.shortDescription ?? undefined) : undefined}
            />
            <ThemeShiftCard
              themeCode={theme2Code}
              themeName={THEMES[theme2Code]?.name ?? theme2Code}
              signalLevel={theme2Level}
              isSecondary
              shortDescription={dayNumber <= 7 ? (THEMES[theme2Code]?.shortDescription ?? undefined) : undefined}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Footer: "Tomorrow at dawn" + Close ──────────────────────────── */}
      <Animated.View style={[styles.footer, s5Style]}>
        <Text style={styles.caps}>Tomorrow at dawn</Text>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Close mirror reading"
          hitSlop={12}
        >
          <Text style={styles.closeBtn}>Close</Text>
        </Pressable>
      </Animated.View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  content: {
    paddingHorizontal: 26,
    paddingTop: 28,
    gap: 24,
  },

  // Strip
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  caps: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.slateLight,
  },
  capsLight: { color: COLORS.slateLight },
  capsInk: { color: COLORS.ink },
  rule: {
    height: 1,
    backgroundColor: COLORS.ruleLight,
    marginTop: -14, // pulls rule flush under strip within the content gap
  },

  // Hero
  heroBlock: {
    marginTop: 4,
  },
  heroMeta: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.slateLight,
    marginBottom: 6,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 14,
  },
  heroScore: {
    fontFamily: FONTS.display,
    fontSize: 72,
    lineHeight: 72,
    letterSpacing: -2,
    color: COLORS.ink,
  },
  heroMeta2: {
    gap: 4,
  },
  heroStatus: {
    fontFamily: FONTS.displayItalic,
    fontSize: 22,
    letterSpacing: -0.2,
    color: COLORS.ink,
  },
  heroDelta: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  underline: {
    marginTop: 12,
    width: 96,
    height: 1,
    backgroundColor: COLORS.brass,
    transformOrigin: 'left',
  },

  // Threshold bar
  barContainer: {
    height: 32,
    position: 'relative',
    overflow: 'visible',
  },
  barGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 13,
    height: 6,
    borderRadius: 3,
    opacity: 0.35,
  },
  tick: {
    position: 'absolute',
    top: 7,
    width: 1,
    height: 18,
    backgroundColor: COLORS.slateMid,
    opacity: 0.5,
  },
  markerOuter: {
    position: 'absolute',
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    borderWidth: 2,
    borderColor: COLORS.ink,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  markerDot: {
    position: 'absolute',
    top: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ink,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  barLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.slateLight,
  },

  // Signature
  sigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sigCaps: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.slateLight,
  },

  // Mirror card
  mirrorCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.ruleLight,
    gap: 8,
  },
  mirrorLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.brass,
  },
  mirrorText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 17,
    lineHeight: 25, // 17 × 1.5
    color: COLORS.ink,
  },
  mirrorCalibrating: {
    fontFamily: FONTS.displayItalic,
    fontSize: 15,
    color: COLORS.slateLight,
    letterSpacing: 0.2,
  },

  // Themes
  themeSection: {
    gap: 10,
  },
  themeCards: {
    gap: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  closeBtn: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
    paddingBottom: 2,
  },
});

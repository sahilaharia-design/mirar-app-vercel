import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ThemeShiftCard } from './ThemeShiftCard';
import { AlignmentCompass } from '../ui/AlignmentCompass';
import {
  FONTS,
  getAlignmentStatus,
} from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import {
  V3_SETTLE_EASING,
  V3_SETTLE_DURATION,
  V3_STAGGER_MS,
  V3_UNDERLINE_EASING,
  V3_UNDERLINE_DURATION,
  V3_UNDERLINE_DELAY,
  V3_REDUCED_FADE_DURATION,
} from '../../lib/animations';
import { supabase } from '../../lib/supabase';
import { mirrorSignalLabelKey, signalHelpKeyForStatus, compassWhyKey } from '../../lib/guidance';
import { InfoTooltipInline } from '../ui/InfoTooltip';
import { ThemeCode, SignalLevel } from '../../types/mirar';

type Colors = ReturnType<typeof useColors>;

// Declared at module level — must not be inside a component to avoid re-creation on every render
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── Prop contract ──────────────────────────────────────────────────────────
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
  theme1PatternFlag: string | null;
  theme2PatternFlag: string | null;
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

function markColor(score: number | null, colors: Colors): string {
  if (score === null) return colors.slateXLight;
  if (score >= 75) return colors.signalHigh;
  if (score >= 38) return colors.slate;
  return colors.signalLow;
}

// ── Delta helpers ─────────────────────────────────────────────────────────────
function deltaLabel(t: (key: string, opts?: any) => string, before: number | null, after: number | null): string {
  if (after === null || before === null) return '';
  const d = after - before;
  if (Math.abs(d) <= 2) return t('checkin.delta_steady');
  return d > 0
    ? t('checkin.delta_up', { n: Math.round(d) })
    : t('checkin.delta_down', { n: Math.round(d) });
}

function deltaColor(before: number | null, after: number | null, colors: Colors): string {
  if (after === null || before === null) return colors.slateLight;
  const d = after - before;
  if (Math.abs(d) <= 2) return colors.slateLight;
  return d > 0 ? colors.signalHigh : colors.brass;
}

// ── Fallback mirror text (AI generation timed out) ────────────────────────────
function buildFallbackMirror(
  t: (key: string, opts?: any) => string,
  score: number | null,
  t1: ThemeCode,
  t2: ThemeCode,
): string {
  const t1Name = t(`themes.${t1}`);
  const t2Name = t(`themes.${t2}`);
  const status = score !== null ? getAlignmentStatus(score) : null;
  const statusLine = status ? t('checkin.fallback_status_line', { status: status.toLowerCase() }) : '';
  return t('checkin.fallback_mirror', { theme1: t1Name, theme2: t2Name, statusLine }).trim();
}

// ── DaySignature ──────────────────────────────────────────────────────────────
// 14 vertical marks encoding magnitude; brass drift arc if last 3 show sustained low.
function DaySignature({
  history,
  reduceMotion,
  colors,
}: {
  history: (number | null)[];
  reduceMotion: boolean;
  colors: Colors;
}) {
  const { t } = useTranslation();
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
        <Text style={[styles.sigCaps, { color: colors.slateLight }]}>{t('checkin.signature_label')}</Text>
        {showArc && driftDays > 0 && (
          <Text style={[styles.sigCaps, { color: colors.brass }]}>
            ↘ {t('checkin.drift_label', { n: driftDays })}
          </Text>
        )}
      </View>
      <Svg width="100%" height={60} viewBox={`0 0 ${VW} 60`} preserveAspectRatio="none">
        {/* Center baseline */}
        <Line
          x1="0" y1={CY} x2={VW} y2={CY}
          stroke={colors.ruleLight} strokeWidth="1" strokeDasharray="1 3"
        />
        {/* Day marks */}
        {history.map((score, i) => {
          const x = 10 + i * STEP;
          const len = markLen(score);
          const color = markColor(score, colors);
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
            stroke={colors.brass}
            strokeWidth="1"
            strokeDasharray={50}
            animatedProps={arcProps}
          />
        )}
      </Svg>
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
  theme1PatternFlag,
  theme2PatternFlag,
  tomorrowTease,
  onDone,
}: MirrorScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();
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
        setMirrorText(buildFallbackMirror(t, alignmentScore, theme1Code, theme2Code));
        setMirrorLoading(false);
      }
    };

    fetchHistory();
    pollRef.current = setTimeout(poll, 1500);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [userId]);

  // ── Settle animations (5 sections, 100ms stagger) ─────────────────────────
  const s0Op = useSharedValue(0); const s0Y = useSharedValue(4); // strip
  const s1Op = useSharedValue(0); const s1Y = useSharedValue(4); // hero
  const s2Op = useSharedValue(0); const s2Y = useSharedValue(4); // themes
  const s3Op = useSharedValue(0); const s3Y = useSharedValue(4); // compass + signature
  const s4Op = useSharedValue(0); const s4Y = useSharedValue(4); // tomorrow
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
  const isListening = alignmentScore === null;
  const status = getAlignmentStatus(alignmentScore);
  const signalLabelKey = mirrorSignalLabelKey(status);
  const compassStatusLabel = isListening ? t('signal_labels.listening') : t(`signal_labels.${signalLabelKey}`);
  const dLabel = deltaLabel(t, scoreBefore, alignmentScore);
  const dColor = deltaColor(scoreBefore, alignmentScore, colors);

  // "Why" sentence — built from the identity vector's pattern flag for whichever
  // touched theme has one (theme1 first), falling back to a cold-start note when
  // there's no score yet, or a generic naming line when there's no flag at all.
  const theme1Name = t(`themes.${theme1Code}`);
  const theme2Name = t(`themes.${theme2Code}`);
  const explanation = isListening
    ? t('checkin.cold_start_note', { theme: theme1Name })
    : theme1PatternFlag
      ? t(compassWhyKey(theme1PatternFlag), { theme: theme1Name })
      : theme2PatternFlag
        ? t(compassWhyKey(theme2PatternFlag), { theme: theme2Name })
        : t('checkin.why_fallback', { theme: theme1Name });

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.cream }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top strip ───────────────────────────────────────────────────── */}
      <Animated.View style={[styles.strip, s0Style]}>
        <Text style={[styles.caps, { color: colors.slateLight }]}>
          <Text style={{ color: colors.ink }}>{t('common.your_alignment_today')}</Text>
          {cycleNumber > 1 && <Text style={{ color: colors.slateLight }}> · {t('common.cycle', { n: cycleNumber })}</Text>}
        </Text>
        <Text style={[styles.caps, { color: colors.slateLight }]}>{t('common.recorded')}</Text>
      </Animated.View>
      <View style={[styles.rule, { backgroundColor: colors.ruleLight }]} />

      {/* ── Reflection hero — the reveal, first and largest ─────────────── */}
      <Animated.View style={[styles.reflectionBlock, s1Style]}>
        <Text style={[styles.reflectionLabel, { color: colors.brass }]}>{t('checkin.reflection_label')}</Text>
        {mirrorLoading ? (
          <Text style={[styles.reflectionLoading, { color: colors.slateLight }]}>{t('checkin.reflection_loading')}</Text>
        ) : (
          <Text style={[styles.reflectionText, { color: colors.ink }]}>{mirrorText}</Text>
        )}
        <Animated.View style={[styles.underline, { backgroundColor: colors.brass }, underlineStyle]} />
      </Animated.View>

      {/* ── What today touched — the themes behind the reflection ───────── */}
      <Animated.View style={s2Style}>
        <View style={styles.themeSection}>
          <Text style={[styles.caps, { color: colors.slateLight }]}>{t('checkin.themes_touched')}</Text>
          <View style={styles.themeCards}>
            <ThemeShiftCard
              themeCode={theme1Code}
              themeName={theme1Name}
              signalLevel={theme1Level}
              shortDescription={dayNumber <= 7 ? t(`themes.${theme1Code}_short`) : undefined}
            />
            <ThemeShiftCard
              themeCode={theme2Code}
              themeName={theme2Name}
              signalLevel={theme2Level}
              isSecondary
              shortDescription={dayNumber <= 7 ? t(`themes.${theme2Code}_short`) : undefined}
            />
          </View>
        </View>
      </Animated.View>

      {/* ── Compass — the direction, felt immediately ────────────────────── */}
      <Animated.View style={s3Style}>
        <View style={styles.readingBlock}>
          <View style={styles.readingHeaderRow}>
            <Text style={[styles.caps, { color: colors.slateLight }]}>{t('checkin.your_reading')}</Text>
            <InfoTooltipInline helpText={t(`guidance_tooltips.${signalHelpKeyForStatus(status)}`)} size={13} />
          </View>
          <AlignmentCompass
            score={alignmentScore}
            previousScore={scoreBefore}
            statusLabel={compassStatusLabel}
            deltaLabel={dLabel || null}
            deltaColor={dColor}
            explanation={explanation}
            reduceMotion={reduceMotion}
          />
          <View style={{ height: 4 }} />
          <DaySignature history={history14} reduceMotion={reduceMotion} colors={colors} />
        </View>
      </Animated.View>

      {/* ── Tomorrow — the curiosity hook that pulls the next visit ─────── */}
      <Animated.View style={[styles.tomorrowBlock, { backgroundColor: colors.paper, borderColor: colors.ruleLight }, s4Style]}>
        <Text style={[styles.mirrorLabel, { color: colors.brass }]}>{t('checkin.tomorrow_label')}</Text>
        <Text style={[styles.tomorrowText, { color: colors.ink }]}>
          {tomorrowTease && tomorrowTease.trim().length > 0
            ? tomorrowTease
            : t('checkin.tomorrow_fallback')}
        </Text>
      </Animated.View>

      {/* ── Footer: Close ────────────────────────────────────────────────── */}
      <Animated.View style={[styles.footer, s5Style]}>
        <Text style={[styles.caps, { color: colors.slateLight }]}>{t('checkin.return_when_ready')}</Text>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={t('checkin.close_a11y')}
          hitSlop={12}
        >
          <Text style={[styles.closeBtn, { color: colors.ink, borderBottomColor: colors.ink }]}>{t('checkin.close')}</Text>
        </Pressable>
      </Animated.View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ── Styles (layout only — colors applied inline via useColors()) ─────────────
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
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
  },
  rule: {
    height: 1,
    marginTop: -14, // pulls rule flush under strip within the content gap
  },

  underline: {
    marginTop: 12,
    width: 96,
    height: 1,
    transformOrigin: 'left',
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
  },

  // Reflection hero (the reveal)
  reflectionBlock: {
    marginTop: 4,
    gap: 12,
  },
  reflectionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  reflectionText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 26,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  reflectionLoading: {
    fontFamily: FONTS.displayItalic,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0.2,
  },

  // Reading block (compass + signature)
  readingBlock: {
    gap: 4,
  },
  readingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Tomorrow hook
  tomorrowBlock: {
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  mirrorLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tomorrowText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 17,
    lineHeight: 25,
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
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
});

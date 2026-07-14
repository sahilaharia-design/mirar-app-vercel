/**
 * AlignmentCompass — the single hero visual for "how aligned am I, and which
 * way am I moving." Replaces the old status-label + delta-text + ThresholdBar
 * cluster on the Mirror screen, and the AlignmentRing on the home screen, with
 * one shared visual language: a needle sweeping across a 180° zone gauge.
 *
 * Built cross-platform on react-native-svg + Reanimated useAnimatedProps
 * (the same pattern ThemeSignalMiniCard's SignalArc already uses), not the
 * web-only SVG / native-View forks used by AlignmentRing/AlignmentSparkline —
 * so the needle sweep animates correctly on native too.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { ALIGNMENT_THRESHOLDS, FONTS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import {
  V3_MARKER_EASING,
  V3_MARKER_DURATION,
  V3_MARKER_DELAY,
} from '../../lib/animations';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2 + 6;
const R = 92;
const NEEDLE_LEN = 66;

// 0–100 score → angle in degrees, where 0 = straight left (180°), 100 =
// straight right (0°), measured the standard SVG way from the positive x-axis.
function scoreToAngle(score: number): number {
  return 180 - (score / 100) * 180;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function zoneArcPath(cx: number, cy: number, r: number, fromScore: number, toScore: number): string {
  const start = polar(cx, cy, r, scoreToAngle(fromScore));
  const end = polar(cx, cy, r, scoreToAngle(toScore));
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
}

interface AlignmentCompassProps {
  score: number | null;
  previousScore: number | null;
  /** Already-translated status word, e.g. "Forming" or "Listening". */
  statusLabel: string;
  /** Already-translated delta line, e.g. "+4" — omit to hide. */
  deltaLabel?: string | null;
  deltaColor?: string | null;
  /** Already-translated explanatory sentence(s) shown below the gauge. */
  explanation?: string | null;
  reduceMotion?: boolean;
  size?: number;
}

export function AlignmentCompass({
  score,
  previousScore,
  statusLabel,
  deltaLabel,
  deltaColor,
  explanation,
  reduceMotion = false,
  size = SIZE,
}: AlignmentCompassProps) {
  const colors = useColors();
  const scale = size / SIZE;
  const svgHeight = Math.round(SIZE * 0.78);

  const isListening = score === null;
  const targetAngle = scoreToAngle(score ?? 50);
  const startAngle = scoreToAngle(previousScore ?? score ?? 50);

  const angle = useSharedValue(reduceMotion ? targetAngle : startAngle);

  useEffect(() => {
    if (isListening) {
      angle.value = 90; // straight up — neutral, nothing claimed yet
      return;
    }
    angle.value = reduceMotion
      ? targetAngle
      : withDelay(V3_MARKER_DELAY, withTiming(targetAngle, { duration: V3_MARKER_DURATION, easing: V3_MARKER_EASING }));
  }, [score, previousScore, isListening, reduceMotion]);

  const needleProps = useAnimatedProps(() => {
    const tip = polar(CX, CY, NEEDLE_LEN, angle.value);
    return { x2: tip.x, y2: tip.y };
  });

  const zoneColor = (i: number) => (isListening ? colors.borderLight : ALIGNMENT_THRESHOLDS[i].color);
  const bounds = [0, 38, 50, 75, 100];

  return (
    <View style={[styles.wrap, { width: SIZE, transform: [{ scale }] }]}>
      <Svg
        width={SIZE}
        height={svgHeight}
        viewBox={`0 0 ${SIZE} ${svgHeight}`}
        style={{ width: SIZE, height: svgHeight }}
      >
        {bounds.slice(0, 4).map((from, i) => (
          <Path
            key={i}
            d={zoneArcPath(CX, CY, R, from, bounds[i + 1])}
            stroke={zoneColor(i)}
            strokeWidth={16}
            strokeLinecap="round"
            fill="none"
            opacity={isListening ? 1 : 0.55}
          />
        ))}
        <AnimatedLine
          x1={CX}
          y1={CY}
          animatedProps={needleProps}
          stroke={colors.ink}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx={CX} cy={CY} r={7} fill={colors.ink} />
      </Svg>

      <View style={styles.textBlock}>
        <Text style={[styles.status, { color: colors.ink, fontFamily: FONTS.displayItalic }]}>
          {statusLabel}
        </Text>
        {deltaLabel ? (
          <Text style={[styles.delta, { color: deltaColor ?? colors.slateLight, fontFamily: FONTS.bodyMedium }]}>
            {deltaLabel}
          </Text>
        ) : null}
        {explanation ? (
          <Text style={[styles.explanation, { color: colors.slateMid, fontFamily: FONTS.body }]}>
            {explanation}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  textBlock: {
    marginTop: -16,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
  },
  status: {
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  delta: {
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  explanation: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },
});

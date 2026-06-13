import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AlignmentScoreRow } from '../../types/mirar';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, getAlignmentColor } from '../../lib/constants';

interface AlignmentSparklineProps {
  history: AlignmentScoreRow[];
  height?: number;
  width?: number;
}

export function AlignmentSparkline({ history, height = 32, width = 120 }: AlignmentSparklineProps) {
  const colors = useColors();
  const { t } = useTranslation();

  if (history.length < 2) return null;

  const scores = history.map((h) => h.score);
  const min = Math.max(0, Math.min(...scores) - 5);
  const max = Math.min(100, Math.max(...scores) + 5);
  const range = max - min || 10;

  const padX = 4;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = scores.map((s, i) => {
    const x = padX + (i / (scores.length - 1)) * innerW;
    const y = padY + (1 - (s - min) / range) * innerH;
    return { x, y, score: s };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const lastPoint = points[points.length - 1];
  const lineColor = getAlignmentColor(scores[scores.length - 1]);

  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  const delta = latest && prev ? Math.round(latest.score - prev.score) : 0;
  const trendLabel =
    Math.abs(delta) < 2
      ? t('today.trend_steady')
      : delta > 0
      ? t('today.trend_up', { n: delta })
      : t('today.trend_down', { n: delta });
  const trendColor =
    Math.abs(delta) < 2
      ? colors.slateLight
      : delta > 0
      ? '#5A8A6A'
      : '#B85A4A';

  if (Platform.OS !== 'web') {
    // Native fallback: simple dots row
    return (
      <Animated.View entering={FadeIn.duration(600).delay(400)} style={nativeStyles.container}>
        <View style={nativeStyles.dots}>
          {scores.map((s, i) => (
            <View
              key={i}
              style={[
                nativeStyles.dot,
                {
                  backgroundColor: getAlignmentColor(s),
                  opacity: 0.4 + (i / scores.length) * 0.6,
                  width: i === scores.length - 1 ? 8 : 5,
                  height: i === scores.length - 1 ? 8 : 5,
                  borderRadius: 4,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[nativeStyles.trend, { color: trendColor }]}>{trendLabel}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(800).delay(400)} style={styles.container}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' } as any}
      >
        {/* Fill area under line */}
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padY + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`}
          fill="url(#sparkFill)"
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'all 0.8s ease' } as any}
        />
        {/* Terminal dot */}
        <circle
          cx={lastPoint.x.toFixed(1)}
          cy={lastPoint.y.toFixed(1)}
          r="3"
          fill={lineColor}
        />
      </svg>
      <Text style={[styles.trendLabel, { color: trendColor }]}>{trendLabel}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  trendLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

const nativeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {},
  trend: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});

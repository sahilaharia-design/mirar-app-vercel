import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemeCode, ThemeStatus } from '../../types/mirar';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS, STATUS_CONFIG, THEME_COLORS } from '../../lib/constants';
import { buildSparklinePath, getThemeScoreColor } from '../../lib/svg-utils';
import { InfoTooltipInline } from '../ui/InfoTooltip';

interface ThemeDataPoint {
  day: number;
  average: number | null;
}

interface ThemeSignalRowProps {
  code: ThemeCode;
  name: string;
  status: ThemeStatus;
  average: number | null;
  signalCount: number;
  history: ThemeDataPoint[]; // 7 data points
  previousStatus?: ThemeStatus | null;
  helpText?: string;
  index?: number;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ThemeStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ── Mini Sparkline (SVG web / dots native) ────────────────────────────────────
function ThemeSparkline({
  history,
  themeCode,
  width = 88,
  height = 28,
}: {
  history: ThemeDataPoint[];
  themeCode: ThemeCode;
  width?: number;
  height?: number;
}) {
  const values = history.map((h) => h.average);
  const { points, pathD, fillD } = buildSparklinePath(values, width, height);

  if (!pathD) {
    // Not enough data
    return (
      <View style={[styles.noDataLine, { width, height }]}>
        {[...Array(7)].map((_, i) => (
          <View key={i} style={styles.noDataDot} />
        ))}
      </View>
    );
  }

  const validValues = values.filter((v): v is number => v !== null);
  const lastVal = validValues[validValues.length - 1] ?? null;
  const lineColor = getThemeScoreColor(lastVal);

  // Native fallback: colored dots
  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.nativeDots, { width, height }]}>
        {values.map((v, i) => (
          <View
            key={i}
            style={[
              styles.nativeDot,
              {
                backgroundColor: v === null ? '#E0DDD8' : getThemeScoreColor(v),
                width: i === values.length - 1 ? 7 : 5,
                height: i === values.length - 1 ? 7 : 5,
                opacity: v === null ? 0.25 : 0.5 + (i / values.length) * 0.5,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  const lastValidPt = points.filter((p) => p.value !== null).slice(-1)[0];

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' } as any}>
      <defs>
        <linearGradient id={`tf-${themeCode}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fillD && (
        <path d={fillD} fill={`url(#tf-${themeCode})`} />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastValidPt && (
        <circle
          cx={lastValidPt.x.toFixed(1)}
          cy={lastValidPt.y.toFixed(1)}
          r="2.5"
          fill={lineColor}
        />
      )}
    </svg>
  );
}

// ── Delta label vs previous status ───────────────────────────────────────────
function getDeltaLabel(
  currentStatus: ThemeStatus,
  previousStatus: ThemeStatus | null | undefined
): { text: string; color: string } | null {
  if (!previousStatus || previousStatus === currentStatus) return null;

  const rank: Record<ThemeStatus, number> = {
    'Under Load': 0,
    Stabilizing: 1,
    Forming: 2,
    Aligned: 3,
    'No Reading': -1,
  };

  const diff = rank[currentStatus] - rank[previousStatus];
  if (diff > 0) return { text: 'showing more steadiness', color: '#5B8C5A' };
  if (diff < 0) return { text: 'showing more pressure', color: '#C47058' };
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ThemeSignalRow({
  code,
  name,
  status,
  average,
  signalCount,
  history,
  previousStatus,
  helpText,
  index = 0,
}: ThemeSignalRowProps) {
  const colors = useColors();
  const delta = getDeltaLabel(status, previousStatus);
  const accentColor = THEME_COLORS[code]?.light ?? '#9494A0';

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
      <View style={[styles.row, {
        backgroundColor: colors.white,
        borderColor: colors.borderLight,
      }]}>
        {/* Left: accent stripe */}
        <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />

        <View style={styles.body}>
          {/* Top row: theme name + status badge */}
          <View style={styles.topRow}>
            <View style={styles.nameBlock}>
              <Text style={[styles.themeCode, { color: accentColor }]}>signal area</Text>
              <View style={styles.themeNameRow}>
                <Text style={[styles.themeName, { color: colors.slate }]}>{name}</Text>
                {helpText ? <InfoTooltipInline helpText={helpText} size={12} /> : null}
              </View>
            </View>
            <StatusBadge status={status} />
          </View>

          {/* Middle row: sparkline + average + signal count */}
          <View style={styles.middleRow}>
            <ThemeSparkline history={history} themeCode={code} />

            <View style={styles.statsBlock}>
              <Text style={[styles.signalCount, { color: colors.slateXLight }]}>
                {signalCount} reflection{signalCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Delta vs previous period */}
          {delta && (
            <Text style={[styles.deltaLabel, { color: delta.color }]}>
              {delta.text}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentStripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  themeCode: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  themeName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    flexShrink: 1,
  },
  themeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  avgScore: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  signalCount: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  deltaLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  // Native sparkline fallback
  nativeDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nativeDot: {
    borderRadius: 4,
  },
  noDataLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noDataDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0DDD8',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeScore } from '../../types/mirar';
import { StatusBadge } from '../ui/StatusBadge';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface ThemeStatusCardProps {
  themeScore: ThemeScore;
  showSignalBreakdown?: boolean;
}

export function ThemeStatusCard({ themeScore, showSignalBreakdown = false }: ThemeStatusCardProps) {
  const hasData = themeScore.signalCount > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.themeName}>{themeScore.name}</Text>
          <Text style={styles.themeCode}>{themeScore.code}</Text>
        </View>
        <StatusBadge status={themeScore.status} size="sm" />
      </View>

      {hasData && showSignalBreakdown && (
        <View style={styles.signals}>
          <SignalBar
            label="Low"
            count={themeScore.lowCount}
            total={themeScore.signalCount}
            color={COLORS.underLoad}
          />
          <SignalBar
            label="Mid"
            count={themeScore.mediumCount}
            total={themeScore.signalCount}
            color={COLORS.forming}
          />
          <SignalBar
            label="High"
            count={themeScore.highCount}
            total={themeScore.signalCount}
            color={COLORS.aligned}
          />
        </View>
      )}

      {hasData && (
        <Text style={styles.signalCount}>
          {themeScore.signalCount} signal{themeScore.signalCount !== 1 ? 's' : ''}
          {themeScore.average !== null && (
            <Text style={styles.avg}> · avg {themeScore.average.toFixed(1)}</Text>
          )}
        </Text>
      )}
    </View>
  );
}

function SignalBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={barStyles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  themeName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate,
    fontWeight: '500',
    lineHeight: 20,
  },
  themeCode: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    letterSpacing: 0.8,
  },
  signals: {
    gap: 4,
    marginTop: 2,
  },
  signalCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
  },
  avg: {
    color: COLORS.slateMid,
  },
});

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: 10,
    color: COLORS.slateLight,
    width: 24,
  },
  track: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  count: {
    fontSize: 10,
    color: COLORS.slateLight,
    width: 14,
    textAlign: 'right',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface CoverageBarProps {
  coverage: number;
  total: number;
  label?: string;
}

export function CoverageBar({ coverage, total, label }: CoverageBarProps) {
  const colors = useColors();
  const pct = total > 0 ? Math.round((coverage / total) * 100) : 0;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.slateLight }]}>{label}</Text>}
      <View style={styles.row}>
        <View style={[styles.track, { backgroundColor: colors.borderLight }]}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.slate }]} />
        </View>
        <Text style={[styles.count, { color: colors.slateLight }]}>{coverage}/{total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  count: {
    fontSize: FONT_SIZE.xs,
    width: 32,
    textAlign: 'right',
  },
});

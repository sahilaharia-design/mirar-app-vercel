import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface TomorrowTeaseProps {
  tomorrowTease: string | null;
  tomorrowDayNumber: number;
}

export function TomorrowTease({ tomorrowTease, tomorrowDayNumber }: TomorrowTeaseProps) {
  if (!tomorrowTease) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Day {tomorrowDayNumber}</Text>
      <Text style={styles.tease}>{tomorrowTease}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tease: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

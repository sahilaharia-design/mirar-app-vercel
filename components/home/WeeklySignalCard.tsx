import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface WeeklySignalCardProps {
  signalText: string;
  weekNumber?: number;
}

export function WeeklySignalCard({ signalText, weekNumber }: WeeklySignalCardProps) {
  const colors = useColors();

  if (!signalText) return null;

  const weekLabel = weekNumber ? `WEEK ${weekNumber}` : 'THIS WEEK';

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(200)}>
      <View style={[styles.card, {
        backgroundColor: colors.warmGlowLight,
        borderColor: colors.border,
      }]}>
        {/* Label row */}
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: colors.accentTeal }]} />
          <Text style={[styles.label, { color: colors.slateLight }]}>
            WEEKLY SIGNAL · {weekLabel}
          </Text>
        </View>

        {/* Signal text */}
        <Text style={[styles.signalText, { color: colors.slateMid }]}>
          {signalText}
        </Text>

        {/* Subtle footer line */}
        <Text style={[styles.footer, { color: colors.slateXLight }]}>
          Generated from your last 7 check-ins
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  signalText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
  footer: {
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface SignalListProps {
  title: string;
  items: string[];
  variant?: 'primary' | 'calibration';
}

export function SignalList({ title, items, variant = 'primary' }: SignalListProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <View style={[styles.bullet, variant === 'calibration' && styles.bulletCalibration]} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  list: {
    gap: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.slateMid,
    marginTop: 8,
    flexShrink: 0,
  },
  bulletCalibration: {
    backgroundColor: COLORS.forming,
  },
  itemText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    lineHeight: 22,
  },
});

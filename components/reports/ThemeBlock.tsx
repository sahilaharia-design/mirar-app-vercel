import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeBlock as ThemeBlockType } from '../../types/mirar';
import { StatusBadge } from '../ui/StatusBadge';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface ThemeBlockProps {
  block: ThemeBlockType;
}

export function ThemeBlock({ block }: ThemeBlockProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{block.name}</Text>
        <Text style={styles.code}>{block.code}</Text>
      </View>
      <View style={styles.footer}>
        <StatusBadge status={block.status} size="sm" />
        {block.averageScore !== null && (
          <Text style={styles.score}>avg {block.averageScore.toFixed(2)}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate,
    fontWeight: '500',
    flex: 1,
  },
  code: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  score: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

interface Props {
  current: number; // 1-indexed
  total: number;
}

export function AssessProgress({ current, total }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i + 1 < current && styles.dotDone,
            i + 1 === current && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.slateXLight,
  },
  dotDone: {
    backgroundColor: COLORS.slateLight,
  },
  dotActive: {
    backgroundColor: COLORS.slate,
    width: 18,
    borderRadius: RADIUS.full,
  },
});

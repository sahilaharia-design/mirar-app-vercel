import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface Props {
  current: number; // 1-indexed
  total: number;
}

export function AssessProgress({ current, total }: Props) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: colors.slateXLight },
            i + 1 < current && { backgroundColor: colors.slateLight },
            i + 1 === current && { backgroundColor: colors.slate, width: 18 },
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
  },
});

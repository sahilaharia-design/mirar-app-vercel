import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface SignalListProps {
  title: string;
  items: string[];
  variant?: 'primary' | 'calibration';
}

export function SignalList({ title, items, variant = 'primary' }: SignalListProps) {
  const colors = useColors();
  if (items.length === 0) return null;

  const softenItem = (item: string) =>
    item
      .replace(/\s+\((IAP|EWB|FAF|RC|GAL|RA)\)/g, '')
      .replace(/Low signals/gi, 'Pressure signals')
      .replace(/High signals/gi, 'Steady signals')
      .replace(/Low signal/gi, 'Pressure signal')
      .replace(/High signal/gi, 'Steady signal')
      .replace(/this stage/gi, 'this window')
      .replace(/calibration/gi, 'gentle check');

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.slateLight }]}>{title}</Text>
      <View style={styles.list}>
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <View style={[styles.bullet, { backgroundColor: variant === 'calibration' ? colors.forming : colors.slateMid }]} />
            <Text style={[styles.itemText, { color: colors.slateMid }]}>{softenItem(item)}</Text>
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
    marginTop: 8,
    flexShrink: 0,
  },
  itemText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
});

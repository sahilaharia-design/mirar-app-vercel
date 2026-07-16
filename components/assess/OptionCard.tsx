import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface Props {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
}

const isWeb = Platform.OS === 'web';

export function OptionCard({ label, sublabel, selected, onPress, accentColor }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, selected && styles.cardSelected, selected && accentColor ? { borderColor: accentColor, backgroundColor: `${accentColor}12` } : null]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
        </View>
        <View style={[styles.check, selected && styles.checkSelected, selected && accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : null]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...(isWeb ? ({ cursor: 'pointer' } as any) : {}),
  },
  cardSelected: {
    borderColor: COLORS.slate,
    backgroundColor: `${COLORS.slate}08`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    lineHeight: 22,
  },
  labelSelected: {
    color: COLORS.slate,
    fontWeight: '500',
  },
  sublabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    lineHeight: 17,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.slateXLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkSelected: {
    backgroundColor: COLORS.slate,
    borderColor: COLORS.slate,
  },
  checkMark: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
});

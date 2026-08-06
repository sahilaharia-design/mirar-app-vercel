import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface Props {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
}

const isWeb = Platform.OS === 'web';

export function OptionCard({ label, sublabel, selected, onPress, accentColor }: Props) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        { backgroundColor: colors.white, borderColor: colors.border },
        selected && { borderColor: colors.slate, backgroundColor: `${colors.slate}08` },
        selected && accentColor ? { borderColor: accentColor, backgroundColor: `${accentColor}12` } : null,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.label, { color: colors.slateMid }, selected && { color: colors.slate, fontWeight: '500' }]}>{label}</Text>
          {sublabel ? <Text style={[styles.sublabel, { color: colors.slateLight }]}>{sublabel}</Text> : null}
        </View>
        <View
          style={[
            styles.check,
            { borderColor: colors.slateXLight },
            selected && { backgroundColor: colors.slate, borderColor: colors.slate },
            selected && accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : null,
          ]}
        >
          {selected && <Text style={[styles.checkMark, { color: colors.white }]}>✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...(isWeb ? ({ cursor: 'pointer' } as any) : {}),
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
    lineHeight: 22,
  },
  sublabel: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 17,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '700',
  },
});

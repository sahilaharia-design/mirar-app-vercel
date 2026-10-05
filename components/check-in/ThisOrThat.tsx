import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { OptionRow } from '../../types/mirar';
import { useColors } from '../../contexts/theme-context';
import { FONTS } from '../../lib/constants';
import { Choice, optionByChoice } from '../../lib/everyday';

interface Props {
  options: OptionRow[];
  left: string;
  right: string;
  inBetween: string;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

// One plain this-or-that. Left / right are the two big buttons; "in between"
// is the small honest third answer. Left/middle/right map to option 1/3/5 of
// the question (options are stored low→high), so scoring is untouched.
export function ThisOrThat({ options, left, right, inBetween, selectedOptionId, onSelect, disabled }: Props) {
  const colors = useColors();

  const pick = (p: Choice) => {
    if (disabled) return;
    const opt = optionByChoice(options, p);
    if (opt) onSelect(opt.id);
  };
  const isOn = (p: Choice) => optionByChoice(options, p)?.id === selectedOptionId;

  const big = (p: Choice, label: string) => (
    <Pressable
      key={p}
      onPress={() => pick(p)}
      accessibilityRole="button"
      accessibilityState={{ selected: isOn(p) }}
      style={[
        styles.big,
        {
          backgroundColor: isOn(p) ? colors.slate : colors.white,
          borderColor: isOn(p) ? colors.slate : colors.border,
        },
      ]}
    >
      <Text style={[styles.bigText, { color: isOn(p) ? colors.cream : colors.slate }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {big('left', left)}
        {big('right', right)}
      </View>
      <Pressable
        onPress={() => pick('middle')}
        accessibilityRole="button"
        accessibilityState={{ selected: isOn('middle') }}
        style={[
          styles.mid,
          { borderColor: isOn('middle') ? colors.slate : colors.border, backgroundColor: isOn('middle') ? colors.slate : 'transparent' },
        ]}
      >
        <Text style={[styles.midText, { color: isOn('middle') ? colors.cream : colors.slateMid }]}>{inBetween}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  big: {
    flex: 1,
    minHeight: 140,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bigText: { fontFamily: FONTS.display, fontSize: 26, letterSpacing: -0.2, textAlign: 'center' },
  mid: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  midText: { fontFamily: FONTS.bodyMedium, fontSize: 15 },
});

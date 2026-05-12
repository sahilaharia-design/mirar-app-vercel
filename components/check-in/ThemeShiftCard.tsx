import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeCode, SignalLevel } from '../../types/mirar';
import { THEME_COLORS, STATUS_CONFIG, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface ThemeShiftCardProps {
  themeCode: ThemeCode;
  themeName: string;
  signalLevel: SignalLevel;
  isSecondary?: boolean;
  shortDescription?: string;
}

const LEVEL_CONFIG: Record<SignalLevel, { label: string; bar: number }> = {
  Low:    { label: 'present',    bar: 0.28 },
  Medium: { label: 'visible',    bar: 0.58 },
  High:   { label: 'strongly visible',   bar: 0.92 },
};

export function ThemeShiftCard({ themeCode, themeName, signalLevel, isSecondary = false, shortDescription }: ThemeShiftCardProps) {
  const colors = useColors();
  const accentColor = THEME_COLORS[themeCode]?.light ?? '#9494A0';
  const levelCfg = LEVEL_CONFIG[signalLevel];

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.white,
        borderColor: colors.borderLight,
        opacity: isSecondary ? 0.75 : 1,
      },
    ]}>
      {/* Accent stripe */}
      <View style={[styles.stripe, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.code, { color: accentColor }]}>area touched</Text>
          <Text style={[styles.level, { color: colors.slateMid }]}>{levelCfg.label}</Text>
        </View>
        <Text style={[styles.name, { color: colors.slate }]}>{themeName}</Text>
        {shortDescription && (
          <Text style={[styles.shortDesc, { color: colors.slateXLight }]}>{shortDescription}</Text>
        )}

        {/* Signal bar */}
        <View style={[styles.barTrack, { backgroundColor: colors.borderLight }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${levelCfg.bar * 100}%` as any,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: SPACING.sm,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  level: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  shortDesc: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});

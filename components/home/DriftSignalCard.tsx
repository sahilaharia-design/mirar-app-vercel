import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS, CONCERNING_SIGNAL_TYPES } from '../../lib/constants';
import { WeeklySignalRow } from '../../types/mirar';

// ─── DriftSignalCard ───────────────────────────────────────────────────────────
// The Drift Alert system's in-app surface. Reads the weekly signal that
// generate-weekly-signal already computes every 7th reflection (signal_type +
// display_text, already localized server-side) — data that previously had no
// UI consumer at all. Shown once, gently, then marked shown_to_user so it
// never repeats.
//
// display_text is pre-written in "signal, not verdict" language (see that
// function's system prompt) — this component adds no interpretive copy of
// its own, only a label and a dismiss control.

interface Props {
  signal: WeeklySignalRow;
  onDismiss: () => void;
}

export function DriftSignalCard({ signal, onDismiss }: Props) {
  const { t } = useTranslation();
  const colors = useColors();

  const isConcerning = (CONCERNING_SIGNAL_TYPES as readonly string[]).includes(signal.signal_type);
  const accent = isConcerning ? colors.underLoad : colors.accentTeal;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(130)}
      style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.slateLight }]}>
          {t('drift_signal.label')}
        </Text>
        <Text style={[styles.text, { color: colors.slate }]}>{signal.display_text}</Text>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel={t('drift_signal.dismiss')}
        >
          <Text style={[styles.dismissText, { color: colors.slateLight }]}>
            {t('drift_signal.dismiss')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
  },
  body: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: FONT_SIZE.base,
    lineHeight: 23,
    fontWeight: '400',
  },
  dismiss: {
    alignSelf: 'flex-start',
    marginTop: 2,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  dismissText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

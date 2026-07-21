import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { BreathingMirror } from '../ui/BreathingMirror';
import { FONT_SIZE, SPACING } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface SettleScreenProps {
  onContinue: () => void;
}

// Brief pause before the daily question — an invitation to settle in, not an
// instruction or a gate. Shown every day; tap-to-continue only, no timer,
// so it never adds friction to the 2-minute habit for someone in a hurry.
export function SettleScreen({ onContinue }: SettleScreenProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.paper }]}
      onPress={onContinue}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={t('settle.tap_hint')}
    >
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <BreathingMirror size={140} />
        <Text style={[styles.title, { color: colors.slate }]}>{t('settle.title')}</Text>
        <Text style={[styles.body, { color: colors.slateMid }]}>{t('settle.body')}</Text>
        <Text style={[styles.tapHint, { color: colors.slateLight }]}>{t('settle.tap_hint')}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  body: {
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  tapHint: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: SPACING.lg,
  },
});

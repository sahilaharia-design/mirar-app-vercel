import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { PendingMilestone } from '../../stores/cycle-store';

// ─── MilestoneCard ─────────────────────────────────────────────────────────────
// Surfaces unlock_events — already written on every check-in by the
// check-unlocks edge function, previously with no UI consumer at all (see
// lib/milestones.ts). Deliberately styled like DriftSignalCard, not like an
// achievement/badge: same quiet card, same "Got it" dismiss, no icon, no
// confetti, no share action. This is the app's answer to "gamify it" — a
// reflection grounded in the user's own data instead of a scoreboard. Shown
// once, then marked shown_to_user so it never repeats.
interface Props {
  milestone: PendingMilestone;
  onDismiss: () => void;
}

export function MilestoneCard({ milestone, onDismiss }: Props) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(130)}
      style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
    >
      <View style={[styles.accentBar, { backgroundColor: colors.brass }]} />
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.slateLight }]}>
          {t('milestone.label')}
        </Text>
        <Text style={[styles.title, { color: colors.slate }]}>{milestone.title}</Text>
        <Text style={[styles.text, { color: colors.slateMid }]}>{milestone.body}</Text>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel={t('milestone.dismiss')}
        >
          <Text style={[styles.dismissText, { color: colors.slateLight }]}>
            {t('milestone.dismiss')}
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
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
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

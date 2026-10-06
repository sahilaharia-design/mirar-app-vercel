import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONTS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { Exercise } from '../../lib/innerRep/types';
import { capacityName } from '../../lib/innerRep/evidence';

interface Props {
  exercise: Exercise | null;
  doneToday: boolean;
  cue: string | null;
  practiceDays: number;
  onBegin: () => void;
}

// Home's one card: today's rep, Begin, and a quiet continuity line. No score.
export function InnerRepCard({ exercise, doneToday, cue, practiceDays, onBegin }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(120)} style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
      <Text style={[styles.eyebrow, { color: colors.slateLight }]}>{t('innerRep.eyebrow')}</Text>
      {exercise && (
        <Text style={[styles.cap, { color: colors.ink }]}>{capacityName(exercise.capacity)}</Text>
      )}
      {doneToday ? (
        <Text style={[styles.done, { color: colors.aligned }]}>● {t('innerRep.done_card')}</Text>
      ) : (
        <>
          {exercise && (
            <Text style={[styles.meta, { color: colors.slateMid }]}>
              {t('innerRep.seconds', { count: Math.max(20, Math.round(exercise.estimated_duration / 10) * 10) })}
            </Text>
          )}
          <Pressable onPress={onBegin} accessibilityRole="button" style={[styles.cta, { backgroundColor: colors.slate }]}>
            <Text style={[styles.ctaText, { color: colors.cream }]}>{t('innerRep.begin')} →</Text>
          </Pressable>
        </>
      )}
      {cue && <Text style={[styles.cue, { color: colors.slateMid }]}>{cue}</Text>}
      {practiceDays > 0 && (
        <Text style={[styles.practice, { color: colors.slateLight }]}>
          {t(practiceDays === 1 ? 'innerRep.practice_days_one' : 'innerRep.practice_days_other', { count: practiceDays })}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, gap: SPACING.sm },
  eyebrow: { fontSize: FONT_SIZE.xs, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '500' },
  cap: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.3 },
  meta: { fontSize: FONT_SIZE.sm },
  done: { fontSize: FONT_SIZE.md, fontWeight: '500', marginTop: SPACING.xs },
  cta: { borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.xs },
  ctaText: { fontFamily: FONTS.bodyMedium, fontSize: 17 },
  cue: { fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: SPACING.xs },
  practice: { fontSize: FONT_SIZE.sm },
});

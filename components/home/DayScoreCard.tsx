import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONTS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import {
  DayScore,
  weekAverage,
  weekDelta,
  weekStrip,
  scoreWord,
  specificLine,
  recoveryLine,
} from '../../lib/everyday';

interface Props {
  scores: DayScore[];
  isCompleted: boolean;
  question: string;
  tomorrowTease?: string | null;
  onStart: () => void;
}

// Home's one card. Not checked in yet → a big "how's today" button with
// yesterday's number for context. Checked in → your week as one number,
// how it moved, a 7-day strip, and one counted sentence (or nothing).
export function DayScoreCard({ scores, isCompleted, question, tomorrowTease, onStart }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const week = weekAverage(scores);
  const delta = weekDelta(scores);
  const strip = weekStrip(scores);
  const line = specificLine(scores);
  const recovery = recoveryLine(scores);

  const dotColor = (s: number | null) =>
    s === null ? colors.ruleLight : s < 40 ? colors.underLoad : s < 65 ? colors.slateLight : colors.aligned;

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(120)}
      style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}
    >
      {week !== null ? (
        <>
          <Text style={[styles.label, { color: colors.slateLight }]}>{t('home.your_week')}</Text>
          <View style={styles.numberRow}>
            <Text style={[styles.number, { color: colors.slate }]}>{week}</Text>
            <View style={styles.numberMeta}>
              <Text style={[styles.word, { color: colors.slateMid }]}>{t(`home.word_${scoreWord(week).toLowerCase()}`)}</Text>
              {delta !== null && delta !== 0 && (
                <Text style={[styles.delta, { color: delta > 0 ? colors.aligned : colors.underLoad }]}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} {t('home.since_yesterday')}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.strip}>
            {strip.map((d) => (
              <View key={d.date} style={styles.stripItem}>
                <View style={[styles.dot, { backgroundColor: dotColor(d.score) }]} />
                <Text style={[styles.letter, { color: colors.slateLight }]}>{d.letter}</Text>
              </View>
            ))}
          </View>
          {line && <Text style={[styles.line, { color: colors.slate }]}>{line}</Text>}
          {recovery && <Text style={[styles.recovery, { color: colors.slateMid }]}>{recovery}</Text>}
        </>
      ) : (
        <Text style={[styles.label, { color: colors.slateLight }]}>{t('home.first_label')}</Text>
      )}

      {isCompleted ? (
        <>
          <Text style={[styles.done, { color: colors.aligned }]}>● {t('home.done_today')}</Text>
          {tomorrowTease ? (
            <Text style={[styles.tease, { color: colors.slateMid }]} numberOfLines={2}>{tomorrowTease}</Text>
          ) : null}
        </>
      ) : (
        <TouchableOpacity
          onPress={onStart}
          activeOpacity={0.85}
          style={[styles.cta, { backgroundColor: colors.slate }]}
          accessibilityRole="button"
        >
          <Text style={[styles.ctaText, { color: colors.cream }]}>{question}</Text>
          <Text style={[styles.ctaSub, { color: colors.cream }]}>{t('home.tap_to_answer')} →</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, gap: SPACING.sm },
  label: { fontSize: FONT_SIZE.xs, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '500' },
  numberRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.md },
  number: { fontFamily: FONTS.display, fontSize: 84, lineHeight: 88, letterSpacing: -2 },
  numberMeta: { paddingBottom: 14, gap: 2 },
  word: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  delta: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  strip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs },
  stripItem: { alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  letter: { fontSize: 11 },
  line: { fontSize: FONT_SIZE.md, lineHeight: 24, marginTop: SPACING.xs },
  recovery: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  done: { fontSize: FONT_SIZE.sm, fontWeight: '500', marginTop: SPACING.xs },
  tease: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  cta: { borderRadius: RADIUS.lg, padding: SPACING.md, gap: 4, marginTop: SPACING.xs },
  ctaText: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 28 },
  ctaSub: { fontSize: FONT_SIZE.sm, opacity: 0.8 },
});

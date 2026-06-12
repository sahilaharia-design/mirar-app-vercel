import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { PatternReading, PatternInsight } from '../../lib/patterns';

// ─── PatternsPanel ─────────────────────────────────────────────────────────────
// The Signals tab's pattern layer: what repeats, what is changing,
// what is building, what is holding. Observation language only.

function line(t: TFunction, insight: PatternInsight): string {
  const theme = t(`themes.${insight.themeCode}`);
  switch (insight.kind) {
    case 'recurring_tension': return t('awareness.recurring_tension', { theme });
    case 'shift_down': return t('awareness.shift_down', { theme });
    case 'shift_up': return t('awareness.shift_up', { theme });
    case 'growth': return t('awareness.growth', { theme });
    case 'steady': return t('awareness.steady', { theme });
    default: return t('awareness.forming');
  }
}

function Section({
  label,
  insights,
}: {
  label: string;
  insights: PatternInsight[];
}) {
  const { t } = useTranslation();
  const colors = useColors();
  if (insights.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{label}</Text>
      {insights.map((i) => (
        <Text key={`${i.kind}-${i.themeCode}`} style={[styles.lineText, { color: colors.slateMid }]}>
          {line(t, i)}
        </Text>
      ))}
    </View>
  );
}

export function PatternsPanel({ reading }: { reading: PatternReading }) {
  const { t } = useTranslation();
  const colors = useColors();

  const hasAny =
    reading.hasEnoughData &&
    (reading.carrying.length > 0 ||
      reading.shifts.length > 0 ||
      reading.growth.length > 0 ||
      reading.steady.length > 0);

  return (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
      <Text style={[styles.title, { color: colors.slate }]}>
        {t('awareness.patterns_title')}
      </Text>
      {!hasAny ? (
        <Text style={[styles.lineText, { color: colors.slateMid }]}>
          {t('awareness.tone_forming', { count: reading.daysObserved })}
        </Text>
      ) : (
        <>
          <Section label={t('awareness.repeats_label')} insights={reading.carrying} />
          <Section label={t('awareness.changing_label')} insights={reading.shifts} />
          <Section label={t('awareness.building_label')} insights={reading.growth} />
          <Section label={t('awareness.holding_label')} insights={reading.steady} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
  },
  section: {
    gap: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  lineText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
});

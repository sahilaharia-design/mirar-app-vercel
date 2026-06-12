import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { PatternReading, PatternInsight } from '../../lib/patterns';

// ─── AwarenessCard ─────────────────────────────────────────────────────────────
// The dashboard's answer to: How am I doing? What am I carrying?
// What is changing? What deserves attention?
// Renders the pattern engine's structured output through i18n — observation
// language only, no advice, no scores.

function insightText(t: TFunction, insight: PatternInsight): string {
  const theme = t(`themes.${insight.themeCode}`);
  switch (insight.kind) {
    case 'recurring_tension':
      return t('awareness.recurring_tension', { theme });
    case 'shift_down':
      return t('awareness.shift_down', { theme });
    case 'shift_up':
      return t('awareness.shift_up', { theme });
    case 'growth':
      return t('awareness.growth', { theme });
    case 'steady':
      return t('awareness.steady', { theme });
    default:
      return t('awareness.forming');
  }
}

export function AwarenessCard({ reading }: { reading: PatternReading }) {
  const { t } = useTranslation();
  const colors = useColors();

  if (!reading.hasEnoughData) {
    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(160)}
        style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
      >
        <Text style={[styles.label, { color: colors.slateLight }]}>
          {t('awareness.title')}
        </Text>
        <Text style={[styles.tone, { color: colors.slateMid }]}>
          {t('awareness.tone_forming', { count: reading.daysObserved })}
        </Text>
      </Animated.View>
    );
  }

  const changing = reading.shifts.slice(0, 2);
  const holding = reading.steady[0] ?? null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(160)}
      style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
    >
      <Text style={[styles.label, { color: colors.slateLight }]}>
        {t('awareness.title')}
      </Text>

      {/* How am I doing? */}
      <Text style={[styles.tone, { color: colors.slate }]}>
        {t(`awareness.tone_${reading.tone}`)}
      </Text>

      {/* What deserves attention? */}
      {reading.attention && (
        <View style={[styles.attentionBlock, { borderLeftColor: colors.accentTeal }]}>
          <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>
            {t('awareness.attention_label')}
          </Text>
          <Text style={[styles.attentionText, { color: colors.slate }]}>
            {insightText(t, reading.attention)}
          </Text>
        </View>
      )}

      {/* What is changing? */}
      {changing.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>
            {t('awareness.changing_label')}
          </Text>
          {changing.map((s) => (
            <Text key={`${s.kind}-${s.themeCode}`} style={[styles.lineText, { color: colors.slateMid }]}>
              {insightText(t, s)}
            </Text>
          ))}
        </View>
      )}

      {/* What is holding? */}
      {holding && holding.themeCode !== reading.attention?.themeCode && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>
            {t('awareness.holding_label')}
          </Text>
          <Text style={[styles.lineText, { color: colors.slateMid }]}>
            {insightText(t, holding)}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tone: {
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
    fontWeight: '400',
  },
  attentionBlock: {
    borderLeftWidth: 2,
    paddingLeft: SPACING.sm,
    gap: 2,
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
  attentionText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
  lineText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
});

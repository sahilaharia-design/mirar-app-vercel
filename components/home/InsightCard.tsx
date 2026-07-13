import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { ThemeScore, AlignmentScoreRow } from '../../types/mirar';

interface InsightCardProps {
  currentDay: number;
  rollingThemeScores: ThemeScore[];
  alignmentScore: number | null;
  mirrorText?: string | null; // AI-generated, Phase B
}

function buildInsight(
  t: (key: string, opts?: any) => string,
  currentDay: number,
  themeScores: ThemeScore[],
  alignmentScore: number | null,
): string {
  if (currentDay <= 1) {
    return t('insights.first_day');
  }

  if (currentDay === 2) {
    return t('insights.second_day');
  }

  if (currentDay === 3) {
    return t('insights.third_day');
  }

  if (themeScores.length === 0 || alignmentScore === null) {
    return t('insights.calibrating_mirror');
  }

  // Find specific themes by status
  const underLoad = themeScores.filter((ts) => ts.status === 'Under Load');
  const aligned = themeScores.filter((ts) => ts.status === 'Aligned');
  const forming = themeScores.filter((ts) => ts.status === 'Forming');
  const noReading = themeScores.filter((ts) => ts.status === 'No Reading');

  const themeName = (code: string) => t(`themes.${code}`);

  if (underLoad.length >= 2) {
    return t('insights.under_load_two', { a: themeName(underLoad[0].code), b: themeName(underLoad[1].code) });
  }

  if (underLoad.length === 1) {
    return t('insights.under_load_one', { name: themeName(underLoad[0].code) });
  }

  if (aligned.length >= 4) {
    return t('insights.aligned_many', { a: themeName(aligned[0].code), b: themeName(aligned[1].code) });
  }

  if (forming.length >= 3) {
    return t('insights.forming_many', { a: themeName(forming[0].code), b: themeName(forming[1].code) });
  }

  if (noReading.length >= 4) {
    return t('insights.no_reading_many', { n: noReading.length });
  }

  if (aligned.length === 1) {
    return t('insights.aligned_one', { name: themeName(aligned[0].code) });
  }

  return t('insights.active_areas', { n: themeScores.length - noReading.length });
}

export function InsightCard({ currentDay, rollingThemeScores, alignmentScore, mirrorText }: InsightCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  // Use AI-generated text if available, fall back to computed insight
  const insight = mirrorText ?? buildInsight(t, currentDay, rollingThemeScores, alignmentScore);

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(150)}>
      <LinearGradient
        colors={[colors.warmGlow ?? colors.creamDark, colors.creamLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: colors.borderLight, ...cardShadow(colors.shadowColor) }]}
      >
        <View style={[styles.mirrorDot, { backgroundColor: colors.gradientStart }]} />
        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.slateLight }]}>
            {mirrorText ? t('checkin.reflection_label') : t('insights.mirror_notice')}
          </Text>
          <Text style={[styles.insightText, { color: colors.slate }]}>
            {insight}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function cardShadow(shadowColor: string) {
  return Platform.select({
    ios: { shadowColor, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10 },
    android: { elevation: 2 },
    web: { boxShadow: '0 3px 12px rgba(74,74,85,0.05)' },
    default: {},
  }) as any;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  mirrorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 18,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    fontWeight: '400',
    fontStyle: 'italic',
  },
});

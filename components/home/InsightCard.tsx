import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT_SIZE, SPACING, RADIUS, THEMES } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { ThemeScore, AlignmentScoreRow } from '../../types/mirar';

interface InsightCardProps {
  currentDay: number;
  rollingThemeScores: ThemeScore[];
  alignmentScore: number | null;
  mirrorText?: string | null; // AI-generated, Phase B
}

function buildInsight(
  currentDay: number,
  themeScores: ThemeScore[],
  alignmentScore: number | null,
): string {
  if (currentDay <= 1) {
    return 'First signal recorded. Mirar begins pattern detection after 3–5 consecutive check-ins.';
  }

  if (currentDay === 2) {
    return 'Two signals in. No pattern yet — pattern detection requires at least 3 consecutive days.';
  }

  if (currentDay === 3) {
    return 'Day 3 registered. Early pattern window opening. Keep the streak to establish baseline.';
  }

  if (themeScores.length === 0 || alignmentScore === null) {
    return 'Signal data is building. Pattern detection requires 3–5 consecutive readings.';
  }

  // Find specific themes by status
  const underLoad = themeScores.filter((ts) => ts.status === 'Under Load');
  const aligned = themeScores.filter((ts) => ts.status === 'Aligned');
  const forming = themeScores.filter((ts) => ts.status === 'Forming');
  const noReading = themeScores.filter((ts) => ts.status === 'No Reading');

  const themeName = (code: string) => THEMES[code as keyof typeof THEMES]?.name ?? code;

  if (underLoad.length >= 2) {
    const names = underLoad.slice(0, 2).map((t) => themeName(t.code)).join(' and ');
    return `${names} are showing strain in your signals right now. The mirror is holding this.`;
  }

  if (underLoad.length === 1) {
    return `${themeName(underLoad[0].code)} is carrying some weight in your signals. Worth noticing.`;
  }

  if (aligned.length >= 4) {
    const names = aligned.slice(0, 2).map((t) => themeName(t.code)).join(' and ');
    return `${names} — among others — are showing solid alignment in recent signals.`;
  }

  if (forming.length >= 3) {
    const names = forming.slice(0, 2).map((t) => themeName(t.code)).join(' and ');
    return `${names} are forming patterns. Your signals are building momentum.`;
  }

  if (noReading.length >= 4) {
    return `${noReading.length} themes are still building signal. Each check-in adds definition to your mirror.`;
  }

  if (aligned.length === 1) {
    return `${themeName(aligned[0].code)} is your steadiest signal right now.`;
  }

  return `Your signals are active across ${themeScores.length - noReading.length} themes. The mirror is reading.`;
}

export function InsightCard({ currentDay, rollingThemeScores, alignmentScore, mirrorText }: InsightCardProps) {
  const colors = useColors();
  // Use AI-generated text if available, fall back to computed insight
  const insight = mirrorText ?? buildInsight(currentDay, rollingThemeScores, alignmentScore);

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
            {mirrorText ? 'Mirror · Today' : 'Mirror observes'}
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

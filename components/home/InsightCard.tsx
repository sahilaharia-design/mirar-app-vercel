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
    return 'Your first reflection is here. Mirar begins noticing patterns after a few daily pauses.';
  }

  if (currentDay === 2) {
    return 'Two reflections in. The pattern is still forming.';
  }

  if (currentDay === 3) {
    return 'A small pattern window is opening. Read this gently.';
  }

  if (themeScores.length === 0 || alignmentScore === null) {
    return 'Your mirror is still forming. Each reflection adds a little more shape.';
  }

  // Find specific themes by status
  const underLoad = themeScores.filter((ts) => ts.status === 'Under Load');
  const aligned = themeScores.filter((ts) => ts.status === 'Aligned');
  const forming = themeScores.filter((ts) => ts.status === 'Forming');
  const noReading = themeScores.filter((ts) => ts.status === 'No Reading');

  const themeName = (code: string) => THEMES[code as keyof typeof THEMES]?.name ?? code;

  if (underLoad.length >= 2) {
    const names = underLoad.slice(0, 2).map((t) => themeName(t.code)).join(' and ');
    return `${names} are showing pressure in recent reflections. Read this as a mirror, not a verdict.`;
  }

  if (underLoad.length === 1) {
    return `${themeName(underLoad[0].code)} is carrying some weight in recent reflections.`;
  }

  if (aligned.length >= 4) {
    const names = aligned.slice(0, 2).map((t) => themeName(t.code)).join(' and ');
    return `${names} — among others — are showing steadiness in recent reflections.`;
  }

  if (forming.length >= 3) {
    const names = forming.slice(0, 2).map((t) => themeName(t.code)).join(' and ');
    return `${names} are starting to form a pattern.`;
  }

  if (noReading.length >= 4) {
    return `${noReading.length} areas are still forming. Each daily pause adds definition to your mirror.`;
  }

  if (aligned.length === 1) {
    return `${themeName(aligned[0].code)} is the steadiest signal right now.`;
  }

  return `Your recent reflections are active across ${themeScores.length - noReading.length} areas. The mirror is still forming.`;
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
            {mirrorText ? 'Today’s reflection' : 'A small signal'}
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

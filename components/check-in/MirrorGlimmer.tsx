import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { SubmittedSignal, ThemeCode } from '../../types/mirar';

interface MirrorGlimmerProps {
  glimmerText: string | null;
  dayNumber: number;
  submittedSignal?: SubmittedSignal | null;
}

const LEVEL_KEY: Record<string, string> = {
  Low: 'checkin.level_low',
  Medium: 'checkin.level_mid',
  High: 'checkin.level_high',
};

const LEVEL_COLOR: Record<string, string> = {
  Low: '#B85A4A',
  Medium: '#B07A2A',
  High: '#5A8A6A',
};

function ThemeSignalChip({ themeCode, level, colors, t }: {
  themeCode: ThemeCode;
  level: string;
  colors: any;
  t: (key: string) => string;
}) {
  const levelColor = LEVEL_COLOR[level] ?? colors.slateMid;

  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.creamDark, borderColor: colors.borderLight }]}>
      <View style={[chipStyles.dot, { backgroundColor: levelColor }]} />
      <Text style={[chipStyles.name, { color: colors.slate }]}>
        {t(`themes.${themeCode}`)}
      </Text>
      <Text style={[chipStyles.level, { color: levelColor }]}>
        {t(LEVEL_KEY[level] ?? 'checkin.level_low')}
      </Text>
    </View>
  );
}

function ScoreDelta({ before, after, colors, t }: {
  before: number | null;
  after: number | null;
  colors: any;
  t: (key: string, opts?: any) => string;
}) {
  if (before === null || after === null) return null;
  const delta = Math.round(after - before);
  if (Math.abs(delta) < 1) {
    return (
      <Text style={[deltaStyles.text, { color: colors.slateLight }]}>
        {t('checkin.reading_steady')}
      </Text>
    );
  }
  const up = delta > 0;
  const color = up ? '#5A8A6A' : '#B85A4A';
  return (
    <View style={deltaStyles.row}>
      <Text style={[deltaStyles.arrow, { color }]}>{up ? '↑' : '↓'}</Text>
      <Text style={[deltaStyles.text, { color }]}>
        {t(up ? 'checkin.reading_up' : 'checkin.reading_down', { n: Math.abs(delta) })}
      </Text>
    </View>
  );
}

export function MirrorGlimmer({ glimmerText, dayNumber, submittedSignal }: MirrorGlimmerProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeInUp.duration(700).delay(200).springify().damping(18)}
      style={styles.outerContainer}
    >
      {/* Main glimmer */}
      <LinearGradient
        colors={[colors.warmGlow ?? colors.creamDark, colors.creamDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.glimmerCard, { borderLeftColor: colors.gradientStart }]}
      >
        <View style={[styles.glimmerDot, { backgroundColor: colors.gradientStart }]} />
        <View style={styles.glimmerContent}>
          <Animated.Text
            entering={FadeIn.duration(600).delay(300)}
            style={[styles.mirrorLabel, { color: colors.slateLight }]}
          >
            {t('checkin.mirror_signal_label', { n: dayNumber })}
          </Animated.Text>
          <Animated.Text
            entering={FadeIn.duration(900).delay(600)}
            style={[styles.glimmer, { color: colors.slate }]}
          >
            {glimmerText ?? t('checkin.default_glimmer')}
          </Animated.Text>
        </View>
      </LinearGradient>

      {/* What shifted — only shows if we have signal data */}
      {submittedSignal && (
        <Animated.View
          entering={FadeIn.duration(500).delay(800)}
          style={[styles.shiftedSection, { borderColor: colors.borderLight, backgroundColor: colors.white }]}
        >
          <Text style={[styles.shiftedLabel, { color: colors.slateLight }]}>
            {t('checkin.what_touched')}
          </Text>

          <View style={styles.chips}>
            <ThemeSignalChip
              themeCode={submittedSignal.theme1Code}
              level={submittedSignal.theme1Level}
              colors={colors}
              t={t}
            />
            <ThemeSignalChip
              themeCode={submittedSignal.theme2Code}
              level={submittedSignal.theme2Level}
              colors={colors}
              t={t}
            />
          </View>

          <ScoreDelta
            before={submittedSignal.scoreBefore}
            after={submittedSignal.scoreAfter}
            colors={colors}
            t={t}
          />
        </Animated.View>
      )}

      {/* Tomorrow tease */}
      {submittedSignal?.tomorrowTease && (
        <Animated.View
          entering={FadeIn.duration(500).delay(1100)}
          style={[styles.tomorrowCard, { borderColor: colors.borderLight, backgroundColor: colors.creamLight }]}
        >
          <Text style={[styles.tomorrowLabel, { color: colors.slateXLight }]}>
            {t('checkin.tomorrow_explore')}
          </Text>
          <Text style={[styles.tomorrowText, { color: colors.slateLight }]}>
            {submittedSignal.tomorrowTease}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    gap: SPACING.sm,
  },
  glimmerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderLeftWidth: 3,
    borderRadius: RADIUS.lg,
  },
  glimmerDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    marginTop: 22,
    flexShrink: 0,
  },
  glimmerContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  mirrorLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  glimmer: {
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  shiftedSection: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  shiftedLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  tomorrowCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: 3,
  },
  tomorrowLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tomorrowText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  name: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  level: {
    fontSize: 10,
    fontWeight: '400',
  },
});

const deltaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrow: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '400',
  },
});

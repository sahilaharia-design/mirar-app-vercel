import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ThemeCode, ThemeStatus } from '../../types/mirar';
import { STATUS_CONFIG, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { InfoTooltipInline } from '../ui/InfoTooltip';
import { STAGGER_MS } from '../../lib/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ThemeSignalMiniCardProps {
  code: ThemeCode;
  status: ThemeStatus;
  onPress?: () => void;
  index?: number;
}

// Map runtime status strings to i18n keys (en/hi/gu provide status.*)
const STATUS_I18N_KEY: Record<string, string> = {
  Aligned: 'status.aligned',
  Forming: 'status.forming',
  Stabilizing: 'status.stabilizing',
  'Under Load': 'status.under_load',
  'No Reading': 'status.no_reading',
};

// Signal strength per status — drives the mini arc fill (0–1). Ordering communicates
// intensity without relying on color alone (color-not-only guidance).
const STATUS_STRENGTH: Record<ThemeStatus, number> = {
  Aligned: 1,
  Forming: 0.72,
  Stabilizing: 0.48,
  'Under Load': 0.26,
  'No Reading': 0.06,
};

const ARC_SIZE = 34;
const ARC_STROKE = 3.5;
const ARC_RADIUS = (ARC_SIZE - ARC_STROKE) / 2;
const ARC_CIRC = 2 * Math.PI * ARC_RADIUS;

function SignalArc({ status, color, trackColor }: { status: ThemeStatus; color: string; trackColor: string }) {
  const progress = useSharedValue(0);
  const strength = STATUS_STRENGTH[status] ?? 0;

  useEffect(() => {
    progress.value = withDelay(150, withTiming(strength, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [strength]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: ARC_CIRC * (1 - progress.value),
  }));

  return (
    <Svg width={ARC_SIZE} height={ARC_SIZE} viewBox={`0 0 ${ARC_SIZE} ${ARC_SIZE}`}>
      <Circle
        cx={ARC_SIZE / 2}
        cy={ARC_SIZE / 2}
        r={ARC_RADIUS}
        stroke={trackColor}
        strokeWidth={ARC_STROKE}
        fill="none"
      />
      <AnimatedCircle
        cx={ARC_SIZE / 2}
        cy={ARC_SIZE / 2}
        r={ARC_RADIUS}
        stroke={color}
        strokeWidth={ARC_STROKE}
        fill="none"
        strokeDasharray={ARC_CIRC}
        strokeLinecap="round"
        transform={`rotate(-90 ${ARC_SIZE / 2} ${ARC_SIZE / 2})`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

export function ThemeSignalMiniCard({ code, status, onPress, index = 0 }: ThemeSignalMiniCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const config = STATUS_CONFIG[status];
  const [expanded, setExpanded] = useState(false);
  const expandHeight = useSharedValue(0);

  const handlePress = () => {
    const next = !expanded;
    expandHeight.value = withTiming(next ? 1 : 0, { duration: 250 });
    setExpanded(next);
    onPress?.();
  };

  const expandStyle = useAnimatedStyle(() => ({
    maxHeight: expandHeight.value * 60,
    opacity: expandHeight.value,
    marginTop: expandHeight.value * 4,
  }));

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(200 + index * STAGGER_MS)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: config.bg,
            borderColor: colors.borderLight,
            ...cardShadow(colors.shadowColor),
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={styles.topRow}>
          <SignalArc status={status} color={config.color} trackColor={colors.borderLight} />
          <View style={styles.topRowText}>
            <Text style={[styles.name, { color: colors.slate }]} numberOfLines={2}>
              {t(`themes.${code}`)}
            </Text>
            <Text style={[styles.statusText, { color: config.color }]}>
              {t(STATUS_I18N_KEY[status] ?? 'status.no_reading')}
            </Text>
          </View>
        </View>
        <Animated.View style={[styles.expandedContent, expandStyle]}>
          <Text style={[styles.description, { color: colors.slateLight }]} numberOfLines={3}>
            {t(`themes.${code}_short`)}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ThemeSignalsGrid({
  themeScores,
  onThemePress,
}: {
  themeScores: Array<{ code: ThemeCode; status: ThemeStatus }>;
  onThemePress?: (code: ThemeCode) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(400)}
      style={styles.gridContainer}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>
          {t('common.your_signals')}
        </Text>
        <InfoTooltipInline
          helpText={t('tooltips.theme_signals')}
          size={13}
        />
      </View>
      <View style={styles.grid}>
        {themeScores.map((ts, i) => (
          <ThemeSignalMiniCard
            key={ts.code}
            code={ts.code}
            status={ts.status}
            index={i}
            onPress={() => onThemePress?.(ts.code)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function cardShadow(shadowColor: string) {
  return Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 8px rgba(74,74,85,0.04)' },
    default: {},
  }) as any;
}

const styles = StyleSheet.create({
  gridContainer: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 1.2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACING.sm,
  },
  // Two-column layout: each wrapper takes just under half so two fit per row
  cardWrapper: {
    width: '48.5%',
  },
  card: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    gap: 4,
    alignItems: 'flex-start',
    minHeight: 80,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  topRowText: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  expandedContent: {
    overflow: 'hidden',
    width: '100%',
  },
  description: {
    fontSize: 10,
    lineHeight: 14,
  },
});

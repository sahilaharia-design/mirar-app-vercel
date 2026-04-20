import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { ThemeCode, ThemeStatus } from '../../types/mirar';
import { THEMES, STATUS_CONFIG, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { InfoTooltipInline } from '../ui/InfoTooltip';
import { STAGGER_MS } from '../../lib/animations';

interface ThemeSignalMiniCardProps {
  code: ThemeCode;
  status: ThemeStatus;
  onPress?: () => void;
  index?: number;
}

export function ThemeSignalMiniCard({ code, status, onPress, index = 0 }: ThemeSignalMiniCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const config = STATUS_CONFIG[status];
  const theme = THEMES[code];
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
    <Animated.View entering={FadeInUp.duration(400).delay(200 + index * STAGGER_MS)}>
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
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text style={[styles.name, { color: colors.slate }]} numberOfLines={2}>
          {theme?.name ?? code}
        </Text>
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
        <Animated.View style={[styles.expandedContent, expandStyle]}>
          <Text style={[styles.description, { color: colors.slateLight }]} numberOfLines={3}>
            {theme?.shortDescription ?? ''}
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
    gap: SPACING.sm,
  },
  card: {
    width: '30%',
    flexGrow: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    gap: 4,
    alignItems: 'flex-start',
    minWidth: 90,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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

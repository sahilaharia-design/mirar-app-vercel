import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { InfoTooltipInline } from '../ui/InfoTooltip';

interface TodayCheckinCardProps {
  dayNumber: number;
  promptPreview: string;
  isCompleted: boolean;
  completedAt?: string | null;
  onPress: () => void;
}

export function TodayCheckinCard({
  dayNumber,
  promptPreview,
  isCompleted,
  completedAt,
  onPress,
}: TodayCheckinCardProps) {
  const { t } = useTranslation();
  const colors = useColors();

  if (isCompleted) {
    return (
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={[styles.card, styles.completedCard, {
          backgroundColor: colors.white,
          borderColor: colors.border,
          ...cardShadow(colors.shadowColor),
        }]}
      >
        <View style={styles.completedHeader}>
          <View style={[styles.checkDot, { backgroundColor: colors.aligned }]} />
          <Text style={[styles.completedLabel, { color: colors.aligned }]}>
            {t('common.checkin_recorded')}
          </Text>
        </View>
        <Text style={[styles.dayLabel, { color: colors.slateLight }]}>
          Today's mirror
        </Text>
        {completedAt && (
          <Text style={[styles.time, { color: colors.slateXLight }]}>
            {new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(300)}>
      <TouchableOpacity
        style={[styles.card, styles.activeCard, {
          backgroundColor: colors.white,
          borderColor: colors.border,
          ...cardShadow(colors.shadowColor),
        }]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <View style={[styles.accentBar, { backgroundColor: colors.aligned }]} />
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <Text style={[styles.dayLabel, { color: colors.slateLight }]}>
              {t('today.daily_pause')}
            </Text>
            <InfoTooltipInline
              helpText={t('tooltips.checkin_card')}
              size={13}
            />
          </View>
          <Text style={[styles.prompt, { color: colors.slate }]} numberOfLines={2}>
            {promptPreview}
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.cta, { color: colors.slateMid }]}>
              {t('common.start_checkin')}
            </Text>
            <View style={[styles.ctaCircle, { backgroundColor: colors.slate }]}>
              <Text style={styles.ctaArrow}>→</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function cardShadow(shadowColor: string) {
  return Platform.select({
    ios: {
      shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: '0 4px 16px rgba(74,74,85,0.06)',
    },
    default: {},
  }) as any;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  activeCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  completedCard: {
    opacity: 0.85,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  checkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  completedLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.5,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  prompt: {
    fontSize: FONT_SIZE.md,
    lineHeight: 26,
    fontWeight: '400',
    paddingTop: 2,
  },
  footer: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cta: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  ctaCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaArrow: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    fontSize: FONT_SIZE.xs,
  },
});

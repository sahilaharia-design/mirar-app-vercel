import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

export function FirstDayWelcome() {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(100)}
      style={[styles.container, { backgroundColor: colors.creamDark, borderColor: colors.borderLight }]}
    >
      <View style={[styles.dot, { backgroundColor: colors.slateXLight }]} />
      <Text style={[styles.heading, { color: colors.slate }]}>
        {t('first_day_welcome.heading')}
      </Text>
      <Text style={[styles.body, { color: colors.slateMid }]}>
        {t('first_day_welcome.body')}
      </Text>
      <View style={[styles.arrow, { borderTopColor: colors.slateXLight }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  heading: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '300',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
  arrow: {
    marginTop: SPACING.sm,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
  },
});

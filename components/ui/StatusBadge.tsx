import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeStatus } from '../../types/mirar';
import { STATUS_CONFIG, FONT_SIZE, RADIUS } from '../../lib/constants';

const STATUS_KEY: Record<ThemeStatus, string> = {
  Aligned: 'status.aligned',
  Forming: 'status.forming',
  Stabilizing: 'status.stabilizing',
  'Under Load': 'status.under_load',
  'No Reading': 'status.no_reading',
};

interface StatusBadgeProps {
  status: ThemeStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        style={[
          styles.label,
          { color: config.color },
          isSmall && styles.labelSm,
        ]}
      >
        {t(STATUS_KEY[status])}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelSm: {
    fontSize: 10,
  },
});

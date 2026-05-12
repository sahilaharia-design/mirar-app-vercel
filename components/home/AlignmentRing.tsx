import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AlignmentStatus, AlignmentTrend } from '../../types/mirar';
import { getAlignmentColor } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, FONTS } from '../../lib/constants';
import { InfoTooltip } from '../ui/InfoTooltip';

interface AlignmentRingProps {
  score: number | null;
  status: AlignmentStatus;
  trend: AlignmentTrend | null;
  size?: number;
}

const RING_SIZE = 200;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STATUS_I18N_KEY: Record<string, string> = {
  'Calibrating': 'status.calibrating',
  'Aligned': 'status.aligned',
  'Forming': 'status.forming',
  'Stabilizing': 'status.stabilizing',
  'Under Load': 'status.under_load',
  'No Reading': 'status.no_reading',
};

export function AlignmentRing({ score, status, trend, size = RING_SIZE }: AlignmentRingProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const isCalibrating = score === null;
  const color = isCalibrating ? colors.slateXLight : getAlignmentColor(score);
  const targetProgress = isCalibrating ? 0.08 : score! / 100;

  // Animated values
  const arcProgress = useSharedValue(0);
  const displayNumber = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate ring arc drawing
    arcProgress.value = withDelay(
      200,
      withTiming(targetProgress, {
        duration: 1400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Animate number counting up
    if (!isCalibrating && score !== null) {
      displayNumber.value = withDelay(
        400,
        withTiming(score, {
          duration: 1200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
    }

    // Fade in center content
    contentOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600 })
    );

    // Subtle glow pulse
    glowOpacity.value = withDelay(
      800,
      withTiming(0.6, { duration: 800 })
    );
  }, [score, isCalibrating]);

  const centerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'steady' ? '→' : null;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {/* Warm glow behind ring */}
        <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
          <LinearGradient
            colors={[colors.warmGlow ?? colors.creamDark, colors.transparent ?? 'transparent']}
            style={[styles.glow, { width: size + 60, height: size + 60, borderRadius: (size + 60) / 2 }]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* SVG ring — web only */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ position: 'absolute' as any }}
        >
          {/* Track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.borderLight}
            strokeWidth={STROKE}
          />
          {/* Progress arc */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - targetProgress)}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.25,0.1,0.25,1)' } as any}
          />
        </svg>

        {/* Center content */}
        <Animated.View style={[styles.center, centerAnimatedStyle]}>
          {isCalibrating ? (
            <>
              <Text style={[styles.calibratingText, { color: colors.slateMid }]}>
                {t('common.calibrating')}
              </Text>
              <Text style={[styles.calibratingSubtext, { color: colors.slateLight }]}>
                {t('common.calibrating_subtext')}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.statusLabel, { color }]}>
                {t(STATUS_I18N_KEY[status] || 'status.calibrating')}
              </Text>
              <Text style={[styles.score, { color: colors.slateLight }]}>{score}</Text>
              {trendSymbol && (
                <Text style={[styles.trend, { color }]}>{trendSymbol}</Text>
              )}
            </>
          )}
        </Animated.View>
      </View>
    );
  }

  // Native fallback — bordered circle with animations
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Warm glow */}
      <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
        <LinearGradient
          colors={[colors.warmGlow ?? colors.creamDark, colors.transparent ?? 'transparent']}
          style={[styles.glow, { width: size + 60, height: size + 60, borderRadius: (size + 60) / 2 }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <View
        style={[
          styles.nativeRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            borderWidth: STROKE,
            backgroundColor: colors.creamLight,
          },
        ]}
      />
      <Animated.View style={[styles.center, centerAnimatedStyle]}>
        {isCalibrating ? (
          <Text style={[styles.calibratingText, { color: colors.slateMid }]}>
            {t('common.calibrating')}
          </Text>
        ) : (
          <>
            <Text style={[styles.statusLabel, { color }]}>
              {t(STATUS_I18N_KEY[status] || 'status.calibrating')}
            </Text>
            <Text style={[styles.score, { color: colors.slateLight }]}>{score}</Text>
            {trendSymbol && (
              <Text style={[styles.trend, { color }]}>{trendSymbol}</Text>
            )}
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  nativeRing: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  score: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.6,
  },
  statusLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  trend: {
    fontSize: FONT_SIZE.base,
    marginTop: 2,
  },
  calibratingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  calibratingSubtext: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
});

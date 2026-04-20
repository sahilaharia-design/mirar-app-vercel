import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, CYCLE_DAYS } from '../../lib/constants';
import {
  V3_SETTLE_EASING,
  V3_SETTLE_DURATION,
  V3_STAGGER_MS,
  V3_UNDERLINE_EASING,
  V3_UNDERLINE_DURATION,
  V3_UNDERLINE_DELAY,
  V3_REDUCED_FADE_DURATION,
} from '../../lib/animations';

interface PromptCardProps {
  dayNumber: number;
  /** Accepted for back-compat with the existing call site; no longer rendered. */
  stage?: number;
  promptText: string;
  totalDays?: number;
  /** Optional italic serif whisper above the question (e.g. "Good morning, Anya."). */
  greeting?: string;
  /** Optional right-side strip caps (e.g. "Tue · 9:41"). Computed by parent. */
  timeLabel?: string;
}

export function PromptCard({
  dayNumber,
  promptText,
  totalDays = CYCLE_DAYS,
  greeting,
  timeLabel,
}: PromptCardProps) {
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // Settle values: opacity + 4px Y drift, staggered 100ms
  const stripOpacity = useSharedValue(0);
  const stripY = useSharedValue(4);
  const greetOpacity = useSharedValue(0);
  const greetY = useSharedValue(4);
  const questionOpacity = useSharedValue(0);
  const questionY = useSharedValue(4);
  // Brass underline: scaleX 0 → 1, transform-origin left
  const underlineScale = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      const fade = { duration: V3_REDUCED_FADE_DURATION };
      stripOpacity.value = withTiming(1, fade);
      greetOpacity.value = withTiming(1, fade);
      questionOpacity.value = withTiming(1, fade);
      stripY.value = 0;
      greetY.value = 0;
      questionY.value = 0;
      underlineScale.value = 1;
      return;
    }
    const settle = { duration: V3_SETTLE_DURATION, easing: V3_SETTLE_EASING };
    stripOpacity.value = withTiming(1, settle);
    stripY.value = withTiming(0, settle);
    greetOpacity.value = withDelay(V3_STAGGER_MS, withTiming(1, settle));
    greetY.value = withDelay(V3_STAGGER_MS, withTiming(0, settle));
    questionOpacity.value = withDelay(V3_STAGGER_MS * 2, withTiming(1, settle));
    questionY.value = withDelay(V3_STAGGER_MS * 2, withTiming(0, settle));
    underlineScale.value = withDelay(
      V3_UNDERLINE_DELAY,
      withTiming(1, { duration: V3_UNDERLINE_DURATION, easing: V3_UNDERLINE_EASING }),
    );
  }, [reduceMotion, promptText]);

  const stripStyle = useAnimatedStyle(() => ({
    opacity: stripOpacity.value,
    transform: [{ translateY: stripY.value }],
  }));
  const greetStyle = useAnimatedStyle(() => ({
    opacity: greetOpacity.value,
    transform: [{ translateY: greetY.value }],
  }));
  const questionStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateY: questionY.value }],
  }));
  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: underlineScale.value }],
  }));

  // Split "Day 14" so the numeric portion can carry the ink accent
  // while the label stays in the caps slateLight tone. Works across locales
  // because {{n}} is always rendered as digits.
  const dayLabel = t('common.day', { n: dayNumber });
  const match = dayLabel.match(/^(.*?)(\d+)(.*)$/);
  const dayPrefix = match ? match[1] : `${dayLabel} `;
  const dayNum = match ? match[2] : String(dayNumber);
  const daySuffix = match ? match[3] : '';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.strip, stripStyle]}>
        <Text style={styles.caps}>
          <Text style={styles.capsLight}>{dayPrefix}</Text>
          <Text style={styles.capsInk}>{dayNum}</Text>
          <Text style={styles.capsLight}>
            {daySuffix} / {totalDays}
          </Text>
        </Text>
        {timeLabel ? <Text style={styles.caps}>{timeLabel}</Text> : <View />}
      </Animated.View>
      <View style={styles.rule} />

      {greeting ? (
        <Animated.Text style={[styles.greeting, greetStyle]}>{greeting}</Animated.Text>
      ) : null}

      <Animated.View style={[styles.questionWrap, questionStyle]}>
        <Text style={styles.question} accessibilityRole="header">
          {promptText}
        </Text>
        <Animated.View style={[styles.underline, underlineStyle]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 28,
    paddingBottom: 8,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  caps: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 2, // ≈0.2em at 10px
    textTransform: 'uppercase',
    color: COLORS.slateLight,
  },
  capsLight: {
    color: COLORS.slateLight,
  },
  capsInk: {
    color: COLORS.ink,
  },
  rule: {
    height: 1,
    backgroundColor: COLORS.ruleLight,
    marginTop: 10,
  },
  greeting: {
    marginTop: 28,
    fontFamily: FONTS.displayItalic,
    fontSize: 18,
    lineHeight: 24,
    color: COLORS.slateMid,
    letterSpacing: 0.1,
  },
  questionWrap: {
    marginTop: 28,
    marginBottom: 24,
  },
  question: {
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 30 * 1.22,
    letterSpacing: -0.3,
    color: COLORS.ink,
  },
  underline: {
    marginTop: 16,
    width: 48,
    height: 1,
    backgroundColor: COLORS.brass,
    transformOrigin: 'left',
  },
});

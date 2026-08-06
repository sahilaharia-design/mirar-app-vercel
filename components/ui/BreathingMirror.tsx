import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '../../contexts/theme-context';

// A still, breathing mirror surface — the calm motif first built for the
// onboarding welcome screen, shared here so any screen that wants the same
// settling atmosphere (e.g. the pre-check-in pause) doesn't reinvent it.
export function BreathingMirror({ size = 120 }: { size?: number }) {
  const colors = useColors();
  const breathe = useSharedValue(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((val) => {
      if (cancelled) return;
      setReducedMotion(val);
      if (!val) {
        breathe.value = withRepeat(
          withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        );
      }
    });
    return () => { cancelled = true; };
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + breathe.value * 0.3,
    transform: [{ scale: 1 + breathe.value * 0.035 }],
  }));

  const r1 = size * 0.467;
  const r2 = size * 0.35;
  const r3 = size * 0.233;
  const c = size / 2;

  const svg = (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={c} cy={c} r={r1} stroke={colors.slateXLight} strokeWidth={1} fill="none" opacity={0.35} />
      <Circle cx={c} cy={c} r={r2} stroke={colors.slateXLight} strokeWidth={1} fill="none" opacity={0.5} />
      <Circle cx={c} cy={c} r={r3} stroke={colors.peach} strokeWidth={1.25} fill="none" opacity={0.55} />
      <Circle cx={c} cy={c} r={size * 0.033} fill={colors.peach} opacity={0.8} />
    </Svg>
  );

  if (reducedMotion) {
    return <View style={styles.wrap}>{svg}</View>;
  }

  return (
    <Animated.View style={[styles.wrap, glowStyle]}>
      {svg}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

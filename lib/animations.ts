import {
  withSpring,
  withTiming,
  withDelay,
  Easing,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

// ─── Spring Presets ──────────────────────────────────────────────────────────
export const SPRING_GENTLE = { damping: 20, stiffness: 120, mass: 0.8 };
export const SPRING_BOUNCY = { damping: 12, stiffness: 180, mass: 0.6 };
export const SPRING_SNAPPY = { damping: 18, stiffness: 250, mass: 0.5 };

// ─── Timing Presets ──────────────────────────────────────────────────────────
export const TIMING_EASE_IN_OUT = { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) };
export const TIMING_SLOW_REVEAL = { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };
export const TIMING_FAST = { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) };

// ─── Stagger Delay ───────────────────────────────────────────────────────────
export const STAGGER_MS = 80;
export const staggerDelay = (index: number, baseDelay = 0) =>
  baseDelay + index * STAGGER_MS;

// ─── V3 · Linen & Brass motion ──────────────────────────────────────────────
// Threshold-cross tempo. Fountain-pen, not rubber-band.
export const V3_STAGGER_MS = 100;
export const v3StaggerDelay = (index: number, baseDelay = 0) =>
  baseDelay + index * V3_STAGGER_MS;

// Settle: 650ms, opacity + 4px Y drift
export const V3_SETTLE_EASING = Easing.bezier(0.2, 0.5, 0.2, 1);
export const V3_SETTLE_DURATION = 650;

// Underline draw: scaleX 0→1, 700ms, 700ms delay
export const V3_UNDERLINE_EASING = Easing.bezier(0.4, 0, 0.2, 1);
export const V3_UNDERLINE_DURATION = 700;
export const V3_UNDERLINE_DELAY = 700;

// Marker slide (threshold bar): 1000ms, 200ms delay
export const V3_MARKER_EASING = Easing.bezier(0.33, 0, 0.1, 1);
export const V3_MARKER_DURATION = 1000;
export const V3_MARKER_DELAY = 200;

// Reduce-motion fallback — used when AccessibilityInfo.isReduceMotionEnabled() is true
export const V3_REDUCED_FADE_DURATION = 200;

// ─── Animated Count ──────────────────────────────────────────────────────────
export function animateCountTo(target: number, duration = 1000) {
  'worklet';
  return withTiming(target, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
}

// ─── Ring Arc Draw ───────────────────────────────────────────────────────────
export function animateArcDraw(targetProgress: number, delay = 300) {
  'worklet';
  return withDelay(delay, withTiming(targetProgress, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
}

// ─── Scale Press ─────────────────────────────────────────────────────────────
export function scalePressIn() {
  'worklet';
  return withSpring(0.96, SPRING_SNAPPY);
}

export function scalePressOut() {
  'worklet';
  return withSpring(1, SPRING_GENTLE);
}

// ─── Shimmer ─────────────────────────────────────────────────────────────────
export function shimmerLoop(value: SharedValue<number>) {
  'worklet';
  value.value = withRepeat(
    withSequence(
      withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      withTiming(0, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
    ),
    -1,
    true
  );
}

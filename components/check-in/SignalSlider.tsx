import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OptionRow } from '../../types/mirar';
import { FONTS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { SPRING_GENTLE } from '../../lib/animations';

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 4;

interface SignalSliderProps {
  options: OptionRow[];
  poleLowLabel?: string | null;
  poleHighLabel?: string | null;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

// Replaces the old 5-sentence multiple-choice (OptionSelector) with a single
// drag gesture along a low→high spectrum. HISTORY: the prior format asked
// users to read and psychologically differentiate between 5 full-sentence
// options every day — real cognitive work no matter how short the sentences
// were, and a direct contradiction of the product's own "2-3 minutes,
// frictionless as brushing teeth" spec. The backend is untouched: each of
// the 5 tick positions still is one of the existing option rows (theme
// codes/levels/points/signal_notes unchanged) — see migration
// 011_signal_slider.sql and seed_v4_signal_slider.sql, which reordered
// option_number per question into a true low→high continuum (sorted by
// combined theme points) and added the two pole_label strings rendered at
// the track's ends. Only the *input* changed — the nuanced language now
// surfaces as output, in the AI Mirror reflection after submission, instead
// of being something the user must read and self-diagnose against first.
export function SignalSlider({
  options,
  poleLowLabel,
  poleHighLabel,
  selectedOptionId,
  onSelect,
  disabled = false,
}: SignalSliderProps) {
  const colors = useColors();
  const sorted = [...options].sort((a, b) => a.option_number - b.option_number);
  const stepCount = Math.max(sorted.length - 1, 1);

  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    sorted.findIndex((o) => o.id === selectedOptionId)
  );
  const hasSelection = selectedOptionId != null;

  const thumbX = useSharedValue(0);
  const fillWidth = useSharedValue(0);
  const labelOpacity = useSharedValue(0);

  const positionFor = (index: number, width: number) => (width / stepCount) * index;

  useEffect(() => {
    if (trackWidth === 0) return;
    const target = positionFor(hasSelection ? selectedIndex : 0, trackWidth);
    thumbX.value = withSpring(target, SPRING_GENTLE);
    fillWidth.value = withSpring(hasSelection ? target : 0, SPRING_GENTLE);
    labelOpacity.value = withTiming(hasSelection ? 1 : 0, { duration: 180 });
  }, [selectedIndex, hasSelection, trackWidth]);

  const nearestIndexForX = (x: number, width: number) => {
    if (width <= 0) return 0;
    const raw = (x / width) * stepCount;
    return Math.min(stepCount, Math.max(0, Math.round(raw)));
  };

  const trackRef = useRef({ width: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = nearestIndexForX(x, trackRef.current.width);
        const opt = sorted[idx];
        if (opt) onSelect(opt.id);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const idx = nearestIndexForX(x, trackRef.current.width);
        const opt = sorted[idx];
        if (opt && opt.id !== selectedOptionId) onSelect(opt.id);
      },
    })
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackRef.current.width = w;
    setTrackWidth(w);
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const currentOption = hasSelection ? sorted[selectedIndex] : null;

  return (
    <View style={styles.container} accessibilityRole="adjustable">
      <View style={styles.poleRow}>
        <Text style={[styles.poleLabel, { color: colors.slateLight }]} numberOfLines={1}>
          {poleLowLabel ?? sorted[0]?.option_text ?? ''}
        </Text>
        <Text style={[styles.poleLabel, { color: colors.slateLight, textAlign: 'right' }]} numberOfLines={1}>
          {poleHighLabel ?? sorted[sorted.length - 1]?.option_text ?? ''}
        </Text>
      </View>

      <View
        style={styles.trackWrap}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: colors.ruleLight }]} />
        <Animated.View style={[styles.fill, { backgroundColor: colors.brass }, fillStyle]} />

        {sorted.map((opt, i) => {
          const x = positionFor(i, trackWidth);
          const isActive = hasSelection && i === selectedIndex;
          return (
            <Pressable
              key={opt.id}
              disabled={disabled}
              onPress={() => onSelect(opt.id)}
              accessibilityRole="radio"
              accessibilityLabel={opt.option_text}
              accessibilityState={{ selected: isActive }}
              style={[styles.tickHit, { left: x - 16 }]}
            >
              <View
                style={[
                  styles.tick,
                  {
                    backgroundColor: isActive ? colors.brass : colors.ruleLight,
                    borderColor: isActive ? colors.brass : colors.border,
                  },
                ]}
              />
            </Pressable>
          );
        })}

        {trackWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              { backgroundColor: colors.paper, borderColor: colors.slate },
              thumbStyle,
            ]}
          />
        )}
      </View>

      <Animated.View style={[styles.currentLabelWrap, labelStyle]}>
        <Text style={[styles.currentLabel, { color: colors.ink }]}>
          {currentOption?.option_text ?? ' '}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  poleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poleLabel: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  trackWrap: {
    height: THUMB_SIZE + 16,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  fill: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  tickHit: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  currentLabelWrap: {
    minHeight: 22,
  },
  currentLabel: {
    fontFamily: FONTS.displayItalic,
    fontSize: 16,
    lineHeight: 22,
  },
});

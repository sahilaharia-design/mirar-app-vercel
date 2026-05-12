import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { OptionRow } from '../../types/mirar';
import { COLORS, FONTS } from '../../lib/constants';
import {
  SPRING_GENTLE,
  SPRING_SNAPPY,
  V3_SETTLE_EASING,
  V3_SETTLE_DURATION,
  V3_STAGGER_MS,
  V3_REDUCED_FADE_DURATION,
} from '../../lib/animations';

interface OptionSelectorProps {
  options: OptionRow[];
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
}

export function OptionSelector({
  options,
  selectedOptionId,
  onSelect,
  disabled = false,
}: OptionSelectorProps) {
  const sorted = [...options].sort((a, b) => a.option_number - b.option_number);

  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {sorted.map((option, index) => (
        <OptionItem
          key={option.id}
          option={option}
          isSelected={option.id === selectedOptionId}
          onSelect={onSelect}
          disabled={disabled}
          index={index}
        />
      ))}
    </View>
  );
}

interface OptionItemProps {
  option: OptionRow;
  isSelected: boolean;
  onSelect: (id: string) => void;
  disabled: boolean;
  index: number;
}

function OptionItem({ option, isSelected, onSelect, disabled, index }: OptionItemProps) {
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

  // Settle entrance — 100ms stagger per row
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(4);
  // Press feedback (spring)
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = withTiming(1, { duration: V3_REDUCED_FADE_DURATION });
      translateY.value = 0;
      return;
    }
    const settle = { duration: V3_SETTLE_DURATION, easing: V3_SETTLE_EASING };
    opacity.value = withDelay(index * V3_STAGGER_MS, withTiming(1, settle));
    translateY.value = withDelay(index * V3_STAGGER_MS, withTiming(0, settle));
  }, [reduceMotion, index]);

  const handlePressIn = () => {
    if (!disabled) scale.value = withSpring(0.98, SPRING_SNAPPY);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_GENTLE);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => !disabled && onSelect(option.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected, disabled }}
        accessibilityLabel={option.option_text}
        style={[
          styles.option,
          { borderColor: isSelected ? COLORS.slate : COLORS.ruleLight },
          isSelected ? selectedShadow : unselectedShadow,
          disabled && !isSelected && styles.optionDimmed,
        ]}
      >
        <View
          style={[
            styles.leftBar,
            { backgroundColor: isSelected ? COLORS.brass : 'transparent' },
          ]}
        />
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? COLORS.ink : COLORS.slateMid,
              fontFamily: isSelected ? FONTS.bodyMedium : FONTS.body,
            },
          ]}
        >
          {option.option_text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const selectedShadow = Platform.select({
  ios: {
    shadowColor: COLORS.slate,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 9,
  },
  android: { elevation: 2 },
  web: { boxShadow: '0 1px 0 0 rgba(74,74,85,0.4), 0 6px 18px -8px rgba(74,74,85,0.18)' },
  default: {},
}) as any;

const unselectedShadow = Platform.select({
  ios: {
    shadowColor: COLORS.slate,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  android: { elevation: 0 },
  web: { boxShadow: '0 1px 2px rgba(74,74,85,0.03)' },
  default: {},
}) as any;

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: COLORS.paper,
  },
  optionDimmed: {
    opacity: 0.5,
  },
  leftBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21, // 15 × 1.4
  },
});

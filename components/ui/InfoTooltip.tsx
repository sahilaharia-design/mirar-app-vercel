import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface InfoTooltipProps {
  helpText: string;
  size?: number;
}

export function InfoTooltip({ helpText, size = 16 }: InfoTooltipProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const toggle = () => {
    if (expanded) {
      opacity.value = withTiming(0, { duration: 150 });
      height.value = withTiming(0, { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    } else {
      height.value = withSpring(1, { damping: 20, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });
    }
    setExpanded(!expanded);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: height.value * 120,
    opacity: opacity.value,
    marginTop: height.value * SPACING.xs,
  }));

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={toggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        <View
          style={[
            styles.icon,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.slateXLight,
            },
          ]}
        >
          <Text
            style={[
              styles.iconText,
              { color: colors.slateLight, fontSize: size * 0.65 },
            ]}
          >
            i
          </Text>
        </View>
      </TouchableOpacity>
      <Animated.View style={[styles.textContainer, animatedStyle]}>
        <Text style={[styles.helpText, { color: colors.slateLight }]}>
          {helpText}
        </Text>
      </Animated.View>
    </View>
  );
}

export function InfoTooltipInline({ helpText, size = 14 }: InfoTooltipProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const opacity = useSharedValue(0);

  const toggle = () => {
    opacity.value = withTiming(expanded ? 0 : 1, { duration: 200 });
    setExpanded(!expanded);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    maxHeight: opacity.value * 80,
    marginTop: opacity.value * SPACING.xs,
  }));

  return (
    <>
      <TouchableOpacity
        onPress={toggle}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        activeOpacity={0.6}
        style={styles.inlineIcon}
      >
        <View
          style={[
            styles.icon,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.slateXLight,
            },
          ]}
        >
          <Text
            style={[
              styles.iconText,
              { color: colors.slateLight, fontSize: size * 0.65 },
            ]}
          >
            i
          </Text>
        </View>
      </TouchableOpacity>
      {expanded && (
        <Animated.View style={[styles.inlineText, animatedStyle]}>
          <Text style={[styles.helpTextSmall, { color: colors.slateLight }]}>
            {helpText}
          </Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
  },
  icon: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontWeight: '500',
    fontStyle: 'italic',
  },
  textContainer: {
    overflow: 'hidden',
  },
  helpText: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 17,
    letterSpacing: 0.1,
  },
  helpTextSmall: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  inlineIcon: {
    marginLeft: SPACING.xs,
  },
  inlineText: {
    overflow: 'hidden',
    width: '100%',
  },
});

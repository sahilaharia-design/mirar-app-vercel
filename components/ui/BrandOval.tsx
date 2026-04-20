import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../../lib/constants';

interface BrandOvalProps {
  size?: number;
  style?: ViewStyle;
}

export function BrandOval({ size = 64, style }: BrandOvalProps) {
  return (
    <View style={[styles.container, { width: size, height: size * 1.3 }, style]}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.oval, { borderRadius: size * 0.65 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  oval: {
    flex: 1,
  },
});

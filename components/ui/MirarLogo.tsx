import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BrandOval } from './BrandOval';
import { COLORS, FONT_SIZE } from '../../lib/constants';

interface MirarLogoProps {
  variant?: 'mark' | 'wordmark' | 'full';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const SIZE_MAP = {
  sm: { oval: 24, text: FONT_SIZE.md },
  md: { oval: 36, text: FONT_SIZE.xl },
  lg: { oval: 48, text: FONT_SIZE['2xl'] },
};

export function MirarLogo({ variant = 'full', size = 'md', style }: MirarLogoProps) {
  const dims = SIZE_MAP[size];

  if (variant === 'mark') {
    return <BrandOval size={dims.oval} style={style} />;
  }

  return (
    <View style={[styles.row, style]}>
      {(variant === 'full') && (
        <BrandOval size={dims.oval} style={styles.oval} />
      )}
      <Text style={[styles.wordmark, { fontSize: dims.text }]}>mirar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  oval: {
    // intentionally empty — spacing handled by gap
  },
  wordmark: {
    color: COLORS.slate,
    fontWeight: '300',
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
});

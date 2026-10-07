import React, { useEffect, useRef } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * Tab screens stay mounted behind the active one. On web that leaves their
 * controls focusable and readable by assistive technology. While the screen is
 * blurred this marks its subtree `inert` (no focus, no pointer, hidden from AT).
 * No effect on native.
 */
export function InertWhenBlurred({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const focused = useIsFocused();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;
    if (focused) node.removeAttribute('inert');
    else node.setAttribute('inert', '');
  }, [focused]);

  return (
    <View ref={ref} style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
}

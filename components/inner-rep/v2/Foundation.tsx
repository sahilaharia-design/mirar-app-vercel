import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, findNodeHandle, type ViewProps } from 'react-native';
import FontGate from './FontGate';
import Wordmark from '../../../assets/brand/mirar-wordmark.png';
import { MIRAR as M } from '../../../design-system/native';

export function useReducedMotion() {
 const [reduced, setReduced] = useState(true);
 useEffect(() => {
  let live = true;
  AccessibilityInfo.isReduceMotionEnabled().then(value => { if (live) setReduced(value); });
  const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
  return () => { live = false; subscription.remove(); };
 }, []);
 return reduced;
}
export function VisualFoundation({ children }: { children: React.ReactNode }) {
 return <FontGate>{children}</FontGate>;
}
export function BrandAsset() {
 return <Image source={typeof Wordmark === 'string' ? { uri: Wordmark } : Wordmark} accessibilityLabel="Mirar" accessibilityRole="image" style={{ width: 112, height: 40, resizeMode: 'contain' }} />;
}
export function PageTransition({ children, ...props }: ViewProps) {
 const reduced = useReducedMotion(); const progress = useRef(new Animated.Value(1)).current;
 useEffect(() => {
  if (reduced) { progress.setValue(1); return; }
  progress.setValue(0);
  const animation = Animated.timing(progress, { toValue: 1, duration: M.motion.entry, easing: Easing.bezier(.22,1,.36,1), useNativeDriver: Platform.OS !== 'web' });
  animation.start(); return () => animation.stop();
 }, [progress, reduced]);
 return <Animated.View {...props} style={[props.style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0,1], outputRange: [M.motion.travel,0] }) }] }]}>{children}</Animated.View>;
}
export function Prompt({ children, label = 'prompt', display = false }: { children: string; label?: string; display?: boolean }) {
 const ref = useRef<Text>(null); const { width } = useWindowDimensions();
 useEffect(() => {
  if (Platform.OS === 'web') { const node = ref.current as unknown as HTMLElement | null; node?.setAttribute('tabindex','-1'); node?.focus({ preventScroll: true }); }
  else { const node = findNodeHandle(ref.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); else AccessibilityInfo.announceForAccessibility(children); }
 }, [children]);
 const size = display ? Math.min(72, Math.max(40,width*.055)) : Math.min(56, Math.max(32, width*.045));
 return <Text ref={ref} nativeID={label} accessibilityRole="header" aria-level={1} style={[styles.prompt, { fontSize: size, lineHeight: size * 1.12 }]}>{children}</Text>;
}
export function Eyebrow({ children }: { children: React.ReactNode }) { return <Text style={styles.eyebrow}>{children}</Text>; }
export function Body({ children, ...props }: React.ComponentProps<typeof Text>) { return <Text {...props} style={[styles.body, props.style]}>{children}</Text>; }
export function Action({ children, onPress, secondary = false, disabled = false, selected, testID, expanded }: { children: string; onPress: () => void; secondary?: boolean; disabled?: boolean; selected?: boolean; testID?: string; expanded?: boolean }) {
 return <Pressable testID={testID} aria-expanded={expanded} onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled, selected }} aria-pressed={selected} style={({ pressed }) => [styles.action, secondary ? styles.secondary : styles.primary, disabled && { backgroundColor: M.color.disabled }, pressed && { opacity: .85 }]}>
  <Text style={[styles.actionText, { color: secondary || disabled ? M.color.ink : M.color.inverse }]}>{children}</Text>
 </Pressable>;
}
export function SelectionSurface({ children, onPress, disabled, selected, compare = false }: { children: string; onPress: () => void; disabled?: boolean; selected?: boolean; compare?: boolean }) {
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, selected }} aria-pressed={selected} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.selection, compare && styles.compare, (pressed || selected) && { backgroundColor: M.color.selected, borderBottomColor: M.color.warmInk }, disabled && { backgroundColor: M.color.disabled }]}>
  <Text style={[styles.selectionText, compare && { fontFamily: M.font.display, fontSize: 28, lineHeight: 34 }]}>{children}</Text>
 </Pressable>;
}
export const styles = StyleSheet.create({
 prompt: { fontFamily: M.font.display, color: M.color.ink, letterSpacing: -.5, marginBottom: M.space.large },
 eyebrow: { fontFamily: M.font.body, color: M.color.muted, fontSize: 12, lineHeight: 18, letterSpacing: 1, textTransform: 'uppercase' },
 body: { fontFamily: M.font.body, color: M.color.muted, fontSize: 16, lineHeight: 26 },
 action: { minHeight: 48, minWidth: 44, paddingHorizontal: M.space.lg, paddingVertical: M.space.md, borderRadius: M.radius.control, alignItems: 'center', justifyContent: 'center', borderWidth: 1, alignSelf: 'flex-start' },
 primary: { backgroundColor: M.color.ink, borderColor: M.color.ink }, secondary: { backgroundColor: 'transparent', borderColor: M.color.border },
 actionText: { fontFamily: M.font.body, fontSize: 16, lineHeight: 24, fontWeight: '500' },
 selection: { minHeight: 64, paddingVertical: M.space.base, paddingHorizontal: M.space.base, borderBottomWidth: 1, borderBottomColor: M.color.border, justifyContent: 'center' },
 selectionText: { fontFamily: M.font.body, color: M.color.ink, fontSize: 17, lineHeight: 26 },
 compare: { minHeight: 152, paddingVertical: M.space.xl, flex: 1 },
});

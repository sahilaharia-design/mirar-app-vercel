import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

const SEEN_KEY = 'mirar_seen_rebuild_banner_v1';
const CONTACT_LINK = 'mailto:info@mirar.life';

// One-time card telling existing users the app was rebuilt and inviting
// feedback. Shown once per device, then dismissed for good (tracked in
// AsyncStorage, same persistence pattern as the theme preference).
export function WelcomeBackBanner() {
  const { t } = useTranslation();
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(SEEN_KEY).then((seen) => {
      if (mounted && !seen) setVisible(true);
    });
    return () => { mounted = false; };
  }, []);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(SEEN_KEY, '1');
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      exiting={FadeOut.duration(200)}
      style={[styles.card, { backgroundColor: colors.creamDark, borderColor: colors.border }]}
    >
      <TouchableOpacity onPress={dismiss} hitSlop={10} style={styles.closeBtn} accessibilityLabel={t('welcome_back.dismiss_a11y')}>
        <Text style={[styles.closeText, { color: colors.slateLight }]}>×</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.slate }]}>{t('welcome_back.title')}</Text>
      <Text style={[styles.body, { color: colors.slateMid }]}>{t('welcome_back.body')}</Text>
      <TouchableOpacity onPress={() => Linking.openURL(CONTACT_LINK)} activeOpacity={0.7}>
        <Text style={[styles.link, { color: colors.accentTeal }]}>{t('welcome_back.cta')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    paddingRight: SPACING.xl,
    gap: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    lineHeight: 20,
  },
  title: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
  },
  body: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  link: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginTop: 2,
  },
});

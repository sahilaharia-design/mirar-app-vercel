import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MirarLogo } from './MirarLogo';
import { useColors } from '../../contexts/theme-context';
import { SPACING } from '../../lib/constants';

const CONTACT_LINK = 'mailto:info@mirar.life';

interface AppHeaderProps {
  style?: ViewStyle;
}

// Shared across all four tab screens so the contact path is always
// reachable — not just buried at the bottom of Profile, or in a
// one-time banner a user can dismiss forever.
export function AppHeader({ style }: AppHeaderProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { borderBottomColor: colors.borderLight }, style]}>
      <View style={styles.brand}>
        <MirarLogo size="sm" />
        <Text style={[styles.beta, { color: colors.slateMid, borderColor: colors.borderLight }]}>Beta</Text>
      </View>
      <TouchableOpacity
        onPress={() => Linking.openURL(CONTACT_LINK)}
        activeOpacity={0.7}
        style={styles.helpButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.contact_help_a11y')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.helpIcon, { color: colors.slateMid }]}>✉</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  beta: { fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  helpButton: {
    padding: 4,
  },
  helpIcon: {
    fontSize: 18,
  },
});

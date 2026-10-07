import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';

const CONTACT_LINK = 'mailto:info@mirar.life';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme, useColors } from '../../contexts/theme-context';
import { AppHeader } from '../../components/ui/AppHeader';
import { InertWhenBlurred } from '../../components/ui/InertWhenBlurred';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut, session } = useAuthStore();
  const { colorScheme, setColorScheme } = useTheme();
  const colors = useColors();
  const styles = getStyles(colors);

  const handleSignOut = () => {
    // Alert.alert's button callbacks don't fire on web (react-native-web has
    // no working native-alert equivalent), so web uses window.confirm.
    if (Platform.OS === 'web') {
      if (window.confirm(`${t('profile.sign_out')}\n\n${t('profile.sign_out_confirm')}`)) {
        signOut();
      }
      return;
    }
    Alert.alert(
      t('profile.sign_out'),
      t('profile.sign_out_confirm'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('profile.sign_out'),
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <InertWhenBlurred>
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <AppHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View role="main" accessibilityLabel={t('nav.profile')}>
          {/* Account identity */}
          <View style={[styles.idCard, { backgroundColor: colors.creamDark, borderColor: colors.border }]}>
            <Text style={[styles.idLabel, { color: colors.slateMid }]}>{t('profile.account')}</Text>
            <Text style={[styles.idValue, { color: colors.slate }]} selectable>
              {session?.user?.email ?? '—'}
            </Text>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.slateMid }]}>{t('profile.settings_label')}</Text>
            <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
              <TouchableOpacity
                style={[rowStyles.row, { justifyContent: 'space-between', borderBottomColor: colors.borderLight }]}
                onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={[rowStyles.label, { color: colors.slateMid }]}>{t('profile.dark_mode')}</Text>
                <Text style={{ color: colors.accentTeal, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>
                  {colorScheme === 'dark' ? t('profile.on') : t('profile.off')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.supportButton, { backgroundColor: colors.white, borderColor: colors.border }]}
              onPress={() => Linking.openURL(CONTACT_LINK)}
              activeOpacity={0.8}
              accessibilityRole="link"
            >
              <Text style={[styles.supportText, { color: colors.slate }]}>{t('profile.contact')}</Text>
              <Text style={[styles.supportSub, { color: colors.slateMid }]}>{t('profile.contact_sub')}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign out */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: colors.white, borderColor: colors.border }]}
              onPress={handleSignOut}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={[styles.signOutText, { color: colors.underLoad }]}>{t('profile.sign_out')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.version, { color: colors.slateMid }]}>{t('profile.beta_note')}</Text>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
    </InertWhenBlurred>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.borderLight }]}>
      <Text style={[rowStyles.label, { color: colors.slateMid }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.slate }]}>{value}</Text>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.cream,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      gap: SPACING.lg,
    },
    idCard: {
      backgroundColor: colors.creamDark,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: SPACING.xs,
    },
    idLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    idLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateLight,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    idValue: {
      fontSize: FONT_SIZE.md,
      color: colors.slate,
      fontWeight: '500',
      letterSpacing: 1.5,
      fontFamily: 'monospace',
    },
    idNote: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateLight,
      lineHeight: 18,
      marginTop: SPACING.xs,
    },
    section: {
      gap: SPACING.sm,
    },
    guideCard: {
      backgroundColor: colors.white,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.md,
    },
    guideTextBlock: {
      flex: 1,
      gap: 4,
    },
    guideTitle: {
      fontSize: FONT_SIZE.base,
      color: colors.slate,
      fontWeight: '500',
    },
    guideDesc: {
      fontSize: FONT_SIZE.sm,
      color: colors.slateLight,
      lineHeight: 20,
    },
    guideArrow: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateMid,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    sectionLabel: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateLight,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    supportButton: {
      backgroundColor: colors.white,
      borderRadius: RADIUS.md,
      paddingVertical: 14,
      paddingHorizontal: SPACING.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: 3,
    },
    supportText: {
      fontSize: FONT_SIZE.base,
      color: colors.slate,
      fontWeight: '500',
    },
    supportSub: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateLight,
      letterSpacing: 0.2,
    },
    signOutButton: {
      backgroundColor: colors.white,
      borderRadius: RADIUS.md,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    signOutText: {
      fontSize: FONT_SIZE.base,
      color: colors.underLoad,
      fontWeight: '500',
    },
    version: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateXLight,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    journalCount: {
      fontSize: FONT_SIZE.xs,
      color: colors.accentTeal,
      fontWeight: '500',
    },
    journalLoading: {
      paddingVertical: SPACING.md,
      alignItems: 'center',
    },
    journalList: {
      gap: SPACING.sm,
    },
    journalEntry: {
      backgroundColor: colors.white,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderLeftWidth: 3,
      borderLeftColor: colors.accentTeal,
      gap: SPACING.xs,
    },
    journalMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    journalDay: {
      fontSize: 10,
      color: colors.accentTeal,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    journalDate: {
      fontSize: 10,
      color: colors.slateLight,
    },
    journalText: {
      fontSize: FONT_SIZE.sm,
      color: colors.slateMid,
      lineHeight: 20,
    },
    journalPreview: {
      backgroundColor: colors.white,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderLeftWidth: 3,
      borderLeftColor: colors.accentTeal,
      gap: 4,
    },
    journalPreviewDay: {
      fontSize: 10,
      color: colors.accentTeal,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    journalPreviewText: {
      fontSize: FONT_SIZE.sm,
      color: colors.slateMid,
      lineHeight: 20,
    },
    journalMoreHint: {
      fontSize: 10,
      color: colors.slateLight,
      marginTop: 2,
    },
  });
}

// Layout-only — every usage site overrides color/border via inline `colors.x`
// array-style props, so this stays theme-invariant on purpose.
const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  value: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  settingsValue: {
    fontWeight: '400',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';

const CONTACT_LINK = 'mailto:info@mirar.life';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useTheme, useColors } from '../../contexts/theme-context';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/with-timeout';
import { AppHeader } from '../../components/ui/AppHeader';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { MirrorGuideModal } from '../../components/guide/MirrorGuideModal';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../lib/i18n';

interface JournalEntry {
  text: string;
  submittedAt: string;
  dayNumber: number;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut, session } = useAuthStore();
  const { activeCycle, currentDay, currentStage, totalReflections } = useCycleStore();
  const { language, setLanguage } = useSettingsStore();
  const { colorScheme, setColorScheme } = useTheme();
  const colors = useColors();

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [journalsExpanded, setJournalsExpanded] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  useEffect(() => {
    const userId = session?.user?.id;
    const cycleId = activeCycle?.id;
    if (!userId || !cycleId) return;

    setJournalsLoading(true);
    withTimeout(
      supabase
        .from('responses')
        .select('journal_text, submitted_at, day_number')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .not('journal_text', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(28)
    )
      .then(({ data }) => {
        const entries = (data ?? [])
          .filter((r: any) => r.journal_text?.trim())
          .map((r: any) => ({
            text: r.journal_text as string,
            submittedAt: r.submitted_at as string,
            dayNumber: r.day_number as number,
          }));
        setJournals(entries);
      })
      .catch((err) => {
        console.error('[Mirar] loading journals failed:', err);
        setJournals([]);
      })
      .finally(() => {
        setJournalsLoading(false);
      });
  }, [session?.user?.id, activeCycle?.id]);

  const handleSignOut = () => {
    // Alert.alert's button callbacks don't fire on web (react-native-web has
    // no working native-alert equivalent) — this app is primarily used at
    // mirar-app.vercel.app, so that silently made sign-out a dead button.
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

  // Account creation date — NOT activeCycle.start_date, which resets on every
  // silent cycle rollover. This is the true "practicing since" anchor.
  const practicingSinceDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const STAGE_KEYS = ['stages.awareness', 'stages.realignment', 'stages.action', 'stages.reflection'];
  const stageName = STAGE_KEYS[currentStage - 1] ? t(STAGE_KEYS[currentStage - 1]) : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <AppHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mirar ID block */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={[styles.idCard, { backgroundColor: colors.creamDark, borderColor: colors.border }]}>
          <View style={styles.idLabelRow}>
            <Text style={[styles.idLabel, { color: colors.slateLight }]}>{t('profile.mirar_id')}</Text>
            <InfoTooltipInline
              helpText={t('profile.id_help')}
              size={12}
            />
          </View>
          <Text style={[styles.idValue, { color: colors.slate }]} selectable>{user?.mirar_id ?? '—'}</Text>
          <Text style={[styles.idNote, { color: colors.slateLight }]}>
            {t('profile.id_note')}
          </Text>
        </Animated.View>

        {/* Mirror guide */}
        <Animated.View entering={FadeInDown.duration(400).delay(85)} style={styles.section}>
          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
            onPress={() => setGuideVisible(true)}
            activeOpacity={0.78}
            accessibilityRole="button"
          >
            <View style={styles.guideTextBlock}>
              <Text style={[styles.guideTitle, { color: colors.slate }]}>{t('guide_modal.eyebrow')}</Text>
              <Text style={[styles.guideDesc, { color: colors.slateLight }]}>
                {t('profile.guide_desc')}
              </Text>
            </View>
            <Text style={[styles.guideArrow, { color: colors.slateMid }]}>{t('profile.open')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Practice block */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('profile.practice')}</Text>
            <InfoTooltipInline
              helpText={t('tooltips.cycle_info')}
              size={12}
            />
          </View>
          <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <Row label={t('profile.practicing_since')} value={practicingSinceDate} colors={colors} />
            <Row label={t('profile.days_practiced')} value={String(totalReflections)} colors={colors} />
            <Row label={t('profile.today_label')} value={t('profile.daily_mirror')} colors={colors} />
            <Row
              label={t('profile.current_pattern')}
              value={stageName}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Language */}
        <Animated.View entering={FadeInDown.duration(400).delay(260)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('profile.language')}</Text>
          <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[rowStyles.row, { justifyContent: 'space-between', borderBottomColor: colors.borderLight }]}
                onPress={() => setLanguage(lang.code as SupportedLanguage)}
                activeOpacity={0.7}
              >
                <Text style={[rowStyles.label, { color: colors.slateMid }]}>{lang.label}</Text>
                {language === lang.code && (
                  <Text style={{ color: colors.accentTeal, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.duration(400).delay(330)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('profile.settings_label')}</Text>
          <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <SettingsRow label={t('profile.summary_notifications')} value={t('profile.on')} colors={colors} />
            <TouchableOpacity
              style={[rowStyles.row, { justifyContent: 'space-between', borderBottomColor: colors.borderLight }]}
              onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
              activeOpacity={0.7}
            >
              <Text style={[rowStyles.label, { color: colors.slateMid }]}>{t('profile.dark_mode')}</Text>
              <Text style={{ color: colors.accentTeal, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>
                {colorScheme === 'dark' ? t('profile.on') : t('profile.off')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Journal Archive */}
        {(journalsLoading || journals.length > 0) && (
          <Animated.View entering={FadeInDown.duration(400).delay(310)} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionLabelRow}
              onPress={() => setJournalsExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('profile.reflection_notes')}</Text>
              {journals.length > 0 && (
                <Text style={[styles.journalCount, { color: colors.accentTeal }]}>
                  {t('profile.note_count', { count: journals.length })} · {journalsExpanded ? t('profile.hide') : t('profile.show')}
                </Text>
              )}
            </TouchableOpacity>

            {journalsLoading ? (
              <View style={styles.journalLoading}>
                <ActivityIndicator size="small" color={colors.slateMid} />
              </View>
            ) : journalsExpanded ? (
              <View style={styles.journalList}>
                {journals.map((entry, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeIn.duration(300).delay(i * 60)}
                    style={[styles.journalEntry, { backgroundColor: colors.white, borderColor: colors.borderLight, borderLeftColor: colors.accentTeal }]}
                  >
                    <View style={styles.journalMeta}>
                      <Text style={[styles.journalDay, { color: colors.accentTeal }]}>{t('profile.reflection_n', { n: entry.dayNumber })}</Text>
                      <Text style={[styles.journalDate, { color: colors.slateLight }]}>
                        {new Date(entry.submittedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text style={[styles.journalText, { color: colors.slateMid }]}>{entry.text}</Text>
                  </Animated.View>
                ))}
              </View>
            ) : journals.length > 0 ? (
              <TouchableOpacity
                style={[styles.journalPreview, { backgroundColor: colors.white, borderColor: colors.borderLight, borderLeftColor: colors.accentTeal }]}
                onPress={() => setJournalsExpanded(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.journalPreviewDay, { color: colors.accentTeal }]}>{t('profile.reflection_n', { n: journals[0].dayNumber })}</Text>
                <Text style={[styles.journalPreviewText, { color: colors.slateMid }]} numberOfLines={2}>
                  {journals[0].text}
                </Text>
                {journals.length > 1 && (
                  <Text style={[styles.journalMoreHint, { color: colors.slateLight }]}>
                    {t('profile.more_notes', { count: journals.length - 1 })}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        )}

        {/* Support Mirar */}
        <Animated.View entering={FadeInDown.duration(400).delay(380)} style={styles.section}>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: colors.white, borderColor: colors.border }]}
            onPress={() => Linking.openURL(CONTACT_LINK)}
            activeOpacity={0.8}
          >
            <Text style={[styles.supportText, { color: colors.slate }]}>{t('profile.support_mirar')}</Text>
            <Text style={[styles.supportSub, { color: colors.slateLight }]}>{t('profile.support_sub')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Sign out */}
        <Animated.View entering={FadeInDown.duration(400).delay(420)} style={styles.section}>
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: colors.white, borderColor: colors.border }]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Text style={[styles.signOutText, { color: colors.underLoad }]}>{t('profile.sign_out')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.slateXLight }]}>Mirar · v1.0</Text>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      <MirrorGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </SafeAreaView>
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

function SettingsRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.borderLight }]}>
      <Text style={[rowStyles.label, { color: colors.slateMid }]}>{label}</Text>
      <Text style={[rowStyles.value, rowStyles.settingsValue, { color: colors.slateLight }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
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
    backgroundColor: COLORS.creamDark,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  idLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  idLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  idValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.slate,
    fontWeight: '500',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  idNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  section: {
    gap: SPACING.sm,
  },
  guideCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    color: COLORS.slate,
    fontWeight: '500',
  },
  guideDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    lineHeight: 20,
  },
  guideArrow: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateMid,
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
    color: COLORS.slateLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  supportButton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 3,
  },
  supportText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    fontWeight: '500',
  },
  supportSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 0.2,
  },
  signOutButton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.underLoad,
    fontWeight: '500',
  },
  version: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  journalCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accentTeal,
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentTeal,
    gap: SPACING.xs,
  },
  journalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  journalDay: {
    fontSize: 10,
    color: COLORS.accentTeal,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  journalDate: {
    fontSize: 10,
    color: COLORS.slateLight,
  },
  journalText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    lineHeight: 20,
  },
  journalPreview: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accentTeal,
    gap: 4,
  },
  journalPreviewDay: {
    fontSize: 10,
    color: COLORS.accentTeal,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  journalPreviewText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    lineHeight: 20,
  },
  journalMoreHint: {
    fontSize: 10,
    color: COLORS.slateLight,
    marginTop: 2,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    flex: 1,
  },
  value: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate,
    fontWeight: '500',
  },
  settingsValue: {
    color: COLORS.slateLight,
    fontWeight: '400',
  },
});

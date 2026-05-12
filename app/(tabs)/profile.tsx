import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useTheme } from '../../contexts/theme-context';
import { supabase } from '../../lib/supabase';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { MirrorGuideModal } from '../../components/guide/MirrorGuideModal';
import { CycleArc } from '../../components/dashboard/CycleArc';
import { COLORS, FONT_SIZE, SPACING, RADIUS, STAGES } from '../../lib/constants';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../lib/i18n';

interface JournalEntry {
  text: string;
  submittedAt: string;
  dayNumber: number;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut, session } = useAuthStore();
  const { activeCycle, currentDay, currentStage } = useCycleStore();
  const { language, setLanguage } = useSettingsStore();
  const { colorScheme, setColorScheme } = useTheme();

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [journalsExpanded, setJournalsExpanded] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  useEffect(() => {
    const userId = session?.user?.id;
    const cycleId = activeCycle?.id;
    if (!userId || !cycleId) return;

    setJournalsLoading(true);
    supabase
      .from('responses')
      .select('journal_text, submitted_at, day_number')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .not('journal_text', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(28)
      .then(({ data }) => {
        const entries = (data ?? [])
          .filter((r: any) => r.journal_text?.trim())
          .map((r: any) => ({
            text: r.journal_text as string,
            submittedAt: r.submitted_at as string,
            dayNumber: r.day_number as number,
          }));
        setJournals(entries);
        setJournalsLoading(false);
      });
  }, [session?.user?.id, activeCycle?.id]);

  const handleSignOut = () => {
    Alert.alert(
      t('profile.sign_out'),
      'You will be signed out of Mirar. Your signal data is preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('profile.sign_out'),
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const cycleStartDate = activeCycle?.start_date
    ? new Date(activeCycle.start_date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const stageName = STAGES[currentStage - 1]?.label ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mirar ID block */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.idCard}>
          <View style={styles.idLabelRow}>
            <Text style={styles.idLabel}>{t('profile.mirar_id')}</Text>
            <InfoTooltipInline
              helpText="Your Mirar ID helps separate your reflection history from your public identity inside the app."
              size={12}
            />
          </View>
          <Text style={styles.idValue} selectable>{user?.mirar_id ?? '—'}</Text>
          <Text style={styles.idNote}>
            Your Mirar ID helps keep your reflection history separate inside the app.
          </Text>
        </Animated.View>

        {/* Mirror guide */}
        <Animated.View entering={FadeInDown.duration(400).delay(85)} style={styles.section}>
          <TouchableOpacity
            style={styles.guideCard}
            onPress={() => setGuideVisible(true)}
            activeOpacity={0.78}
            accessibilityRole="button"
          >
            <View style={styles.guideTextBlock}>
              <Text style={styles.guideTitle}>The Mirror Guide</Text>
              <Text style={styles.guideDesc}>
                What signals mean, how patterns form, and how to read summaries.
              </Text>
            </View>
            <Text style={styles.guideArrow}>Open</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Cycle block */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>{t('profile.cycle')}</Text>
            <InfoTooltipInline
              helpText={t('tooltips.cycle_info')}
              size={12}
            />
          </View>
          <View style={styles.card}>
            <Row label="Cycle" value={`#${activeCycle?.cycle_number ?? '—'}`} />
            <Row label="Started" value={cycleStartDate} />
            <Row label="Today" value="Daily mirror" />
            <Row
              label="Current pattern"
              value={stageName}
            />
          </View>
        </Animated.View>

        {/* Cycle arc */}
        <Animated.View entering={FadeInDown.duration(400).delay(190)} style={styles.section}>
          <View style={styles.card}>
            <CycleArc currentDay={currentDay} />
          </View>
        </Animated.View>

        {/* Language */}
        <Animated.View entering={FadeInDown.duration(400).delay(260)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
          <View style={styles.card}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[rowStyles.row, { justifyContent: 'space-between' }]}
                onPress={() => setLanguage(lang.code as SupportedLanguage)}
                activeOpacity={0.7}
              >
                <Text style={rowStyles.label}>{lang.label}</Text>
                {language === lang.code && (
                  <Text style={{ color: COLORS.accentTeal, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.duration(400).delay(330)} style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>
          <View style={styles.card}>
            <SettingsRow label="Daily mirror reminder" value="8:00 AM" />
            <SettingsRow label="Summary notifications" value="On" />
            <TouchableOpacity
              style={[rowStyles.row, { justifyContent: 'space-between' }]}
              onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
              activeOpacity={0.7}
            >
              <Text style={rowStyles.label}>{t('profile.dark_mode')}</Text>
              <Text style={{ color: COLORS.accentTeal, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>
                {colorScheme === 'dark' ? 'On' : 'Off'}
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
              <Text style={styles.sectionLabel}>Reflection notes</Text>
              {journals.length > 0 && (
                <Text style={styles.journalCount}>
                  {journals.length} note{journals.length !== 1 ? 's' : ''} · {journalsExpanded ? 'Hide' : 'Show'}
                </Text>
              )}
            </TouchableOpacity>

            {journalsLoading ? (
              <View style={styles.journalLoading}>
                <ActivityIndicator size="small" color={COLORS.slateMid} />
              </View>
            ) : journalsExpanded ? (
              <View style={styles.journalList}>
                {journals.map((entry, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeIn.duration(300).delay(i * 60)}
                    style={styles.journalEntry}
                  >
                    <View style={styles.journalMeta}>
                      <Text style={styles.journalDay}>Reflection {entry.dayNumber}</Text>
                      <Text style={styles.journalDate}>
                        {new Date(entry.submittedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.journalText}>{entry.text}</Text>
                  </Animated.View>
                ))}
              </View>
            ) : journals.length > 0 ? (
              <TouchableOpacity
                style={styles.journalPreview}
                onPress={() => setJournalsExpanded(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.journalPreviewDay}>Reflection {journals[0].dayNumber}</Text>
                <Text style={styles.journalPreviewText} numberOfLines={2}>
                  {journals[0].text}
                </Text>
                {journals.length > 1 && (
                  <Text style={styles.journalMoreHint}>
                    +{journals.length - 1} more note{journals.length > 2 ? 's' : ''}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        )}

        {/* Sign out */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutText}>{t('profile.sign_out')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Text style={styles.version}>Mirar · Cycle 1 · v1.0</Text>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      <MirrorGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, rowStyles.settingsValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
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

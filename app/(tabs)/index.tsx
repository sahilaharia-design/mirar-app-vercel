import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useCheckInStore } from '../../stores/checkin-store';
import { useCycleStore } from '../../stores/cycle-store';
import { useDevStore } from '../../stores/dev-store';
import { ThisOrThat } from '../../components/check-in/ThisOrThat';
import { InnerRepCard } from '../../components/home/InnerRepCard';
import { useInnerRepStore } from '../../stores/inner-rep-store';
import { EVERYDAY_AREAS } from '../../lib/everyday';
import { FONTS } from '../../lib/constants';
import { AppHeader } from '../../components/ui/AppHeader';
import { MilestoneCard } from '../../components/home/MilestoneCard';
import { MirrorGuideModal } from '../../components/guide/MirrorGuideModal';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

// ─── Check-in Flow ────────────────────────────────────────────────────────────
// One plain this-or-that. Tap a side (or "in between"); it saves itself after
// a beat — tap something else in that beat to change your mind. No settle
// screen, no journal step, no Continue button: nothing to read, nothing to
// press twice. Saving uses the same submitCheckIn as before, so the day
// count, one-per-day gate and scoring are untouched.
function CheckInFlow({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { session } = useAuthStore();
  const { activeCycle } = useCycleStore();
  const { question, selectedOptionId, isSubmitting, isCompleted, selectOption, submitCheckIn } = useCheckInStore();

  React.useEffect(() => {
    if (!selectedOptionId || isSubmitting || isCompleted) return;
    const timer = setTimeout(async () => {
      if (!session?.user?.id || !activeCycle?.id) return;
      const result = await submitCheckIn(session.user.id, activeCycle.id);
      if (result.error) {
        selectOption('');
        Alert.alert(t('common.submit_error_title'), t('common.submit_error_body'));
        return;
      }
      useCycleStore.getState().refreshScores();
      onDone();
    }, 1100);
    return () => clearTimeout(timer);
  }, [selectedOptionId]);

  if (!question) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.cream }]}>
        <ActivityIndicator color={colors.slateMid} />
      </View>
    );
  }

  // Plain everyday wording by area; fall back to whatever the question
  // itself carries (e.g. a personalised question for an unmapped theme).
  const area = EVERYDAY_AREAS[question.theme_1 as keyof typeof EVERYDAY_AREAS];
  const sortedOptions = [...(question.options ?? [])].sort((a, b) => a.option_number - b.option_number);
  const heading = area?.question ?? question.prompt_text;
  const left = area?.left ?? question.pole_low_label ?? sortedOptions[0]?.option_text ?? '';
  const right = area?.right ?? question.pole_high_label ?? sortedOptions[sortedOptions.length - 1]?.option_text ?? '';

  return (
    <View style={[styles.checkinWrap, { backgroundColor: colors.paper }]}>
      <Text style={[styles.checkinQuestion, { color: colors.ink }]} accessibilityRole="header">
        {heading}
      </Text>
      <ThisOrThat
        options={sortedOptions}
        left={left}
        right={right}
        inBetween={t('checkin.in_between')}
        selectedOptionId={selectedOptionId || null}
        onSelect={selectOption}
        disabled={isSubmitting}
      />
      <Text style={[styles.checkinHint, { color: colors.slateLight }]}>
        {isSubmitting ? t('checkin.saving') : selectedOptionId ? t('checkin.saving_soon') : t('checkin.hint')}
      </Text>
    </View>
  );
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'common.greeting_morning';
  if (hour < 17) return 'common.greeting_afternoon';
  return 'common.greeting_evening';
}

// ─── Main Home Screen ─────────────────────────────────────────────────────────
export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const { session } = useAuthStore();
  const {
    activeCycle,
    currentDay,
    dailyScores,
    streakLength,
    pendingMilestone,
    dismissMilestone,
    loadActiveCycle,
    loadAlignmentHistory,
  } = useCycleStore();
  const { isCompleted, completedAt, loadTodayQuestion, question } = useCheckInStore();
  const { simulatedDay, setSimulatedDay, resetSimulatedDay } = useDevStore();
  const rep = useInnerRepStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const effectiveDay = simulatedDay ?? currentDay;

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    await loadActiveCycle(session.user.id);
    // Load 14-day history for sparkline (parallel, non-blocking)
    loadAlignmentHistory(session.user.id, 14);
    const cycle = useCycleStore.getState().activeCycle;
    if (cycle) {
      // dayNumber is now completion-count-based (see getCycleDay in
      // lib/scoring.ts), so the dev Day Simulator just overrides the number
      // directly instead of faking a calendar start date — there's no
      // calendar date to fake anymore.
      const realDay = useCycleStore.getState().currentDay;
      const dayToLoad = __DEV__ && simulatedDay ? simulatedDay : realDay;
      await loadTodayQuestion(cycle.id, dayToLoad);
    } else {
      router.replace('/(auth)/onboarding');
    }
    // i18n.language is intentionally a dependency, not just read inside —
    // loadTodayQuestion resolves _hi/_gu fields once at fetch time and
    // caches the result in checkin-store's Zustand state. Without this
    // dependency, switching language mid-session (e.g. from Profile) never
    // re-triggers the fetch, so the already-cached question/options stay in
    // whatever language was active on first load — a silent stale-language
    // bug distinct from the static-string i18n gaps fixed earlier.
  }, [session?.user?.id, simulatedDay, i18n.language]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (session?.user?.id) rep.load(session.user.id); }, [session?.user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Day simulation for testing
  const handleSimulateNextDay = async () => {
    const nextDay = (simulatedDay ?? currentDay) + 1;
    if (nextDay > 28) return;
    setSimulatedDay(nextDay);
    const cycle = useCycleStore.getState().activeCycle;
    if (cycle) {
      await loadTodayQuestion(cycle.id, nextDay);
    }
  };

  const handleResetSim = async () => {
    resetSimulatedDay();
    await load();
  };

  useEffect(() => {
    if (isCompleted && showCheckin) {
      // Keep modal open to show MirrorGlimmer — user taps "Back to today"
    }
  }, [isCompleted]);

  if (!activeCycle) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.slateMid} />
        </View>
      </SafeAreaView>
    );
  }


  // ─── Check-in flow active ───────────────────────────────────────────────────
  if (showCheckin && !isCompleted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.paper }]}>
        <View style={[styles.header, { borderBottomColor: colors.ruleLight }]}>
          <TouchableOpacity onPress={() => setShowCheckin(false)}>
            <Text style={[styles.backLink, { color: colors.slateMid }]}>← {t('nav.today')}</Text>
          </TouchableOpacity>
        </View>
        <CheckInFlow onDone={() => setShowCheckin(false)} />
      </SafeAreaView>
    );
  }

  // ─── Home dashboard ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <Animated.View entering={FadeIn.duration(300)}>
        <AppHeader />
        {simulatedDay !== null && (
          <Text style={[styles.dayChip, { color: colors.slateLight }]}>
            Simulated day {effectiveDay}
          </Text>
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.homeScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.slateMid}
          />
        }
      >
        {/* 1. Greeting — calm, non-metric header */}
        <Animated.View entering={FadeIn.duration(400).delay(80)}>
          <Text style={[styles.greeting, { color: colors.slate }]}>
            {t(getGreetingKey())}
          </Text>
        </Animated.View>

        {/* The one card: today's inner rep, Begin, and a quiet continuity cue */}
        <InnerRepCard
          exercise={rep.today}
          doneToday={rep.doneToday}
          cue={rep.cue}
          practiceDays={rep.practiceDays}
          onBegin={() => router.push('/inner-rep')}
        />

        {/* Milestone — rare, once, specific; never competes with the card */}
        {pendingMilestone && (
          <MilestoneCard milestone={pendingMilestone} onDismiss={dismissMilestone} />
        )}

        {/* Dev Day Simulator */}
        {__DEV__ && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.devSection, { borderColor: colors.border }]}>
            <Text style={[styles.devLabel, { color: colors.slateLight }]}>
              Development · Day Simulator
            </Text>
            <View style={styles.devButtons}>
              <TouchableOpacity
                style={[styles.devButton, { backgroundColor: colors.creamDark, borderColor: colors.border }]}
                onPress={handleSimulateNextDay}
              >
                <Text style={[styles.devButtonText, { color: colors.slateMid }]}>
                  Next Day →
                </Text>
              </TouchableOpacity>
              {simulatedDay !== null && (
                <TouchableOpacity
                  style={[styles.devButton, { backgroundColor: colors.creamDark, borderColor: colors.border }]}
                  onPress={handleResetSim}
                >
                  <Text style={[styles.devButtonText, { color: colors.slateMid }]}>
                    Reset
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <MirrorGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkinWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 36, gap: 28 },
  checkinQuestion: { fontFamily: FONTS.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  checkinHint: { textAlign: 'center', fontSize: 13 },
  safe: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  scrollView: { flex: 1 },
  homeScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  ringLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringLabel: {
    fontSize: FONT_SIZE.sm,
    letterSpacing: 0.3,
  },
  guidanceCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  guidanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidanceTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '400',
    flexShrink: 1,
  },
  guidanceText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
  guidanceHint: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  guideLink: {
    alignSelf: 'flex-start',
    paddingTop: SPACING.xs,
  },
  guideLinkText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  divider: { height: 1 },
  dayChip: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.5,
    fontWeight: '500',
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  backLink: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  // Greeting header
  greeting: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '300',
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  streakLine: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
    lineHeight: 20,
  },
  // Sparkline card
  sparklineCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sparklineCardLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Submit
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 32,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.35 },
  submitButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  doneButton: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  doneButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
  },
  // Early-days card (days 2–3, pre-data)
  earlyCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  earlyCardText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '300',
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  // Dev simulator
  devSection: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  devLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  devButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  devButton: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  devButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useCheckInStore } from '../../stores/checkin-store';
import { useCycleStore } from '../../stores/cycle-store';
import { useDevStore } from '../../stores/dev-store';
import { PromptCard } from '../../components/check-in/PromptCard';
import { OptionSelector } from '../../components/check-in/OptionSelector';
import { JournalExpander } from '../../components/check-in/JournalExpander';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { AlignmentCompass } from '../../components/ui/AlignmentCompass';
import { TodayCheckinCard } from '../../components/home/TodayCheckinCard';
import { AwarenessCard } from '../../components/home/AwarenessCard';
import { FirstDayWelcome } from '../../components/home/FirstDayWelcome';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { MirrorGuideModal } from '../../components/guide/MirrorGuideModal';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { getAlignmentStatus } from '../../lib/constants';
import { getStageFromDay } from '../../lib/scoring';
import { mirrorSignalLabelKey } from '../../lib/guidance';

// ─── Check-in Flow (modal-style within the tab) ───────────────────────────────
function CheckInFlow({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const { session } = useAuthStore();
  const { activeCycle } = useCycleStore();
  const {
    question,
    selectedOptionId,
    journalText,
    isSubmitting,
    isCompleted,
    selectOption,
    setJournalText,
    submitCheckIn,
  } = useCheckInStore();

  // V3: two-step flow — step 1 = question+options, step 2 = journal
  const [checkInStep, setCheckInStep] = React.useState<1 | 2>(1);

  // Derive selected option data for journal echo
  const selectedOption = question?.options?.find((o) => o.id === selectedOptionId) ?? null;

  const handleSubmit = async () => {
    if (!session?.user?.id || !activeCycle?.id || !selectedOptionId) return;
    const result = await submitCheckIn(session.user.id, activeCycle.id);
    if (!result.error) {
      const signal = useCheckInStore.getState().submittedSignal;
      const currentDayNum = useCycleStore.getState().currentDay;
      const cycleNum = activeCycle.cycle_number ?? 1;

      router.push({
        pathname: '/(checkin)/mirror',
        params: {
          day_number: String(currentDayNum),
          cycle_number: String(cycleNum),
          alignment_score: result.alignmentScore != null ? String(result.alignmentScore) : '',
          score_before: result.scoreBefore != null ? String(result.scoreBefore) : '',
          theme1_code: signal?.theme1Code ?? 'IAP',
          theme1_level: signal?.theme1Level ?? 'Medium',
          theme2_code: signal?.theme2Code ?? 'EWB',
          theme2_level: signal?.theme2Level ?? 'Medium',
          theme1_pattern_flag: signal?.theme1PatternFlag ?? '',
          theme2_pattern_flag: signal?.theme2PatternFlag ?? '',
          tomorrow_tease: signal?.tomorrowTease ?? '',
        },
      });
    }
  };

  if (!question) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.cream }]}>
        <ActivityIndicator color={colors.slateMid} />
      </View>
    );
  }

  // When completed, we navigate to the mirror screen — nothing to render here
  if (isCompleted) return null;

  const stage = getStageFromDay(question.day_number ?? 1);
  const dayNum = question.day_number ?? 1;

  // ── Step 2: Journal ─────────────────────────────────────────────────────────
  if (checkInStep === 2) {
    return (
      <JournalExpander
        dayNumber={dayNum}
        selectedOptionText={selectedOption?.option_text ?? undefined}
        theme1Code={selectedOption?.theme_1_code ?? undefined}
        theme1Level={selectedOption?.theme_1_level ?? undefined}
        theme2Code={selectedOption?.theme_2_code ?? undefined}
        theme2Level={selectedOption?.theme_2_level ?? undefined}
        value={journalText}
        onChangeText={setJournalText}
        disabled={isSubmitting}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onSkip={handleSubmit}
      />
    );
  }

  // ── Step 1: Question + Options ──────────────────────────────────────────────
  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.paper }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PromptCard
          dayNumber={dayNum}
          stage={stage}
          promptText={question.prompt_text}
        />
        <View style={[styles.divider, { backgroundColor: colors.ruleLight }]} />
        <OptionSelector
          options={question.options ?? []}
          selectedOptionId={selectedOptionId}
          onSelect={selectOption}
          disabled={isSubmitting}
        />
      </ScrollView>

      <View style={[styles.submitContainer, { backgroundColor: colors.paper, borderTopColor: colors.ruleLight }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.slate },
            !selectedOptionId && styles.submitButtonDisabled,
          ]}
          onPress={() => setCheckInStep(2)}
          disabled={!selectedOptionId}
          activeOpacity={0.85}
        >
          <Text style={[styles.submitButtonText, { color: colors.cream }]}>
            {t('onboarding.continue')} →
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

// ─── Main Home Screen ─────────────────────────────────────────────────────────
export default function TodayScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { session } = useAuthStore();
  const {
    activeCycle,
    currentDay,
    currentStage,
    alignmentScore,
    alignmentHistory,
    streakLength,
    contextMessage,
    patternReading,
    loadActiveCycle,
    loadAlignmentHistory,
  } = useCycleStore();
  const { isCompleted, completedAt, loadTodayQuestion, question } = useCheckInStore();
  const { simulatedDay, setSimulatedDay, resetSimulatedDay } = useDevStore();

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
      if (__DEV__ && simulatedDay) {
        const fakeStart = new Date();
        fakeStart.setDate(fakeStart.getDate() - simulatedDay + 1);
        await loadTodayQuestion(cycle.id, fakeStart.toISOString().split('T')[0]);
      } else {
        await loadTodayQuestion(cycle.id, cycle.start_date);
      }
    } else {
      router.replace('/(auth)/onboarding');
    }
  }, [session?.user?.id, simulatedDay]);

  useEffect(() => { load(); }, [load]);

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
      const fakeStart = new Date();
      fakeStart.setDate(fakeStart.getDate() - nextDay + 1);
      await loadTodayQuestion(cycle.id, fakeStart.toISOString().split('T')[0]);
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

  const cycleNumber = activeCycle?.cycle_number ?? 1;
  const score = alignmentScore?.score ?? null;
  const status = getAlignmentStatus(score);
  const trendValue = alignmentScore?.trend ?? null;

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
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <MirarLogo size="sm" />
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
            {getGreeting()}
          </Text>
          {streakLength >= 2 && (
            <Text style={[styles.streakLine, { color: colors.slateLight }]}>
              {streakLength} days in a row.
            </Text>
          )}
        </Animated.View>

        {/* 2. Today's check-in card — primary action */}
        <TodayCheckinCard
          dayNumber={effectiveDay}
          promptPreview={question?.prompt_text ?? t('common.signal_ready')}
          isCompleted={isCompleted}
          completedAt={completedAt}
          onPress={() => setShowCheckin(true)}
        />

        {/* 3. Early-days card — human text for days 1–3 before data accumulates */}
        {effectiveDay === 1 && !isCompleted && score === null && (
          <FirstDayWelcome />
        )}

        {/* 4. Alignment compass — same visual as the post-check-in Mirror screen.
            The single "today" focus of this screen; deeper history and the
            6-theme breakdown live exclusively on the Signals tab now, so this
            screen guides one thing at a time instead of showing everything
            at once. */}
        {score !== null && (
          <View style={styles.ringSection}>
            <AlignmentCompass
              score={score}
              previousScore={null}
              statusLabel={t(`signal_labels.${mirrorSignalLabelKey(status)}`)}
              deltaLabel={trendValue === 'up' ? '↑' : trendValue === 'down' ? '↓' : trendValue === 'steady' ? '→' : null}
              deltaColor={colors.slateLight}
              reduceMotion
            />
            <View style={styles.ringLabelRow}>
              <Text style={[styles.ringLabel, { color: colors.slateLight }]}>
                {t('common.your_alignment_today')}
              </Text>
              <InfoTooltipInline helpText={t('guidance_tooltips.signal')} size={13} />
            </View>
          </View>
        )}

        {/* 5. Pattern-of-the-week note — appears after today's reading, not competing with it */}
        {effectiveDay > 1 && effectiveDay <= 3 && !isCompleted && score === null ? (
          <Animated.View
            entering={FadeInDown.duration(400).delay(120)}
            style={[styles.earlyCard, { backgroundColor: colors.white, borderColor: colors.borderLight }]}
          >
            <Text style={[styles.earlyCardText, { color: colors.slateMid }]}>
              {effectiveDay === 2
                ? 'Day 2. The practice continues.'
                : 'Three days of signal. Your first pattern is forming.'}
            </Text>
          </Animated.View>
        ) : patternReading ? (
          <AwarenessCard reading={patternReading} />
        ) : null}

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

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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useCheckInStore } from '../../stores/checkin-store';
import { useCycleStore } from '../../stores/cycle-store';
import { PromptCard } from '../../components/check-in/PromptCard';
import { OptionSelector } from '../../components/check-in/OptionSelector';
import { JournalExpander } from '../../components/check-in/JournalExpander';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { AlignmentRing } from '../../components/home/AlignmentRing';
import { AlignmentSparkline } from '../../components/home/AlignmentSparkline';
import { ThemeSignalsGrid } from '../../components/home/ThemeSignalMiniCard';
import { TodayCheckinCard } from '../../components/home/TodayCheckinCard';
import { InsightCard } from '../../components/home/InsightCard';
import { WeeklySignalCard } from '../../components/home/WeeklySignalCard';
import { FirstDayWelcome } from '../../components/home/FirstDayWelcome';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS, STAGES } from '../../lib/constants';
import { getAlignmentStatus } from '../../lib/constants';
import { getStageFromDay } from '../../lib/scoring';
import { ThemeCode } from '../../types/mirar';

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
    completedOptionId,
    completedAt,
    submittedSignal,
    selectOption,
    setJournalText,
    submitCheckIn,
  } = useCheckInStore();

  const handleSubmit = async () => {
    if (!session?.user?.id || !activeCycle?.id || !selectedOptionId) return;
    const result = await submitCheckIn(session.user.id, activeCycle.id);
    if (!result.error) {
      // Navigate to dedicated Mirror Screen with signal params
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

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.cream }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PromptCard
          dayNumber={question.day_number ?? 1}
          stage={stage}
          promptText={question.prompt_text}
        />
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
        <OptionSelector
          options={question.options ?? []}
          selectedOptionId={selectedOptionId}
          onSelect={selectOption}
          disabled={isSubmitting}
        />
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
        <JournalExpander
          journalPrompt={question.journal_prompt}
          value={journalText}
          onChangeText={setJournalText}
          disabled={isSubmitting}
        />
      </ScrollView>

      <View style={[styles.submitContainer, { backgroundColor: colors.cream, borderTopColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.slate },
            (!selectedOptionId || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedOptionId || isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.creamLight} size="small" />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.creamLight }]}>
              {t('common.record_checkin')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Context Line (replaces plain DayPill) ────────────────────────────────────
function ContextLine({
  currentDay,
  cycleNumber,
  streakLength,
  contextMessage,
}: {
  currentDay: number;
  cycleNumber: number;
  streakLength: number;
  contextMessage: string | null;
}) {
  const colors = useColors();
  const stageName = STAGES[getStageFromDay(currentDay) - 1]?.label ?? '';

  // If context_message is available from server, use it; else build a simple one
  const displayText = contextMessage
    ?? `Day ${currentDay} · Chapter ${getStageFromDay(currentDay)}: ${stageName}${streakLength >= 2 ? ` · ${streakLength} days` : ''}`;

  return (
    <Animated.View entering={FadeIn.duration(400).delay(100)}>
      <View style={[styles.contextLine, {
        backgroundColor: colors.white,
        borderColor: colors.borderLight,
      }]}>
        <Text style={[styles.contextText, { color: colors.slateLight }]}>
          {displayText}
        </Text>
        {streakLength >= 2 && !contextMessage && (
          <View style={[styles.streakDot, { backgroundColor: colors.accentTeal }]} />
        )}
      </View>
    </Animated.View>
  );
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
    rollingThemeScores,
    streakLength,
    contextMessage,
    latestSignalText,
    loadActiveCycle,
    loadAlignmentHistory,
  } = useCycleStore();
  const { isCompleted, completedAt, loadTodayQuestion, question } = useCheckInStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [simDay, setSimDay] = useState<number | null>(null);

  const effectiveDay = simDay ?? currentDay;

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    await loadActiveCycle(session.user.id);
    // Load 14-day history for sparkline (parallel, non-blocking)
    loadAlignmentHistory(session.user.id, 14);
    const cycle = useCycleStore.getState().activeCycle;
    if (cycle) {
      await loadTodayQuestion(cycle.id, cycle.start_date);
    } else {
      router.replace('/(auth)/onboarding');
    }
  }, [session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Day simulation for testing
  const handleSimulateNextDay = async () => {
    const nextDay = (simDay ?? currentDay) + 1;
    if (nextDay > 28) return;
    setSimDay(nextDay);
    const cycle = useCycleStore.getState().activeCycle;
    if (cycle) {
      const fakeStart = new Date();
      fakeStart.setDate(fakeStart.getDate() - nextDay + 1);
      await loadTodayQuestion(cycle.id, fakeStart.toISOString().split('T')[0]);
    }
  };

  const handleResetSim = async () => {
    setSimDay(null);
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
  const themeScoresForGrid = rollingThemeScores.map((ts) => ({
    code: ts.code as ThemeCode,
    status: ts.status,
  }));

  // Compute week number for the weekly signal label
  const weekNumber = Math.ceil(effectiveDay / 7);

  // ─── Check-in flow active ───────────────────────────────────────────────────
  if (showCheckin && !isCompleted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => setShowCheckin(false)}>
            <Text style={[styles.backLink, { color: colors.slateMid }]}>← Today</Text>
          </TouchableOpacity>
          <Text style={[styles.dayChip, { color: colors.slateLight }]}>
            {t('common.day', { n: effectiveDay })}
          </Text>
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
        {simDay !== null && (
          <Text style={[styles.dayChip, { color: colors.slateLight }]}>
            Day {effectiveDay} (simulated)
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
        {/* 1. Context line (streak + day + stage) — replaces DayPill */}
        <ContextLine
          currentDay={effectiveDay}
          cycleNumber={cycleNumber}
          streakLength={streakLength}
          contextMessage={contextMessage}
        />

        {/* 2. Alignment ring — primary signal display */}
        {effectiveDay === 1 && !isCompleted && score === null ? (
          <FirstDayWelcome />
        ) : (
          <View style={styles.ringSection}>
            <AlignmentRing score={score} status={status} trend={trendValue} />
            <View style={styles.ringLabelRow}>
              <Text style={[styles.ringLabel, { color: colors.slateLight }]}>
                {t('common.your_alignment_today')}
              </Text>
              <InfoTooltipInline
                helpText={t('tooltips.alignment_ring')}
                size={13}
              />
            </View>
          </View>
        )}

        {/* 3. 14-day sparkline — trend context, moved up from bottom */}
        {alignmentHistory.length >= 2 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={[styles.sparklineCard, {
            backgroundColor: colors.white,
            borderColor: colors.borderLight,
          }]}>
            <Text style={[styles.sparklineCardLabel, { color: colors.slateLight }]}>
              14-DAY SIGNAL
            </Text>
            <AlignmentSparkline history={alignmentHistory} width={160} height={28} />
          </Animated.View>
        )}

        {/* 4. Weekly signal card — surfaces AI-generated weekly insight */}
        {latestSignalText && (
          <WeeklySignalCard
            signalText={latestSignalText}
            weekNumber={weekNumber}
          />
        )}

        {/* 5. Today's check-in card — primary action */}
        <TodayCheckinCard
          dayNumber={effectiveDay}
          promptPreview={question?.prompt_text ?? t('common.signal_ready')}
          isCompleted={isCompleted}
          completedAt={completedAt}
          onPress={() => setShowCheckin(true)}
        />

        {/* 6. Theme signal grid — 6 mini status cards */}
        {themeScoresForGrid.length > 0 && (
          <ThemeSignalsGrid
            themeScores={themeScoresForGrid}
            onThemePress={() => {}}
          />
        )}

        {/* 7. Mirror insight — AI synthesis (secondary context) */}
        {(score !== null || rollingThemeScores.length > 0) && (
          <InsightCard
            currentDay={effectiveDay}
            rollingThemeScores={rollingThemeScores}
            alignmentScore={score}
            mirrorText={alignmentScore?.mirror_text ?? null}
          />
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
              {simDay !== null && (
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
  // Context line (replaces DayPill)
  contextLine: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    letterSpacing: 0.4,
    flex: 1,
  },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: SPACING.sm,
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

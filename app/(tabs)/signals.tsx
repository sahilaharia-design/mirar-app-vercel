import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { ThemeSignalRow } from '../../components/dashboard/ThemeSignalRow';
import { StageProgress } from '../../components/dashboard/StageProgress';
import { CycleArc } from '../../components/dashboard/CycleArc';
import { CoverageBar } from '../../components/dashboard/CoverageBar';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { ThemeScore, ThemeCode } from '../../types/mirar';
import { COLORS, FONT_SIZE, SPACING, RADIUS, STAGES, THEME_ORDER } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';
import { ThemeDetailSheet } from '../../components/dashboard/ThemeDetailSheet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCrossThemeObservation(themeScores: ThemeScore[]): string | null {
  if (!themeScores.length) return null;
  const underLoad = themeScores.filter((t) => t.status === 'Under Load');
  const aligned = themeScores.filter((t) => t.status === 'Aligned');

  if (underLoad.length >= 3) {
    return `${underLoad.length} themes are carrying load simultaneously — this pattern often reflects broader internal pressure.`;
  }
  if (underLoad.length === 2) {
    return `${underLoad[0].name} and ${underLoad[1].name} are both reading low. These often move together.`;
  }
  if (aligned.length >= 4) {
    return `${aligned.length} themes are tracking well. Your signals are broadly stable this stage.`;
  }
  if (aligned.length >= 2 && underLoad.length === 0) {
    return `${aligned[0].name} and ${aligned[1].name} are both holding. No themes currently under load.`;
  }
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignalsScreen() {
  const colors = useColors();
  const { session } = useAuthStore();
  const {
    activeCycle,
    currentDay,
    currentStage,
    stageOverviews,
    alignmentHistory,
    rollingThemeScores,
    themeHistories,
    isLoading,
    loadActiveCycle,
    loadAlignmentHistory,
  } = useCycleStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeCode | null>(null);

  const load = async () => {
    if (session?.user?.id) {
      await loadActiveCycle(session.user.id);
      loadAlignmentHistory(session.user.id, 7);
    }
  };

  useEffect(() => {
    load();
  }, [session?.user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.slateMid} />
        </View>
      </SafeAreaView>
    );
  }

  const currentStageOverview = stageOverviews.find((s) => s.stage === currentStage);
  const currentStageCoverage = currentStageOverview?.coverage ?? 0;
  const crossThemeNote = currentStageOverview
    ? getCrossThemeObservation(currentStageOverview.themeScores)
    : null;

  // Build previous-stage theme statuses for delta labels
  const prevStageOverview = currentStage > 1
    ? stageOverviews.find((s) => s.stage === currentStage - 1)
    : null;
  const prevThemeStatusMap: Record<string, string> = {};
  for (const ts of prevStageOverview?.themeScores ?? []) {
    prevThemeStatusMap[ts.code] = ts.status;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <MirarLogo size="sm" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.slateMid}
          />
        }
      >
        {/* ── Current reading block ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>Current Reading</Text>
          <View style={[styles.stageSummaryCard, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <View style={styles.stageSummaryHeader}>
              <Text style={[styles.stageSummaryTitle, { color: colors.slate }]}>
                Chapter {currentStage} — {STAGES[currentStage - 1]?.label}
              </Text>
              <Text style={[styles.stageSummaryDesc, { color: colors.slateLight }]}>
                "{STAGES[currentStage - 1]?.description}"
              </Text>
            </View>
            <CoverageBar
              coverage={currentStageCoverage}
              total={7}
              label="Check-ins this stage"
            />
          </View>
        </View>

        {/* ── Theme signal rows with 7-day sparklines ────────────────────── */}
        {currentStageOverview && currentStageOverview.themeScores.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>Signal Status · 7 days</Text>
            <View style={styles.themeRows}>
              {THEME_ORDER.map((code, index) => {
                const score = currentStageOverview.themeScores.find((s) => s.code === code);
                if (!score) return null;

                const history = themeHistories?.[code] ?? [];
                const prevStatus = prevThemeStatusMap[code] as any ?? null;

                return (
                  <TouchableOpacity
                    key={code}
                    activeOpacity={0.75}
                    onPress={() => setSelectedTheme(code as ThemeCode)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${score.name} detail`}
                  >
                    <ThemeSignalRow
                      code={code as ThemeCode}
                      name={score.name}
                      status={score.status}
                      average={score.average}
                      signalCount={score.signalCount}
                      history={history}
                      previousStatus={prevStatus}
                      index={index}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cross-theme observation */}
            {crossThemeNote && (
              <View style={[styles.crossThemeCard, { backgroundColor: colors.creamDark, borderColor: colors.border }]}>
                <Text style={[styles.crossThemeLabel, { color: colors.slateLight }]}>Signal pattern</Text>
                <Text style={[styles.crossThemeText, { color: colors.slateMid }]}>{crossThemeNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Signal history (stage progress) ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>Signal History</Text>
          <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <StageProgress
              stages={stageOverviews}
              currentStage={currentStage}
              currentDay={currentDay}
            />
          </View>
        </View>

        {/* ── Cycle arc ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <CycleArc currentDay={currentDay} />
          </View>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <ThemeDetailSheet
        visible={selectedTheme !== null}
        themeCode={selectedTheme}
        cycleNumber={activeCycle?.cycle_number ?? 1}
        currentDay={currentDay}
        stageOverviews={stageOverviews}
        themeHistories={themeHistories}
        onClose={() => setSelectedTheme(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stageSummaryCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    gap: SPACING.md,
  },
  stageSummaryHeader: {
    gap: 4,
  },
  stageSummaryTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
  },
  stageSummaryDesc: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
  },
  themeRows: {
    gap: SPACING.sm,
  },
  crossThemeCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    gap: 4,
    marginTop: SPACING.xs,
  },
  crossThemeLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  crossThemeText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
});

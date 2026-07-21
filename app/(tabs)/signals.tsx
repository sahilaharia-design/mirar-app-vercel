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
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { useDevStore } from '../../stores/dev-store';
import { ThemeSignalRow } from '../../components/dashboard/ThemeSignalRow';
import { StageProgress } from '../../components/dashboard/StageProgress';
import { CoverageBar } from '../../components/dashboard/CoverageBar';
import { AppHeader } from '../../components/ui/AppHeader';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { MirrorGuideModal } from '../../components/guide/MirrorGuideModal';
import { ThemeScore, ThemeCode } from '../../types/mirar';
import { COLORS, FONT_SIZE, SPACING, RADIUS, THEME_ORDER } from '../../lib/constants';
import { getStageFromDay } from '../../lib/scoring';
import { signalHelpKeyForStatus } from '../../lib/guidance';
import { useColors } from '../../contexts/theme-context';
import { ThemeDetailSheet } from '../../components/dashboard/ThemeDetailSheet';
import { PatternsPanel } from '../../components/dashboard/PatternsPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCrossThemeObservation(t: (key: string, opts?: any) => string, themeScores: ThemeScore[]): string | null {
  if (!themeScores.length) return null;
  const underLoad = themeScores.filter((ts) => ts.status === 'Under Load');
  const aligned = themeScores.filter((ts) => ts.status === 'Aligned');

  if (underLoad.length >= 3) {
    return t('signals_tab.cross_load_many', { n: underLoad.length });
  }
  if (underLoad.length === 2) {
    return t('signals_tab.cross_load_two', { a: t(`themes.${underLoad[0].code}`), b: t(`themes.${underLoad[1].code}`) });
  }
  if (aligned.length >= 4) {
    return t('signals_tab.cross_aligned_many', { n: aligned.length });
  }
  if (aligned.length >= 2 && underLoad.length === 0) {
    return t('signals_tab.cross_aligned_two', { a: t(`themes.${aligned[0].code}`), b: t(`themes.${aligned[1].code}`) });
  }
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignalsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { session } = useAuthStore();
  const {
    activeCycle,
    currentDay,
    currentStage,
    stageOverviews,
    alignmentHistory,
    rollingThemeScores,
    rollingCoverage,
    themeHistories,
    patternReading,
    isLoading,
    loadActiveCycle,
    loadAlignmentHistory,
  } = useCycleStore();
  const { simulatedDay } = useDevStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeCode | null>(null);
  const [guideVisible, setGuideVisible] = React.useState(false);

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

  const effectiveDay = simulatedDay ?? currentDay;
  const effectiveStage = simulatedDay ? getStageFromDay(simulatedDay) : currentStage;
  // Rolling 7-real-calendar-day view — never resets, unlike the per-stage
  // overview below (which stays around only to drive the weekly-report
  // timeline further down the screen).
  const crossThemeNote = getCrossThemeObservation(t, rollingThemeScores);

  // Build previous-week theme statuses for delta labels — the most recent
  // completed stage window, used only as a "compared to before" reference,
  // not as the primary reading (rollingThemeScores is).
  const prevStageOverview = effectiveStage > 1
    ? stageOverviews.find((s) => s.stage === effectiveStage - 1)
    : null;
  const prevThemeStatusMap: Record<string, string> = {};
  for (const ts of prevStageOverview?.themeScores ?? []) {
    prevThemeStatusMap[ts.code] = ts.status;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <AppHeader />

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
        {/* ── Patterns: what repeats, changes, builds, holds ─────────────── */}
        {patternReading && <PatternsPanel reading={patternReading} />}

        {/* ── Current reading block ──────────────────────────────────────── */}
        <View style={[styles.guideCard, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
          <View style={styles.guideHeaderRow}>
            <Text style={[styles.guideTitle, { color: colors.slate }]}>
              {t('signals_tab.guide_title')}
            </Text>
            <InfoTooltipInline helpText={t('guidance_tooltips.signal')} size={13} />
          </View>
          <Text style={[styles.guideText, { color: colors.slateMid }]}>
            {t('signals_tab.guide_text')}
          </Text>
          {rollingCoverage < 3 && (
            <Text style={[styles.guideHint, { color: colors.slateLight }]}>
              {t('signals_tab.guide_hint')}
            </Text>
          )}
          <TouchableOpacity onPress={() => setGuideVisible(true)} activeOpacity={0.75} style={styles.guideLink}>
            <Text style={[styles.guideLinkText, { color: colors.slate }]}>{t('signals_tab.how_this_works')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('signals_tab.whats_showing_up')}</Text>
            <InfoTooltipInline helpText={t('guidance_tooltips.whats_showing_up')} size={12} />
          </View>
          <View style={[styles.stageSummaryCard, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <View style={styles.stageSummaryHeader}>
              <Text style={[styles.stageSummaryTitle, { color: colors.slate }]}>
                {t('signals_tab.recent_reflections')}
              </Text>
              <Text style={[styles.stageSummaryDesc, { color: colors.slateLight }]}>
                "{t(`report_detail.stage_description.${effectiveStage}`)}"
              </Text>
            </View>
            <CoverageBar
              coverage={rollingCoverage}
              total={7}
              label={t('signals_tab.reflections_in_window')}
            />
          </View>
        </View>

        {/* ── Theme signal rows with 7-day sparklines ────────────────────── */}
        {rollingThemeScores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('signals_tab.recent_signals')}</Text>
              <InfoTooltipInline helpText={t('guidance_tooltips.recent_reflections')} size={12} />
            </View>
            <View style={styles.themeRows}>
              {THEME_ORDER.map((code, index) => {
                const score = rollingThemeScores.find((s) => s.code === code);
                if (!score) return null;

                const history = themeHistories?.[code] ?? [];
                const prevStatus = prevThemeStatusMap[code] as any ?? null;

                return (
                  <TouchableOpacity
                    key={code}
                    activeOpacity={0.75}
                    onPress={() => setSelectedTheme(code as ThemeCode)}
                    accessibilityRole="button"
                    accessibilityLabel={t('signals_tab.view_detail_a11y', { name: t(`themes.${code}`) })}
                  >
                    <ThemeSignalRow
                      code={code as ThemeCode}
                      name={t(`themes.${code}`)}
                      status={score.status}
                      average={score.average}
                      signalCount={score.signalCount}
                      history={history}
                      previousStatus={prevStatus}
                      helpText={t(`guidance_tooltips.${signalHelpKeyForStatus(score.status)}`)}
                      index={index}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cross-theme observation */}
            {crossThemeNote && (
              <View style={[styles.crossThemeCard, { backgroundColor: colors.creamDark, borderColor: colors.border }]}>
                <Text style={[styles.crossThemeLabel, { color: colors.slateLight }]}>{t('signals_tab.your_pattern')}</Text>
                <Text style={[styles.crossThemeText, { color: colors.slateMid }]}>{crossThemeNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Signal history (stage progress) ───────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('signals_tab.recent_reflections')}</Text>
            <InfoTooltipInline helpText={t('guidance_tooltips.pattern')} size={12} />
          </View>
          <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
            <StageProgress
              stages={stageOverviews}
              currentStage={effectiveStage}
              currentDay={effectiveDay}
            />
          </View>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <ThemeDetailSheet
        visible={selectedTheme !== null}
        themeCode={selectedTheme}
        cycleNumber={activeCycle?.cycle_number ?? 1}
        currentDay={effectiveDay}
        stageOverviews={stageOverviews}
        themeHistories={themeHistories}
        onClose={() => setSelectedTheme(null)}
      />
      <MirrorGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
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
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  guideCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    lineHeight: 22,
    flexShrink: 1,
  },
  guideText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
  guideHint: {
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

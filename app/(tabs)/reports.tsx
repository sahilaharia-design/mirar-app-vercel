import React, { useEffect, useState } from 'react';
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
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { supabase } from '../../lib/supabase';
import { ReportRow } from '../../types/mirar';
import { ReportCard } from '../../components/reports/ReportCard';
import { AppHeader } from '../../components/ui/AppHeader';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { MirrorGuideModal } from '../../components/guide/MirrorGuideModal';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { session } = useAuthStore();
  const { activeCycle, loadActiveCycle, stageOverviews } = useCycleStore();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  const loadReports = async () => {
    // On a direct load or refresh of this tab the active cycle may not be in
    // the store yet (only Today loads it on mount). Hydrate it here so reports
    // resolve instead of showing every stage as "still forming".
    let cycleId = activeCycle?.id;
    if (!cycleId && session?.user?.id) {
      await loadActiveCycle(session.user.id);
      cycleId = useCycleStore.getState().activeCycle?.id;
    }
    if (!cycleId) {
      setIsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('stage', { ascending: true });
    setReports(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [activeCycle?.id, session?.user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getReport = (stage: number) => reports.find((r) => r.stage === stage) ?? null;
  const formingStage = stageOverviews.find((s) => s.status !== 'GENERATED');
  const formingCoverage = formingStage?.coverage ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <AppHeader />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.slateMid} />
        </View>
      ) : (
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
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: colors.slate }]}>{t('reports.page_title')}</Text>
            <InfoTooltipInline helpText={t('guidance_tooltips.reflection_summary')} size={13} />
          </View>
          <Text style={[styles.pageDesc, { color: colors.slateLight }]}>
            {t('reports.page_desc')}
          </Text>

          {formingCoverage < 7 && reports.length === 0 && (
            <View style={[styles.progressCard, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
              <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { backgroundColor: colors.accentTeal, width: `${Math.min((formingCoverage / 7) * 100, 100)}%` as any }]} />
              </View>
              <Text style={[styles.progressLabel, { color: colors.slateLight }]}>
                {t('reports.progress_label', { count: formingCoverage })}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('reports.summaries_label')}</Text>
            {[1, 2, 3, 4].map((stage) => (
              <ReportCard
                key={stage}
                stage={stage}
                report={getReport(stage)}
                onPress={() => {
                  const r = getReport(stage);
                  if (r) router.push(`/report/${r.id}`);
                }}
              />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.slateLight }]}>{t('reports.full_pattern_label')}</Text>
            <ReportCard
              stage={0}
              report={getReport(0)}
              onPress={() => {
                const r = getReport(0);
                if (r) router.push(`/report/${r.id}`);
              }}
            />
          </View>

          <View style={[styles.note, { backgroundColor: colors.creamDark, borderLeftColor: colors.borderLight }]}>
            <Text style={[styles.noteText, { color: colors.slateLight }]}>
              {t('reports.footer_note')}
            </Text>
          </View>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      )}
      <MirrorGuideModal visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  pageDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    marginTop: -SPACING.sm,
  },
  progressCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  note: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 2,
  },
  noteText: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

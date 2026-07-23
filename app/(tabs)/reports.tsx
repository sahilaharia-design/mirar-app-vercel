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
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

export default function ReportsScreen() {
  const { t } = useTranslation();
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
    <SafeAreaView style={styles.safe}>
      <AppHeader />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.slateMid} />
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
              tintColor={COLORS.slateMid}
            />
          }
        >
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{t('reports.page_title')}</Text>
            <InfoTooltipInline helpText={t('guidance_tooltips.reflection_summary')} size={13} />
          </View>
          <Text style={styles.pageDesc}>
            {t('reports.page_desc')}
          </Text>

          {formingCoverage < 7 && reports.length === 0 && (
            <View style={styles.progressCard}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${Math.min((formingCoverage / 7) * 100, 100)}%` as any }]} />
              </View>
              <Text style={styles.progressLabel}>
                {t('reports.progress_label', { count: formingCoverage })}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('reports.summaries_label')}</Text>
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
            <Text style={styles.sectionLabel}>{t('reports.full_pattern_label')}</Text>
            <ReportCard
              stage={0}
              report={getReport(0)}
              onPress={() => {
                const r = getReport(0);
                if (r) router.push(`/report/${r.id}`);
              }}
            />
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
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
    backgroundColor: COLORS.cream,
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
    color: COLORS.slate,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  pageDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    lineHeight: 22,
    marginTop: -SPACING.sm,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: COLORS.accentTeal,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    lineHeight: 18,
  },
  valueCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  valueTitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    fontWeight: '500',
  },
  valueText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    color: COLORS.slateMid,
  },
  guideLink: {
    alignSelf: 'flex-start',
    paddingTop: SPACING.xs,
  },
  guideLinkText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  section: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  note: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.creamDark,
    borderRadius: RADIUS.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.borderLight,
  },
  noteText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

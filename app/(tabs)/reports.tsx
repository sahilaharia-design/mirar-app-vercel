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
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { supabase } from '../../lib/supabase';
import { ReportRow } from '../../types/mirar';
import { ReportCard } from '../../components/reports/ReportCard';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { MirrorGuideModal } from '../../components/guide/MirrorGuideModal';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { GUIDANCE_TOOLTIPS } from '../../lib/guidance';

export default function ReportsScreen() {
  const { session } = useAuthStore();
  const { activeCycle, loadActiveCycle } = useCycleStore();
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
      </View>

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
            <Text style={styles.pageTitle}>Reflection summaries</Text>
            <InfoTooltipInline helpText={GUIDANCE_TOOLTIPS.reflectionSummary} size={13} />
          </View>
          <Text style={styles.pageDesc}>
            Summaries help you see what repeated across your reflections. Read them as a mirror, not a verdict.
          </Text>

          <View style={styles.valueCard}>
            <Text style={styles.valueTitle}>What reports are for</Text>
            <Text style={styles.valueText}>
              Based on your recent reflections, Mirar looks for what kept showing up: where you felt steady, stretched, unclear, or pulled in a direction.
            </Text>
            <TouchableOpacity onPress={() => setGuideVisible(true)} activeOpacity={0.75} style={styles.guideLink}>
              <Text style={styles.guideLinkText}>How this works</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recent summaries</Text>
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
            <Text style={styles.sectionLabel}>Full pattern</Text>
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
              Reflection summaries only. Mirar reflects — you interpret.
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

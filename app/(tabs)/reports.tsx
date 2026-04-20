import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
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
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

export default function ReportsScreen() {
  const { session } = useAuthStore();
  const { activeCycle } = useCycleStore();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    if (!activeCycle?.id) {
      setIsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('cycle_id', activeCycle.id)
      .order('stage', { ascending: true });
    setReports(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [activeCycle?.id]);

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
          <Text style={styles.pageTitle}>Alignment Summaries</Text>
          <Text style={styles.pageDesc}>
            Generated at each stage close. Available after{'\n'}start date + 6 days + 20 hours.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Stage Summaries</Text>
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
            <Text style={styles.sectionLabel}>Full Cycle</Text>
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
              Signal observations only. Mirar reads — you interpret.
            </Text>
          </View>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      )}
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

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ReportRow, ThemeScore, ReportDisplay } from '../../types/mirar';
import { buildReportDisplay } from '../../lib/report-generator';
import { ThemeBlock } from '../../components/reports/ThemeBlock';
import { SignalList } from '../../components/reports/SignalList';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

const STAGE_DESCRIPTIONS: Record<number, string> = {
  1: 'What became noticeable',
  2: 'Where adjustment signals appeared',
  3: 'Where movement occurred',
  4: 'What remained visible by the end of the cycle',
  0: 'Full cycle signal summary',
};

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reportDisplay, setReportDisplay] = useState<ReportDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data: report } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (!report) {
        setIsLoading(false);
        return;
      }

      // Load theme scores for this stage
      const { data: scores } = await supabase
        .from('theme_scores')
        .select('*')
        .eq('cycle_id', report.cycle_id)
        .eq('stage', report.stage);

      const themeScores: ThemeScore[] = (scores ?? []).map((s: any) => ({
        code: s.theme_code,
        name: s.theme_code, // will be replaced by buildReportDisplay
        status: s.status,
        average: s.average_score,
        lowCount: s.low_count,
        mediumCount: s.medium_count,
        highCount: s.high_count,
        signalCount: s.signal_count,
      }));

      setReportDisplay(buildReportDisplay(report, themeScores));
      setIsLoading(false);
    };

    load();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.slateMid} />
        </View>
      </SafeAreaView>
    );
  }

  if (!reportDisplay) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.errorText}>Report not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { stage, stageLabel, coverage, coverageTotal, themeBlocks, primarySignals, calibrationChecks, summaryText } = reportDisplay;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Reports</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Report header */}
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>{stageLabel}</Text>
          <Text style={styles.reportDesc}>"{STAGE_DESCRIPTIONS[stage]}"</Text>
          <View style={styles.coverageRow}>
            <Text style={styles.coverageText}>
              {coverage} of {coverageTotal} check-ins recorded
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        {summaryText && (
          <View style={styles.summaryBlock}>
            <Text style={styles.sectionLabel}>Summary</Text>
            <Text style={styles.summaryText}>{summaryText}</Text>
          </View>
        )}

        {/* Theme blocks */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionLabel}>Signal Areas</Text>
          <View style={styles.themeList}>
            {themeBlocks.map((block) => (
              <ThemeBlock key={block.code} block={block} />
            ))}
          </View>
        </View>

        {/* Primary signals */}
        {primarySignals.length > 0 && (
          <SignalList
            title="Primary Signals"
            items={primarySignals}
            variant="primary"
          />
        )}

        {/* Calibration checks */}
        {calibrationChecks.length > 0 && (
          <SignalList
            title="Calibration Checks"
            items={calibrationChecks}
            variant="calibration"
          />
        )}

        {/* Language disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This summary contains signal observations only. No interpretation, recommendations, or behavioral guidance is present.
          </Text>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
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
  errorText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  },
  reportHeader: {
    gap: SPACING.sm,
  },
  reportTitle: {
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.slate,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  reportDesc: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    fontStyle: 'italic',
  },
  coverageRow: {
    marginTop: SPACING.xs,
  },
  coverageText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  summaryBlock: {
    gap: SPACING.xs,
  },
  summaryText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    lineHeight: 26,
  },
  themeSection: {
    gap: SPACING.xs,
  },
  themeList: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  disclaimer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.creamDark,
    borderRadius: RADIUS.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.borderLight,
  },
  disclaimerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

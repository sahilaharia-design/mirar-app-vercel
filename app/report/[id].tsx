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
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { ReportRow, ThemeScore, ReportDisplay } from '../../types/mirar';
import { buildReportDisplay } from '../../lib/report-generator';
import { ThemeBlock } from '../../components/reports/ThemeBlock';
import { SignalList } from '../../components/reports/SignalList';
import { InfoTooltipInline } from '../../components/ui/InfoTooltip';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

function softenReportLine(line: string): string {
  return line
    .replace(/\s+\((IAP|EWB|FAF|RC|GAL|RA)\)/g, '')
    .replace(/Coverage:\s*/i, '')
    .replace(/check-ins/gi, 'reflections')
    .replace(/Low signal presence/gi, 'Pressure or load showed up')
    .replace(/High signal presence/gi, 'Steadiness showed up')
    .replace(/Moderate signal presence/gi, 'This area appeared, but not strongly')
    .replace(/Stabilizing signal pattern/gi, 'This area was settling')
    .replace(/this stage/gi, 'this window')
    .replace(/\.$/, '.');
}

export default function ReportDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reportDisplay, setReportDisplay] = useState<ReportDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [meaningOpen, setMeaningOpen] = useState(false);

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

      setReportDisplay(buildReportDisplay(t, report, themeScores));
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
          <Text style={styles.errorText}>{t('report_detail.not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { stage, stageLabel, coverage, coverageTotal, themeBlocks, primarySignals, calibrationChecks, summaryText } = reportDisplay;
  const strongestSignal = primarySignals[0] ?? null;
  const repeatedSignals = primarySignals.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← {t('report_detail.back_reports')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Report header */}
        <View style={styles.reportHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.reportTitle}>{stageLabel}</Text>
            <InfoTooltipInline helpText={t('guidance_tooltips.reflection_summary')} size={13} />
          </View>
          <Text style={styles.reportDesc}>"{t(`report_detail.stage_description.${stage}`)}"</Text>
          <View style={styles.coverageRow}>
            <Text style={styles.coverageText}>
              {t('report_detail.coverage_text', { coverage, total: coverageTotal })}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.valueIntro}>
          <Text style={styles.sectionLabel}>{t('report_detail.your_summary_label')}</Text>
          <Text style={styles.valueIntroText}>
            {t('report_detail.value_intro_text')}
          </Text>
        </View>

        {repeatedSignals.length > 0 && (
          <View style={styles.noticeBlock}>
            <Text style={styles.sectionLabel}>{t('report_detail.what_kept_showing_up')}</Text>
            <View style={styles.noticeCard}>
              {repeatedSignals.map((signal) => (
                <View key={signal} style={styles.noticeRow}>
                  <View style={styles.noticeDot} />
                  <Text style={styles.noticeText}>{softenReportLine(signal)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {strongestSignal && (
          <View style={styles.summaryBlock}>
            <Text style={styles.sectionLabel}>{t('report_detail.strongest_signal_label')}</Text>
            <Text style={styles.summaryText}>{softenReportLine(strongestSignal)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.meaningCard}
          onPress={() => setMeaningOpen((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <View style={styles.meaningHeader}>
            <Text style={styles.meaningTitle}>{t('report_detail.meaning_title')}</Text>
            <Text style={styles.meaningToggle}>{meaningOpen ? t('checkin.close') : t('report_detail.meaning_toggle_open')}</Text>
          </View>
          {meaningOpen && (
            <Text style={styles.meaningText}>
              {t('report_detail.meaning_text')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Summary */}
        {summaryText && (
          <View style={styles.summaryBlock}>
            <Text style={styles.sectionLabel}>{t('report_detail.how_to_read_label')}</Text>
            <Text style={styles.summaryText}>{summaryText}</Text>
          </View>
        )}

        {/* Theme blocks */}
        <View style={styles.themeSection}>
          <Text style={styles.sectionLabel}>{t('theme_detail.what_showed_up')}</Text>
          <View style={styles.themeList}>
            {themeBlocks.map((block) => (
              <ThemeBlock key={block.code} block={block} />
            ))}
          </View>
        </View>

        {/* Primary signals */}
        {primarySignals.length > 0 && (
          <SignalList
            title={t('report_detail.strongest_signals_title')}
            items={primarySignals}
            variant="primary"
          />
        )}

        {/* Calibration checks */}
        {calibrationChecks.length > 0 && (
          <SignalList
            title={t('report_detail.gentle_checks_title')}
            items={calibrationChecks}
            variant="calibration"
          />
        )}

        {/* Language disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            {t('report_detail.disclaimer_text')}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  valueIntro: {
    gap: SPACING.xs,
  },
  valueIntroText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    lineHeight: 25,
  },
  noticeBlock: {
    gap: SPACING.xs,
  },
  noticeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  noticeDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.slateMid,
    marginTop: 9,
  },
  noticeText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    lineHeight: 22,
  },
  summaryText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    lineHeight: 26,
  },
  meaningCard: {
    backgroundColor: COLORS.creamDark,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  meaningHeader: {
    gap: SPACING.xs,
  },
  meaningTitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    fontWeight: '500',
  },
  meaningToggle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  meaningText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    lineHeight: 22,
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

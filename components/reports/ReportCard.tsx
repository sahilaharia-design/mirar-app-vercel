import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReportRow } from '../../types/mirar';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface ReportCardProps {
  stage: number; // 1–4 or 0 for overall
  report: ReportRow | null;
  onPress?: () => void;
}

const CHAPTER_KEYS: Record<number, string> = {
  1: 'stages.awareness',
  2: 'stages.realignment',
  3: 'stages.action',
  4: 'stages.reflection',
  0: 'report_detail.full_cycle_label',
};

export function ReportCard({ stage, report, onPress }: ReportCardProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const title = t(CHAPTER_KEYS[stage] ?? CHAPTER_KEYS[1]);
  const isGenerated = report?.status === 'generated' || report?.status === 'delivered';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.white, borderColor: colors.borderLight },
        !isGenerated && styles.cardLocked,
      ]}
      onPress={isGenerated ? onPress : undefined}
      activeOpacity={isGenerated ? 0.8 : 1}
    >
      <View style={styles.left}>
        <View style={[styles.statusDot, { backgroundColor: isGenerated ? colors.aligned : colors.slateXLight }]} />
        <View style={styles.textGroup}>
          <Text style={[styles.title, { color: isGenerated ? colors.slate : colors.slateMid }]}>
            {title}
          </Text>
          {report?.generated_at && (
            <Text style={[styles.generatedAt, { color: colors.slateXLight }]}>
              {t('reports.ready_date', { date: new Date(report.generated_at).toLocaleDateString() })}
            </Text>
          )}
        </View>
      </View>

      {isGenerated ? (
        <Text style={[styles.arrow, { color: colors.slateLight }]}>›</Text>
      ) : (
        <View style={[styles.lockedBadge, { backgroundColor: colors.creamDark }]}>
          <Text style={[styles.lockedText, { color: colors.slateLight }]}>{t('reports.locked')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  cardLocked: {
    opacity: 0.6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    marginTop: 5,
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    lineHeight: 20,
  },
  generatedAt: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  arrow: {
    fontSize: FONT_SIZE.lg,
  },
  lockedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  lockedText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

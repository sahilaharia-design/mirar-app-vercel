import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReportRow } from '../../types/mirar';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface ReportCardProps {
  stage: number; // 1–4 or 0 for overall
  report: ReportRow | null;
  onPress?: () => void;
}

const CHAPTER_LABELS: Record<number, string> = {
  1: 'Chapter 1 — First Signals',
  2: 'Chapter 2 — Patterns Emerge',
  3: 'Chapter 3 — Signal in Action',
  4: 'Chapter 4 — Mirror Deepens',
  0: 'Full Cycle Mirror',
};

export function ReportCard({ stage, report, onPress }: ReportCardProps) {
  const { t } = useTranslation();
  const title = CHAPTER_LABELS[stage] ?? CHAPTER_LABELS[1];
  const isGenerated = report?.status === 'generated' || report?.status === 'delivered';

  return (
    <TouchableOpacity
      style={[styles.card, !isGenerated && styles.cardLocked]}
      onPress={isGenerated ? onPress : undefined}
      activeOpacity={isGenerated ? 0.8 : 1}
    >
      <View style={styles.left}>
        <View style={[styles.statusDot, isGenerated ? styles.dotReady : styles.dotPending]} />
        <View style={styles.textGroup}>
          <Text style={[styles.title, !isGenerated && styles.titleLocked]}>
            {title}
          </Text>
          {report?.generated_at && (
            <Text style={styles.generatedAt}>
              Generated {new Date(report.generated_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      {isGenerated ? (
        <Text style={styles.arrow}>›</Text>
      ) : (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedText}>{t('reports.locked')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  dotReady: {
    backgroundColor: COLORS.aligned,
  },
  dotPending: {
    backgroundColor: COLORS.slateXLight,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate,
    fontWeight: '500',
    lineHeight: 20,
  },
  titleLocked: {
    color: COLORS.slateMid,
  },
  generatedAt: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    marginTop: 2,
  },
  arrow: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.slateLight,
  },
  lockedBadge: {
    backgroundColor: COLORS.creamDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  lockedText: {
    fontSize: 10,
    color: COLORS.slateLight,
    letterSpacing: 0.5,
  },
});

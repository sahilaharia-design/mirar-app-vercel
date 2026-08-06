import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StageOverview } from '../../types/mirar';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface StageProgressProps {
  stages: StageOverview[];
  currentStage: number;
  currentDay: number;
}

// stage.label from lib/constants.ts's STAGES is a raw English fallback string
// (e.g. "First Signals") — never translated. This maps stage number to the
// same i18n keys ReportCard.tsx already uses for consistent, localized names.
const STAGE_KEY: Record<number, string> = {
  1: 'stages.awareness',
  2: 'stages.realignment',
  3: 'stages.action',
  4: 'stages.reflection',
};

export function StageProgress({ stages, currentStage, currentDay }: StageProgressProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <View style={styles.container}>
      {stages.map((stage) => {
        const isActive = stage.stage === currentStage;
        const isCompleted = stage.stage < currentStage;
        const coveragePct = (stage.coverage / 7) * 100;

        return (
          <View key={stage.stage} style={styles.stageRow}>
            <View
              style={[
                styles.stageDot,
                { backgroundColor: colors.borderLight },
                isCompleted && { backgroundColor: colors.aligned },
                isActive && { backgroundColor: colors.slate },
              ]}
            />

            <View style={styles.stageInfo}>
              <View style={styles.stageHeader}>
                <Text
                  style={[
                    styles.stageLabel,
                    { color: colors.slateLight },
                    isActive && { color: colors.slate, fontWeight: '500' },
                  ]}
                >
                  {t(STAGE_KEY[stage.stage] ?? STAGE_KEY[1])}
                </Text>
                <Text style={[styles.stageCoverage, { color: colors.slateXLight }]}>
                  {stage.coverage}/7
                </Text>
              </View>

              {(isActive || isCompleted) && (
                <View style={[styles.coverageTrack, { backgroundColor: colors.borderLight }]}>
                  <View
                    style={[
                      styles.coverageFill,
                      { width: `${coveragePct}%`, backgroundColor: colors.slateMid },
                      isCompleted && { backgroundColor: colors.aligned },
                    ]}
                  />
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
    marginTop: 4,
    flexShrink: 0,
  },
  stageInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: FONT_SIZE.sm,
  },
  stageCoverage: {
    fontSize: FONT_SIZE.xs,
  },
  coverageTrack: {
    height: 2,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  coverageFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});

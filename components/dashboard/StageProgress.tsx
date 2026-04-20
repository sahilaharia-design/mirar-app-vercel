import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StageOverview } from '../../types/mirar';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface StageProgressProps {
  stages: StageOverview[];
  currentStage: number;
  currentDay: number;
}

export function StageProgress({ stages, currentStage, currentDay }: StageProgressProps) {
  return (
    <View style={styles.container}>
      {stages.map((stage) => {
        const isActive = stage.stage === currentStage;
        const isCompleted = stage.stage < currentStage;
        const coveragePct = (stage.coverage / 7) * 100;

        return (
          <View key={stage.stage} style={styles.stageRow}>
            <View style={[styles.stageDot, isCompleted && styles.stageDotDone, isActive && styles.stageDotActive]} />

            <View style={styles.stageInfo}>
              <View style={styles.stageHeader}>
                <Text style={[styles.stageLabel, isActive && styles.stageLabelActive]}>
                  {stage.label}
                </Text>
                <Text style={styles.stageCoverage}>
                  {stage.coverage}/7
                </Text>
              </View>

              {(isActive || isCompleted) && (
                <View style={styles.coverageTrack}>
                  <View
                    style={[
                      styles.coverageFill,
                      { width: `${coveragePct}%` },
                      isCompleted && styles.coverageFillDone,
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
    backgroundColor: COLORS.borderLight,
    marginTop: 4,
    flexShrink: 0,
  },
  stageDotActive: {
    backgroundColor: COLORS.slate,
  },
  stageDotDone: {
    backgroundColor: COLORS.aligned,
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
    color: COLORS.slateLight,
  },
  stageLabelActive: {
    color: COLORS.slate,
    fontWeight: '500',
  },
  stageCoverage: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
  },
  coverageTrack: {
    height: 2,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  coverageFill: {
    height: '100%',
    backgroundColor: COLORS.slateMid,
    borderRadius: RADIUS.full,
  },
  coverageFillDone: {
    backgroundColor: COLORS.aligned,
  },
});

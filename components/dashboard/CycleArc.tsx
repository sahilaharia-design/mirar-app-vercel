import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface CycleArcProps {
  currentDay: number;
  totalDays?: number;
}

export function CycleArc({ currentDay, totalDays = 28 }: CycleArcProps) {
  const completedDays = currentDay - 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Cycle Progress</Text>
        <Text style={styles.dayCount}>Day {currentDay} of {totalDays}</Text>
      </View>

      {/* Day grid — 4 rows of 7 */}
      <View style={styles.grid}>
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const isDone = day < currentDay;
          const isToday = day === currentDay;
          const stage = Math.ceil(day / 7);
          return (
            <View
              key={day}
              style={[
                styles.cell,
                isDone && styles.cellDone,
                isToday && styles.cellToday,
                stage === 1 && styles.stage1,
                stage === 2 && styles.stage2,
                stage === 3 && styles.stage3,
                stage === 4 && styles.stage4,
                (isDone || isToday) && [
                  stage === 1 && styles.stage1Active,
                  stage === 2 && styles.stage2Active,
                  stage === 3 && styles.stage3Active,
                  stage === 4 && styles.stage4Active,
                ],
              ]}
            >
              {isToday && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>

      {/* Stage legend */}
      <View style={styles.legend}>
        {[
          { label: 'Awareness', bg: STAGE_COLORS.stage1Active },
          { label: 'Realignment', bg: STAGE_COLORS.stage2Active },
          { label: 'Action', bg: STAGE_COLORS.stage3Active },
          { label: 'Recognition', bg: STAGE_COLORS.stage4Active },
        ].map(({ label, bg }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: bg }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const STAGE_COLORS = {
  stage1: '#C8D4E8',
  stage2: '#C8DDD4',
  stage3: '#E8D8C4',
  stage4: '#D4C8E0',
  stage1Active: '#7A9ABE',
  stage2Active: '#5A8A6A',
  stage3Active: '#B07A2A',
  stage4Active: '#8A6AAA',
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate,
    fontWeight: '500',
  },
  dayCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: 32,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDone: {
    opacity: 0.85,
  },
  cellToday: {
    opacity: 1,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
  },
  stage1: { backgroundColor: STAGE_COLORS.stage1 },
  stage2: { backgroundColor: STAGE_COLORS.stage2 },
  stage3: { backgroundColor: STAGE_COLORS.stage3 },
  stage4: { backgroundColor: STAGE_COLORS.stage4 },
  stage1Active: { backgroundColor: STAGE_COLORS.stage1Active },
  stage2Active: { backgroundColor: STAGE_COLORS.stage2Active },
  stage3Active: { backgroundColor: STAGE_COLORS.stage3Active },
  stage4Active: { backgroundColor: STAGE_COLORS.stage4Active },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.slateLight,
  },
});

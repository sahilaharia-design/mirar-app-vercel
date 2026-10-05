import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONTS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { DayScore, recoveryStats } from '../../lib/everyday';

// The "fitness" half: how fast you come back from a low day. Silent-safe — if
// there's no completed dip yet it says exactly that instead of inventing one.
export function RecoveryCard({ scores }: { scores: DayScore[] }) {
  const { t } = useTranslation();
  const colors = useColors();
  const r = recoveryStats(scores);

  return (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.slateLight }]}>{t('signals_tab.recovery_title')}</Text>
      {r ? (
        <>
          <View style={styles.row}>
            <Text style={[styles.number, { color: colors.slate }]}>{r.avgDays}</Text>
            <Text style={[styles.unit, { color: colors.slateMid }]}>
              {r.avgDays === 1 ? t('signals_tab.recovery_day') : t('signals_tab.recovery_days')}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.slateMid }]}>
            {t('signals_tab.recovery_measured', { count: r.count })}
            {r.trend === 'faster' ? ` ${t('signals_tab.recovery_faster')}` : r.trend === 'slower' ? ` ${t('signals_tab.recovery_slower')}` : ''}
          </Text>
        </>
      ) : (
        <Text style={[styles.body, { color: colors.slateMid }]}>{t('signals_tab.recovery_empty')}</Text>
      )}
      <Text style={[styles.note, { color: colors.slateLight }]}>{t('signals_tab.recovery_note')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, gap: SPACING.xs },
  label: { fontSize: FONT_SIZE.xs, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  number: { fontFamily: FONTS.display, fontSize: 56, lineHeight: 60, letterSpacing: -1 },
  unit: { fontSize: FONT_SIZE.md, paddingBottom: 10 },
  body: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  note: { fontSize: FONT_SIZE.xs, lineHeight: 16, marginTop: SPACING.xs },
});

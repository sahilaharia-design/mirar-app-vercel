import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONTS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { SAFETY_RESOURCES } from '../../lib/innerRep/safety';

// Shown instead of the rep when free text trips the crisis check. No exercise,
// no insight, no score. Wording + helpline list pending founder/clinician review.
export function SafetyPanel({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.headline, { color: colors.ink }]} accessibilityRole="header">{SAFETY_RESOURCES.headline}</Text>
      <Text style={[styles.body, { color: colors.slateMid }]}>{SAFETY_RESOURCES.body}</Text>
      <View style={[styles.box, { backgroundColor: colors.white, borderColor: colors.border }]}>
        {SAFETY_RESOURCES.lines.map((l) => (
          <View key={l.label} style={styles.row}>
            <Text style={[styles.label, { color: colors.slateMid }]}>{l.label}</Text>
            <Text style={[styles.value, { color: colors.ink }]}>{l.value}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.note, { color: colors.slateLight }]}>{SAFETY_RESOURCES.note}</Text>
      <Pressable onPress={onContinue} accessibilityRole="button" style={[styles.btn, { borderColor: colors.border }]}>
        <Text style={[styles.btnText, { color: colors.slate }]}>{t('innerRep.safety_continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.md },
  headline: { fontFamily: FONTS.display, fontSize: 28, lineHeight: 34 },
  body: { fontSize: FONT_SIZE.md, lineHeight: 24 },
  box: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm },
  row: { gap: 2 },
  label: { fontSize: FONT_SIZE.sm },
  value: { fontFamily: FONTS.display, fontSize: 24 },
  note: { fontSize: FONT_SIZE.xs },
  btn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  btnText: { fontFamily: FONTS.bodyMedium, fontSize: 15 },
});

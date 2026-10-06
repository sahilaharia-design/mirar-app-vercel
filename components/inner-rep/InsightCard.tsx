import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { Insight } from '../../lib/innerRep/types';

type Feedback = 'accurate' | 'partly' | 'no' | 'unsure';

// One evidence-typed line, with its count shown, and a way to disagree.
export function InsightCard({ insight, onFeedback }: { insight: Insight; onFeedback: (f: Feedback) => void }) {
  const { t } = useTranslation();
  const colors = useColors();
  const [given, setGiven] = useState<Feedback | null>(null);
  const opts: { key: Feedback; label: string }[] = [
    { key: 'accurate', label: t('innerRep.fb_accurate') },
    { key: 'partly', label: t('innerRep.fb_partly') },
    { key: 'no', label: t('innerRep.fb_no') },
    { key: 'unsure', label: t('innerRep.fb_unsure') },
  ];
  return (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.slate }]}>{insight.text}</Text>
      <Text style={[styles.q, { color: colors.slateLight }]}>{given ? t('innerRep.fb_thanks') : t('innerRep.feedback_q')}</Text>
      {!given && (
        <View style={styles.chips}>
          {opts.map((o) => (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              onPress={() => { setGiven(o.key); onFeedback(o.key); }}
              style={[styles.chip, { borderColor: colors.border }]}
            >
              <Text style={[styles.chipText, { color: colors.slateMid }]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm },
  text: { fontSize: FONT_SIZE.md, lineHeight: 24 },
  q: { fontSize: FONT_SIZE.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontSize: FONT_SIZE.sm },
});

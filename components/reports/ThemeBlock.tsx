import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeBlock as ThemeBlockType } from '../../types/mirar';
import { StatusBadge } from '../ui/StatusBadge';
import { FONT_SIZE, SPACING } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface ThemeBlockProps {
  block: ThemeBlockType;
}

export function ThemeBlock({ block }: ThemeBlockProps) {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <View style={[styles.container, { borderBottomColor: colors.borderLight }]}>
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.slate }]}>{block.name}</Text>
      </View>
      <View style={styles.footer}>
        <StatusBadge status={block.status} size="sm" />
        {block.averageScore !== null && (
          <Text style={[styles.score, { color: colors.slateLight }]}>{t('theme_block.based_on_reflections')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  score: {
    fontSize: FONT_SIZE.xs,
  },
});

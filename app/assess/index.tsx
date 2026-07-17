import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { OptionCard } from '../../components/assess/OptionCard';
import { AssessProgress } from '../../components/assess/AssessProgress';
import { useAssessStore } from '../../stores/assess-store';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

// Stable ids — shared with app/(onboarding)/index.tsx so OAuth users who
// answer here pre-auth land on matching selections post-auth.
const Q1_IDS = ['understand', 'off', 'habit', 'transition', 'reactivity', 'recommended', 'curious'] as const;

export default function AssessQ1() {
  const { t } = useTranslation();
  const { q1, setQ1 } = useAssessStore();

  const toggle = (id: string) => {
    setQ1(q1.includes(id) ? q1.filter(x => x !== id) : [...q1, id]);
  };

  const canContinue = q1.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
        <AssessProgress current={1} total={5} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.step}>{t('assess.step', { n: 1 })}</Text>
        <Text style={styles.title}>{t('assess.q1_title')}</Text>
        <Text style={styles.sub}>{t('assess.q1_sub')}</Text>

        <View style={styles.options}>
          {Q1_IDS.map(id => (
            <OptionCard
              key={id}
              label={t(`shared.q1_options.${id}`)}
              selected={q1.includes(id)}
              onPress={() => toggle(id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={() => canContinue && router.push('/assess/q2')}
          disabled={!canContinue}
          activeOpacity={0.82}
        >
          <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  step: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.slate,
    fontWeight: '300',
    lineHeight: 36,
    letterSpacing: -0.3,
    marginTop: -SPACING.xs,
  },
  sub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    marginTop: -SPACING.xs,
  },
  options: { gap: SPACING.sm },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  cta: {
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  ctaDisabled: { opacity: 0.35 },
  ctaText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.white,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

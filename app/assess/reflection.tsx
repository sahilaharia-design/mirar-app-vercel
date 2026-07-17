import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { AssessProgress } from '../../components/assess/AssessProgress';
import { useAssessStore } from '../../stores/assess-store';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

function buildReflection(t: (key: string) => string, q2: string[]): string {
  if (q2.length === 0) return t('assess.reflection_default');
  const key = `assess.reflection_dimensions.${q2[0]}`;
  const text = t(key);
  return text === key ? t('assess.reflection_default') : text;
}

export default function AssessReflection() {
  const { t } = useTranslation();
  const { q1, q2 } = useAssessStore();
  const reflection = buildReflection(t, q2);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
        <AssessProgress current={5} total={5} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.stepRow}>
          <Text style={styles.step}>{t('assess.reflection_step_label')}</Text>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.title}
        >
          {t('assess.reflection_title')}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.duration(700).delay(250)}
          style={styles.reflectionCard}
        >
          <View style={styles.reflectionDot} />
          <Text style={styles.reflectionText}>{reflection}</Text>
          <Text style={styles.closer}>
            {t('assess.reflection_closer')}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={styles.privacyNote}
        >
          <Text style={styles.privacyText}>
            {t('assess.reflection_privacy')}
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.duration(500).delay(700)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.82}
        >
          <Text style={styles.ctaText}>{t('assess.reflection_cta')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          {t('assess.reflection_footer_note')}
        </Text>
      </Animated.View>
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
    gap: SPACING.lg,
  },
  stepRow: {},
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
  },
  reflectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  reflectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentTeal,
  },
  reflectionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.slateMid,
    lineHeight: 28,
    fontWeight: '300',
    letterSpacing: -0.1,
  },
  closer: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    lineHeight: 22,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    fontStyle: 'italic',
  },
  privacyNote: {
    paddingHorizontal: SPACING.sm,
  },
  privacyText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  cta: {
    width: '100%',
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  ctaText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.white,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  footerNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
  },
});

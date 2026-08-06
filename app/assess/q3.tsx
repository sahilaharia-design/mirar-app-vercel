import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { OptionCard } from '../../components/assess/OptionCard';
import { AssessProgress } from '../../components/assess/AssessProgress';
import { useAssessStore } from '../../stores/assess-store';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

const Q3_IDS = ['almost_never', 'occasionally', 'regularly', 'has_practice'] as const;

export default function AssessQ3() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { q3, setQ3 } = useAssessStore();

  const canContinue = q3.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
        <AssessProgress current={3} total={5} />
      </View>

      <View style={styles.content}>
        <Text style={styles.step}>{t('assess.step', { n: 3 })}</Text>
        <Text style={styles.title}>{t('assess.q3_title')}</Text>

        <View style={styles.options}>
          {Q3_IDS.map(id => (
            <OptionCard
              key={id}
              label={t(`assess.q3_options.${id}`)}
              selected={q3 === id}
              onPress={() => setQ3(id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={() => canContinue && router.push('/assess/q4')}
          disabled={!canContinue}
          activeOpacity={0.82}
        >
          <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.cream },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      gap: SPACING.lg,
    },
    step: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateLight,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: FONT_SIZE['2xl'],
      color: colors.slate,
      fontWeight: '300',
      lineHeight: 36,
      letterSpacing: -0.3,
      marginTop: -SPACING.xs,
    },
    options: { gap: SPACING.sm },
    footer: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
      paddingTop: SPACING.md,
    },
    cta: {
      backgroundColor: colors.slate,
      borderRadius: RADIUS.md,
      paddingVertical: 16,
      alignItems: 'center',
      ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
    },
    ctaDisabled: { opacity: 0.35 },
    ctaText: {
      fontSize: FONT_SIZE.base,
      color: colors.white,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
  });
}

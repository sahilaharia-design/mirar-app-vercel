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
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

const Q2_CODES = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'] as const;
const Q2_COLORS: Record<string, string> = {
  IAP: '#7C6FA0',
  EWB: '#C07840',
  FAF: '#4A7CA8',
  RC: '#6A9870',
  GAL: '#A0884A',
  RA: '#B85A4A',
};

export default function AssessQ2() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { q2, setQ2 } = useAssessStore();

  const toggle = (code: string) => {
    if (q2.includes(code)) {
      setQ2(q2.filter(x => x !== code));
    } else if (q2.length < 3) {
      setQ2([...q2, code]);
    }
  };

  const canContinue = q2.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
        <AssessProgress current={2} total={5} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.step}>{t('assess.step', { n: 2 })}</Text>
        <Text style={styles.title}>{t('assess.q2_title')}</Text>
        <Text style={styles.sub}>{t('assess.q2_sub')}</Text>

        <View style={styles.options}>
          {Q2_CODES.map(code => (
            <OptionCard
              key={code}
              label={t(`shared.q2_dimensions.${code}.name`)}
              sublabel={t(`shared.q2_dimensions.${code}.desc`)}
              selected={q2.includes(code)}
              onPress={() => toggle(code)}
              accentColor={Q2_COLORS[code]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={() => canContinue && router.push('/assess/q3')}
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
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xl,
      gap: SPACING.md,
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
    sub: {
      fontSize: FONT_SIZE.sm,
      color: colors.slateLight,
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

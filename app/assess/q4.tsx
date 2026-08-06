import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { AssessProgress } from '../../components/assess/AssessProgress';
import { useAssessStore } from '../../stores/assess-store';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

const MAX_CHARS = 120;

export default function AssessQ4() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = getStyles(colors);
  const { q4, setQ4 } = useAssessStore();
  const [localText, setLocalText] = useState(q4);

  const handleChange = (val: string) => {
    if (val.length <= MAX_CHARS) {
      setLocalText(val);
      setQ4(val);
    }
  };

  const handleContinue = () => {
    router.push('/assess/reflection');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <MirarLogo size="sm" />
          <AssessProgress current={4} total={5} />
        </View>

        <View style={styles.content}>
          <Text style={styles.step}>{t('assess.step', { n: 4 })}</Text>
          <Text style={styles.title}>{t('assess.q4_title')}</Text>
          <Text style={styles.sub}>{t('assess.q4_placeholder')}</Text>

          <TextInput
            style={styles.textarea}
            value={localText}
            onChangeText={handleChange}
            placeholder={t('assess.q4_input_placeholder')}
            placeholderTextColor={colors.slateXLight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="default"
          />

          <Text style={styles.charCount}>{localText.length}/{MAX_CHARS}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={handleContinue}
            activeOpacity={0.82}
          >
            <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            style={styles.skip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>{t('assess.q4_skip')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.cream },
    flex: { flex: 1 },
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
    textarea: {
      backgroundColor: colors.white,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      fontSize: FONT_SIZE.base,
      color: colors.slate,
      lineHeight: 24,
      minHeight: 120,
    },
    charCount: {
      fontSize: FONT_SIZE.xs,
      color: colors.slateXLight,
      textAlign: 'right',
      marginTop: -SPACING.sm,
    },
    footer: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
      paddingTop: SPACING.sm,
      gap: SPACING.sm,
    },
    cta: {
      backgroundColor: colors.slate,
      borderRadius: RADIUS.md,
      paddingVertical: 16,
      alignItems: 'center',
      ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
    },
    ctaText: {
      fontSize: FONT_SIZE.base,
      color: colors.white,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    skip: {
      alignItems: 'center',
      paddingVertical: SPACING.sm,
    },
    skipText: {
      fontSize: FONT_SIZE.sm,
      color: colors.slateLight,
      textDecorationLine: 'underline',
    },
  });
}

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { LanguagePicker } from '../../components/ui/LanguagePicker';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../lib/constants';

const WORDMARK = require('../../assets/brand/mirar-wordmark.png');
const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmail, isLoading } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setError(null);
    const result = await signInWithEmail(email.trim().toLowerCase());
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
          <Image source={WORDMARK} style={styles.wordmark} resizeMode="contain" accessibilityLabel="Mirar" />

          <View style={styles.sentCard}>
            <View style={styles.sentDot} />
            <Text style={styles.sentTitle}>{t('auth.check_email')}</Text>
            <Text style={styles.sentBody}>{t('auth.link_sent', { email })}</Text>
            <Text style={styles.sentNote}>{t('auth.link_validity')}</Text>
          </View>

          <TouchableOpacity onPress={() => setSent(false)} style={styles.tryAgain} activeOpacity={0.7}>
            <Text style={styles.tryAgainText}>{t('auth.try_again')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <LanguagePicker variant="inline" />
        </View>

        <Animated.View entering={FadeInDown.duration(500)} style={styles.center}>
          <Image source={WORDMARK} style={styles.wordmark} resizeMode="contain" accessibilityLabel="Mirar" />

          <Text style={styles.tagline}>{t('auth.tagline_short')}</Text>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor={COLORS.slateLight}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
              editable={!isLoading}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.ctaButton, isLoading && styles.ctaButtonDisabled, isWeb && ({ cursor: 'pointer' } as any)]}
              onPress={handleSubmit}
              disabled={isLoading || !email.trim()}
              activeOpacity={0.82}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.ctaText}>{t('auth.cta_early_access')}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>{t('auth.disclaimer')}</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  wordmark: {
    height: 28,
    width: 120,
    marginBottom: SPACING.xl,
  },
  tagline: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.md,
  },
  form: {
    width: '100%',
    gap: SPACING.md,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: '#E05252',
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: '#E05252',
    marginTop: -SPACING.xs,
  },
  ctaButton: {
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.white,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Sent state
  sentCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentTeal,
    marginBottom: SPACING.sm,
  },
  sentTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.slate,
    fontWeight: '300',
    letterSpacing: -0.2,
  },
  sentBody: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    textAlign: 'center',
    lineHeight: 22,
  },
  sentNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  tryAgain: {
    paddingVertical: SPACING.sm,
  },
  tryAgainText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    textDecorationLine: 'underline',
  },
});

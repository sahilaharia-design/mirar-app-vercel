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
  Image,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { LanguagePicker } from '../../components/ui/LanguagePicker';
import { FONT_SIZE, RADIUS, SPACING } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

const WORDMARK = require('../../assets/brand/mirar-wordmark.png');
const isWeb = Platform.OS === 'web';

type Mode = 'email' | 'sent';

const AUTH_ERROR_KEYS: Record<string, string> = {
  otp_expired: 'auth.link_expired',
  no_session: 'auth.link_expired',
  access_denied: 'auth.link_expired',
};

export default function LoginScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { auth_error } = useLocalSearchParams<{ auth_error?: string }>();
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(
    auth_error ? t(AUTH_ERROR_KEYS[auth_error] ?? 'auth.link_expired') : null
  );
  const { signInWithEmail, isLoading } = useAuthStore();

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    setError(null);
    const result = await signInWithEmail(email.trim().toLowerCase());
    if (result.error) {
      setError(result.error);
    } else {
      setMode('sent');
    }
  };

  if (mode === 'sent') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
          <Image source={WORDMARK} style={styles.wordmark} resizeMode="contain" accessibilityLabel="Mirar" />
          <View style={[styles.sentCard, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={[styles.sentDot, { backgroundColor: colors.accentTeal }]} />
            <Text style={[styles.sentTitle, { color: colors.slate }]}>{t('auth.check_email')}</Text>
            <Text style={[styles.sentBody, { color: colors.slateMid }]}>{t('auth.link_sent', { email })}</Text>
            <Text style={[styles.sentNote, { color: colors.slateLight }]}>{t('auth.link_validity')}</Text>
          </View>
          <TouchableOpacity onPress={() => setMode('email')} style={styles.tryAgain} activeOpacity={0.7}>
            <Text style={[styles.tryAgainText, { color: colors.slateLight }]}>{t('auth.try_again')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <LanguagePicker variant="inline" />
        </View>

        <Animated.View entering={FadeInDown.duration(500)} style={styles.center}>
          <Image source={WORDMARK} style={styles.wordmark} resizeMode="contain" accessibilityLabel="Mirar" />

          <Text style={[styles.heading, { color: colors.slate }]}>{t('auth.heading')}</Text>
          <Text style={[styles.sub, { color: colors.slateMid }]}>{t('auth.login_subtitle')}</Text>

          <View style={styles.form}>
            {/* Email — primary intentional path */}
            <TextInput
              style={[
                styles.input,
                { borderColor: colors.border, backgroundColor: colors.white, color: colors.slate },
                error ? styles.inputError : null,
              ]}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor={colors.slateLight}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleEmailSubmit}
              editable={!isLoading}
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                { backgroundColor: colors.slate },
                (isLoading || !email.trim()) && styles.buttonDisabled,
                isWeb && ({ cursor: 'pointer' } as any),
              ]}
              onPress={handleEmailSubmit}
              disabled={isLoading || !email.trim()}
              activeOpacity={0.82}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.ctaText, { color: colors.white }]}>{t('auth.send_link')}</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: colors.slateLight }]}>{t('auth.privacy_badge')}</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  heading: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '300',
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sub: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.sm,
  },
  form: {
    width: '100%',
    gap: SPACING.md,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.base,
  },
  inputError: { borderColor: '#E05252' },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: '#E05252',
    marginTop: -SPACING.xs,
  },
  ctaButton: {
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: { opacity: 0.45 },
  ctaText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  sentCard: {
    width: '100%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: SPACING.sm,
  },
  sentTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '300',
    letterSpacing: -0.2,
  },
  sentBody: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  sentNote: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  tryAgain: { paddingVertical: SPACING.sm },
  tryAgainText: {
    fontSize: FONT_SIZE.sm,
    textDecorationLine: 'underline',
  },
});

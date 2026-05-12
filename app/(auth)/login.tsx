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
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { LanguagePicker } from '../../components/ui/LanguagePicker';
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  THEMES,
  THEME_ORDER,
  THEME_COLORS,
} from '../../lib/constants';

const MAX_W = 640;

// ─── Shared CTA Form ──────────────────────────────────────────────────────────
function CTAForm({
  email,
  setEmail,
  sent,
  setSent,
  error,
  onSubmit,
  isLoading,
  inline = false,
}: {
  email: string;
  setEmail: (v: string) => void;
  sent: boolean;
  setSent: (v: boolean) => void;
  error: string | null;
  onSubmit: () => void;
  isLoading: boolean;
  inline?: boolean;
}) {
  const { t } = useTranslation();

  if (sent) {
    return (
      <View style={formStyles.sentContainer}>
        <View style={[formStyles.sentDot, { backgroundColor: COLORS.aligned }]} />
        <Text style={formStyles.sentTitle}>{t('auth.check_email')}</Text>
        <Text style={formStyles.sentBody}>{t('auth.link_sent', { email })}</Text>
        <Text style={formStyles.sentNote}>{t('auth.link_validity')}</Text>
        <TouchableOpacity onPress={() => setSent(false)} activeOpacity={0.7}>
          <Text style={formStyles.resendText}>{t('auth.try_again')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (inline) {
    return (
      <View style={formStyles.inlineWrap}>
        <View style={formStyles.inlineRow}>
          <TextInput
            style={[formStyles.inlineInput, error ? formStyles.inputError : null]}
            placeholder={t('auth.email_placeholder')}
            placeholderTextColor={COLORS.slateXLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={onSubmit}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[formStyles.inlineButton, (!email.trim() || isLoading) && formStyles.buttonDisabled]}
            onPress={onSubmit}
            disabled={!email.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.creamLight} size="small" />
            ) : (
              <Text style={formStyles.buttonText}>{t('landing.hero_cta')}</Text>
            )}
          </TouchableOpacity>
        </View>
        {error ? <Text style={formStyles.errorText}>{error}</Text> : null}
        <Text style={formStyles.badgeText}>{t('landing.hero_badge')}</Text>
      </View>
    );
  }

  return (
    <View style={formStyles.stackedWrap}>
      <TextInput
        style={[formStyles.stackedInput, error ? formStyles.inputError : null]}
        placeholder={t('auth.email_placeholder')}
        placeholderTextColor={COLORS.slateXLight}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={onSubmit}
        returnKeyType="send"
      />
      {error ? <Text style={formStyles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[formStyles.stackedButton, (!email.trim() || isLoading) && formStyles.buttonDisabled]}
        onPress={onSubmit}
        disabled={!email.trim() || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.creamLight} size="small" />
        ) : (
          <Text style={formStyles.buttonText}>{t('landing.hero_cta')}</Text>
        )}
      </TouchableOpacity>
      <Text style={formStyles.badgeText}>{t('landing.hero_badge')}</Text>
    </View>
  );
}

// ─── Web Landing ──────────────────────────────────────────────────────────────
function WebLanding({
  email,
  setEmail,
  sent,
  setSent,
  error,
  onSubmit,
  isLoading,
}: {
  email: string;
  setEmail: (v: string) => void;
  sent: boolean;
  setSent: (v: boolean) => void;
  error: string | null;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <ScrollView
      style={webStyles.scroll}
      contentContainerStyle={webStyles.container}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Section 1: Hero ─────────────────────────────────────── */}
      <LinearGradient
        colors={[COLORS.cream, COLORS.warmGlow, COLORS.cream]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={webStyles.heroSection}
      >
        <View style={webStyles.inner}>
          <Animated.View entering={FadeIn.duration(500)} style={webStyles.heroTopRow}>
            <MirarLogo size="lg" />
            <LanguagePicker variant="inline" />
          </Animated.View>
          <Animated.Text entering={FadeInDown.duration(500).delay(150)} style={webStyles.heroTitle}>
            {t('landing.hero_title')}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(500).delay(280)} style={webStyles.heroSub}>
            {t('landing.hero_sub')}
          </Animated.Text>
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <CTAForm
              email={email}
              setEmail={setEmail}
              sent={sent}
              setSent={setSent}
              error={error}
              onSubmit={onSubmit}
              isLoading={isLoading}
              inline
            />
          </Animated.View>
        </View>
      </LinearGradient>

      {/* ── Section 2: Recognition ──────────────────────────────── */}
      <View style={webStyles.recognitionSection}>
        <View style={webStyles.inner}>
          <Text style={webStyles.recognitionHeading}>{t('landing.recognition_heading')}</Text>
          <Text style={webStyles.recognitionSub}>{t('landing.recognition_sub')}</Text>
          <View style={webStyles.recognitionLines}>
            {([
              t('landing.recognition_1'),
              t('landing.recognition_2'),
              t('landing.recognition_3'),
            ] as string[]).map((line, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(400).delay(i * 100)}
                style={webStyles.recognitionLine}
              >
                <View style={webStyles.recognitionDash} />
                <Text style={webStyles.recognitionLineText}>{line}</Text>
              </Animated.View>
            ))}
          </View>
          <Text style={webStyles.recognitionCta}>{t('landing.recognition_cta')}</Text>
        </View>
      </View>

      {/* ── Section 3: What Alignment Feels Like ────────────────── */}
      <View style={webStyles.feelsSection}>
        <View style={webStyles.inner}>
          <Text style={webStyles.sectionHeading}>{t('landing.feels_like_heading')}</Text>
          <View style={webStyles.feelsList}>
            {([
              t('landing.feels_like_1'),
              t('landing.feels_like_2'),
              t('landing.feels_like_3'),
              t('landing.feels_like_4'),
              t('landing.feels_like_5'),
            ] as string[]).map((item, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(350).delay(i * 80)}
                style={webStyles.feelsItem}
              >
                <View style={webStyles.feelsDot} />
                <Text style={webStyles.feelsText}>{item}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Section 4: Alignment Compounds ──────────────────────── */}
      <LinearGradient
        colors={[COLORS.slate, '#3A3A45']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={webStyles.compoundsSection}
      >
        <View style={webStyles.inner}>
          <Text style={webStyles.compoundsHeading}>{t('landing.compounds_heading')}</Text>
          <View style={webStyles.compoundsRows}>
            {([
              { time: t('landing.compounds_1_time'), body: t('landing.compounds_1_body') },
              { time: t('landing.compounds_2_time'), body: t('landing.compounds_2_body') },
              { time: t('landing.compounds_3_time'), body: t('landing.compounds_3_body') },
              { time: t('landing.compounds_4_time'), body: t('landing.compounds_4_body') },
            ] as const).map((row, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(400).delay(i * 80)}
                style={webStyles.compoundsRow}
              >
                <Text style={webStyles.compoundsTime}>{row.time}</Text>
                <Text style={webStyles.compoundsBody}>{row.body}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* ── Section 5: How Mirar Works ───────────────────────────── */}
      <View style={webStyles.howSection}>
        <View style={webStyles.inner}>
          <Text style={webStyles.sectionHeading}>{t('landing.how_heading')}</Text>
          <View style={webStyles.howRows}>
            {([
              { label: t('landing.how_day_label'), body: t('landing.how_day_body') },
              { label: t('landing.how_week_label'), body: t('landing.how_week_body') },
              { label: t('landing.how_cycle_label'), body: t('landing.how_cycle_body') },
              { label: t('landing.how_lifetime_label'), body: t('landing.how_lifetime_body') },
            ] as const).map((row, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(350).delay(i * 70)}
                style={webStyles.howRow}
              >
                <Text style={webStyles.howLabel}>{row.label}</Text>
                <Text style={webStyles.howBody}>{row.body}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Theme chips — what Mirar tracks */}
          <View style={webStyles.themesNote}>
            <Text style={webStyles.themesNoteLabel}>What Mirar gently notices</Text>
            <View style={webStyles.themesGrid}>
              {THEME_ORDER.map((code) => (
                <View key={code} style={webStyles.themeChip}>
                  <View style={[webStyles.themeDot, { backgroundColor: THEME_COLORS[code].light }]} />
                  <Text style={webStyles.themeName}>{THEMES[code].name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ── Section 6: Privacy ──────────────────────────────────── */}
      <View style={webStyles.privacySection}>
        <View style={webStyles.inner}>
          <Text style={webStyles.sectionHeading}>{t('landing.privacy_heading')}</Text>
          <Text style={webStyles.privacyBody}>{t('landing.privacy_body')}</Text>
          <View style={webStyles.privacyBadgeRow}>
            {(['No password', 'No tracking', 'Signal is yours'] as const).map((badge) => (
              <View key={badge} style={webStyles.privacyBadge}>
                <Text style={webStyles.privacyBadgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Section 7: Final CTA ────────────────────────────────── */}
      <View style={webStyles.ctaSection}>
        <View style={webStyles.inner}>
          <Text style={webStyles.ctaHeading}>{t('landing.cta_heading')}</Text>
          <CTAForm
            email={email}
            setEmail={setEmail}
            sent={sent}
            setSent={setSent}
            error={error}
            onSubmit={onSubmit}
            isLoading={isLoading}
            inline
          />
          <Text style={webStyles.ctaBadge}>{t('landing.cta_badge')}</Text>
        </View>
      </View>

      <View style={webStyles.footer}>
        <Text style={webStyles.footerText}>Mirar · Private Beta</Text>
      </View>
    </ScrollView>
  );
}

// ─── Mobile Landing ───────────────────────────────────────────────────────────
function MobileLanding({
  email,
  setEmail,
  sent,
  setSent,
  error,
  onSubmit,
  isLoading,
}: {
  email: string;
  setEmail: (v: string) => void;
  sent: boolean;
  setSent: (v: boolean) => void;
  error: string | null;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={mobileStyles.safe}>
      <KeyboardAvoidingView
        style={mobileStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={mobileStyles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <LinearGradient
            colors={[COLORS.cream, COLORS.warmGlow, COLORS.cream]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={mobileStyles.heroGradient}
          >
            <Animated.View entering={FadeIn.duration(600)} style={mobileStyles.heroContent}>
              <View style={mobileStyles.heroTopRow}>
                <MirarLogo size="lg" />
                <LanguagePicker variant="inline" />
              </View>
              <Animated.Text entering={FadeInDown.duration(500).delay(200)} style={mobileStyles.tagline}>
                {t('landing.recognition_heading')}
              </Animated.Text>
              <Animated.Text entering={FadeInDown.duration(500).delay(350)} style={mobileStyles.heroSub}>
                {t('landing.recognition_sub')}
              </Animated.Text>
            </Animated.View>
          </LinearGradient>

          {/* Recognition lines */}
          <View style={mobileStyles.recognitionSection}>
            {([
              t('landing.recognition_1'),
              t('landing.recognition_2'),
              t('landing.recognition_3'),
            ] as string[]).map((line, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(400).delay(400 + i * 100)}
                style={mobileStyles.recognitionLine}
              >
                <View style={mobileStyles.recognitionDash} />
                <Text style={mobileStyles.recognitionText}>{line}</Text>
              </Animated.View>
            ))}
            <Animated.Text
              entering={FadeInUp.duration(400).delay(750)}
              style={mobileStyles.recognitionCta}
            >
              {t('landing.recognition_cta')}
            </Animated.Text>
          </View>

          {/* CTA */}
          <Animated.View entering={FadeInUp.duration(500).delay(900)} style={mobileStyles.ctaSection}>
            <CTAForm
              email={email}
              setEmail={setEmail}
              sent={sent}
              setSent={setSent}
              error={error}
              onSubmit={onSubmit}
              isLoading={isLoading}
              inline={false}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).delay(1100)} style={mobileStyles.versionRow}>
            <Text style={mobileStyles.versionText}>Mirar · Private Beta</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Root Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
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

  const formProps = { email, setEmail, sent, setSent, error, onSubmit: handleSubmit, isLoading };

  if (Platform.OS === 'web') {
    return <WebLanding {...formProps} />;
  }
  return <MobileLanding {...formProps} />;
}

// ─── Shared Form Styles ───────────────────────────────────────────────────────
const formStyles = StyleSheet.create({
  inlineWrap: { gap: SPACING.sm, marginTop: SPACING.lg },
  inlineRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  inlineInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
  },
  inlineButton: {
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    alignItems: 'center',
    flexShrink: 0,
  },
  stackedWrap: { gap: SPACING.md },
  stackedInput: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
  },
  stackedButton: {
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  inputError: { borderColor: COLORS.underLoad },
  errorText: { fontSize: FONT_SIZE.sm, color: COLORS.underLoad },
  buttonText: { color: COLORS.creamLight, fontSize: FONT_SIZE.base, fontWeight: '500', letterSpacing: 0.3 },
  buttonDisabled: { opacity: 0.4 },
  badgeText: { fontSize: FONT_SIZE.xs, color: COLORS.slateLight, textAlign: 'center' },
  sentContainer: { gap: SPACING.sm, marginTop: SPACING.lg },
  sentDot: { width: 10, height: 10, borderRadius: 5 },
  sentTitle: { fontSize: FONT_SIZE.xl, color: COLORS.slate, fontWeight: '300' },
  sentBody: { fontSize: FONT_SIZE.base, color: COLORS.slateMid, lineHeight: 24 },
  sentNote: { fontSize: FONT_SIZE.sm, color: COLORS.slateLight },
  resendText: { fontSize: FONT_SIZE.sm, color: COLORS.slateMid, textDecorationLine: 'underline', marginTop: SPACING.sm },
});

// ─── Web Styles ───────────────────────────────────────────────────────────────
const webStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.cream },
  container: { flexGrow: 1 },
  inner: { maxWidth: MAX_W, alignSelf: 'center', width: '100%', paddingHorizontal: SPACING.lg },

  // Hero
  heroSection: { paddingVertical: SPACING['3xl'] },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING['2xl'] },
  heroTitle: { fontSize: 42, color: COLORS.slate, fontWeight: '300', letterSpacing: -1, lineHeight: 52 },
  heroSub: { fontSize: FONT_SIZE.md, color: COLORS.slateMid, lineHeight: 28, marginTop: SPACING.md },

  // Recognition
  recognitionSection: { backgroundColor: COLORS.creamDark, paddingVertical: SPACING['2xl'] },
  recognitionHeading: { fontSize: FONT_SIZE.md, color: COLORS.slate, fontWeight: '500', letterSpacing: -0.2, marginBottom: SPACING.xs },
  recognitionSub: { fontSize: FONT_SIZE.lg, color: COLORS.slateMid, fontWeight: '300', marginBottom: SPACING.xl, fontStyle: 'italic' },
  recognitionLines: { gap: SPACING.md },
  recognitionLine: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  recognitionDash: { width: 16, height: 1, backgroundColor: COLORS.slateLight, marginTop: 11, flexShrink: 0 },
  recognitionLineText: { flex: 1, fontSize: FONT_SIZE.base, color: COLORS.slateMid, lineHeight: 24 },
  recognitionCta: { marginTop: SPACING.xl, fontSize: FONT_SIZE.base, color: COLORS.slate, fontWeight: '500' },

  // Feels like
  feelsSection: { backgroundColor: COLORS.cream, paddingVertical: SPACING['2xl'] },
  sectionHeading: { fontSize: FONT_SIZE.xs, color: COLORS.slateLight, letterSpacing: 2, textTransform: 'uppercase', marginBottom: SPACING.lg },
  feelsList: { gap: SPACING.md },
  feelsItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  feelsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accentTeal, flexShrink: 0 },
  feelsText: { fontSize: FONT_SIZE.md, color: COLORS.slate, fontWeight: '300', flex: 1 },

  // Compounds
  compoundsSection: { paddingVertical: SPACING['2xl'] },
  compoundsHeading: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: SPACING.xl },
  compoundsRows: { gap: SPACING.lg },
  compoundsRow: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'flex-start' },
  compoundsTime: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', fontWeight: '500', width: 120, flexShrink: 0, paddingTop: 2 },
  compoundsBody: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.creamLight, fontWeight: '300' },

  // How it works
  howSection: { backgroundColor: COLORS.creamDark, paddingVertical: SPACING['2xl'] },
  howRows: { gap: SPACING.md, marginBottom: SPACING['2xl'] },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.lg },
  howLabel: { fontSize: FONT_SIZE.sm, color: COLORS.slateLight, fontWeight: '500', width: 120, flexShrink: 0, paddingTop: 2 },
  howBody: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.slate, fontWeight: '300' },
  themesNote: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.lg, gap: SPACING.md },
  themesNoteLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slateXLight, letterSpacing: 1, textTransform: 'uppercase' },
  themesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  themeChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.white, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.borderLight },
  themeDot: { width: 7, height: 7, borderRadius: 4 },
  themeCode: { fontSize: FONT_SIZE.xs, color: COLORS.slateLight, fontWeight: '600', letterSpacing: 0.8 },
  themeName: { fontSize: FONT_SIZE.sm, color: COLORS.slateMid },

  // Privacy
  privacySection: { backgroundColor: COLORS.cream, paddingVertical: SPACING['2xl'] },
  privacyBody: { fontSize: FONT_SIZE.base, color: COLORS.slateMid, lineHeight: 26, marginBottom: SPACING.lg },
  privacyBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  privacyBadge: { backgroundColor: COLORS.creamDark, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  privacyBadgeText: { fontSize: FONT_SIZE.xs, color: COLORS.slateLight, letterSpacing: 0.5 },

  // Final CTA
  ctaSection: { backgroundColor: COLORS.creamDark, paddingVertical: SPACING['2xl'] },
  ctaHeading: { fontSize: FONT_SIZE['2xl'], color: COLORS.slate, fontWeight: '300', letterSpacing: -0.5, marginBottom: SPACING.sm },
  ctaBadge: { fontSize: FONT_SIZE.xs, color: COLORS.slateXLight, textAlign: 'center', marginTop: SPACING.md, letterSpacing: 0.5 },

  footer: { paddingVertical: SPACING.lg, alignItems: 'center' },
  footerText: { fontSize: FONT_SIZE.xs, color: COLORS.slateXLight, letterSpacing: 1, textTransform: 'uppercase' },
});

// ─── Mobile Styles ────────────────────────────────────────────────────────────
const mobileStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingBottom: SPACING.xl },
  heroGradient: { paddingHorizontal: SPACING.lg, paddingTop: SPACING['3xl'], paddingBottom: SPACING['2xl'] },
  heroContent: { alignItems: 'flex-start', gap: SPACING.sm },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  tagline: { fontSize: FONT_SIZE['2xl'], color: COLORS.slate, fontWeight: '500', letterSpacing: -0.5, lineHeight: 34, marginTop: SPACING.md },
  heroSub: { fontSize: FONT_SIZE.lg, color: COLORS.slateMid, fontWeight: '300', lineHeight: 28, fontStyle: 'italic' },
  recognitionSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING['2xl'], gap: SPACING.md, marginBottom: SPACING.lg },
  recognitionLine: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  recognitionDash: { width: 14, height: 1, backgroundColor: COLORS.slateLight, marginTop: 11, flexShrink: 0 },
  recognitionText: { flex: 1, fontSize: FONT_SIZE.base, color: COLORS.slateMid, lineHeight: 24 },
  recognitionCta: { fontSize: FONT_SIZE.base, color: COLORS.slate, fontWeight: '500', marginTop: SPACING.sm },
  ctaSection: { paddingHorizontal: SPACING.lg },
  versionRow: { marginTop: SPACING['2xl'], alignItems: 'center' },
  versionText: { fontSize: 10, color: COLORS.slateXLight, letterSpacing: 1, textTransform: 'uppercase' },
});

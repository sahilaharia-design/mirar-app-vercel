import React, { useRef, useState } from 'react';
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
  Image,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { LanguagePicker } from '../../components/ui/LanguagePicker';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

const MAX_WIDE = 1180;
const MAX_TEXT = 720;
const MARK = require('../../assets/brand/mirar-mark.png');
const WORDMARK = require('../../assets/brand/mirar-wordmark.png');
const FULL_LOGO = require('../../assets/brand/mirar-logo-full.png');
const TAGLINE = require('../../assets/brand/mirar-tagline.png');

const PROCESS = [
  ['Start today’s mirror', 'A single question opens the check-in.'],
  ['Choose what feels closest', 'No blank page. No need to explain everything.'],
  ['Receive one signal', 'Mirar reflects what may be showing up.'],
  ['Return tomorrow', 'Repeated signals begin to form a pattern.'],
];

const SIGNAL_AREAS = [
  ['Direction', 'Where your life seems to be pulling you.', '#8C7DB1'],
  ['Energy', 'What is quietly draining or restoring you.', '#C98B55'],
  ['Attention', 'Where your mind keeps returning.', '#6F93B8'],
  ['Connection', 'What you are emotionally available for.', '#7FA47B'],
  ['Growth', 'What you are outgrowing or becoming.', '#B9A05D'],
  ['Movement', 'What action is asking to happen.', '#BE7868'],
];

const PREVIEWS = [
  {
    title: 'Today’s Mirror',
    copy: 'One question. One answer. One small signal.',
    meta: 'What feels closest today?',
    lines: ['clear', 'scattered', 'heavy', 'uncertain'],
    signal: 'Still forming',
  },
  {
    title: 'Signals',
    copy: 'See what keeps repeating across Direction, Energy, Attention, Connection, Growth, and Movement.',
    meta: 'What’s been showing up',
    lines: ['Direction · Forming', 'Energy · Under Load', 'Connection · Steady'],
    signal: 'Recent reflections',
  },
  {
    title: 'Reflection Summary',
    copy: 'A weekly mirror of what showed up — not a verdict on who you are.',
    meta: 'Based on your recent reflections',
    lines: ['Energy was present, but stretched.', 'Clarity appeared in moments.', 'Movement was there, but scattered.'],
    signal: 'Mirror, not verdict',
  },
];

function isCompact(width: number) {
  return width < 760;
}

function BrandLogo({ size = 'header' }: { size?: 'header' | 'footer' }) {
  return (
    <View style={styles.logoWrap}>
      <Image
        source={WORDMARK}
        style={size === 'header' ? styles.wordmarkHeader : styles.wordmarkFooter}
        resizeMode="contain"
        accessibilityLabel="Mirar"
      />
    </View>
  );
}

function CTAForm({
  email,
  setEmail,
  sent,
  setSent,
  error,
  onSubmit,
  isLoading,
  compact,
}: {
  email: string;
  setEmail: (v: string) => void;
  sent: boolean;
  setSent: (v: boolean) => void;
  error: string | null;
  onSubmit: () => void;
  isLoading: boolean;
  compact: boolean;
}) {
  const { t } = useTranslation();

  if (sent) {
    return (
      <View style={styles.sentPanel}>
        <View style={styles.sentDot} />
        <Text style={styles.sentTitle}>{t('auth.check_email')}</Text>
        <Text style={styles.sentBody}>{t('auth.link_sent', { email })}</Text>
        <Text style={styles.sentNote}>{t('auth.link_validity')}</Text>
        <TouchableOpacity onPress={() => setSent(false)} activeOpacity={0.7}>
          <Text style={styles.resendText}>{t('auth.try_again')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.formWrap}>
      <View style={[styles.formRow, compact && styles.formRowCompact]}>
        <TextInput
          style={[styles.emailInput, error && styles.inputError]}
          placeholder={t('auth.email_placeholder')}
          placeholderTextColor="#8F887F"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={onSubmit}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
          activeOpacity={0.86}
        >
          {isLoading ? (
            <ActivityIndicator color="#FBF8F1" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Start your daily mirror</Text>
          )}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.microcopy}>Private beta · Less than 2 minutes · Free to begin</Text>
    </View>
  );
}

function Header({ onCtaPress, compact }: { onCtaPress: () => void; compact: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(450)} style={styles.headerShell}>
      <View style={styles.header}>
        <BrandLogo />
        <View style={styles.headerRight}>
          {!compact && <LanguagePicker variant="inline" />}
          <TouchableOpacity onPress={onCtaPress} activeOpacity={0.84} style={styles.headerCta}>
            <Text style={styles.headerCtaText}>Start your mirror</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function HeroPreview({ compact }: { compact: boolean }) {
  return (
    <Animated.View entering={FadeInUp.duration(800).delay(220)} style={[styles.heroPreview, compact && styles.heroPreviewCompact]}>
      <View style={[styles.mirrorOrb, compact && styles.mirrorOrbCompact]}>
        <View style={styles.orbGlowLarge} />
        <View style={styles.orbGlowPeach} />
        <View style={styles.orbGlowBlue} />
        <LinearGradient
          colors={['rgba(255,255,255,0.86)', 'rgba(226,233,232,0.58)', 'rgba(239,197,162,0.46)']}
          locations={[0, 0.52, 1]}
          start={{ x: 0.18, y: 0.05 }}
          end={{ x: 0.86, y: 1 }}
          style={styles.orbGlass}
        >
          <LinearGradient
            colors={['rgba(203,202,235,0.88)', 'rgba(197,224,224,0.62)', 'rgba(246,180,139,0.82)']}
            locations={[0, 0.54, 1]}
            start={{ x: 0.28, y: 0.05 }}
            end={{ x: 0.72, y: 1 }}
            style={styles.orbCore}
          />
          <Image source={MARK} style={styles.orbMark} resizeMode="contain" />
        </LinearGradient>
        <Svg style={styles.orbRings} viewBox="0 0 420 520">
          <Circle cx="206" cy="255" r="176" stroke="rgba(67,70,80,0.16)" strokeWidth="1" fill="none" />
          <Path d="M96 386 C168 334 263 320 346 266" stroke="rgba(67,70,80,0.24)" strokeWidth="1.2" fill="none" />
          <Path d="M98 132 C162 72 282 64 344 148" stroke="rgba(255,255,255,0.46)" strokeWidth="1.4" fill="none" />
        </Svg>
        <View style={styles.orbSheen} />
        <View style={[styles.orbSignalCluster, compact && styles.orbSignalClusterCompact]}>
          {['Direction', 'Energy', 'Attention'].map((chip, index) => (
            <View key={chip} style={[styles.orbSignalChip, index === 1 && styles.orbSignalChipWarm]}>
              <View style={[styles.orbSignalDot, index === 1 && styles.orbSignalDotWarm]} />
              <Text style={styles.orbSignalText}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.previewCard, compact && styles.previewCardCompact]}>
        <View style={styles.previewTopRow}>
          <Text style={styles.previewOverline}>Today’s mirror</Text>
          <View style={styles.statusChip}>
            <View style={styles.statusDot} />
            <Text style={styles.statusChipText}>Still forming</Text>
          </View>
        </View>
        <Text style={[styles.previewQuestion, compact && styles.previewQuestionCompact]}>What feels closest today?</Text>
        <View style={styles.previewOptions}>
          {['Clear', 'Scattered', 'Heavy', 'Uncertain'].map((option, index) => (
            <View key={option} style={[styles.previewOption, compact && styles.previewOptionCompact, index === 1 && styles.previewOptionActive]}>
              <Text style={[styles.previewOptionText, index === 1 && styles.previewOptionTextActive]}>{option}</Text>
            </View>
          ))}
        </View>
        <View style={styles.signalStrip}>
          <View style={styles.signalDot} />
          <Text style={styles.signalText}>Energy is present, but direction feels spread out.</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function SectionLabel({ children, inverse = false }: { children: React.ReactNode; inverse?: boolean }) {
  return <Text style={[styles.sectionLabel, inverse && styles.sectionLabelInverse]}>{children}</Text>;
}

function ProductPreviewCard({ preview, index }: { preview: typeof PREVIEWS[number]; index: number }) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(index * 80)} style={styles.productPreviewCard}>
      <Text style={styles.productPreviewTitle}>{preview.title}</Text>
      <Text style={styles.productPreviewCopy}>{preview.copy}</Text>
      <View style={styles.mockSurface}>
        <Text style={styles.mockMeta}>{preview.meta}</Text>
        {preview.lines.map((line, i) => (
          <View key={line} style={styles.mockLineRow}>
            <View style={[styles.mockLineDot, { opacity: 1 - i * 0.16 }]} />
            <Text style={styles.mockLineText}>{line}</Text>
          </View>
        ))}
        <View style={styles.mockSignal}>
          <Text style={styles.mockSignalText}>{preview.signal}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function LandingPage({
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
  const { width } = useWindowDimensions();
  const compact = isCompact(width);
  const scrollRef = useRef<ScrollView>(null);
  const ctaProps = { email, setEmail, sent, setSent, error, onSubmit, isLoading, compact };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const heroCopy = (
    <View style={styles.heroCopy}>
      <Animated.Image
        entering={FadeInDown.duration(580).delay(40)}
        source={TAGLINE}
        style={[styles.heroTagline, compact && styles.heroTaglineCompact]}
        resizeMode="contain"
      />
      <Animated.Text entering={FadeInDown.duration(580).delay(80)} style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
        Notice what’s off before it becomes your life.
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(580).delay(160)} style={[styles.heroSub, compact && styles.heroSubCompact]}>
        Mirar is a 2-minute daily check-in for emotional and mental hygiene — one question a day to help you see what your inner life keeps trying to tell you.
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(580).delay(240)}>
        <CTAForm {...ctaProps} />
        <Text style={styles.heroMicro}>No journaling. No tracking. No advice. Just one honest signal a day.</Text>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header onCtaPress={scrollToTop} compact={compact} />

          <View style={[styles.hero, compact && styles.heroCompact]}>
            <View style={[styles.heroAuraTop, compact && styles.heroAuraHidden]} />
            <View style={[styles.heroAuraBottom, compact && styles.heroAuraHidden]} />
            {compact ? (
              <>
                <HeroPreview compact={compact} />
                {heroCopy}
              </>
            ) : (
              <>
                {heroCopy}
                <HeroPreview compact={compact} />
              </>
            )}
          </View>

          <View style={styles.quietGap}>
            <View style={styles.sectionInnerNarrow}>
              <SectionLabel>THE QUIET GAP</SectionLabel>
              <Text style={styles.editorialHeading}>We check everything except ourselves.</Text>
              <Text style={styles.editorialBody}>
                Your calendar knows where you need to be.{'\n'}Your phone knows how much you moved.{'\n'}Your apps know what you clicked.
              </Text>
              <Text style={styles.editorialBody}>
                But the quieter signals — your energy, attention, direction, and connection — often go unseen until they become impossible to ignore.
              </Text>
              <Text style={styles.editorialLead}>Mirar gives those signals a place to show up.</Text>
              <View style={[styles.signalWords, compact && styles.signalWordsCompact]}>
                {['calendar', 'steps', 'sleep', 'messages', 'money', 'work'].map((item) => (
                  <Text key={item} style={styles.fadingWord}>{item}</Text>
                ))}
                {['direction', 'energy', 'attention', 'connection'].map((item) => (
                  <Text key={item} style={styles.clearWord}>{item}</Text>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.whatItIs, compact && styles.stackSection]}>
            <View style={styles.statementColumn}>
              <SectionLabel>WHAT IT IS</SectionLabel>
              <Text style={styles.sectionTitle}>A mirror, not another system to manage.</Text>
              <Text style={styles.bodyText}>
                Mirar is not therapy.{'\n'}Not journaling.{'\n'}Not meditation.{'\n'}Not productivity.
              </Text>
              <Text style={styles.bodyText}>It is a small daily ritual that helps you notice what is forming inside your life.</Text>
            </View>
            <View style={styles.mirrorStatement}>
              <Image source={MARK} style={styles.statementMark} resizeMode="contain" />
              <Text style={styles.statementLine}>One question.</Text>
              <Text style={styles.statementLine}>One answer.</Text>
              <Text style={styles.statementLine}>One small signal.</Text>
              <Text style={styles.statementFinal}>A clearer pattern over time.</Text>
            </View>
          </View>

          <View style={styles.howItWorks}>
            <View style={styles.sectionInnerWide}>
              <SectionLabel>HOW IT WORKS</SectionLabel>
              <Text style={styles.sectionTitle}>One question. One signal. A clearer pattern over time.</Text>
              <View style={[styles.processGrid, compact && styles.singleColumn]}>
                {PROCESS.map(([title, copy], index) => (
                  <Animated.View key={title} entering={FadeInUp.duration(500).delay(index * 70)} style={styles.processCard}>
                    <Text style={styles.processNumber}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.processTitle}>{title}</Text>
                    <Text style={styles.processCopy}>{copy}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.insideMirar}>
            <View style={styles.sectionInnerWide}>
              <SectionLabel>INSIDE MIRAR</SectionLabel>
              <Text style={styles.sectionTitle}>Small reflections become visible patterns.</Text>
              <View style={[styles.previewGrid, compact && styles.singleColumn]}>
                {PREVIEWS.map((preview, index) => (
                  <ProductPreviewCard key={preview.title} preview={preview} index={index} />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.signalAreas}>
            <View style={styles.sectionInnerWide}>
              <SectionLabel>SIGNAL AREAS</SectionLabel>
              <Text style={styles.sectionTitle}>What your mirror learns to notice.</Text>
              <View style={[styles.signalGrid, compact && styles.signalGridCompact]}>
                {SIGNAL_AREAS.map(([title, copy, color]) => (
                  <View key={title} style={[styles.signalAreaCard, compact && styles.signalAreaCardCompact]}>
                    <View style={[styles.areaDot, { backgroundColor: color }]} />
                    <Text style={styles.areaTitle}>{title}</Text>
                    <Text style={styles.areaCopy}>{copy}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.compounding}>
            <View style={styles.sectionInnerWide}>
              <SectionLabel>WHY DAILY</SectionLabel>
              <Text style={styles.sectionTitle}>The first check-in may feel small. That is the point.</Text>
              <Text style={styles.compoundingBody}>
                One answer does not define you. A few answers begin to form a signal. Repeated signals reveal a pattern. Patterns help you notice what your life has been trying to say quietly.
              </Text>
              <View style={[styles.timeline, compact && styles.timelineCompact]}>
                {[
                  ['Day 1', 'one dot'],
                  ['Day 4', 'a faint line'],
                  ['Day 9', 'a pattern forming'],
                  ['Day 21', 'a clearer mirror'],
                ].map(([day, label], index) => (
                  <View key={day} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, index > 0 && styles.timelineDotActive]} />
                    <Text style={styles.timelineDay}>{day}</Text>
                    <Text style={styles.timelineLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <LinearGradient colors={['#2F323A', '#26282F']} style={styles.privacy}>
            <View style={styles.sectionInnerWide}>
              <SectionLabel inverse>PRIVATE BY DESIGN</SectionLabel>
              <Text style={styles.privacyTitle}>Your inner life should not become content.</Text>
              <Text style={styles.privacyBody}>
                Mirar is private by design.{'\n'}No public profile.{'\n'}No social feed.{'\n'}No pressure to share.{'\n'}No need to perform clarity.
              </Text>
              <Text style={styles.privacyLead}>Just a quiet place to return to yourself.</Text>
              <View style={styles.trustPills}>
                {['Private beta', 'Less than 2 minutes', 'No social feed', 'No performance', 'Mirror, not verdict'].map((pill) => (
                  <View key={pill} style={styles.trustPill}>
                    <Text style={styles.trustPillText}>{pill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>

          <View style={styles.finalCta}>
            <Image source={FULL_LOGO} style={styles.finalLogo} resizeMode="contain" />
            <Text style={styles.finalTitle}>You do not need to fix your life today.</Text>
            <Text style={styles.finalSub}>Just notice what is true.</Text>
            <CTAForm {...ctaProps} />
          </View>

          <View style={styles.footer}>
            <BrandLogo size="footer" />
            <Text style={styles.footerText}>Private beta · © 2026 Mirar</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

  return (
    <LandingPage
      email={email}
      setEmail={setEmail}
      sent={sent}
      setSent={setSent}
      error={error}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5EFE4',
  },
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: '#F5EFE4' },
  page: {
    flexGrow: 1,
  },
  headerShell: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    backgroundColor: '#F5EFE4',
  },
  header: {
    width: '100%',
    maxWidth: MAX_WIDE,
    alignSelf: 'center',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  logoWrap: {
    justifyContent: 'center',
  },
  wordmarkHeader: {
    width: 150,
    height: 46,
  },
  wordmarkFooter: {
    width: 112,
    height: 34,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerCta: {
    backgroundColor: '#24252A',
    borderRadius: RADIUS.full,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#24252A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  headerCtaText: {
    color: '#FBF8F1',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  hero: {
    maxWidth: MAX_WIDE,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 64,
    paddingBottom: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 64,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCompact: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 24,
    paddingBottom: 78,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 28,
  },
  heroAuraTop: {
    position: 'absolute',
    top: 18,
    right: -80,
    width: 390,
    height: 390,
    borderRadius: 195,
    backgroundColor: 'rgba(190,206,232,0.28)',
  },
  heroAuraBottom: {
    position: 'absolute',
    bottom: 20,
    left: -100,
    width: 440,
    height: 280,
    borderRadius: 220,
    backgroundColor: 'rgba(239,188,142,0.22)',
  },
  heroAuraHidden: {
    display: 'none',
  },
  heroCopy: {
    flex: 1,
    maxWidth: 660,
    zIndex: 2,
  },
  heroTagline: {
    width: 250,
    height: 34,
    marginBottom: SPACING.lg,
    opacity: 0.54,
    alignSelf: 'flex-start',
  },
  heroTaglineCompact: {
    width: 188,
    height: 24,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 78,
    lineHeight: 80,
    letterSpacing: -2,
    color: '#202126',
    fontWeight: '300',
  },
  heroTitleCompact: {
    fontSize: 41,
    lineHeight: 45,
    letterSpacing: -0.7,
  },
  heroSub: {
    marginTop: SPACING.lg,
    maxWidth: 620,
    fontSize: 21,
    lineHeight: 34,
    color: '#5A5753',
    fontWeight: '300',
  },
  heroSubCompact: {
    fontSize: 16,
    lineHeight: 26,
  },
  heroMicro: {
    marginTop: SPACING.md,
    color: '#706B64',
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  formWrap: {
    marginTop: SPACING.xl,
    maxWidth: 650,
    gap: SPACING.sm,
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  formRowCompact: {
    flexDirection: 'column',
  },
  emailInput: {
    flex: 1,
    minHeight: 58,
    backgroundColor: 'rgba(255,252,245,0.86)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(54,50,46,0.14)',
    paddingHorizontal: 20,
    color: '#24252A',
    fontSize: FONT_SIZE.base,
    shadowColor: '#5B5044',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#202126',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#24252A',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  primaryButtonText: {
    color: '#FBF8F1',
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
  },
  buttonDisabled: { opacity: 0.78 },
  inputError: { borderColor: COLORS.underLoad },
  errorText: { color: COLORS.underLoad, fontSize: FONT_SIZE.sm },
  microcopy: { color: '#8B8780', fontSize: FONT_SIZE.xs, letterSpacing: 0.4 },
  sentPanel: {
    marginTop: SPACING.xl,
    backgroundColor: '#FBF8F1',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(39,38,37,0.12)',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sentDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#7FA47B' },
  sentTitle: { color: '#272625', fontSize: FONT_SIZE.xl, fontWeight: '400' },
  sentBody: { color: '#5F5A53', fontSize: FONT_SIZE.base, lineHeight: 24 },
  sentNote: { color: '#8B8780', fontSize: FONT_SIZE.sm },
  resendText: { color: '#272625', fontSize: FONT_SIZE.sm, textDecorationLine: 'underline' },
  heroPreview: {
    flex: 0.86,
    minHeight: 610,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  heroPreviewCompact: {
    minHeight: 500,
  },
  mirrorOrb: {
    width: 430,
    height: 550,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mirrorOrbCompact: {
    width: 316,
    height: 390,
    alignSelf: 'center',
    transform: [{ translateY: -54 }],
  },
  orbGlowLarge: {
    position: 'absolute',
    width: '92%',
    height: '78%',
    borderRadius: 240,
    backgroundColor: 'rgba(202,207,228,0.26)',
    transform: [{ rotate: '-8deg' }],
  },
  orbGlowPeach: {
    position: 'absolute',
    bottom: 54,
    width: '76%',
    height: '42%',
    borderRadius: 190,
    backgroundColor: 'rgba(239,177,132,0.34)',
  },
  orbGlowBlue: {
    position: 'absolute',
    top: 58,
    right: 28,
    width: '62%',
    height: '34%',
    borderRadius: 150,
    backgroundColor: 'rgba(166,190,226,0.34)',
  },
  orbGlass: {
    width: '76%',
    height: '82%',
    borderRadius: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(70,70,78,0.16)',
    shadowColor: '#6A6470',
    shadowOpacity: 0.2,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 30 },
    transform: [{ rotate: '-7deg' }],
  },
  orbCore: {
    width: '48%',
    height: '56%',
    borderRadius: 130,
    opacity: 0.92,
    transform: [{ rotate: '14deg' }],
  },
  orbMark: {
    position: 'absolute',
    width: '56%',
    height: '68%',
    opacity: 0.24,
    transform: [{ rotate: '7deg' }],
  },
  orbRings: {
    position: 'absolute',
    width: '96%',
    height: '96%',
  },
  orbSheen: {
    position: 'absolute',
    top: 72,
    left: 88,
    width: 170,
    height: 72,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.28)',
    transform: [{ rotate: '-24deg' }],
  },
  orbSignalCluster: {
    position: 'absolute',
    right: -2,
    top: 92,
    gap: SPACING.sm,
    zIndex: 6,
  },
  orbSignalClusterCompact: {
    top: 92,
    right: 0,
    opacity: 0.84,
  },
  orbSignalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(50,50,58,0.10)',
    backgroundColor: 'rgba(255,252,245,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#504A44',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  orbSignalChipWarm: {
    marginLeft: 22,
  },
  orbSignalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8C7DB1',
  },
  orbSignalDotWarm: {
    backgroundColor: '#C98B55',
  },
  orbSignalText: {
    color: '#4D4A4F',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  previewCard: {
    position: 'absolute',
    bottom: 18,
    left: -2,
    width: 372,
    maxWidth: '92%',
    backgroundColor: 'rgba(255,252,245,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(54,50,46,0.12)',
    borderRadius: 26,
    padding: SPACING.lg,
    shadowColor: '#47413A',
    shadowOpacity: 0.16,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 22 },
    zIndex: 8,
  },
  previewCardCompact: {
    left: 0,
    right: 0,
    bottom: -4,
    width: '100%',
    maxWidth: 334,
    alignSelf: 'center',
    padding: SPACING.md,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  previewOverline: {
    color: '#8B8780',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(226,233,232,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7FA47B',
  },
  statusChipText: {
    color: '#4D5A50',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  previewQuestion: {
    color: '#202126',
    fontSize: 29,
    lineHeight: 34,
    marginTop: SPACING.md,
    fontWeight: '300',
  },
  previewQuestionCompact: {
    fontSize: 25,
    lineHeight: 30,
  },
  previewOptions: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  previewOption: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(39,38,37,0.10)',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(244,239,230,0.66)',
  },
  previewOptionCompact: {
    paddingVertical: 10,
  },
  previewOptionActive: {
    backgroundColor: '#24252A',
    borderColor: '#24252A',
  },
  previewOptionText: {
    color: '#5F5A53',
    fontSize: FONT_SIZE.sm,
  },
  previewOptionTextActive: {
    color: '#FBF8F1',
  },
  signalStrip: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(39,38,37,0.10)',
    paddingTop: SPACING.md,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B88B78',
    marginTop: 6,
  },
  signalText: {
    flex: 1,
    color: '#5F5A53',
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
  quietGap: {
    backgroundColor: '#FBF8F1',
    paddingVertical: 104,
    paddingHorizontal: SPACING.lg,
  },
  sectionInnerNarrow: {
    maxWidth: MAX_TEXT,
    width: '100%',
    alignSelf: 'center',
  },
  sectionInnerWide: {
    maxWidth: MAX_WIDE,
    width: '100%',
    alignSelf: 'center',
  },
  sectionLabel: {
    color: '#8B8780',
    fontSize: 11,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
  sectionLabelInverse: {
    color: 'rgba(251,248,241,0.56)',
  },
  editorialHeading: {
    color: '#272625',
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1,
    fontWeight: '300',
    marginBottom: SPACING.xl,
  },
  editorialBody: {
    color: '#5F5A53',
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '300',
    marginBottom: SPACING.lg,
  },
  editorialLead: {
    color: '#272625',
    fontSize: 21,
    lineHeight: 32,
    fontWeight: '500',
    marginTop: SPACING.md,
  },
  signalWords: {
    marginTop: SPACING['2xl'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  signalWordsCompact: {
    marginTop: SPACING.xl,
  },
  fadingWord: {
    color: '#B5AEA4',
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#F4EFE6',
  },
  clearWord: {
    color: '#272625',
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#E7E2D7',
  },
  whatItIs: {
    maxWidth: MAX_WIDE,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 110,
    flexDirection: 'row',
    gap: 72,
    alignItems: 'center',
  },
  stackSection: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: SPACING.xl,
  },
  statementColumn: {
    flex: 1,
  },
  sectionTitle: {
    color: '#272625',
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1,
    fontWeight: '300',
    maxWidth: 780,
    marginBottom: SPACING.xl,
  },
  bodyText: {
    color: '#5F5A53',
    fontSize: 18,
    lineHeight: 31,
    fontWeight: '300',
    marginBottom: SPACING.lg,
  },
  mirrorStatement: {
    flex: 0.82,
    backgroundColor: '#FBF8F1',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(39,38,37,0.10)',
    padding: SPACING.xl,
    minHeight: 420,
    justifyContent: 'center',
  },
  statementMark: {
    width: 84,
    height: 118,
    marginBottom: SPACING.xl,
  },
  statementLine: {
    color: '#272625',
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '300',
  },
  statementFinal: {
    color: '#8B8780',
    fontSize: 18,
    lineHeight: 28,
    marginTop: SPACING.lg,
  },
  howItWorks: {
    backgroundColor: '#F0E9DD',
    paddingVertical: 104,
    paddingHorizontal: SPACING.lg,
  },
  processGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  singleColumn: {
    flexDirection: 'column',
  },
  processCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FBF8F1',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(39,38,37,0.10)',
    padding: SPACING.lg,
  },
  processNumber: {
    color: '#B88B78',
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginBottom: SPACING.xl,
  },
  processTitle: {
    color: '#272625',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  processCopy: {
    color: '#6C655E',
    fontSize: FONT_SIZE.base,
    lineHeight: 23,
  },
  insideMirar: {
    backgroundColor: '#F4EFE6',
    paddingVertical: 112,
    paddingHorizontal: SPACING.lg,
  },
  previewGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  productPreviewCard: {
    flex: 1,
    minWidth: 270,
    backgroundColor: '#FBF8F1',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(39,38,37,0.10)',
    padding: SPACING.lg,
  },
  productPreviewTitle: {
    color: '#272625',
    fontSize: 22,
    fontWeight: '400',
    marginBottom: SPACING.sm,
  },
  productPreviewCopy: {
    color: '#6C655E',
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    minHeight: 64,
  },
  mockSurface: {
    marginTop: SPACING.lg,
    backgroundColor: '#F4EFE6',
    borderRadius: 18,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  mockMeta: {
    color: '#8B8780',
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  mockLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mockLineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8C7DB1',
  },
  mockLineText: {
    color: '#5F5A53',
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
  mockSignal: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    backgroundColor: '#272625',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mockSignalText: {
    color: '#FBF8F1',
    fontSize: 11,
    fontWeight: '600',
  },
  signalAreas: {
    backgroundColor: '#FBF8F1',
    paddingVertical: 104,
    paddingHorizontal: SPACING.lg,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  signalGridCompact: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: SPACING.lg,
  },
  signalAreaCard: {
    flexGrow: 1,
    flexBasis: 330,
    borderTopWidth: 1,
    borderTopColor: 'rgba(39,38,37,0.12)',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  signalAreaCardCompact: {
    flexBasis: 'auto',
    paddingBottom: SPACING.md,
  },
  areaDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: SPACING.md,
  },
  areaTitle: {
    color: '#272625',
    fontSize: 22,
    fontWeight: '400',
    marginBottom: SPACING.sm,
  },
  areaCopy: {
    color: '#6C655E',
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
    maxWidth: 300,
  },
  compounding: {
    backgroundColor: '#F4EFE6',
    paddingVertical: 112,
    paddingHorizontal: SPACING.lg,
  },
  compoundingBody: {
    color: '#5F5A53',
    fontSize: 19,
    lineHeight: 32,
    maxWidth: 760,
    fontWeight: '300',
  },
  timeline: {
    marginTop: SPACING['2xl'],
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  timelineCompact: {
    flexDirection: 'column',
  },
  timelineItem: {
    flex: 1,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(39,38,37,0.14)',
    paddingTop: SPACING.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C9C4D8',
  },
  timelineDotActive: {
    backgroundColor: '#272625',
  },
  timelineDay: {
    color: '#272625',
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
  },
  timelineLabel: {
    color: '#8B8780',
    fontSize: FONT_SIZE.sm,
  },
  privacy: {
    paddingVertical: 112,
    paddingHorizontal: SPACING.lg,
  },
  privacyTitle: {
    color: '#FBF8F1',
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1,
    fontWeight: '300',
    maxWidth: 760,
    marginBottom: SPACING.xl,
  },
  privacyBody: {
    color: 'rgba(251,248,241,0.78)',
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '300',
  },
  privacyLead: {
    color: '#FBF8F1',
    fontSize: 21,
    lineHeight: 30,
    marginTop: SPACING.lg,
    fontWeight: '500',
  },
  trustPills: {
    marginTop: SPACING['2xl'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  trustPill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(251,248,241,0.18)',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  trustPillText: {
    color: 'rgba(251,248,241,0.72)',
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.5,
  },
  finalCta: {
    backgroundColor: '#FBF8F1',
    paddingVertical: 112,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  finalLogo: {
    width: 190,
    height: 90,
    marginBottom: SPACING.xl,
  },
  finalTitle: {
    color: '#272625',
    fontSize: 50,
    lineHeight: 56,
    letterSpacing: -1.2,
    fontWeight: '300',
    textAlign: 'center',
    maxWidth: 780,
  },
  finalSub: {
    color: '#5F5A53',
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  footer: {
    backgroundColor: '#F4EFE6',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footerText: {
    color: '#8B8780',
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.8,
  },
});

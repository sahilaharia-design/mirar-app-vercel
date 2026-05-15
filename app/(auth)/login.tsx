import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth-store';
import { LanguagePicker } from '../../components/ui/LanguagePicker';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from '../../lib/constants';

const MARK = require('../../assets/brand/mirar-mark.png');
const WORDMARK = require('../../assets/brand/mirar-wordmark.png');
const FULL_LOGO = require('../../assets/brand/mirar-logo-full.png');
const TAGLINE = require('../../assets/brand/mirar-tagline.png');
const FOUNDER_PHOTO = require('../../assets/founder/sahil-profile.jpg');

const MAX_WIDTH = 1240;
const isWeb = Platform.OS === 'web';
const webPointer = isWeb ? ({ cursor: 'pointer' } as any) : null;

const MIRAR = {
  ivory: '#F7F1E8',
  paper: '#FFF9EF',
  warmSand: '#E7D8BF',
  ink: '#221F1C',
  graphite: '#2A2E35',
  muted: '#7D756A',
  lavender: '#B9A7FF',
  violet: '#7D63E6',
  blueMist: '#A8CFFF',
  peach: '#FFB58A',
  rose: '#F6A7B8',
  gold: '#E8C66B',
  sage: '#AFCDBA',
  darkChamber: '#17191F',
};

const QUESTION_OPTIONS = [
  'I feel clear, but stretched',
  'I’m moving, but not fully present',
  'Something feels quietly off',
];

const TRUST_PILLS = ['Private beta', 'Less than 2 minutes', 'No social feed', 'Mirror, not verdict'];

const OUTER_SIGNALS = ['Calendar', 'Messages', 'Steps', 'Sleep', 'Food', 'Work', 'Money', 'Mirror'];
const INNER_SIGNALS = ['Direction', 'Energy', 'Attention', 'Connection', 'Clarity'];

const SOCIAL_LINKS = {
  website: 'https://www.mirar.life',
  substack: 'https://substack.com/@mirarlife',
  instagram: 'https://www.instagram.com/mirar.life',
  linkedin: 'https://www.linkedin.com/company/mirarlife/',
  email: 'info@mirar.life',
};

const NAV_ITEMS = [
  ['Why Mirar', 'why'],
  ['How it works', 'how'],
  ['Inside Mirar', 'inside'],
  ['Privacy', 'privacy'],
  ['FAQ', 'faq'],
  ['Founder', 'founder'],
  ['Notes', 'notes'],
];

const PROCESS = [
  ['One question', 'A single prompt opens the mirror without asking you to explain your whole life.'],
  ['One answer', 'Choose what feels closest. No blank page. No performance.'],
  ['One signal', 'Mirar reflects what may be forming, without advice or diagnosis.'],
  ['Pattern over time', 'Repeated signals become easier to see before they become louder.'],
];

const SIGNAL_AREAS = [
  ['Direction', 'Where your life seems to be pulling you.', '#8C7DB1'],
  ['Energy', 'What is quietly draining or restoring you.', '#C98B55'],
  ['Attention', 'Where your mind keeps returning.', '#6F93B8'],
  ['Connection', 'What you are emotionally available for.', '#7FA47B'],
  ['Growth', 'What you are outgrowing or becoming.', '#B46F7F'],
  ['Movement', 'What action is asking to happen.', '#A58B4B'],
];

const PRODUCT_SURFACES = [
  ['Today’s Mirror', 'What feels closest today?', ['I feel clear, but stretched', 'Something feels quietly off']],
  ['Signals', 'Direction · Energy · Attention', ['MID', 'forming', '14 / 28']],
  ['Reflection Summary', 'Read it as a mirror, not a verdict', ['held', 'drifted', 'clearer']],
];

const PATTERN_DAYS = [
  ['Day 1', 'one dot'],
  ['Day 4', 'a faint line'],
  ['Day 9', 'a shape begins'],
  ['Day 21', 'a clearer mirror'],
];

const INFO_CARDS = [
  ['What Mirar is', 'Mirar is a daily internal check-in. It helps you notice small shifts in energy, attention, direction, and connection before they quietly shape your decisions.', '#8C7DB1'],
  ['Why it exists', 'Most misalignment does not arrive as a crisis. It arrives as small friction: decisions taking longer, energy feeling scattered, attention drifting, or clarity becoming harder to access.', '#C98B55'],
  ['How it’s designed', 'Mirar is intentionally lightweight and private. No scoring. No public progress. No performance. Just one small check-in designed to help you notice what is changing inside you.', '#7FA47B'],
];

const BETA_MILESTONES = [
  ['Day 1', 'First mirror', 'A simple check-in opens the signal.'],
  ['Day 7', 'First signal', 'Repeated answers begin to show a direction.'],
  ['Day 14', 'Pattern forming', 'Small shifts become easier to recognize.'],
  ['Day 28', 'Reflection summary', 'A personal mirror of what kept showing up.'],
];

const FAQ_ITEMS = [
  ['Why does Mirar exist?', 'Most people make decisions assuming their internal state is stable. But priorities, energy, focus, and needs change quietly over time. Mirar exists to help you notice those changes before they shape decisions unconsciously.'],
  ['What does “look within” mean here?', 'It means checking your current internal state before reacting or deciding. Not emotional over-analysis. Not storytelling. Just a repeatable way to notice what has shifted.'],
  ['What does “alignment” mean in Mirar?', 'Alignment is the relationship between your internal signals, your decisions, and your daily life. Misalignment often forms when life changes but your decisions still come from an older version of you.'],
  ['Why call this emotional and mental hygiene?', 'Because hygiene is maintenance. Like brushing your teeth, it is not about crisis. It is about regularly noticing what needs attention before it compounds.'],
  ['How does the beta work?', 'Mirar Beta is a private 28-day experience. You complete one short check-in per day. Each check-in is intentionally simple and designed to help you notice your internal state without performance pressure.'],
  ['Is there scoring, streaks, or comparison?', 'No. Mirar is not built around scores, rankings, streak pressure, or comparison. The focus is signal visibility, not performance.'],
  ['How is privacy handled?', 'Mirar is designed to keep attention internal. Your reflections are not public, not social, and not used to create a performance profile. The experience is intentionally private and lightweight.'],
  ['Will I receive a report at the end?', 'Yes. At the end of the experience, Mirar can generate a personal reflection summary that helps you see recurring signals and patterns over time. It is a mirror, not a verdict.'],
  ['Is Mirar therapy, journaling, or coaching?', 'No. Mirar does not diagnose, treat, guide emotional processing, or provide advice. It is a daily emotional and mental hygiene system for awareness and self-regulation.'],
  ['What if I stop engaging?', 'Nothing happens. There is no punishment, no pressure, and no completion requirement. Hygiene systems should be supportive, not punitive.'],
  ['Who is Mirar for?', 'Mirar is for people who are functioning on the outside but sense that something inside needs attention: a shift in energy, direction, clarity, connection, or focus.'],
  ['What makes Mirar different from journaling?', 'Journaling asks you to generate your own reflection. Mirar gives you one structured check-in and reflects patterns over time. There is no blank page.'],
];

const HYGIENE_HABITS = [
  ['Brush', 'before decay', 'Teeth', '#8C7DB1'],
  ['Eat', 'before depletion', 'Food', '#C98B55'],
  ['Move', 'before stiffness', 'Movement', '#6F93B8'],
  ['Calendar', 'before the day begins', 'Calendar', '#7FA47B'],
  ['Mirror', 'before stepping out', 'Mirror', '#B46F7F'],
];

const INNER_HABITS = [
  ['energy', 'what is draining or restoring you', '#C98B55'],
  ['attention', 'where your mind keeps returning', '#6F93B8'],
  ['direction', 'what still feels chosen', '#8C7DB1'],
  ['connection', 'what you are available for', '#7FA47B'],
  ['clarity', 'what feels true enough to see', '#A58B4B'],
];

const DAY_PHASES = [
  ['Morning', 'messages', 'scattered attention'],
  ['Afternoon', 'work', 'low energy'],
  ['Evening', 'errands', 'unclear direction'],
  ['Night', 'fatigue', 'quiet avoidance'],
];

const VALUE_RIBBONS = [
  'For the week that looks productive but feels strangely off.',
  'For the moment you say yes before checking if you mean it.',
  'For the decision that keeps taking longer than it should.',
  'For the dream you keep postponing because life keeps moving.',
  'For noticing drift before it becomes direction.',
  'For the quiet signal underneath the busy day.',
  'For the version of you that changed before your calendar did.',
  'For the day that passes before you ask what you needed.',
];

const CATCH_EARLIER = [
  ['Decisions that feel heavier than they should', 'Mirar helps you notice when the delay is not about the decision itself, but the state you are making it from.', '#8C7DB1', 'Heavy'],
  ['Productive weeks that still feel off', 'Mirar helps you see when output is high but energy, direction, or attention is quietly drifting.', '#C98B55', 'Grid'],
  ['Patterns you only understand too late', 'Mirar helps small signals become visible before they compound into burnout, resentment, avoidance, or confusion.', '#6F93B8', 'Pattern'],
  ['Dreams that keep getting postponed', 'Mirar helps you notice when the life you are maintaining is crowding out the life still asking for attention.', '#B46F7F', 'Dream'],
  ['External momentum', 'Mirar helps you pause before your calendar, inbox, family, work, or expectations decide the shape of your day for you.', '#7FA47B', 'Momentum'],
  ['The gap between functioning and feeling aligned', 'Mirar is for the part of you that can keep going while quietly knowing something needs to be seen.', '#A58B4B', 'Gap'],
];

const OPEN_MOMENTS = [
  ['Before the day begins', 'Set a signal before the world asks for your attention.'],
  ['After a decision feels heavy', 'Notice whether the weight is the choice or the state around it.'],
  ['When the week looks productive but scattered', 'Check the inner pattern underneath the output.'],
  ['When you keep postponing what matters', 'See what life is crowding out before it disappears again.'],
  ['When you feel off but cannot name why', 'Start with one honest signal instead of a whole explanation.'],
  ['Before saying yes', 'Pause before momentum speaks for you.'],
  ['At night', 'Let the day become visible before it becomes tomorrow.'],
];

const RETURN_CARDS = [
  ['A daily signal', 'A small reflection of what may be present today.', '#8C7DB1'],
  ['A pattern over time', 'A way to see what keeps repeating across your check-ins.', '#6F93B8'],
  ['A reflection summary', 'A mirror of what your recent answers have been showing — not a verdict on who you are.', '#C98B55'],
];

const ALIGNMENT_NOTES = [
  ['Internal alignment', 'Mirar documents the relationship between inner signals, choices, and the life those choices create.', 'alignment'],
  ['How misalignment forms', 'The publication focuses on noticing drift early, before it turns into burnout, avoidance, or reactive decisions.', 'misalignment'],
  ['Awareness and calibration', 'The writing is centered on awareness, calibration, and response rather than performance or self-optimization.', 'calibration'],
  ['Response before reaction', 'Alignment Notes explores how small signals can be seen while they are still small enough to respond to deliberately.', 'response'],
];

const SOCIAL_MIRRORS = [
  ['Drift', 'Short reflections on how small misalignments can become larger patterns if they go unseen.'],
  ['Attention', 'Notes on where the mind keeps returning and what that may be trying to show.'],
  ['Emotional hygiene', 'Simple language for making inner check-ins feel normal, private, and daily.'],
  ['Ordinary days', 'Reflections on how everyday routines can quietly reveal what we are carrying.'],
  ['Internal alignment', 'Prompts and observations about decisions, energy, direction, and response.'],
  ['Calibration', 'Small mirrors for noticing what has changed before reaction becomes the default.'],
];

function isCompact(width: number) {
  return width < 820;
}

function useLoopingValue(enabled = true) {
  const value = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;
    value.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [enabled, value]);

  return value;
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.logoWrap}>
      <Image
        source={WORDMARK}
        style={[styles.wordmark, compact && styles.wordmarkCompact]}
        resizeMode="contain"
        accessibilityLabel="Mirar"
      />
    </View>
  );
}

function SignalDot({ color = '#8C7DB1', active = false }: { color?: string; active?: boolean }) {
  const pulse = useLoopingValue(active);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.72 + pulse.value * 0.28 : 1,
    transform: [{ scale: active ? 1 + pulse.value * 0.24 : 1 }],
  }));

  return <Animated.View style={[styles.signalDot, { backgroundColor: color }, animatedStyle]} />;
}

function SignalChip({
  label,
  color = '#8C7DB1',
  active = false,
  style,
}: {
  label: string;
  color?: string;
  active?: boolean;
  style?: any;
}) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={[styles.signalChip, style]}>
      <SignalDot color={color} active={active} />
      <Text style={styles.signalChipText}>{label}</Text>
    </Animated.View>
  );
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.trustPill}>
      <Text style={styles.trustPillText}>{children}</Text>
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
        <View style={styles.sentPanelGlow} />
        <View style={styles.sentDot} />
        <Text style={styles.sentTitle}>{t('auth.check_email')}</Text>
        <Text style={styles.sentBody}>{t('auth.link_sent', { email })}</Text>
        <Text style={styles.sentNote}>{t('auth.link_validity')}</Text>
        <TouchableOpacity onPress={() => setSent(false)} activeOpacity={0.72} style={webPointer}>
          <Text style={styles.resendText}>{t('auth.try_again')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.formWrap, compact && styles.formWrapCompact]}>
      <View style={[styles.formRow, compact && styles.formRowCompact]}>
        <TextInput
          style={[styles.emailInput, compact && styles.emailInputCompact, error && styles.inputError]}
          placeholder={t('auth.email_placeholder')}
          placeholderTextColor="#8C857B"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={onSubmit}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.primaryButton, compact && styles.primaryButtonCompact, isLoading && styles.buttonDisabled, webPointer]}
          onPress={onSubmit}
          disabled={isLoading}
          activeOpacity={0.84}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF9EF" size="small" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Start your daily mirror</Text>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Header({
  onCtaPress,
  onNavPress,
  compact,
}: {
  onCtaPress: () => void;
  onNavPress: (key: string) => void;
  compact: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleNavPress = (key: string) => {
    setMenuOpen(false);
    onNavPress(key);
  };

  return (
    <Animated.View entering={FadeIn.duration(500)} style={[styles.headerShell, compact && styles.headerShellCompact]}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <BrandLogo compact={compact} />
        {!compact && (
          <View style={styles.navLinks}>
            {NAV_ITEMS.map(([label, key]) => (
              <Pressable key={key} onPress={() => handleNavPress(key)} accessibilityRole="link" style={[styles.navLink, webPointer]}>
                <Text style={styles.navLinkText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.headerRight}>
          {!compact && <LanguagePicker variant="inline" />}
          <TouchableOpacity onPress={onCtaPress} activeOpacity={0.82} style={[styles.headerCta, compact && styles.headerCtaCompact, webPointer]}>
            <Text style={[styles.headerCtaText, compact && styles.headerCtaTextCompact]}>{compact ? 'Start' : 'Start your mirror'}</Text>
          </TouchableOpacity>
          {compact && (
            <Pressable
              onPress={() => setMenuOpen((open) => !open)}
              accessibilityRole="button"
              accessibilityLabel={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              style={[styles.menuButton, menuOpen && styles.menuButtonOpen, webPointer]}
            >
              <View style={[styles.menuLine, menuOpen && styles.menuLineTop]} />
              <View style={[styles.menuLine, menuOpen && styles.menuLineMiddle]} />
              <View style={[styles.menuLine, menuOpen && styles.menuLineBottom]} />
            </Pressable>
          )}
        </View>
      </View>
      {compact && menuOpen && (
        <Animated.View entering={FadeInDown.duration(180)} style={styles.mobileMenuPanel}>
          {NAV_ITEMS.map(([label, key]) => (
            <Pressable key={key} onPress={() => handleNavPress(key)} accessibilityRole="link" style={[styles.mobileNavLink, webPointer]}>
              <Text style={styles.mobileNavLinkText}>{label}</Text>
            </Pressable>
          ))}
          <View style={styles.mobileMenuDivider} />
          <LanguagePicker variant="inline" />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function LivingMirror({ compact = false }: { compact?: boolean }) {
  const breath = useLoopingValue(true);

  const orbStyle = useAnimatedStyle(() => ({
    opacity: 0.92 + breath.value * 0.08,
    transform: [
      { scale: 0.985 + breath.value * 0.035 },
      { rotate: `${-4 + breath.value * 2}deg` },
    ],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    opacity: 0.78 + breath.value * 0.2,
    transform: [
      { translateX: -8 + breath.value * 16 },
      { translateY: 6 - breath.value * 10 },
      { scale: 0.96 + breath.value * 0.08 },
      { rotate: `${8 + breath.value * 8}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + breath.value * 0.24,
    transform: [
      { translateX: -4 + breath.value * 8 },
      { rotate: `${-3 + breath.value * 6}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.58 + breath.value * 0.25,
    transform: [{ scale: 0.96 + breath.value * 0.08 }],
  }));

  return (
    <View style={[styles.livingMirror, compact && styles.livingMirrorCompact]}>
      <Animated.View style={[styles.mirrorGlow, glowStyle]} />
      <Animated.View style={[styles.mirrorAuraBlue, glowStyle]} />
      <Animated.View style={[styles.mirrorAuraPeach, glowStyle]} />
      <Animated.View style={[styles.mirrorOrbShell, compact && styles.mirrorOrbShellCompact, orbStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.94)', 'rgba(219,229,231,0.68)', 'rgba(244,214,170,0.56)', 'rgba(233,187,159,0.42)']}
          locations={[0, 0.42, 0.76, 1]}
          start={{ x: 0.16, y: 0.04 }}
          end={{ x: 0.88, y: 1 }}
          style={styles.mirrorGlass}
        >
          <Animated.View style={[styles.mirrorCoreWrap, coreStyle]}>
            <LinearGradient
              colors={['rgba(179,174,226,0.92)', 'rgba(188,219,222,0.76)', 'rgba(251,185,136,0.9)']}
              locations={[0, 0.53, 1]}
              start={{ x: 0.32, y: 0.02 }}
              end={{ x: 0.76, y: 1 }}
              style={styles.mirrorCore}
            />
          </Animated.View>
          <Image source={MARK} style={styles.mirrorMark} resizeMode="contain" />
          <View style={styles.mirrorHighlight} />
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.mirrorRings, ringStyle]}>
        <Svg viewBox="0 0 560 620" width="100%" height="100%">
          <Circle cx="282" cy="302" r="210" stroke="rgba(78,78,88,0.16)" strokeWidth="1.2" fill="none" />
          <Circle cx="282" cy="302" r="168" stroke="rgba(255,255,255,0.34)" strokeWidth="1" fill="none" />
          <Path d="M98 438 C190 362 335 348 468 256" stroke="rgba(70,70,82,0.22)" strokeWidth="1.4" fill="none" />
          <Path d="M106 172 C190 76 366 72 452 190" stroke="rgba(255,255,255,0.54)" strokeWidth="1.5" fill="none" />
          <Path d="M154 498 C246 474 368 430 444 340" stroke="rgba(194,139,85,0.24)" strokeWidth="1.2" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function QuestionPreviewCard({ compact = false }: { compact?: boolean }) {
  const float = useLoopingValue(true);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -4 + float.value * 8 },
      { rotate: `${-0.6 + float.value * 1.2}deg` },
    ],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(700).delay(260)} style={[styles.questionCard, compact && styles.questionCardCompact, cardStyle]}>
      <View style={styles.questionCardHeader}>
        <Text style={styles.questionLabel}>TODAY’S MIRROR</Text>
        <SignalChip label="Still forming" color="#7FA47B" active style={styles.statusChip} />
      </View>
      <Text style={[styles.questionTitle, compact && styles.questionTitleCompact]}>What feels closest today?</Text>
      <View style={styles.answerStack}>
        {QUESTION_OPTIONS.map((option, index) => (
          <View key={option} style={[styles.answerPill, index === 1 && styles.answerPillActive]}>
            <View style={[styles.answerAccent, index === 0 && styles.answerAccentLavender, index === 1 && styles.answerAccentPeach, index === 2 && styles.answerAccentBlue]} />
            <Text style={[styles.answerText, index === 1 && styles.answerTextActive]}>{option}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chooseLine}>
        <View style={styles.chooseLineRule} />
        <Text style={styles.chooseLineText}>Choose what feels closest</Text>
      </View>
    </Animated.View>
  );
}

function HeroProductScene({ compact = false }: { compact?: boolean }) {
  const signalFloat = useLoopingValue(true);
  const chipA = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 + signalFloat.value * 10 }],
  }));
  const chipB = useAnimatedStyle(() => ({
    transform: [{ translateX: 4 - signalFloat.value * 8 }, { translateY: 3 - signalFloat.value * 6 }],
  }));
  const chipC = useAnimatedStyle(() => ({
    transform: [{ translateY: 5 - signalFloat.value * 10 }],
  }));

  return (
    <View style={[styles.productScene, compact && styles.productSceneCompact]}>
      <View style={styles.sceneLightColumn} />
      <LivingMirror compact={compact} />
      <Animated.View style={[styles.sceneChipDirection, compact && styles.sceneChipDirectionCompact, chipA]}>
        <SignalChip label="Direction" color="#8C7DB1" active />
      </Animated.View>
      <Animated.View style={[styles.sceneChipEnergy, compact && styles.sceneChipEnergyCompact, chipB]}>
        <SignalChip label="Energy" color="#C98B55" active />
      </Animated.View>
      <Animated.View style={[styles.sceneChipAttention, compact && styles.sceneChipAttentionCompact, chipC]}>
        <SignalChip label="Attention" color="#6F93B8" active />
      </Animated.View>
      <QuestionPreviewCard compact={compact} />
    </View>
  );
}

function HeroCopy({
  compact,
  form,
}: {
  compact: boolean;
  form: React.ReactNode;
}) {
  return (
    <View style={[styles.heroCopy, compact && styles.heroCopyCompact]}>
      <Animated.Image
        entering={FadeInDown.duration(600).delay(80)}
        source={TAGLINE}
        style={[styles.heroTagline, compact && styles.heroTaglineCompact]}
        resizeMode="contain"
      />
      <Animated.Text entering={FadeInDown.duration(650).delay(140)} style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
        Notice what’s off before it becomes your life.
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(650).delay(220)} style={[styles.heroSub, compact && styles.heroSubCompact]}>
        Mirar is a 2-minute daily check-in for emotional and mental hygiene — one question a day to help you see what your inner life keeps trying to tell you.
      </Animated.Text>
      {!compact && (
        <>
          <Animated.View entering={FadeInDown.duration(650).delay(300)}>{form}</Animated.View>
          <Text style={styles.heroMicro}>No journaling. No tracking. No advice. Just one honest signal a day.</Text>
          <View style={styles.heroTrustRow}>
            {TRUST_PILLS.map((pill) => (
              <TrustPill key={pill}>{pill}</TrustPill>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function MirrorPortalSection({ compact }: { compact: boolean }) {
  const breath = useLoopingValue(true);
  const portalStyle = useAnimatedStyle(() => ({
    opacity: 0.78 + breath.value * 0.18,
    transform: [
      { scale: 0.985 + breath.value * 0.035 },
      { rotate: `${-1.2 + breath.value * 2.4}deg` },
    ],
  }));
  const lightStyle = useAnimatedStyle(() => ({
    opacity: 0.34 + breath.value * 0.28,
    transform: [{ translateX: -18 + breath.value * 36 }],
  }));

  return (
    <View style={[styles.portalSection, compact && styles.mobileSectionTight]}>
      <View style={[styles.portalStage, compact && styles.portalStageCompact]}>
        <Animated.View style={[styles.portalOuterGlow, portalStyle]} />
        <Animated.View style={[styles.portalLightSweep, lightStyle]} />
        <View style={styles.portalRingOne} />
        <View style={styles.portalRingTwo} />
        <Image source={MARK} style={styles.portalMark} resizeMode="contain" />
        <View style={styles.portalCopy}>
          <Text style={styles.portalKicker}>THE LIVING MIRROR</Text>
          <Text style={[styles.portalTitle, compact && styles.portalTitleCompact]}>A quiet place where your inner signal can become visible.</Text>
          <Text style={styles.portalBody}>Not advice. Not a score. A small daily reflection that helps clarity form before life gets louder.</Text>
        </View>
      </View>
    </View>
  );
}

function MiniGlyph({ type = 'dot', color = '#7F7A73' }: { type?: string; color?: string }) {
  return (
    <Svg viewBox="0 0 28 28" width={18} height={18}>
      {type === 'Calendar' ? (
        <Path d="M7 8.5H21M8.5 5.5V10M19.5 5.5V10M7 7H21V22H7Z" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      ) : type === 'Steps' ? (
        <Path d="M6 20C9 14 12 18 14 12C15.5 7 20 8 22 5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : type === 'Sleep' ? (
        <Path d="M18.5 21C12 21 7 16.5 7 10C7 8.2 7.4 6.6 8.2 5.2C9.4 10.3 13.2 14.1 18.4 15.1C20.1 15.4 21.6 15.3 22.8 15C21.6 18.6 20.1 21 18.5 21Z" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : type === 'Messages' ? (
        <Path d="M6.5 8H21.5V17.5H13L8.5 21V17.5H6.5Z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      ) : type === 'Work' ? (
        <Path d="M7 10H21V21H7ZM11 10V7H17V10" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      ) : type === 'Money' ? (
        <Path d="M14 6V22M18 9.5C15.8 8 10.5 8.1 10.5 11.5C10.5 15 18.5 13.3 18.5 17.1C18.5 21 12.5 20.6 9.8 18.5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      ) : type === 'Food' ? (
        <Path d="M7 17C8.5 12 12.5 10 18 11C18 16 14.5 20 9 20M15 9C15.5 7.4 17 6.3 19 6" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : type === 'Mirror' ? (
        <Path d="M14 5C18.4 5 21 8.7 21 13.5C21 18.3 18.4 23 14 23C9.6 23 7 18.3 7 13.5C7 8.7 9.6 5 14 5ZM10 24H18" stroke={color} strokeWidth="1.35" fill="none" strokeLinecap="round" />
      ) : type === 'Teeth' ? (
        <Path d="M9 7C11 5.8 12.6 7 14 7C15.4 7 17 5.8 19 7C21 8.3 19.8 14.5 18.4 18.8C17.5 21.5 15.8 22.4 15.4 19.2C15.1 17.2 12.9 17.2 12.6 19.2C12.2 22.4 10.5 21.5 9.6 18.8C8.2 14.5 7 8.3 9 7Z" stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : type === 'Movement' ? (
        <Path d="M6 18C10 10 15 20 22 9M18 9H22V13" stroke={color} strokeWidth="1.45" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : type === 'Direction' ? (
        <Path d="M14 5L20 22L14 19L8 22Z" stroke={color} strokeWidth="1.35" fill="none" strokeLinejoin="round" />
      ) : type === 'Energy' ? (
        <Path d="M15 4L8 15H14L13 24L21 11H15Z" stroke={color} strokeWidth="1.35" fill="none" strokeLinejoin="round" />
      ) : type === 'Attention' ? (
        <>
          <Circle cx="14" cy="14" r="8" stroke={color} strokeWidth="1.25" fill="none" />
          <Circle cx="14" cy="14" r="2.8" fill={color} opacity="0.78" />
        </>
      ) : type === 'Connection' ? (
        <Path d="M9 14C9 11.8 10.8 10 13 10H15M13 18H15C17.2 18 19 16.2 19 14M10 18C7.8 18 6 16.2 6 14C6 11.8 7.8 10 10 10M18 18C20.2 18 22 16.2 22 14C22 11.8 20.2 10 18 10" stroke={color} strokeWidth="1.35" fill="none" strokeLinecap="round" />
      ) : type === 'Clarity' ? (
        <Path d="M14 5V8M14 20V23M5 14H8M20 14H23M8 8L10 10M18 18L20 20M20 8L18 10M10 18L8 20" stroke={color} strokeWidth="1.35" fill="none" strokeLinecap="round" />
      ) : type === 'Heavy' ? (
        <Path d="M8 20H20M10 20L14 8L18 20M7 12H21M7 12L5 17H10L7 12ZM21 12L18 17H23L21 12Z" stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : type === 'Grid' ? (
        <Path d="M7 7H21V21H7ZM7 12H21M7 17H21M12 7V21M17 7V21" stroke={color} strokeWidth="1.15" fill="none" strokeLinecap="round" />
      ) : type === 'Pattern' ? (
        <Path d="M6 19C10 10 15 21 22 8M7 19H7.1M12 13H12.1M17 16H17.1M22 8H22.1" stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      ) : type === 'Dream' ? (
        <Path d="M14 5L16.4 11L23 11.2L17.8 15.2L19.7 22L14 18.1L8.3 22L10.2 15.2L5 11.2L11.6 11Z" stroke={color} strokeWidth="1.25" fill="none" strokeLinejoin="round" />
      ) : type === 'Momentum' ? (
        <Path d="M5 15H19M14 9L20 15L14 21M6 9C10 6 15 6 20 9" stroke={color} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : type === 'Gap' ? (
        <Path d="M6 11C11 8 16 8 22 11M6 18C11 15 16 15 22 18" stroke={color} strokeWidth="1.35" fill="none" strokeLinecap="round" />
      ) : type === 'Private' ? (
        <Path d="M8 13H20V22H8ZM10.5 13V10C10.5 7.8 12.1 6 14 6C15.9 6 17.5 7.8 17.5 10V13" stroke={color} strokeWidth="1.35" fill="none" strokeLinejoin="round" />
      ) : (
        <Circle cx="14" cy="14" r="5" fill={color} opacity="0.82" />
      )}
    </Svg>
  );
}

function TrackingChip({ label, index }: { label: string; index: number }) {
  const drift = useLoopingValue(true);
  const chipStyle = useAnimatedStyle(() => ({
    opacity: 0.76 + drift.value * 0.18,
    transform: [
      { translateY: (index % 2 === 0 ? -2 : 2) + drift.value * (index % 2 === 0 ? 5 : -5) },
      { translateX: -2 + drift.value * 4 },
    ],
  }));

  return (
    <Animated.View style={[styles.trackingChip, chipStyle]}>
      <MiniGlyph type={label} />
      <Text style={styles.trackingChipText}>{label}</Text>
    </Animated.View>
  );
}

function BehaviorGapSection({ compact }: { compact: boolean }) {
  const flow = useLoopingValue(true);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + flow.value * 0.5,
    transform: [
      { translateX: compact ? 0 : -90 + flow.value * 180 },
      { translateY: compact ? -58 + flow.value * 116 : -12 + flow.value * 24 },
      { scale: 0.88 + flow.value * 0.22 },
    ],
  }));

  return (
    <View style={[styles.behaviorSectionV2, compact && styles.mobileSection]}> 
      <View style={styles.gridWash} />
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={[styles.sectionCopy, compact && styles.sectionCopyCompact]}>
          <SectionLabel>THE QUIET GAP</SectionLabel>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>We check everything except ourselves.</Text>
          <Text style={styles.sectionBody}>
            We check calendars, steps, messages, sleep, money, and mirrors. But the state making our decisions often goes unchecked.
          </Text>
          <Text style={styles.sectionBody}>Mirar gives that state a daily place to show up.</Text>
        </View>
        <View style={[styles.trackingField, compact && styles.trackingFieldCompact]}>
          <View style={styles.trackingOrb} />
          <LinearGradient
            colors={['rgba(210,213,226,0.0)', 'rgba(244,184,139,0.22)', 'rgba(184,190,230,0.26)', 'rgba(210,213,226,0.0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.trackingBeam}
          />
          <View style={styles.trackingFieldHeader}>
            <Text style={styles.compareLabel}>External checks</Text>
            <Text style={styles.compareLabelActive}>Inner signals</Text>
          </View>
          <View style={[styles.trackingRows, compact && styles.trackingRowsCompact]}>
            <View style={[styles.trackingColumn, compact && styles.trackingColumnCompact]}>
              {OUTER_SIGNALS.map((signal, index) => (
                <TrackingChip key={signal} label={signal} index={index} />
              ))}
            </View>
            <View style={[styles.flowBridge, compact && styles.flowBridgeCompact]}>
              <Svg viewBox="0 0 220 180" width="100%" height="100%">
                <Path d="M8 32 C82 18 112 74 212 52" stroke="rgba(141,125,177,0.24)" strokeWidth="1.2" fill="none" />
                <Path d="M10 94 C82 110 134 82 212 118" stroke="rgba(201,139,85,0.22)" strokeWidth="1.2" fill="none" />
                <Path d="M18 150 C82 118 132 156 206 142" stroke="rgba(111,147,184,0.2)" strokeWidth="1.2" fill="none" />
              </Svg>
              <Animated.View style={[styles.flowPulse, pulseStyle]} />
            </View>
            <View style={[styles.innerSignalStack, compact && styles.innerSignalStackCompact]}>
              {INNER_SIGNALS.map((signal, index) => (
                <SignalChip key={signal} label={signal} color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active style={styles.innerSignalGlow} />
              ))}
            </View>
          </View>
          <Text style={[styles.trackingFootnote, compact && styles.trackingFootnoteCompact]}>External tools record behavior. Mirar notices the quieter pattern underneath.</Text>
        </View>
      </View>
    </View>
  );
}

function SectionLabel({ children, inverse = false }: { children: React.ReactNode; inverse?: boolean }) {
  return <Text style={[styles.sectionLabel, inverse && styles.sectionLabelInverse]}>{children}</Text>;
}

function InteractiveSurface({
  children,
  style,
  hoverStyle,
  pressedStyle,
  onPress,
}: {
  children: React.ReactNode;
  style?: any;
  hoverStyle?: any;
  pressedStyle?: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={(state: any) => [
        style,
        isWeb && state.hovered && hoverStyle,
        state.pressed && pressedStyle,
        isWeb && webPointer,
      ]}
    >
      {children}
    </Pressable>
  );
}

function InfoSystemSection({ compact }: { compact: boolean }) {
  const glyphs = ['Mirror', 'Gap', 'Private'];
  return (
    <View style={[styles.infoSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <SectionLabel>WHAT MIRAR IS</SectionLabel>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>A small system for noticing what usually goes unseen.</Text>
        <View style={[styles.infoCardRow, compact && styles.infoCardRowCompact]}>
          {INFO_CARDS.map(([title, copy, color], index) => (
            <Animated.View key={title} entering={FadeInUp.duration(560).delay(index * 80)} style={styles.infoCardWrap}>
              <InteractiveSurface style={[styles.infoCard, compact && styles.infoCardCompact]} hoverStyle={styles.surfaceHover} pressedStyle={styles.surfacePressed}>
                <View style={[styles.infoGlyph, { borderColor: color as string }]}>
                  <MiniGlyph type={glyphs[index]} color={color as string} />
                  <View style={[styles.infoGlyphArc, { backgroundColor: color as string }]} />
                </View>
                <Text style={styles.infoCardTitle}>{title}</Text>
                <Text style={styles.infoCardCopy}>{copy}</Text>
              </InteractiveSurface>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

function MisalignmentSection({ compact }: { compact: boolean }) {
  const pulse = useLoopingValue(true);
  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.52 + pulse.value * 0.38,
    transform: [
      { translateX: compact ? 0 : -120 + pulse.value * 240 },
      { translateY: compact ? -28 + pulse.value * 56 : 18 - pulse.value * 36 },
      { scale: 0.88 + pulse.value * 0.24 },
    ],
  }));

  return (
    <View style={[styles.misalignmentSection, compact && styles.mobileSection]}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={[styles.sectionCopy, compact && styles.sectionCopyCompact]}>
          <SectionLabel>EARLIER VISIBILITY</SectionLabel>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Earlier visibility into internal misalignment.</Text>
          <Text style={styles.sectionBody}>So you can respond with clarity instead of reaction.</Text>
          <Text style={styles.sectionBody}>
            Misalignment rarely arrives all at once. It builds quietly as context shifts, responsibilities grow, priorities evolve, energy fluctuates, and needs change.
          </Text>
          <Text style={styles.sectionBody}>
            But many decisions continue to be made as if nothing has shifted. Mirar helps surface those signals earlier — before reaction becomes the default response.
          </Text>
        </View>
        <View style={[styles.driftMap, compact && styles.driftMapCompact]}>
          <View style={styles.driftOrb} />
          <Svg viewBox="0 0 560 420" width="100%" height="100%">
            <Path d="M46 112 C174 52 266 138 380 84 C444 54 492 68 524 92" stroke="rgba(140,125,177,0.28)" strokeWidth="1.4" fill="none" />
            <Path d="M60 234 C178 186 272 260 384 210 C462 176 502 210 530 252" stroke="rgba(201,139,85,0.26)" strokeWidth="1.4" fill="none" />
            <Path d="M74 334 C174 278 298 348 420 306 C474 288 512 304 538 324" stroke="rgba(111,147,184,0.22)" strokeWidth="1.4" fill="none" />
          </Svg>
          <Animated.View style={[styles.driftPulse, dotStyle]} />
          {['subtle shift', 'internal load', 'decision drift'].map((label, index) => (
            <View key={label} style={[styles.driftLabel, index === 1 && styles.driftLabelMid, index === 2 && styles.driftLabelEnd]}>
              <SignalDot color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active={index === 1} />
              <Text style={styles.driftLabelText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function HygieneSection({ compact }: { compact: boolean }) {
  const external = [
    ['Body', 'Movement'],
    ['Nutrition', 'Food'],
    ['Movement', 'Steps'],
    ['Calendar', 'Calendar'],
    ['Physical mirror', 'Mirror'],
  ];
  const internal = [
    ['Energy', 'Energy'],
    ['Attention', 'Attention'],
    ['Direction', 'Direction'],
    ['Connection', 'Connection'],
    ['Clarity', 'Clarity'],
  ];

  return (
    <View style={[styles.hygieneSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <View style={[styles.hygieneHeader, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>WHY HYGIENE</SectionLabel>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Why Mirar is built as hygiene.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>Hygiene is maintenance, not fixing. Mirar applies that idea internally before drift compounds.</Text>
        </View>
        <View style={[styles.hygieneSystem, compact && styles.hygieneSystemCompact]}>
          <Text style={[styles.hygieneColumnLabel, styles.hygieneColumnLabelLeft]}>External maintenance</Text>
          <Text style={[styles.hygieneColumnLabel, styles.hygieneColumnLabelRight]}>Internal maintenance</Text>
          <View style={[styles.hygieneOrb, compact && styles.hygieneOrbCompact]}>
            <Image source={MARK} style={styles.hygieneMark} resizeMode="contain" />
            <Text style={styles.hygieneOrbLabel}>Mirar</Text>
          </View>
          <View style={styles.hygieneColumn}>
            {external.map(([item, glyph]) => (
              <View key={item} style={styles.maintenanceChip}>
                <MiniGlyph type={glyph} />
                <Text style={styles.maintenanceChipText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={styles.hygieneBridge}>
            <Svg viewBox="0 0 280 170" width="100%" height="100%">
              <Path d="M18 34 C88 18 166 44 256 26" stroke="rgba(140,125,177,0.25)" strokeWidth="1.3" fill="none" />
              <Path d="M18 86 C88 76 172 104 256 82" stroke="rgba(201,139,85,0.25)" strokeWidth="1.3" fill="none" />
              <Path d="M18 138 C88 128 174 150 256 130" stroke="rgba(127,164,123,0.23)" strokeWidth="1.3" fill="none" />
            </Svg>
          </View>
          <View style={styles.hygieneColumn}>
            {internal.map(([item, glyph], index) => (
              <View key={item} style={styles.hygieneSignalRow}>
                <MiniGlyph type={glyph} color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} />
                <SignalChip label={item} color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active style={styles.hygieneSignal} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function MirrorHabitSection({ compact }: { compact: boolean }) {
  const pulse = useLoopingValue(true);
  const orbStyle = useAnimatedStyle(() => ({
    opacity: 0.42 + pulse.value * 0.26,
    transform: [{ scale: 0.96 + pulse.value * 0.08 }],
  }));

  return (
    <View style={[styles.mirrorHabitSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <View style={[styles.valueIntro, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>DAILY HYGIENE</SectionLabel>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>The mirror most people forget to use.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>
            You maintain the body, the calendar, and the day. Mirar helps you maintain the state making your decisions.
          </Text>
        </View>
        <View style={[styles.habitTransform, compact && styles.habitTransformCompact]}>
          <Animated.View style={[styles.habitMirrorOrb, orbStyle]} />
          <View style={[styles.habitColumn, compact && styles.habitColumnCompact]}>
            <Text style={styles.habitColumnLabel}>Everyday maintenance</Text>
            {HYGIENE_HABITS.map(([habit, detail, glyph, color], index) => (
              <InteractiveSurface key={habit} style={styles.habitChip} hoverStyle={styles.habitChipHover} pressedStyle={styles.surfacePressed}>
                <MiniGlyph type={glyph as string} color={color as string} />
                <View>
                  <Text style={styles.habitChipTitle}>{habit}</Text>
                  <Text style={styles.habitChipDetail}>{detail}</Text>
                </View>
              </InteractiveSurface>
            ))}
          </View>
          <View style={[styles.habitPath, compact && styles.habitPathCompact]}>
            <Svg viewBox="0 0 300 260" width="100%" height="100%">
              <Path d="M20 42 C96 24 172 70 280 38" stroke="rgba(140,125,177,0.24)" strokeWidth="1.4" fill="none" />
              <Path d="M20 130 C98 118 174 158 280 128" stroke="rgba(201,139,85,0.24)" strokeWidth="1.4" fill="none" />
              <Path d="M20 216 C112 182 182 226 280 198" stroke="rgba(127,164,123,0.22)" strokeWidth="1.4" fill="none" />
            </Svg>
          </View>
          <View style={[styles.habitColumn, compact && styles.habitColumnCompact]}>
            <Text style={styles.habitColumnLabel}>Inner maintenance</Text>
            {INNER_HABITS.map(([signal, detail, color]) => (
              <InteractiveSurface key={signal} style={styles.innerHabitChip} hoverStyle={styles.habitChipHover} pressedStyle={styles.surfacePressed}>
                <SignalDot color={color as string} active />
                <View>
                  <Text style={styles.habitChipTitle}>{signal}</Text>
                  <Text style={styles.habitChipDetail}>{detail}</Text>
                </View>
              </InteractiveSurface>
            ))}
          </View>
        </View>
        <Text style={[styles.habitClose, compact && styles.habitCloseCompact]}>Mirar is a daily mirror for the part of you carrying pressure, saying yes, postponing dreams, absorbing expectations, and choosing direction.</Text>
      </View>
    </View>
  );
}

function DayDriftSection({ compact }: { compact: boolean }) {
  const drift = useLoopingValue(true);
  const driftStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + drift.value * 0.3,
    transform: compact ? [{ translateX: -8 + drift.value * 16 }] : [{ translateY: -8 + drift.value * 16 }],
  }));

  return (
    <View style={[styles.dayDriftSection, compact && styles.mobileSection]}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={[styles.sectionCopy, compact && styles.sectionCopyCompact]}>
          <SectionLabel>ORDINARY DAYS</SectionLabel>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Most drift hides inside ordinary days.</Text>
          <Text style={styles.sectionBody}>Drift rarely announces itself. It hides inside ordinary days: meetings, messages, errands, replies, fatigue, and one more thing to do.</Text>
          <Text style={styles.sectionBody}>Then weeks pass. Then months pass. And life begins reflecting decisions you never fully checked against yourself.</Text>
        </View>
        <View style={[styles.dayFlowPanel, compact && styles.dayFlowPanelCompact]}>
          <Animated.View style={[styles.dayDriftLine, driftStyle]} />
          {DAY_PHASES.map(([phase, external, inner], index) => (
            <View key={phase} style={styles.dayPhase}>
              <Text style={styles.dayPhaseTime}>{phase}</Text>
              <View style={styles.dayExternalChip}>
                <MiniGlyph type={external === 'messages' ? 'Messages' : external === 'meetings' ? 'Work' : external === 'family' ? 'Connection' : 'Calendar'} />
                <Text style={styles.dayExternalText}>{external}</Text>
              </View>
              <View style={styles.dayInnerRow}>
                <SignalDot color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active={index === 2} />
                <Text style={styles.dayInnerText}>{inner}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ValueRibbon() {
  const drift = useLoopingValue(true);
  const ribbonA = useAnimatedStyle(() => ({
    transform: [{ translateX: -520 * drift.value }],
  }));
  const ribbonB = useAnimatedStyle(() => ({
    transform: [{ translateX: -260 + 520 * drift.value }],
  }));

  const row = [...VALUE_RIBBONS, ...VALUE_RIBBONS];
  return (
    <View style={styles.ribbonSection}>
      <Animated.View style={[styles.ribbonTrack, ribbonA]}>
        {row.map((line, index) => (
          <View key={`${line}-${index}`} style={styles.ribbonItem}>
            <SignalDot color={SIGNAL_AREAS[index % SIGNAL_AREAS.length]?.[2] ?? '#8C7DB1'} active={index % 3 === 0} />
            <Text style={styles.ribbonText}>{line}</Text>
          </View>
        ))}
      </Animated.View>
      <Animated.View style={[styles.ribbonTrack, styles.ribbonTrackSecond, ribbonB]}>
        {row.slice().reverse().map((line, index) => (
          <View key={`${line}-reverse-${index}`} style={styles.ribbonItemAlt}>
            <SignalDot color={SIGNAL_AREAS[(index + 2) % SIGNAL_AREAS.length]?.[2] ?? '#8C7DB1'} active={index % 4 === 0} />
            <Text style={styles.ribbonTextMuted}>{line}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

function CatchEarlierSection({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.catchSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <SectionLabel>VALUE</SectionLabel>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>What Mirar helps you catch earlier.</Text>
        <View style={[styles.catchGrid, compact && styles.catchGridCompact]}>
          {CATCH_EARLIER.map(([title, copy, color, glyph], index) => (
            <InteractiveSurface key={title} style={[styles.catchCard, compact && styles.valueCardCompact]} hoverStyle={styles.surfaceHover} pressedStyle={styles.surfacePressed}>
              <View style={[styles.catchGlyph, { borderColor: color as string, backgroundColor: `${color}18` }]}>
                <MiniGlyph type={glyph as string} color={color as string} />
                <SignalDot color={color as string} active={index === 1 || index === 3} />
              </View>
              <Text style={styles.catchTitle}>{title}</Text>
              <Text style={styles.catchCopy}>{copy}</Text>
            </InteractiveSurface>
          ))}
        </View>
      </View>
    </View>
  );
}

function WhenOpenSection({ compact }: { compact: boolean }) {
  const [active, setActive] = useState(0);

  return (
    <View style={[styles.whenSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <View style={[styles.valueIntro, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>USE CASES</SectionLabel>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>When to open Mirar.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>Small moments are where the mirror is most useful. Not after everything breaks, but before your next automatic yes.</Text>
        </View>
        <View style={[styles.whenPhone, compact && styles.whenPhoneCompact]}>
          <View style={styles.whenPhoneTop}>
            <Text style={styles.whenPhoneLabel}>A day with Mirar</Text>
            <SignalChip label="2 min" color="#8C7DB1" active style={styles.whenPhoneChip} />
          </View>
          <View style={styles.whenRail} />
          {OPEN_MOMENTS.map(([title, copy], index) => {
            const selected = active === index;
            return (
              <InteractiveSurface
                key={title}
                onPress={() => setActive(index)}
                style={[styles.whenMoment, compact && styles.whenMomentCompact, selected && styles.whenMomentActive]}
                hoverStyle={styles.surfaceHover}
                pressedStyle={styles.surfacePressed}
              >
                <View style={[styles.whenMomentGlyph, { borderColor: SIGNAL_AREAS[index % SIGNAL_AREAS.length]?.[2] ?? '#8C7DB1' }]}>
                  <MiniGlyph
                    type={index === 0 ? 'Calendar' : index === 1 ? 'Heavy' : index === 2 ? 'Grid' : index === 3 ? 'Dream' : index === 4 ? 'Clarity' : index === 5 ? 'Connection' : 'Mirror'}
                    color={SIGNAL_AREAS[index % SIGNAL_AREAS.length]?.[2] ?? '#8C7DB1'}
                  />
                </View>
                <View style={styles.whenMomentText}>
                  <Text style={styles.whenIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.whenTitle}>{title}</Text>
                  <Text style={[styles.whenCopy, !selected && styles.whenCopyMuted]}>{copy}</Text>
                </View>
              </InteractiveSurface>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function ReturnSection({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.returnSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <SectionLabel>WHAT YOU GET BACK</SectionLabel>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Mirar does not tell you what to do. It helps you see what keeps showing up.</Text>
        <View style={[styles.returnPath, compact && styles.returnPathCompact]}>
          <View style={styles.returnLine} />
          {RETURN_CARDS.map(([title, copy, color], index) => (
            <InteractiveSurface key={title} style={[styles.returnCard, compact && styles.returnCardCompact]} hoverStyle={styles.surfaceHover} pressedStyle={styles.surfacePressed}>
              <View style={[styles.returnNode, { borderColor: color as string }]}>
                <SignalDot color={color as string} active />
              </View>
              <Text style={styles.returnTitle}>{title}</Text>
              <Text style={styles.returnCopy}>{copy}</Text>
            </InteractiveSurface>
          ))}
        </View>
      </View>
    </View>
  );
}

function AlignmentNotesSection({ compact }: { compact: boolean }) {
  const openSubstack = () => Linking.openURL(SOCIAL_LINKS.substack);

  return (
    <View style={[styles.notesSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <View style={[styles.valueIntro, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>ALIGNMENT NOTES</SectionLabel>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Essays and reflections on drift, attention, and emotional hygiene.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>Mirar is an internal alignment system. Alignment Notes documents how misalignment forms and how to notice it early.</Text>
        </View>
        <View style={[styles.notesGrid, compact && styles.notesGridCompact]}>
          {ALIGNMENT_NOTES.map(([title, copy, tag], index) => (
            <InteractiveSurface key={title} style={[styles.noteCard, compact && styles.noteCardCompact]} hoverStyle={styles.surfaceHover} pressedStyle={styles.surfacePressed}>
              <LinearGradient
                colors={['rgba(255,252,245,0.96)', index % 2 ? 'rgba(244,200,156,0.2)' : 'rgba(184,190,230,0.2)']}
                style={styles.noteGradient}
              >
                <Text style={styles.noteTag}>{tag}</Text>
                <Text style={styles.noteTitle}>{title}</Text>
                <Text style={styles.noteCopy}>{copy}</Text>
              </LinearGradient>
            </InteractiveSurface>
          ))}
        </View>
        <InteractiveSurface onPress={openSubstack} style={styles.notesCta} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
          <Text style={styles.notesCtaText}>Read Alignment Notes</Text>
          <Text style={styles.notesCtaArrow}>↗</Text>
        </InteractiveSurface>
      </View>
    </View>
  );
}

function SocialMirrorsSection({ compact }: { compact: boolean }) {
  const openInstagram = () => Linking.openURL(SOCIAL_LINKS.instagram);
  const openLinkedin = () => Linking.openURL(SOCIAL_LINKS.linkedin);

  return (
    <View style={[styles.socialSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <View style={[styles.valueIntro, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>SOCIAL MIRRORS</SectionLabel>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Small mirrors from the feed.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>Short reflections on drift, attention, emotional hygiene, and the quiet ways ordinary days shape us.</Text>
        </View>
        <View style={[styles.socialGrid, compact && styles.socialGridCompact]}>
          {SOCIAL_MIRRORS.map(([title, copy], index) => (
            <InteractiveSurface key={title} style={[styles.socialCard, compact && styles.valueCardCompact]} hoverStyle={styles.surfaceHover} pressedStyle={styles.surfacePressed}>
              <LinearGradient
                colors={index % 2 ? ['rgba(32,33,39,0.92)', 'rgba(64,58,74,0.9)'] : ['rgba(255,252,245,0.96)', 'rgba(234,221,245,0.68)']}
                style={styles.socialCardInner}
              >
                <SignalDot color={SIGNAL_AREAS[index % SIGNAL_AREAS.length]?.[2] ?? '#8C7DB1'} active />
                <Text style={[styles.socialCardTitle, index % 2 ? styles.socialCardTitleDark : null]}>{title}</Text>
                <Text style={[styles.socialCardCopy, index % 2 ? styles.socialCardCopyDark : null]}>{copy}</Text>
              </LinearGradient>
            </InteractiveSurface>
          ))}
        </View>
        <View style={styles.ecosystemLinks}>
          <InteractiveSurface onPress={openInstagram} style={styles.ecosystemPill} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
            <Text style={styles.ecosystemText}>Follow @mirar.life</Text>
          </InteractiveSurface>
          <InteractiveSurface onPress={openLinkedin} style={styles.ecosystemPill} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
            <Text style={styles.ecosystemText}>Follow Mirar on LinkedIn</Text>
          </InteractiveSurface>
        </View>
      </View>
    </View>
  );
}

function BetaSection({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.betaSection, compact && styles.mobileSection]}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={[styles.sectionCopy, compact && styles.sectionCopyCompact]}>
          <SectionLabel>BETA EXPERIENCE</SectionLabel>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>How the 28-day beta works.</Text>
          <Text style={styles.sectionBody}>Mirar Beta is a small, private 28-day experience.</Text>
          <Text style={styles.sectionBody}>
            Each day, you complete one short check-in designed to help you notice your current internal state — without analysis, storytelling, or pressure to explain yourself.
          </Text>
          <Text style={styles.sectionBody}>Each check-in takes less than two minutes. Nothing to score. Nothing to perform. Nothing to prove.</Text>
        </View>
        <View style={[styles.betaTimeline, compact && styles.betaTimelineCompact]}>
          <View style={styles.betaLine} />
          {BETA_MILESTONES.map(([day, title, copy], index) => (
            <Animated.View key={day} entering={FadeInUp.duration(520).delay(index * 90)} style={styles.betaMilestone}>
              <View style={[styles.betaNode, { borderColor: SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1' }]}>
                <SignalDot color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active={index === 2} />
              </View>
              <View style={styles.betaMilestoneText}>
                <Text style={styles.betaDay}>{day}</Text>
                <Text style={styles.betaTitle}>{title}</Text>
                <Text style={styles.betaCopy}>{copy}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

function FAQSection({ compact }: { compact: boolean }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <View style={[styles.faqSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <SectionLabel>FAQ</SectionLabel>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Frequently asked questions</Text>
        <Text style={styles.faqSub}>Clear answers before you begin.</Text>
        <View style={[styles.faqGrid, compact && styles.faqGridCompact]}>
          {FAQ_ITEMS.map(([question, answer], index) => {
            const isOpen = openIndex === index;
            return (
              <InteractiveSurface
                key={question}
                onPress={() => setOpenIndex(isOpen ? -1 : index)}
                style={[styles.faqItem, compact && styles.faqItemCompact, isOpen && styles.faqItemOpen]}
                hoverStyle={styles.surfaceHover}
                pressedStyle={styles.surfacePressed}
              >
                <View style={styles.faqQuestionRow}>
                  <View style={[styles.faqDot, { backgroundColor: SIGNAL_AREAS[index % SIGNAL_AREAS.length]?.[2] ?? '#8C7DB1' }]} />
                  <Text style={styles.faqQuestion}>{question}</Text>
                  <Text style={styles.faqToggle}>{isOpen ? '−' : '+'}</Text>
                </View>
                {isOpen ? (
                  <Animated.Text entering={FadeInDown.duration(220)} style={styles.faqAnswer}>
                    {answer}
                  </Animated.Text>
                ) : null}
              </InteractiveSurface>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function FounderSection({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.founderSection, compact && styles.mobileSection]}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={[styles.founderPortraitCard, compact && styles.founderPortraitCardCompact]}>
          <Image source={FOUNDER_PHOTO} style={styles.founderPhoto} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(23,25,31,0)', 'rgba(23,25,31,0.18)', 'rgba(23,25,31,0.78)']}
            locations={[0, 0.45, 1]}
            style={styles.founderPhotoGlow}
          />
          <Text style={[styles.founderQuote, compact && styles.founderQuoteCompact]}>“Most drift isn’t caused by failure. It’s caused by outdated internal assumptions.”</Text>
        </View>
        <View style={styles.founderCopy}>
          <SectionLabel>FOUNDER</SectionLabel>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Built from lived drift, research, and recalibration.</Text>
          <Text style={styles.founderName}>Dr. Sahil Haria, PhD | Founder</Text>
          <Text style={styles.sectionBody}>
            Over the last 15+ years, my life has moved across very different phases: building companies, working across countries, returning home after years abroad, and starting again professionally.
          </Text>
          <Text style={styles.sectionBody}>
            On the surface, things often looked successful. Work continued. Decisions were made. Progress was visible. Internally, the experience was different.
          </Text>
          <Text style={styles.sectionBody}>
            As priorities changed, energy fluctuated, and responsibilities evolved, I noticed that many decisions were still being made from an older internal reference point. Choices that once felt natural began to require more effort because they were rooted in an earlier version of me.
          </Text>
          <Text style={styles.sectionBody}>
            Alongside lived experience, my doctoral research focused on decision-making and adaptation: how internal models update under changing conditions. Mirar grew from that intersection.
          </Text>
          <Text style={styles.sectionBody}>
            It is designed as emotional and mental hygiene, not to interpret or fix behavior, but to help surface internal shifts early, while they are still small enough to respond to deliberately.
          </Text>
        </View>
      </View>
    </View>
  );
}

function ContactFooter({ onCtaPress, compact }: { onCtaPress: () => void; compact: boolean }) {
  const openEmail = () => Linking.openURL(`mailto:${SOCIAL_LINKS.email}`);
  const openSubstack = () => Linking.openURL(SOCIAL_LINKS.substack);
  const openInstagram = () => Linking.openURL(SOCIAL_LINKS.instagram);
  const openLinkedin = () => Linking.openURL(SOCIAL_LINKS.linkedin);

  return (
    <View style={[styles.contactFooter, compact && styles.contactFooterCompact]}>
      <View style={styles.footerGlow} />
      <View style={styles.contactInner}>
        <Image source={FULL_LOGO} style={styles.contactLogo} resizeMode="contain" />
        <Text style={[styles.contactTitle, compact && styles.contactTitleCompact]}>Questions about the beta or the project?</Text>
        <InteractiveSurface onPress={openEmail} style={styles.emailPill} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
          <Text style={styles.emailText}>{SOCIAL_LINKS.email}</Text>
        </InteractiveSurface>
        <Text style={styles.contactNote}>This is an early-stage project. Responses may be slow by design.</Text>
        <View style={styles.footerLinks}>
          <InteractiveSurface onPress={openSubstack} style={styles.footerLinkPill} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
            <Text style={styles.footerLinkText}>Substack</Text>
          </InteractiveSurface>
          <InteractiveSurface onPress={openInstagram} style={styles.footerLinkPill} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
            <Text style={styles.footerLinkText}>Instagram</Text>
          </InteractiveSurface>
          <InteractiveSurface onPress={openLinkedin} style={styles.footerLinkPill} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
            <Text style={styles.footerLinkText}>LinkedIn</Text>
          </InteractiveSurface>
        </View>
        <TouchableOpacity onPress={onCtaPress} activeOpacity={0.82} style={[styles.footerCta, webPointer]}>
          <Text style={styles.footerCtaText}>Start your daily mirror</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Private beta · Mirror, not verdict · © 2026 Mirar</Text>
      </View>
    </View>
  );
}

function SignalPathSection({ compact }: { compact: boolean }) {
  const pulse = useLoopingValue(true);
  const runnerStyle = useAnimatedStyle(() => ({
    opacity: 0.42 + pulse.value * 0.54,
    transform: compact
      ? [{ translateY: pulse.value * 310 }, { scale: 0.84 + pulse.value * 0.2 }]
      : [{ translateX: pulse.value * 760 }, { scale: 0.84 + pulse.value * 0.2 }],
  }));

  return (
    <View style={[styles.processSectionV2, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>One question becomes a signal path.</Text>
        <Text style={styles.signalPathIntro}>So you can notice what is changing before it starts making decisions for you.</Text>
        <View style={[styles.signalPathStage, compact && styles.signalPathStageCompact]}>
          <View style={[styles.signalPathLine, compact && styles.signalPathLineCompact]} />
          <Animated.View style={[styles.signalRunner, runnerStyle]} />
          {PROCESS.map(([title, copy], index) => (
            <Animated.View key={title} entering={FadeInUp.duration(520).delay(index * 90)} style={[styles.signalPathStep, compact && styles.signalPathStepCompact]}>
              <View style={[styles.signalPathNode, { borderColor: SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1' }]}>
                <SignalDot color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active={index === 2} />
                <Text style={styles.signalPathIndex}>0{index + 1}</Text>
              </View>
              <Text style={styles.processTitle}>{title}</Text>
              <Text style={styles.processCopy}>{copy}</Text>
              <View style={styles.pathMiniInstrument}>
                {Array.from({ length: 8 }).map((_, markIndex) => (
                  <View
                    key={markIndex}
                    style={[
                      styles.pathTick,
                      { height: 12 + ((markIndex + index) % 4) * 7, backgroundColor: markIndex === index + 2 ? SIGNAL_AREAS[index]?.[2] : 'rgba(32,33,39,0.28)' },
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ProductSurface({ title, lead, items, index, compact }: { title: string; lead: string; items: string[]; index: number; compact: boolean }) {
  const float = useLoopingValue(true);
  const surfaceStyle = useAnimatedStyle(() => ({
    transform: compact
      ? [{ translateY: float.value * (index % 2 === 0 ? -3 : 3) }]
      : [
          { translateY: (index - 1) * 16 + float.value * (index % 2 === 0 ? -8 : 8) },
          { rotate: `${(index - 1) * 1.4 + float.value * (index % 2 === 0 ? 0.6 : -0.6)}deg` },
        ],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(620).delay(index * 100)} style={[styles.productSurface, compact && styles.productSurfaceCompact, !compact && index === 1 && styles.productSurfaceCenter, surfaceStyle]}>
      <View style={styles.productSurfaceTop}>
        <Text style={styles.productSurfaceLabel}>{title}</Text>
        <SignalDot color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active />
      </View>
      <Text style={styles.productSurfaceLead}>{lead}</Text>
      <View style={styles.productSurfaceBody}>
        {items.map((item, itemIndex) => (
          <View key={item} style={[styles.surfaceRow, itemIndex === 1 && styles.surfaceRowActive]}>
            <View style={[styles.answerAccent, { backgroundColor: SIGNAL_AREAS[(itemIndex + index) % SIGNAL_AREAS.length]?.[2] ?? '#8C7DB1' }]} />
            <Text style={[styles.surfaceRowText, itemIndex === 1 && styles.surfaceRowTextActive]}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={styles.surfaceInstrument}>
        {Array.from({ length: 13 }).map((_, tick) => (
          <View key={tick} style={[styles.surfaceTick, tick % 5 === index && { backgroundColor: SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1', height: 30 }]} />
        ))}
      </View>
    </Animated.View>
  );
}

function InsideMirrorSection({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.insideSection, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <View style={[styles.insideIntro, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>INSIDE THE MIRROR</SectionLabel>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>The product feels like a private instrument.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>
            One question, a few honest options, and a soft read on the signal forming underneath.
          </Text>
        </View>
        <View style={[styles.productGallery, compact && styles.productGalleryCompact]}>
          <View style={styles.galleryOrb} />
          {PRODUCT_SURFACES.map(([title, lead, items], index) => (
            <ProductSurface key={title as string} title={title as string} lead={lead as string} items={items as string[]} index={index} compact={compact} />
          ))}
        </View>
      </View>
    </View>
  );
}

function SignalAreasSection({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.signalAreasSectionV2, compact && styles.mobileSection]}>
      <View style={styles.sectionInner}>
        <SectionLabel>SIGNAL AREAS</SectionLabel>
        <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Six quiet dimensions. One living system.</Text>
        <View style={[styles.constellationStage, compact && styles.constellationStageCompact]}>
          <View style={styles.constellationOrb}>
            <Image source={MARK} style={styles.constellationMark} resizeMode="contain" />
          </View>
          <Svg viewBox="0 0 860 360" width="100%" height="100%" style={styles.constellationLines}>
            <Path d="M140 80 C280 32 530 32 704 96" stroke="rgba(140,125,177,0.2)" strokeWidth="1.2" fill="none" />
            <Path d="M110 228 C278 320 542 330 746 224" stroke="rgba(201,139,85,0.18)" strokeWidth="1.2" fill="none" />
            <Path d="M214 292 C330 188 514 168 646 58" stroke="rgba(111,147,184,0.18)" strokeWidth="1.2" fill="none" />
          </Svg>
          {SIGNAL_AREAS.map(([title, copy, color], index) => (
            <Animated.View
              key={title}
              entering={FadeInUp.duration(520).delay(index * 70)}
              style={[
                styles.constellationCard,
                compact && styles.signalAreaCompact,
                !compact && index === 0 && styles.signalAreaOne,
                !compact && index === 1 && styles.signalAreaTwo,
                !compact && index === 2 && styles.signalAreaThree,
                !compact && index === 3 && styles.signalAreaFour,
                !compact && index === 4 && styles.signalAreaFive,
                !compact && index === 5 && styles.signalAreaSix,
              ]}
            >
              <View style={styles.signalAreaTop}>
                <SignalDot color={color} active={index % 2 === 0} />
                <Text style={styles.signalAreaIndex}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={styles.signalAreaTitle}>{title}</Text>
              <Text style={styles.signalAreaCopy}>{copy}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

function PatternTimelineSection({ compact }: { compact: boolean }) {
  const glow = useLoopingValue(true);
  const mirrorStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + glow.value * 0.28,
    transform: [{ scale: 0.96 + glow.value * 0.08 }],
  }));

  return (
    <View style={[styles.patternSection, compact && styles.mobileSection]}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={[styles.patternInstrument, compact && styles.patternInstrumentCompact]}>
          <Animated.View style={[styles.patternOrb, mirrorStyle]} />
          <Svg viewBox="0 0 620 300" width="100%" height="100%" style={styles.patternLines}>
            <Path d="M64 210 C164 126 250 178 322 110 C402 36 506 92 560 50" stroke="rgba(140,125,177,0.28)" strokeWidth="1.5" fill="none" />
            <Path d="M70 218 C176 198 254 224 338 184 C430 142 500 166 558 128" stroke="rgba(201,139,85,0.23)" strokeWidth="1.3" fill="none" />
          </Svg>
          <View style={styles.patternDays}>
            {PATTERN_DAYS.map(([day, label], index) => (
              <View key={day} style={styles.patternDay}>
                <View style={[styles.patternDot, { backgroundColor: SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1', transform: [{ scale: 0.88 + index * 0.12 }] }]} />
                <Text style={styles.patternDayText}>{day}</Text>
                <Text style={styles.patternDayLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.sectionCopy, compact && styles.sectionCopyCompact]}>
          <SectionLabel>PATTERN OVER TIME</SectionLabel>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>A single answer is small. Repeated answers become a mirror.</Text>
          <Text style={styles.sectionBody}>
            Mirar does not reward streaks or score your mood. It lets a quiet pattern gather enough shape to be seen.
          </Text>
        </View>
      </View>
    </View>
  );
}

function PrivacySection({ compact }: { compact: boolean }) {
  const glow = useLoopingValue(true);
  const chamberGlow = useAnimatedStyle(() => ({
    opacity: 0.36 + glow.value * 0.24,
    transform: [{ scale: 0.96 + glow.value * 0.08 }],
  }));

  return (
    <LinearGradient colors={['#272A32', '#1F2028', '#2B2526']} style={[styles.privacySection, compact && styles.mobileDarkSection]}>
      <Animated.View style={[styles.privacyOrbV2, compact && styles.privacyOrbCompactV2, chamberGlow]} />
      <View style={styles.privacyRingOne} />
      <View style={styles.privacyRingTwo} />
      <View style={styles.sectionInner}>
        <SectionLabel inverse>PRIVATE BY DESIGN</SectionLabel>
        <Text style={[styles.privacyTitle, compact && styles.privacyTitleCompact]}>Your inner life should not become content.</Text>
        <Text style={[styles.privacyBody, compact && styles.privacyBodyCompact]}>
          No public profile. No social feed. No pressure to share. No need to perform clarity.
        </Text>
        <Text style={[styles.privacyLead, compact && styles.privacyLeadCompact]}>Just a quiet place to return to yourself.</Text>
        <View style={styles.privacyPills}>
          {['Private beta', 'No social feed', 'No performance', 'Mirror, not verdict', 'Less than 2 minutes'].map((pill) => (
            <View key={pill} style={styles.privacyPill}>
              <Text style={styles.privacyPillText}>{pill}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

function FinalCta({
  form,
  compact,
}: {
  form: React.ReactNode;
  compact: boolean;
}) {
  const breath = useLoopingValue(true);
  const orbStyle = useAnimatedStyle(() => ({
    opacity: 0.46 + breath.value * 0.2,
    transform: [{ scale: 0.97 + breath.value * 0.06 }],
  }));

  return (
    <View style={[styles.finalCtaV2, compact && styles.finalCtaCompact]}>
      <Animated.View style={[styles.finalOrb, orbStyle]} />
      <Image source={FULL_LOGO} style={styles.finalLogo} resizeMode="contain" />
      <Text style={[styles.finalTitle, compact && styles.finalTitleCompact]}>You do not need to fix your life today.</Text>
      <Text style={[styles.finalSub, compact && styles.finalSubCompact]}>Just notice what is true.</Text>
      {form}
      <Text style={styles.finalTrust}>Private beta · Less than 2 minutes · Free to begin</Text>
    </View>
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
  const sectionY = useRef<Record<string, number>>({});
  const ctaProps = { email, setEmail, sent, setSent, error, onSubmit, isLoading, compact };
  const form = <CTAForm {...ctaProps} />;

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const scrollToSection = (key: string) => {
    if (isWeb && typeof document !== 'undefined') {
      const element = document.getElementById(`mirar-${key}`);
      const scroller = Array.from(document.querySelectorAll('*')).find((node) => node.scrollHeight > node.clientHeight && getComputedStyle(node).overflowY !== 'visible') as HTMLElement | undefined;
      if (element && scroller) {
        scroller.scrollLeft = 0;
        scroller.scrollTop = scroller.scrollTop + element.getBoundingClientRect().top - (compact ? 118 : 96);
        scroller.scrollLeft = 0;
        return;
      }
    }
    const y = sectionY.current[key] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - (compact ? 114 : 98)), animated: true });
  };
  const anchor = (key: string, children: React.ReactNode) => (
    <View nativeID={`mirar-${key}`} onLayout={(event) => { sectionY.current[key] = event.nativeEvent.layout.y; }}>
      {children}
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
          stickyHeaderIndices={[0]}
        >
          <Header onCtaPress={scrollToTop} onNavPress={scrollToSection} compact={compact} />
          <View style={[styles.heroShell, compact && styles.heroShellCompact]}>
            <View style={styles.heroBackdropLavender} />
            <View style={styles.heroBackdropPeach} />
            <View style={styles.heroBackdropSage} />
            <View style={[styles.heroLayout, compact && styles.heroLayoutCompact]}>
              <HeroCopy compact={compact} form={form} />
              <HeroProductScene compact={compact} />
              {compact && (
                <Animated.View entering={FadeInDown.duration(650).delay(280)} style={styles.mobileCtaBlock}>
                  {form}
                  <Text style={styles.heroMicro}>No journaling. No tracking. No advice. Just one honest signal a day.</Text>
                  <View style={styles.mobileTrustRow}>
                    {TRUST_PILLS.slice(0, 3).map((pill) => (
                      <TrustPill key={pill}>{pill}</TrustPill>
                    ))}
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
          <MirrorPortalSection compact={compact} />
          {anchor('why', <BehaviorGapSection compact={compact} />)}
          <MirrorHabitSection compact={compact} />
          <DayDriftSection compact={compact} />
          <ValueRibbon />
          <CatchEarlierSection compact={compact} />
          <WhenOpenSection compact={compact} />
          <InfoSystemSection compact={compact} />
          <MisalignmentSection compact={compact} />
          <HygieneSection compact={compact} />
          {anchor('how', <SignalPathSection compact={compact} />)}
          {anchor('inside', <InsideMirrorSection compact={compact} />)}
          <SignalAreasSection compact={compact} />
          <ReturnSection compact={compact} />
          <PatternTimelineSection compact={compact} />
          <BetaSection compact={compact} />
          {anchor('privacy', <PrivacySection compact={compact} />)}
          {anchor('faq', <FAQSection compact={compact} />)}
          {anchor('founder', <FounderSection compact={compact} />)}
          {anchor('notes', <AlignmentNotesSection compact={compact} />)}
          <SocialMirrorsSection compact={compact} />
          <FinalCta form={<CTAForm {...ctaProps} compact={compact} />} compact={compact} />
          <ContactFooter onCtaPress={scrollToTop} compact={compact} />
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
    backgroundColor: MIRAR.ivory,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: MIRAR.ivory,
    ...(isWeb ? ({ overflowX: 'hidden' } as any) : null),
  },
  page: {
    flexGrow: 1,
    width: '100%',
    ...(isWeb ? ({ overflowX: 'hidden' } as any) : null),
  },
  headerShell: {
    backgroundColor: 'rgba(247,241,232,0.58)',
    paddingHorizontal: 40,
    paddingTop: 18,
    paddingBottom: 10,
    zIndex: 40,
    ...(isWeb ? ({ backdropFilter: 'blur(28px) saturate(1.25)' } as any) : null),
  },
  headerShellCompact: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  header: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(34,31,28,0.07)',
    backgroundColor: 'rgba(255,249,239,0.76)',
    paddingHorizontal: 18,
    shadowColor: MIRAR.graphite,
    shadowOpacity: 0.12,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 },
  },
  headerCompact: {
    minHeight: 54,
    borderRadius: 28,
    paddingHorizontal: 10,
    gap: 8,
  },
  logoWrap: {
    justifyContent: 'center',
  },
  wordmark: {
    width: 156,
    height: 52,
  },
  wordmarkCompact: {
    width: 106,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLink: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  navLinkText: {
    color: '#56504A',
    fontSize: 12,
    fontWeight: '800',
  },
  mobileMenuPanel: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(34,31,28,0.08)',
    backgroundColor: 'rgba(255,249,239,0.94)',
    padding: 10,
    shadowColor: MIRAR.graphite,
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  mobileNavLink: {
    minHeight: 42,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  mobileNavLinkText: {
    color: MIRAR.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  mobileMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(34,31,28,0.08)',
    marginVertical: 8,
  },
  headerCta: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: MIRAR.darkChamber,
    paddingHorizontal: 22,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  headerCtaCompact: {
    minHeight: 38,
    paddingHorizontal: 15,
  },
  headerCtaText: {
    color: '#FFF8ED',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  headerCtaTextCompact: {
    fontSize: 12,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(34,31,28,0.08)',
    backgroundColor: 'rgba(255,249,239,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuButtonOpen: {
    borderColor: 'rgba(125,99,230,0.22)',
    backgroundColor: 'rgba(255,249,239,0.96)',
  },
  menuLine: {
    width: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: MIRAR.ink,
  },
  menuLineTop: {
    transform: [{ translateY: 6 }, { rotate: '45deg' }],
  },
  menuLineMiddle: {
    opacity: 0,
  },
  menuLineBottom: {
    transform: [{ translateY: -6 }, { rotate: '-45deg' }],
  },
  heroShell: {
    minHeight: 860,
    backgroundColor: MIRAR.ivory,
    overflow: 'visible',
    position: 'relative',
    paddingHorizontal: 40,
    paddingTop: 48,
    paddingBottom: 120,
  },
  heroShellCompact: {
    minHeight: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 44,
    overflow: 'hidden',
  },
  heroBackdropLavender: {
    position: 'absolute',
    width: 760,
    height: 760,
    borderRadius: 320,
    right: -150,
    top: 14,
    backgroundColor: 'rgba(185,167,255,0.24)',
  },
  heroBackdropPeach: {
    position: 'absolute',
    width: 520,
    height: 360,
    borderRadius: 260,
    left: -120,
    bottom: 34,
    backgroundColor: 'rgba(255,181,138,0.3)',
  },
  heroBackdropSage: {
    position: 'absolute',
    width: 360,
    height: 280,
    borderRadius: 180,
    left: '42%',
    top: 160,
    backgroundColor: 'rgba(175,205,186,0.2)',
  },
  heroLayout: {
    maxWidth: MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 76,
  },
  heroLayoutCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    overflow: 'hidden',
  },
  heroCopy: {
    flex: 1,
    maxWidth: 660,
    zIndex: 5,
  },
  heroCopyCompact: {
    maxWidth: '100%',
  },
  heroTagline: {
    width: 258,
    height: 34,
    marginBottom: 26,
    opacity: 0.58,
  },
  heroTaglineCompact: {
    width: 190,
    height: 24,
    marginBottom: 18,
  },
  heroTitle: {
    color: MIRAR.ink,
    fontSize: 90,
    lineHeight: 88,
    letterSpacing: 0,
    fontWeight: '300',
  },
  heroTitleCompact: {
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: 0,
  },
  heroSub: {
    maxWidth: 620,
    marginTop: 28,
    color: '#645C52',
    fontSize: 21,
    lineHeight: 34,
    fontWeight: '300',
  },
  heroSubCompact: {
    fontSize: 16,
    lineHeight: 26,
    marginTop: 14,
  },
  heroMicro: {
    marginTop: 13,
    color: '#6F6962',
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
  },
  heroTrustRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mobileCtaBlock: {
    marginTop: -2,
    zIndex: 8,
  },
  mobileTrustRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  trustPill: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,249,239,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.09)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  trustPillText: {
    color: '#655F58',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  formWrap: {
    marginTop: 34,
    maxWidth: 660,
  },
  formWrapCompact: {
    marginTop: 20,
    maxWidth: '100%',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowCompact: {
    flexDirection: 'column',
  },
  emailInput: {
    flex: 1,
    minHeight: 62,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.12)',
    backgroundColor: 'rgba(255,249,239,0.84)',
    color: MIRAR.ink,
    fontSize: FONT_SIZE.base,
    paddingHorizontal: 22,
    shadowColor: '#5B5044',
    shadowOpacity: 0.08,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 10 },
  },
  emailInputCompact: {
    minHeight: 58,
  },
  primaryButton: {
    minHeight: 62,
    borderRadius: 22,
    backgroundColor: MIRAR.darkChamber,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.24,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  primaryButtonCompact: {
    minHeight: 58,
  },
  primaryButtonText: {
    color: '#FFF8ED',
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
  },
  primaryButtonArrow: {
    color: MIRAR.peach,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.74,
  },
  inputError: {
    borderColor: COLORS.underLoad,
  },
  errorText: {
    marginTop: SPACING.sm,
    color: COLORS.underLoad,
    fontSize: FONT_SIZE.sm,
  },
  sentPanel: {
    marginTop: 34,
    maxWidth: 620,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.1)',
    backgroundColor: 'rgba(255,252,245,0.72)',
    padding: SPACING.xl,
    overflow: 'hidden',
  },
  sentPanelGlow: {
    position: 'absolute',
    width: 240,
    height: 180,
    right: -60,
    top: -70,
    borderRadius: 120,
    backgroundColor: 'rgba(190,218,205,0.38)',
  },
  sentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7FA47B',
    marginBottom: SPACING.md,
  },
  sentTitle: {
    color: '#202127',
    fontSize: FONT_SIZE.xl,
    fontWeight: '500',
  },
  sentBody: {
    marginTop: SPACING.sm,
    color: '#5E5A56',
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
  },
  sentNote: {
    marginTop: SPACING.sm,
    color: '#8C857B',
    fontSize: FONT_SIZE.sm,
  },
  resendText: {
    marginTop: SPACING.md,
    color: '#202127',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  productScene: {
    flex: 0.9,
    minHeight: 650,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 4,
  },
  productSceneCompact: {
    minHeight: 370,
    marginTop: -4,
    marginBottom: 0,
    overflow: 'hidden',
  },
  sceneLightColumn: {
    position: 'absolute',
    width: 300,
    height: 620,
    borderRadius: 170,
    right: 18,
    top: 12,
    backgroundColor: 'rgba(168,207,255,0.18)',
    transform: [{ rotate: '18deg' }],
  },
  livingMirror: {
    width: 520,
    height: 620,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  livingMirrorCompact: {
    width: 292,
    height: 350,
    alignSelf: 'center',
  },
  mirrorGlow: {
    position: 'absolute',
    width: '88%',
    height: '78%',
    borderRadius: 280,
    backgroundColor: 'rgba(185,167,255,0.46)',
  },
  mirrorAuraBlue: {
    position: 'absolute',
    right: 38,
    top: 92,
    width: '58%',
    height: '34%',
    borderRadius: 180,
    backgroundColor: 'rgba(168,207,255,0.44)',
  },
  mirrorAuraPeach: {
    position: 'absolute',
    bottom: 82,
    width: '72%',
    height: '36%',
    borderRadius: 190,
    backgroundColor: 'rgba(255,181,138,0.5)',
  },
  mirrorOrbShell: {
    width: '68%',
    height: '78%',
    borderRadius: 260,
    overflow: 'hidden',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.28,
    shadowRadius: 72,
    shadowOffset: { width: 0, height: 36 },
  },
  mirrorOrbShellCompact: {
    width: '70%',
    height: '76%',
  },
  mirrorGlass: {
    flex: 1,
    borderRadius: 260,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66,66,76,0.12)',
  },
  mirrorCoreWrap: {
    width: '52%',
    height: '58%',
    borderRadius: 150,
    overflow: 'hidden',
  },
  mirrorCore: {
    flex: 1,
    borderRadius: 150,
  },
  mirrorMark: {
    position: 'absolute',
    width: '62%',
    height: '74%',
    opacity: 0.28,
  },
  mirrorHighlight: {
    position: 'absolute',
    top: 54,
    left: 62,
    width: 190,
    height: 84,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.28)',
    transform: [{ rotate: '-22deg' }],
  },
  mirrorRings: {
    position: 'absolute',
    width: '104%',
    height: '104%',
  },
  sceneChipDirection: {
    position: 'absolute',
    top: 128,
    right: 70,
    zIndex: 7,
  },
  sceneChipEnergy: {
    position: 'absolute',
    top: 178,
    right: 40,
    zIndex: 7,
  },
  sceneChipAttention: {
    position: 'absolute',
    top: 235,
    right: 76,
    zIndex: 7,
  },
  sceneChipDirectionCompact: {
    top: 66,
    right: 8,
  },
  sceneChipEnergyCompact: {
    top: 172,
    right: 4,
  },
  sceneChipAttentionCompact: {
    display: 'none',
  },
  signalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,252,245,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowColor: '#4B4540',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  signalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  signalChipText: {
    color: '#49474C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.35,
  },
  statusChip: {
    backgroundColor: 'rgba(230,239,232,0.8)',
    shadowOpacity: 0,
    paddingVertical: 7,
  },
  questionCard: {
    position: 'absolute',
    left: 12,
    bottom: 42,
    zIndex: 10,
    width: 430,
    maxWidth: '96%',
    borderRadius: 38,
    backgroundColor: 'rgba(255,249,239,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.12)',
    padding: 26,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.18,
    shadowRadius: 54,
    shadowOffset: { width: 0, height: 28 },
  },
  questionCardCompact: {
    width: '100%',
    maxWidth: 334,
    left: '50%',
    right: 'auto',
    marginLeft: -167,
    bottom: 0,
    padding: 14,
    borderRadius: 26,
    alignSelf: 'center',
  },
  questionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  questionLabel: {
    color: '#989088',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  questionTitle: {
    marginTop: 24,
    color: '#202127',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '300',
  },
  questionTitleCompact: {
    marginTop: 16,
    fontSize: 24,
    lineHeight: 29,
  },
  answerStack: {
    marginTop: 22,
    gap: 10,
  },
  answerPill: {
    minHeight: 48,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.1)',
    backgroundColor: 'rgba(247,241,230,0.62)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
  },
  answerPillActive: {
    backgroundColor: '#202127',
    borderColor: '#202127',
  },
  answerAccent: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  answerAccentLavender: {
    backgroundColor: '#8C7DB1',
  },
  answerAccentPeach: {
    backgroundColor: '#F0B485',
  },
  answerAccentBlue: {
    backgroundColor: '#6F93B8',
  },
  answerText: {
    flex: 1,
    color: '#5E5A56',
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
    fontWeight: '600',
  },
  answerTextActive: {
    color: '#FFF8ED',
  },
  chooseLine: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  chooseLineRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(36,33,31,0.12)',
  },
  chooseLineText: {
    color: '#8C857B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionInner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  mobileSection: {
    paddingHorizontal: 20,
    paddingVertical: 76,
  },
  mobileSectionTight: {
    paddingHorizontal: 20,
    paddingVertical: 58,
  },
  mobileDarkSection: {
    paddingHorizontal: 20,
    paddingVertical: 78,
  },
  sectionGrid: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 72,
  },
  sectionStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 26,
  },
  sectionCopy: {
    flex: 1,
  },
  sectionCopyCompact: {
    flexGrow: 0,
    flexShrink: 0,
    ...(isWeb ? ({ flexBasis: 'auto' } as any) : null),
  },
  sectionLabel: {
    color: '#8D8172',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginBottom: 16,
  },
  sectionLabelInverse: {
    color: 'rgba(255,248,237,0.54)',
  },
  sectionTitle: {
    maxWidth: 780,
    color: MIRAR.ink,
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: 0,
    fontWeight: '300',
  },
  sectionTitleCompact: {
    maxWidth: '100%',
    fontSize: 34,
    lineHeight: 39,
  },
  sectionBody: {
    maxWidth: 680,
    marginTop: 22,
    color: '#635A50',
    fontSize: 19,
    lineHeight: 32,
    fontWeight: '300',
  },
  behaviorSectionV2: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 142,
  },
  signalCompare: {
    flex: 0.9,
    minHeight: 420,
    borderRadius: 42,
    backgroundColor: 'rgba(247,241,230,0.66)',
    padding: 28,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  compareColumn: {
    gap: SPACING.md,
  },
  compareColumnActive: {
    alignItems: 'flex-end',
  },
  compareLabel: {
    color: '#A79F95',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  compareLabelActive: {
    color: '#3D3C42',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  compareChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  outerSignalPill: {
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,252,245,0.66)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  outerSignalText: {
    color: '#A49B91',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  innerSignalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#4B4540',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  innerSignalText: {
    color: '#34333A',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  compareBridge: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 7,
  },
  compareBridgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8D0C6',
  },
  compareBridgeDotActive: {
    backgroundColor: '#8C7DB1',
  },
  compareBridgeLine: {
    width: 1,
    height: 92,
    backgroundColor: 'rgba(36,33,31,0.12)',
  },
  whatSection: {
    backgroundColor: '#F7F1E6',
    paddingHorizontal: 40,
    paddingVertical: 120,
  },
  manifestoPanel: {
    flex: 0.82,
    minHeight: 430,
    borderRadius: 46,
    backgroundColor: 'rgba(255,252,245,0.62)',
    padding: 34,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  manifestoMark: {
    width: 84,
    height: 120,
    marginBottom: 30,
  },
  manifestoLine: {
    color: '#202127',
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '300',
  },
  manifestoLineMuted: {
    marginTop: SPACING.md,
    color: '#8C857B',
    fontSize: 22,
    lineHeight: 31,
  },
  processSectionV2: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  processPath: {
    marginTop: 58,
    flexDirection: 'row',
    gap: SPACING.lg,
    position: 'relative',
  },
  processPathCompact: {
    flexDirection: 'column',
  },
  processPathLine: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 26,
    height: 1,
    backgroundColor: 'rgba(36,33,31,0.14)',
  },
  processPathLineCompact: {
    left: 22,
    top: 24,
    bottom: 24,
    width: 1,
    height: 'auto',
    right: 'auto',
  },
  processStep: {
    flex: 1,
    minWidth: 220,
    paddingTop: 64,
  },
  processStepCompact: {
    minWidth: 0,
    paddingTop: 0,
    paddingLeft: 58,
  },
  processNode: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#202127',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#202127',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  processNodeText: {
    color: '#FFF8ED',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  processTitle: {
    color: '#202127',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '500',
  },
  processCopy: {
    marginTop: SPACING.sm,
    color: '#655F58',
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
  },
  signalAreasSectionV2: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  signalAreaGrid: {
    marginTop: 52,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  signalAreaGridCompact: {
    flexDirection: 'column',
  },
  legacySignalArea: {
    flex: 1,
    minWidth: 230,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36,33,31,0.12)',
    paddingTop: SPACING.lg,
  },
  signalAreaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  signalAreaIndex: {
    color: '#BBB1A6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  signalAreaTitle: {
    color: '#202127',
    fontSize: 24,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  signalAreaCopy: {
    color: '#655F58',
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
  },
  privacySection: {
    paddingHorizontal: 40,
    paddingVertical: 128,
    position: 'relative',
    overflow: 'hidden',
  },
  privacyOrbV2: {
    position: 'absolute',
    right: -120,
    top: -70,
    width: 480,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(183,184,234,0.16)',
  },
  privacyOrbCompactV2: {
    right: -210,
    top: -120,
    width: 390,
    height: 420,
  },
  privacyTitle: {
    maxWidth: 780,
    color: '#FFF8ED',
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: 0,
    fontWeight: '300',
  },
  privacyTitleCompact: {
    fontSize: 34,
    lineHeight: 40,
  },
  privacyBody: {
    maxWidth: 650,
    marginTop: SPACING.xl,
    color: 'rgba(255,248,237,0.76)',
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '300',
  },
  privacyBodyCompact: {
    marginTop: 18,
    fontSize: 17,
    lineHeight: 28,
  },
  privacyLead: {
    marginTop: SPACING.lg,
    color: '#FFF8ED',
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '500',
  },
  privacyLeadCompact: {
    marginTop: 14,
    fontSize: 18,
    lineHeight: 28,
  },
  privacyPills: {
    marginTop: 42,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  privacyPill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,248,237,0.16)',
    backgroundColor: 'rgba(255,248,237,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  privacyPillText: {
    color: 'rgba(255,248,237,0.76)',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  finalCtaV2: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 142,
    alignItems: 'center',
  },
  finalCtaCompact: {
    paddingHorizontal: 20,
    paddingVertical: 78,
  },
  finalLogo: {
    width: 220,
    height: 104,
    marginBottom: SPACING.xl,
  },
  finalTitle: {
    maxWidth: 820,
    textAlign: 'center',
    color: '#202127',
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: 0,
    fontWeight: '300',
  },
  finalTitleCompact: {
    fontSize: 34,
    lineHeight: 40,
  },
  finalSub: {
    marginTop: SPACING.md,
    marginBottom: -4,
    textAlign: 'center',
    color: '#655F58',
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '300',
  },
  finalSubCompact: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: -12,
  },
  gridWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.34,
    ...(isWeb
      ? ({
          backgroundImage:
            'linear-gradient(rgba(32,33,39,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(32,33,39,0.045) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        } as any)
      : null),
  },
  behaviorSection: {
    backgroundColor: '#FBF6EC',
    paddingHorizontal: 40,
    paddingVertical: 126,
    position: 'relative',
    overflow: 'hidden',
  },
  trackingField: {
    flex: 0.95,
    minHeight: 500,
    borderRadius: 48,
    backgroundColor: 'rgba(255,252,245,0.54)',
    padding: 30,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.07)',
    shadowColor: '#756656',
    shadowOpacity: 0.08,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 24 },
  },
  trackingFieldCompact: {
    minHeight: 0,
    padding: 20,
    borderRadius: 34,
  },
  trackingOrb: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    right: -80,
    bottom: -92,
    backgroundColor: 'rgba(184,190,230,0.22)',
  },
  trackingBeam: {
    position: 'absolute',
    left: '30%',
    right: '16%',
    top: '24%',
    bottom: '20%',
    borderRadius: 180,
    opacity: 0.9,
    transform: [{ rotate: '-8deg' }],
  },
  trackingFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  trackingRows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  trackingRowsCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 16,
  },
  trackingColumn: {
    flex: 0.75,
    gap: 10,
  },
  trackingColumnCompact: {
    flex: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trackingChip: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(235,232,225,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(32,33,39,0.07)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  trackingChipText: {
    color: '#77716C',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  flowBridge: {
    flex: 1.1,
    minHeight: 190,
    position: 'relative',
    justifyContent: 'center',
  },
  flowBridgeCompact: {
    minHeight: 100,
  },
  flowPulse: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F0B485',
    shadowColor: '#F0B485',
    shadowOpacity: 0.56,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  innerSignalStack: {
    flex: 0.86,
    gap: 12,
    alignItems: 'flex-end',
  },
  innerSignalStackCompact: {
    flex: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 8,
  },
  innerSignalGlow: {
    backgroundColor: 'rgba(255,252,245,0.86)',
  },
  trackingFootnote: {
    color: '#7B736A',
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
    maxWidth: 420,
  },
  trackingFootnoteCompact: {
    marginTop: 16,
    zIndex: 4,
  },
  processSection: {
    backgroundColor: '#EFE7DA',
    paddingHorizontal: 40,
    paddingVertical: 128,
    overflow: 'hidden',
  },
  signalPathStage: {
    marginTop: 58,
    minHeight: 340,
    borderRadius: 48,
    backgroundColor: 'rgba(255,252,245,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.07)',
    padding: 30,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  signalPathStageCompact: {
    flexDirection: 'column',
    padding: 20,
    borderRadius: 34,
    marginTop: 32,
  },
  signalPathLine: {
    position: 'absolute',
    left: 72,
    right: 72,
    top: 92,
    height: 1,
    backgroundColor: 'rgba(32,33,39,0.16)',
  },
  signalPathLineCompact: {
    left: 47,
    top: 42,
    bottom: 42,
    width: 1,
    height: 'auto',
    right: 'auto',
  },
  signalRunner: {
    position: 'absolute',
    left: 62,
    top: 84,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8C7DB1',
    shadowColor: '#8C7DB1',
    shadowOpacity: 0.52,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  signalPathStep: {
    flex: 1,
    minWidth: 0,
    paddingTop: 108,
    position: 'relative',
  },
  signalPathStepCompact: {
    paddingTop: 0,
    paddingLeft: 62,
    minHeight: 114,
  },
  signalPathNode: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    backgroundColor: 'rgba(255,252,245,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#4B4540',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  signalPathIndex: {
    color: '#8C857B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pathMiniInstrument: {
    marginTop: 22,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  pathTick: {
    width: 2,
    borderRadius: 2,
  },
  insideSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 154,
    overflow: 'hidden',
  },
  insideIntro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 64,
    alignItems: 'flex-end',
  },
  insideIntroCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  sectionBodyTight: {
    maxWidth: 430,
    color: '#635A50',
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '300',
  },
  productGallery: {
    minHeight: 560,
    marginTop: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    position: 'relative',
  },
  productGalleryCompact: {
    minHeight: 0,
    flexDirection: 'column',
    gap: 14,
    marginTop: 34,
  },
  galleryOrb: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(185,167,255,0.22)',
  },
  productSurface: {
    width: 350,
    minHeight: 430,
    borderRadius: 44,
    padding: 26,
    backgroundColor: 'rgba(255,249,239,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.1)',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.16,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 24 },
  },
  productSurfaceCenter: {
    minHeight: 480,
    zIndex: 4,
  },
  productSurfaceCompact: {
    width: '100%',
    minHeight: 0,
    borderRadius: 34,
    padding: 22,
  },
  productSurfaceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productSurfaceLabel: {
    color: '#9A928A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  productSurfaceLead: {
    marginTop: 32,
    color: '#202127',
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '300',
  },
  productSurfaceBody: {
    marginTop: 28,
    gap: 10,
  },
  surfaceRow: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(32,33,39,0.08)',
    backgroundColor: 'rgba(247,241,230,0.62)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  surfaceRowActive: {
    backgroundColor: '#202127',
  },
  surfaceRowText: {
    flex: 1,
    color: '#655F58',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  surfaceRowTextActive: {
    color: '#FFF8ED',
  },
  surfaceInstrument: {
    marginTop: 34,
    height: 48,
    borderTopWidth: 1,
    borderTopColor: 'rgba(32,33,39,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  surfaceTick: {
    width: 2,
    height: 18,
    borderRadius: 2,
    backgroundColor: 'rgba(32,33,39,0.26)',
  },
  signalAreasSection: {
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 40,
    paddingVertical: 132,
    overflow: 'hidden',
  },
  constellationStage: {
    marginTop: 62,
    minHeight: 520,
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  constellationStageCompact: {
    minHeight: 0,
    gap: 14,
    flexDirection: 'column',
    marginTop: 34,
  },
  constellationLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 108,
    bottom: 0,
    opacity: 0.78,
  },
  constellationOrb: {
    position: 'absolute',
    left: '50%',
    top: 145,
    width: 260,
    height: 260,
    marginLeft: -130,
    borderRadius: 130,
    backgroundColor: 'rgba(184,190,230,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  constellationMark: {
    width: 74,
    height: 104,
    opacity: 0.42,
  },
  constellationCard: {
    position: 'relative',
    width: '31.5%',
    minHeight: 178,
    borderRadius: 28,
    padding: 20,
    backgroundColor: 'rgba(255,252,245,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    shadowColor: '#5B5044',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  signalAreaCompact: {
    position: 'relative',
    width: '100%',
    minHeight: 142,
    padding: 18,
  },
  signalAreaOne: { marginTop: 16 },
  signalAreaTwo: { marginTop: 0 },
  signalAreaThree: { marginTop: 32 },
  signalAreaFour: { marginTop: -2 },
  signalAreaFive: { marginTop: 24 },
  signalAreaSix: { marginTop: 8 },
  patternSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  patternInstrument: {
    flex: 1,
    minHeight: 390,
    borderRadius: 46,
    backgroundColor: 'rgba(255,249,239,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  patternInstrumentCompact: {
    minHeight: 300,
    borderRadius: 34,
    padding: 20,
  },
  patternOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -48,
    top: 26,
    backgroundColor: 'rgba(184,190,230,0.24)',
  },
  patternLines: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 60,
  },
  patternDays: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 245,
    gap: SPACING.md,
  },
  patternDay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  patternDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#8C7DB1',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  patternDayText: {
    color: '#202127',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  patternDayLabel: {
    color: '#81786F',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  privacyOrb: {
    position: 'absolute',
    right: 60,
    top: 60,
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(183,184,234,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,248,237,0.12)',
  },
  privacyOrbCompact: {
    right: -170,
    top: -110,
  },
  privacyRingOne: {
    position: 'absolute',
    right: 110,
    top: 110,
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: 'rgba(255,248,237,0.1)',
  },
  privacyRingTwo: {
    position: 'absolute',
    right: 200,
    top: 196,
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 1,
    borderColor: 'rgba(244,200,156,0.16)',
  },
  finalCta: {
    backgroundColor: '#F7F1E6',
    paddingHorizontal: 40,
    paddingVertical: 126,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  finalOrb: {
    position: 'absolute',
    top: 48,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(244,177,132,0.2)',
  },
  finalTrust: {
    marginTop: SPACING.lg,
    color: '#81786F',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  surfaceHover: {
    transform: [{ translateY: -5 }],
    borderColor: 'rgba(140,125,177,0.24)',
    shadowOpacity: 0.18,
    shadowRadius: 34,
  },
  surfacePressed: {
    transform: [{ scale: 0.985 }],
    shadowOpacity: 0.08,
  },
  infoSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  infoCardRow: {
    marginTop: 54,
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  infoCardRowCompact: {
    flexDirection: 'column',
    marginTop: 34,
    gap: 14,
  },
  infoCardWrap: {
    flex: 1,
  },
  infoCard: {
    minHeight: 350,
    borderRadius: 40,
    padding: 30,
    backgroundColor: 'rgba(255,249,239,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  infoCardCompact: {
    minHeight: 0,
    borderRadius: 30,
    padding: 22,
  },
  infoGlyph: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  infoGlyphArc: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    width: 20,
    height: 2,
    borderRadius: 2,
    opacity: 0.52,
    transform: [{ rotate: '-22deg' }],
  },
  infoCardTitle: {
    color: '#202127',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
  },
  infoCardCopy: {
    marginTop: SPACING.md,
    color: '#5E5A56',
    fontSize: FONT_SIZE.base,
    lineHeight: 27,
  },
  misalignmentSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  driftMap: {
    flex: 0.9,
    minHeight: 430,
    borderRadius: 46,
    backgroundColor: 'rgba(247,241,230,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  driftMapCompact: {
    minHeight: 330,
    borderRadius: 34,
    padding: 18,
  },
  driftOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    right: -40,
    bottom: -48,
    backgroundColor: 'rgba(184,190,230,0.23)',
  },
  driftPulse: {
    position: 'absolute',
    left: '48%',
    top: '48%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F0B485',
    shadowColor: '#F0B485',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  driftLabel: {
    position: 'absolute',
    left: 36,
    top: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,252,245,0.74)',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  driftLabelMid: {
    left: '42%',
    top: 190,
  },
  driftLabelEnd: {
    left: '58%',
    top: 312,
  },
  driftLabelText: {
    color: '#555059',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  hygieneSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  hygieneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 64,
    alignItems: 'flex-end',
  },
  hygieneSystem: {
    marginTop: 62,
    minHeight: 330,
    borderRadius: 56,
    backgroundColor: 'rgba(255,249,239,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    padding: 34,
    paddingTop: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  hygieneSystemCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 18,
    padding: 20,
    paddingTop: 58,
    borderRadius: 34,
    minHeight: 0,
  },
  hygieneColumnLabel: {
    position: 'absolute',
    top: 24,
    color: '#8C857B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  hygieneColumnLabelLeft: {
    left: 34,
  },
  hygieneColumnLabelRight: {
    right: 34,
  },
  hygieneOrb: {
    position: 'absolute',
    left: '50%',
    top: 42,
    width: 230,
    height: 230,
    marginLeft: -115,
    borderRadius: 115,
    backgroundColor: 'rgba(184,190,230,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hygieneOrbCompact: {
    position: 'relative',
    left: 'auto',
    top: 'auto',
    alignSelf: 'center',
    marginLeft: 0,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  hygieneMark: {
    width: 70,
    height: 104,
    opacity: 0.34,
  },
  hygieneOrbLabel: {
    position: 'absolute',
    bottom: 48,
    color: '#514D56',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  hygieneColumn: {
    gap: 14,
    zIndex: 2,
  },
  maintenanceChip: {
    minHeight: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(235,232,225,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  maintenanceChipText: {
    color: '#716B65',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  hygieneBridge: {
    flex: 1,
    minHeight: 170,
    zIndex: 1,
  },
  hygieneSignal: {
    backgroundColor: 'rgba(255,252,245,0.86)',
  },
  hygieneSignalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-end',
  },
  hygieneCopy: {
    maxWidth: 860,
    alignSelf: 'center',
    marginTop: 36,
    textAlign: 'center',
    color: '#5E5A56',
    fontSize: 19,
    lineHeight: 32,
    fontWeight: '300',
  },
  betaSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  betaTimeline: {
    flex: 0.88,
    minHeight: 480,
    borderRadius: 54,
    backgroundColor: 'rgba(255,249,239,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    padding: 34,
    position: 'relative',
    gap: 22,
  },
  betaTimelineCompact: {
    minHeight: 0,
    borderRadius: 34,
    padding: 20,
    gap: 18,
  },
  betaLine: {
    position: 'absolute',
    left: 62,
    top: 68,
    bottom: 68,
    width: 1,
    backgroundColor: 'rgba(36,33,31,0.13)',
  },
  betaMilestone: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  betaNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: 'rgba(255,249,239,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  betaMilestoneText: {
    flex: 1,
    paddingTop: 4,
  },
  betaDay: {
    color: '#8C857B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  betaTitle: {
    marginTop: 5,
    color: '#202127',
    fontSize: 22,
    fontWeight: '600',
  },
  betaCopy: {
    marginTop: 7,
    color: '#655F58',
    fontSize: FONT_SIZE.base,
    lineHeight: 24,
  },
  faqSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  faqSub: {
    marginTop: SPACING.md,
    color: '#655F58',
    fontSize: 20,
    lineHeight: 30,
  },
  faqGrid: {
    marginTop: 52,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  faqGridCompact: {
    flexDirection: 'column',
    marginTop: 34,
    gap: 12,
  },
  faqItem: {
    width: '49%',
    borderRadius: 30,
    backgroundColor: 'rgba(255,249,239,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(34,31,28,0.07)',
    padding: 22,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  faqItemCompact: {
    width: '100%',
    borderRadius: 26,
    padding: 18,
  },
  faqItemOpen: {
    backgroundColor: 'rgba(255,252,245,0.94)',
    borderColor: 'rgba(140,125,177,0.22)',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  faqQuestion: {
    flex: 1,
    color: '#202127',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  faqToggle: {
    color: '#8C857B',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '300',
  },
  faqAnswer: {
    marginTop: 16,
    color: '#5E5A56',
    fontSize: FONT_SIZE.base,
    lineHeight: 26,
  },
  founderSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  founderPortraitCard: {
    flex: 0.78,
    minHeight: 650,
    borderRadius: 58,
    overflow: 'hidden',
    backgroundColor: '#202127',
    position: 'relative',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.18,
    shadowRadius: 52,
    shadowOffset: { width: 0, height: 26 },
  },
  founderPortraitCardCompact: {
    flex: 0,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    minHeight: 420,
    borderRadius: 34,
  },
  founderPhoto: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.9,
    ...(isWeb ? ({ objectPosition: 'center top' } as any) : null),
  },
  founderPhotoGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '64%',
  },
  founderQuote: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 30,
    color: '#FFF8ED',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '300',
  },
  founderQuoteCompact: {
    fontSize: 21,
    lineHeight: 29,
  },
  founderCopy: {
    flex: 1,
  },
  founderName: {
    marginTop: SPACING.xl,
    color: '#202127',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  contactFooter: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 110,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  contactFooterCompact: {
    paddingHorizontal: 20,
    paddingVertical: 72,
  },
  footerGlow: {
    position: 'absolute',
    top: 30,
    width: 420,
    height: 280,
    borderRadius: 210,
    backgroundColor: 'rgba(185,167,255,0.18)',
  },
  contactInner: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 760,
  },
  contactLogo: {
    width: 190,
    height: 88,
    marginBottom: 20,
  },
  contactTitle: {
    color: '#202127',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '300',
    textAlign: 'center',
  },
  contactTitleCompact: {
    fontSize: 29,
    lineHeight: 36,
  },
  emailPill: {
    marginTop: 22,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,252,245,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.1)',
    paddingHorizontal: 22,
    paddingVertical: 13,
    shadowColor: '#5B5044',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  emailPillHover: {
    transform: [{ translateY: -3 }],
    borderColor: 'rgba(201,139,85,0.32)',
    shadowOpacity: 0.16,
  },
  emailText: {
    color: '#202127',
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
  },
  valueIntro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 64,
  },
  mirrorHabitSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  habitTransform: {
    marginTop: 60,
    minHeight: 460,
    borderRadius: 58,
    backgroundColor: 'rgba(255,249,239,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    padding: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  habitTransformCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 20,
    borderRadius: 34,
    marginTop: 34,
    minHeight: 0,
  },
  habitMirrorOrb: {
    position: 'absolute',
    left: '50%',
    top: 82,
    width: 280,
    height: 280,
    marginLeft: -140,
    borderRadius: 140,
    backgroundColor: 'rgba(184,190,230,0.22)',
  },
  habitColumn: {
    flex: 0.9,
    gap: 12,
    zIndex: 2,
  },
  habitColumnCompact: {
    flexGrow: 0,
    flexShrink: 0,
    ...(isWeb ? ({ flexBasis: 'auto' } as any) : null),
  },
  habitColumnLabel: {
    color: '#8C857B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  habitChip: {
    minHeight: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,245,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#5B5044',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  innerHabitChip: {
    minHeight: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,245,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(140,125,177,0.1)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#5B5044',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  habitChipHover: {
    transform: [{ translateY: -4 }],
    shadowOpacity: 0.14,
    borderColor: 'rgba(201,139,85,0.22)',
  },
  habitChipTitle: {
    color: '#202127',
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  habitChipDetail: {
    marginTop: 2,
    color: '#81786F',
    fontSize: 12,
    fontWeight: '600',
  },
  habitPath: {
    flex: 1.05,
    minHeight: 260,
    zIndex: 1,
  },
  habitPathCompact: {
    flex: 0,
    minHeight: 76,
    maxHeight: 76,
  },
  habitClose: {
    maxWidth: 900,
    alignSelf: 'center',
    marginTop: 34,
    color: '#514D48',
    fontSize: 22,
    lineHeight: 34,
    textAlign: 'center',
    fontWeight: '300',
  },
  habitCloseCompact: {
    marginTop: 22,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'left',
  },
  dayDriftSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  dayFlowPanel: {
    flex: 0.9,
    minHeight: 500,
    borderRadius: 56,
    backgroundColor: 'rgba(255,249,239,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    padding: 30,
    position: 'relative',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.08,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 20 },
  },
  dayFlowPanelCompact: {
    minHeight: 0,
    borderRadius: 34,
    padding: 18,
  },
  dayDriftLine: {
    position: 'absolute',
    left: 48,
    right: 48,
    top: '50%',
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(201,139,85,0.34)',
    transform: [{ rotate: '-8deg' }],
  },
  dayPhase: {
    minHeight: 88,
    borderRadius: 26,
    backgroundColor: 'rgba(255,252,245,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.07)',
    padding: 16,
  },
  dayPhaseTime: {
    color: '#8C857B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  dayExternalChip: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dayExternalText: {
    color: '#655F58',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  dayInnerRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dayInnerText: {
    color: '#202127',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  ribbonSection: {
    backgroundColor: MIRAR.darkChamber,
    paddingVertical: 12,
    overflow: 'hidden',
    ...(isWeb ? ({ maxWidth: '100vw' } as any) : null),
  },
  ribbonTrack: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 40,
    minWidth: 2200,
  },
  ribbonTrackSecond: {
    marginTop: 10,
    opacity: 0.72,
  },
  ribbonItem: {
    minHeight: 44,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,248,237,0.14)',
    backgroundColor: 'rgba(255,248,237,0.06)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ribbonItemAlt: {
    minHeight: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,248,237,0.1)',
    backgroundColor: 'rgba(255,248,237,0.035)',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ribbonText: {
    color: 'rgba(255,248,237,0.82)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  ribbonTextMuted: {
    color: 'rgba(255,248,237,0.62)',
    fontSize: 12,
    fontWeight: '700',
  },
  catchSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  catchGrid: {
    marginTop: 54,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  catchGridCompact: {
    flexDirection: 'column',
    marginTop: 34,
    gap: 14,
  },
  catchCard: {
    width: '32%',
    minHeight: 280,
    borderRadius: 38,
    backgroundColor: 'rgba(255,249,239,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(34,31,28,0.07)',
    padding: 24,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  valueCardCompact: {
    width: '100%',
    minHeight: 0,
    padding: 20,
    borderRadius: 30,
  },
  catchGlyph: {
    width: 66,
    height: 66,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 4,
  },
  catchTitle: {
    color: '#202127',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  catchCopy: {
    marginTop: 12,
    color: '#5E5A56',
    fontSize: FONT_SIZE.base,
    lineHeight: 25,
  },
  whenSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  whenGrid: {
    marginTop: 52,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  whenGridCompact: {
    flexDirection: 'column',
  },
  whenPhone: {
    marginTop: 52,
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 44,
    backgroundColor: 'rgba(255,249,239,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.11,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 20 },
  },
  whenPhoneCompact: {
    borderRadius: 34,
    padding: 16,
    marginTop: 34,
  },
  whenPhoneTop: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  whenPhoneLabel: {
    color: '#202127',
    fontSize: 18,
    fontWeight: '800',
  },
  whenPhoneChip: {
    shadowOpacity: 0,
  },
  whenRail: {
    position: 'absolute',
    left: 55,
    top: 94,
    bottom: 34,
    width: 1,
    backgroundColor: 'rgba(36,33,31,0.12)',
  },
  whenMoment: {
    width: '100%',
    minHeight: 92,
    borderRadius: 28,
    backgroundColor: 'rgba(247,241,232,0.54)',
    borderWidth: 1,
    borderColor: 'rgba(34,31,28,0.07)',
    padding: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  whenMomentCompact: {
    minHeight: 0,
    borderRadius: 24,
    padding: 14,
  },
  whenMomentActive: {
    backgroundColor: 'rgba(255,252,245,0.94)',
    borderColor: 'rgba(140,125,177,0.24)',
  },
  whenMomentGlyph: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  whenMomentText: {
    flex: 1,
  },
  whenIndex: {
    color: '#BBB1A6',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  whenTitle: {
    marginTop: 4,
    color: '#202127',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
  },
  whenCopy: {
    marginTop: 10,
    color: '#5E5A56',
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
  whenCopyMuted: {
    opacity: 0.72,
  },
  signalPathIntro: {
    maxWidth: 700,
    marginTop: 18,
    color: '#655F58',
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '300',
  },
  returnSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  returnPath: {
    marginTop: 58,
    flexDirection: 'row',
    gap: 18,
    position: 'relative',
  },
  returnPathCompact: {
    flexDirection: 'column',
    marginTop: 34,
  },
  returnLine: {
    position: 'absolute',
    left: 80,
    right: 80,
    top: 32,
    height: 1,
    backgroundColor: 'rgba(36,33,31,0.12)',
  },
  returnCard: {
    flex: 1,
    minHeight: 260,
    borderRadius: 38,
    backgroundColor: 'rgba(255,249,239,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    padding: 24,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  returnCardCompact: {
    minHeight: 0,
    borderRadius: 30,
    padding: 20,
  },
  returnNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,252,245,0.92)',
    marginBottom: 34,
  },
  returnTitle: {
    color: '#202127',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '700',
  },
  returnCopy: {
    marginTop: 12,
    color: '#5E5A56',
    fontSize: FONT_SIZE.base,
    lineHeight: 26,
  },
  notesSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 150,
  },
  notesGrid: {
    marginTop: 52,
    flexDirection: 'row',
    gap: 16,
  },
  notesGridCompact: {
    flexDirection: 'column',
    marginTop: 34,
    gap: 14,
  },
  noteCard: {
    flex: 1,
    minHeight: 300,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  noteCardCompact: {
    minHeight: 220,
    borderRadius: 30,
  },
  noteGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  noteTag: {
    color: '#8C857B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  noteTitle: {
    color: '#202127',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  noteCopy: {
    marginTop: 12,
    color: '#655F58',
    fontSize: FONT_SIZE.sm,
    lineHeight: 23,
  },
  notesCta: {
    marginTop: 28,
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: RADIUS.full,
    backgroundColor: MIRAR.darkChamber,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  notesCtaText: {
    color: '#FFF8ED',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  notesCtaArrow: {
    color: '#F4C89C',
    fontSize: 15,
    fontWeight: '800',
  },
  socialSection: {
    backgroundColor: MIRAR.ivory,
    paddingHorizontal: 40,
    paddingVertical: 150,
    overflow: 'hidden',
  },
  socialGrid: {
    marginTop: 52,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  socialGridCompact: {
    flexDirection: 'column',
    marginTop: 34,
    gap: 14,
  },
  socialCard: {
    width: '32%',
    minHeight: 260,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.08)',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  socialCardInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  socialCardTitle: {
    color: '#202127',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  socialCardTitleDark: {
    color: '#FFF8ED',
  },
  socialCardCopy: {
    color: '#5E5A56',
    fontSize: FONT_SIZE.sm,
    lineHeight: 23,
  },
  socialCardCopyDark: {
    color: 'rgba(255,248,237,0.74)',
  },
  ecosystemLinks: {
    marginTop: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ecosystemPill: {
    minHeight: 48,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.1)',
    backgroundColor: 'rgba(255,252,245,0.72)',
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B5044',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  ecosystemText: {
    color: '#202127',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  contactNote: {
    marginTop: SPACING.md,
    color: '#655F58',
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  footerLinks: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  footerLinkPill: {
    minHeight: 42,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.1)',
    backgroundColor: 'rgba(255,252,245,0.66)',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinkText: {
    color: '#514D48',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  footerCta: {
    marginTop: 28,
    minHeight: 50,
    borderRadius: RADIUS.full,
    backgroundColor: '#202127',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#202127',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  footerCtaText: {
    color: '#FFF8ED',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  footer: {
    backgroundColor: '#F7F1E6',
    paddingHorizontal: 40,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footerText: {
    color: '#8C857B',
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.8,
  },
  portalSection: {
    backgroundColor: MIRAR.paper,
    paddingHorizontal: 40,
    paddingVertical: 96,
    overflow: 'hidden',
  },
  portalStage: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    minHeight: 520,
    alignSelf: 'center',
    borderRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,249,239,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(125,99,230,0.1)',
    shadowColor: MIRAR.violet,
    shadowOpacity: 0.12,
    shadowRadius: 70,
    shadowOffset: { width: 0, height: 34 },
  },
  portalStageCompact: {
    minHeight: 390,
    borderRadius: 34,
    paddingHorizontal: 20,
  },
  portalOuterGlow: {
    position: 'absolute',
    width: 680,
    height: 430,
    borderRadius: 340,
    backgroundColor: 'rgba(185,167,255,0.28)',
  },
  portalLightSweep: {
    position: 'absolute',
    width: 360,
    height: 620,
    borderRadius: 220,
    backgroundColor: 'rgba(255,181,138,0.24)',
    transform: [{ rotate: '28deg' }],
  },
  portalRingOne: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: 'rgba(34,31,28,0.08)',
  },
  portalRingTwo: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
  },
  portalMark: {
    position: 'absolute',
    width: 180,
    height: 240,
    opacity: 0.18,
  },
  portalCopy: {
    maxWidth: 760,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  portalKicker: {
    color: MIRAR.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.6,
    marginBottom: 24,
  },
  portalTitle: {
    textAlign: 'center',
    color: MIRAR.ink,
    fontSize: 58,
    lineHeight: 64,
    fontWeight: '300',
  },
  portalTitleCompact: {
    fontSize: 31,
    lineHeight: 37,
  },
  portalBody: {
    maxWidth: 560,
    marginTop: 24,
    textAlign: 'center',
    color: '#5F574F',
    fontSize: 19,
    lineHeight: 31,
    fontWeight: '300',
  },
});

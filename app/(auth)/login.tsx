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

const QUESTION_OPTIONS = [
  'I feel clear, but stretched',
  'I’m moving, but not fully present',
  'Something feels quietly off',
];

const TRUST_PILLS = ['Private beta', 'Less than 2 minutes', 'No social feed', 'Mirror, not verdict'];

const OUTER_SIGNALS = ['Calendar', 'Steps', 'Sleep', 'Messages', 'Work', 'Money'];
const INNER_SIGNALS = ['Direction', 'Energy', 'Attention', 'Connection'];

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
    <View style={styles.formWrap}>
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

function Header({ onCtaPress, compact }: { onCtaPress: () => void; compact: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.headerShell}>
      <View style={styles.header}>
        <BrandLogo compact={compact} />
        <View style={styles.headerRight}>
          {!compact && <LanguagePicker variant="inline" />}
          <TouchableOpacity onPress={onCtaPress} activeOpacity={0.82} style={[styles.headerCta, webPointer]}>
            <Text style={styles.headerCtaText}>Start your mirror</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    <View style={styles.behaviorSectionV2}>
      <View style={styles.gridWash} />
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={styles.sectionCopy}>
          <SectionLabel>THE QUIET GAP</SectionLabel>
          <Text style={styles.sectionTitle}>We check everything except ourselves.</Text>
          <Text style={styles.sectionBody}>
            Your calendar knows where you need to be. Your phone knows how much you moved. Your apps know what you clicked.
          </Text>
          <Text style={styles.sectionBody}>
            But the quieter signals — your energy, attention, direction, and connection — often go unseen until they become impossible to ignore.
          </Text>
        </View>
        <View style={[styles.trackingField, compact && styles.trackingFieldCompact]}>
          <View style={styles.trackingOrb} />
          <View style={styles.trackingFieldHeader}>
            <Text style={styles.compareLabel}>External tracking</Text>
            <Text style={styles.compareLabelActive}>Inner signals</Text>
          </View>
          <View style={[styles.trackingRows, compact && styles.trackingRowsCompact]}>
            <View style={styles.trackingColumn}>
              {OUTER_SIGNALS.map((signal, index) => (
                <TrackingChip key={signal} label={signal} index={index} />
              ))}
            </View>
            <View style={styles.flowBridge}>
              <Svg viewBox="0 0 220 180" width="100%" height="100%">
                <Path d="M8 32 C82 18 112 74 212 52" stroke="rgba(141,125,177,0.24)" strokeWidth="1.2" fill="none" />
                <Path d="M10 94 C82 110 134 82 212 118" stroke="rgba(201,139,85,0.22)" strokeWidth="1.2" fill="none" />
                <Path d="M18 150 C82 118 132 156 206 142" stroke="rgba(111,147,184,0.2)" strokeWidth="1.2" fill="none" />
              </Svg>
              <Animated.View style={[styles.flowPulse, pulseStyle]} />
            </View>
            <View style={styles.innerSignalStack}>
              {INNER_SIGNALS.map((signal, index) => (
                <SignalChip key={signal} label={signal} color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active style={styles.innerSignalGlow} />
              ))}
            </View>
          </View>
          <Text style={styles.trackingFootnote}>External tools record behavior. Mirar notices the quieter pattern underneath.</Text>
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
  return (
    <View style={styles.infoSection}>
      <View style={styles.sectionInner}>
        <SectionLabel>WHAT MIRAR IS</SectionLabel>
        <Text style={styles.sectionTitle}>A small system for noticing what usually goes unseen.</Text>
        <View style={[styles.infoCardRow, compact && styles.infoCardRowCompact]}>
          {INFO_CARDS.map(([title, copy, color], index) => (
            <Animated.View key={title} entering={FadeInUp.duration(560).delay(index * 80)} style={styles.infoCardWrap}>
              <InteractiveSurface style={styles.infoCard} hoverStyle={styles.surfaceHover} pressedStyle={styles.surfacePressed}>
                <View style={[styles.infoGlyph, { borderColor: color as string }]}>
                  <SignalDot color={color as string} active={index === 1} />
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
    <View style={styles.misalignmentSection}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={styles.sectionCopy}>
          <SectionLabel>EARLIER VISIBILITY</SectionLabel>
          <Text style={styles.sectionTitle}>Earlier visibility into internal misalignment.</Text>
          <Text style={styles.sectionBody}>So you can respond with clarity instead of reaction.</Text>
          <Text style={styles.sectionBody}>
            Misalignment rarely arrives all at once. It builds quietly as context shifts, responsibilities grow, priorities evolve, energy fluctuates, and needs change.
          </Text>
          <Text style={styles.sectionBody}>
            But many decisions continue to be made as if nothing has shifted. Mirar helps surface those signals earlier — before reaction becomes the default response.
          </Text>
        </View>
        <View style={styles.driftMap}>
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
  return (
    <View style={styles.hygieneSection}>
      <View style={styles.sectionInner}>
        <View style={[styles.hygieneHeader, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>WHY HYGIENE</SectionLabel>
            <Text style={styles.sectionTitle}>Why Mirar is built as hygiene.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>Hygiene is maintenance, not fixing.</Text>
        </View>
        <View style={[styles.hygieneSystem, compact && styles.hygieneSystemCompact]}>
          <View style={styles.hygieneOrb}>
            <Image source={MARK} style={styles.hygieneMark} resizeMode="contain" />
          </View>
          <View style={styles.hygieneColumn}>
            {['body', 'finances', 'calendar'].map((item, index) => (
              <View key={item} style={styles.maintenanceChip}>
                <MiniGlyph type={index === 0 ? 'Steps' : index === 1 ? 'Money' : 'Calendar'} />
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
            {['energy', 'attention', 'direction'].map((item, index) => (
              <SignalChip key={item} label={item} color={SIGNAL_AREAS[index]?.[2] ?? '#8C7DB1'} active style={styles.hygieneSignal} />
            ))}
          </View>
        </View>
        <Text style={styles.hygieneCopy}>
          We maintain our bodies before illness. We maintain our finances before crisis. We maintain our calendars before chaos. Mirar applies the same principle internally, so decisions stay grounded as life evolves.
        </Text>
      </View>
    </View>
  );
}

function BetaSection({ compact }: { compact: boolean }) {
  return (
    <View style={styles.betaSection}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={styles.sectionCopy}>
          <SectionLabel>BETA EXPERIENCE</SectionLabel>
          <Text style={styles.sectionTitle}>How the beta works.</Text>
          <Text style={styles.sectionBody}>Mirar Beta is a small, private 28-day experience.</Text>
          <Text style={styles.sectionBody}>
            Each day, you receive one short check-in designed to help you notice your current internal state — without analysis, storytelling, or pressure to explain yourself.
          </Text>
          <Text style={styles.sectionBody}>There is nothing to score. Nothing to perform. Nothing to prove.</Text>
        </View>
        <View style={styles.betaTimeline}>
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
    <View style={styles.faqSection}>
      <View style={styles.sectionInner}>
        <SectionLabel>FAQ</SectionLabel>
        <Text style={styles.sectionTitle}>Frequently asked questions</Text>
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
    <View style={styles.founderSection}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={[styles.founderPortraitCard, compact && styles.founderPortraitCardCompact]}>
          <Image source={FOUNDER_PHOTO} style={styles.founderPhoto} resizeMode="cover" />
          <View style={styles.founderPhotoGlow} />
          <Text style={[styles.founderQuote, compact && styles.founderQuoteCompact]}>“Most drift isn’t caused by failure. It’s caused by outdated internal assumptions.”</Text>
        </View>
        <View style={styles.founderCopy}>
          <SectionLabel>FOUNDER</SectionLabel>
          <Text style={styles.sectionTitle}>Built from lived drift, research, and recalibration.</Text>
          <Text style={styles.founderName}>About Dr. Sahil Haria | Founder</Text>
          <Text style={styles.sectionBody}>
            Over the last 15+ years, my life has moved across very different phases: building companies, working across countries, returning home after years abroad, and starting again professionally.
          </Text>
          <Text style={styles.sectionBody}>
            On the surface, things often looked successful. Internally, the experience was different. As priorities changed, energy fluctuated, and responsibilities evolved, I noticed that many decisions were still being made from an older internal reference point.
          </Text>
          <Text style={styles.sectionBody}>
            Alongside lived experience, my doctoral research focused on decision-making and adaptation: how internal models update under changing conditions. Mirar grew from that intersection.
          </Text>
        </View>
      </View>
    </View>
  );
}

function ContactFooter({ onCtaPress }: { onCtaPress: () => void }) {
  const openEmail = () => Linking.openURL('mailto:mirar.life@gmail.com');

  return (
    <View style={styles.contactFooter}>
      <View style={styles.footerGlow} />
      <View style={styles.contactInner}>
        <Image source={FULL_LOGO} style={styles.contactLogo} resizeMode="contain" />
        <Text style={styles.contactTitle}>Questions about the beta or the project?</Text>
        <InteractiveSurface onPress={openEmail} style={styles.emailPill} hoverStyle={styles.emailPillHover} pressedStyle={styles.surfacePressed}>
          <Text style={styles.emailText}>mirar.life@gmail.com</Text>
        </InteractiveSurface>
        <Text style={styles.contactNote}>This is an early-stage project. Responses may be slow by design.</Text>
        <TouchableOpacity onPress={onCtaPress} activeOpacity={0.82} style={[styles.footerCta, webPointer]}>
          <Text style={styles.footerCtaText}>Start your daily mirror</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Private beta · © 2026 Mirar</Text>
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
    <View style={styles.processSectionV2}>
      <View style={styles.sectionInner}>
        <SectionLabel>HOW IT WORKS</SectionLabel>
        <Text style={styles.sectionTitle}>One small answer. A signal begins to form.</Text>
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

function ProductSurface({ title, lead, items, index }: { title: string; lead: string; items: string[]; index: number }) {
  const float = useLoopingValue(true);
  const surfaceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (index - 1) * 16 + float.value * (index % 2 === 0 ? -8 : 8) },
      { rotate: `${(index - 1) * 1.4 + float.value * (index % 2 === 0 ? 0.6 : -0.6)}deg` },
    ],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(620).delay(index * 100)} style={[styles.productSurface, index === 1 && styles.productSurfaceCenter, surfaceStyle]}>
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
    <View style={styles.insideSection}>
      <View style={styles.sectionInner}>
        <View style={[styles.insideIntro, compact && styles.insideIntroCompact]}>
          <View>
            <SectionLabel>INSIDE THE MIRROR</SectionLabel>
            <Text style={styles.sectionTitle}>The product feels like a private instrument.</Text>
          </View>
          <Text style={styles.sectionBodyTight}>
            One question, a few honest options, and a soft read on the signal forming underneath.
          </Text>
        </View>
        <View style={[styles.productGallery, compact && styles.productGalleryCompact]}>
          <View style={styles.galleryOrb} />
          {PRODUCT_SURFACES.map(([title, lead, items], index) => (
            <ProductSurface key={title as string} title={title as string} lead={lead as string} items={items as string[]} index={index} />
          ))}
        </View>
      </View>
    </View>
  );
}

function SignalAreasSection({ compact }: { compact: boolean }) {
  return (
    <View style={styles.signalAreasSectionV2}>
      <View style={styles.sectionInner}>
        <SectionLabel>SIGNAL AREAS</SectionLabel>
        <Text style={styles.sectionTitle}>Six quiet dimensions. One living system.</Text>
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
    <View style={styles.patternSection}>
      <View style={[styles.sectionGrid, compact && styles.sectionStack]}>
        <View style={styles.patternInstrument}>
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
        <View style={styles.sectionCopy}>
          <SectionLabel>PATTERN OVER TIME</SectionLabel>
          <Text style={styles.sectionTitle}>A single answer is small. Repeated answers become a mirror.</Text>
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
    <LinearGradient colors={['#272A32', '#1F2028', '#2B2526']} style={styles.privacySection}>
      <Animated.View style={[styles.privacyOrbV2, compact && styles.privacyOrbCompactV2, chamberGlow]} />
      <View style={styles.privacyRingOne} />
      <View style={styles.privacyRingTwo} />
      <View style={styles.sectionInner}>
        <SectionLabel inverse>PRIVATE BY DESIGN</SectionLabel>
        <Text style={styles.privacyTitle}>Your inner life should not become content.</Text>
        <Text style={styles.privacyBody}>
          No public profile. No social feed. No pressure to share. No need to perform clarity.
        </Text>
        <Text style={styles.privacyLead}>Just a quiet place to return to yourself.</Text>
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
}: {
  form: React.ReactNode;
}) {
  const breath = useLoopingValue(true);
  const orbStyle = useAnimatedStyle(() => ({
    opacity: 0.46 + breath.value * 0.2,
    transform: [{ scale: 0.97 + breath.value * 0.06 }],
  }));

  return (
    <View style={styles.finalCtaV2}>
      <Animated.View style={[styles.finalOrb, orbStyle]} />
      <Image source={FULL_LOGO} style={styles.finalLogo} resizeMode="contain" />
      <Text style={styles.finalTitle}>You do not need to fix your life today.</Text>
      <Text style={styles.finalSub}>Just notice what is true.</Text>
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
  const ctaProps = { email, setEmail, sent, setSent, error, onSubmit, isLoading, compact };
  const form = <CTAForm {...ctaProps} />;

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

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
          <Header onCtaPress={scrollToTop} compact={compact} />
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
          <BehaviorGapSection compact={compact} />
          <InfoSystemSection compact={compact} />
          <MisalignmentSection compact={compact} />
          <HygieneSection compact={compact} />
          <BetaSection compact={compact} />
          <SignalPathSection compact={compact} />
          <InsideMirrorSection compact={compact} />
          <SignalAreasSection compact={compact} />
          <PatternTimelineSection compact={compact} />
          <PrivacySection compact={compact} />
          <FAQSection compact={compact} />
          <FounderSection compact={compact} />
          <FinalCta form={<CTAForm {...ctaProps} compact={compact} />} />
          <ContactFooter onCtaPress={scrollToTop} />
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
    backgroundColor: '#F7F1E6',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F7F1E6',
  },
  page: {
    flexGrow: 1,
  },
  headerShell: {
    backgroundColor: 'rgba(247,241,230,0.74)',
    paddingHorizontal: 40,
    paddingTop: 18,
    paddingBottom: 10,
    zIndex: 40,
    ...(isWeb ? ({ backdropFilter: 'blur(22px)' } as any) : null),
  },
  header: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    backgroundColor: 'rgba(255,252,245,0.62)',
    paddingHorizontal: 20,
    shadowColor: '#5B5044',
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
  },
  logoWrap: {
    justifyContent: 'center',
  },
  wordmark: {
    width: 156,
    height: 52,
  },
  wordmarkCompact: {
    width: 132,
    height: 44,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerCta: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    backgroundColor: '#202127',
    paddingHorizontal: 22,
    shadowColor: '#202127',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  headerCtaText: {
    color: '#FFF8ED',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  heroShell: {
    minHeight: 780,
    backgroundColor: '#F7F1E6',
    overflow: 'visible',
    position: 'relative',
    paddingHorizontal: 40,
    paddingTop: 34,
    paddingBottom: 96,
  },
  heroShellCompact: {
    minHeight: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 80,
  },
  heroBackdropLavender: {
    position: 'absolute',
    width: 640,
    height: 640,
    borderRadius: 320,
    right: -150,
    top: 14,
    backgroundColor: 'rgba(183,184,234,0.22)',
  },
  heroBackdropPeach: {
    position: 'absolute',
    width: 520,
    height: 360,
    borderRadius: 260,
    left: -120,
    bottom: 34,
    backgroundColor: 'rgba(245,181,133,0.25)',
  },
  heroBackdropSage: {
    position: 'absolute',
    width: 360,
    height: 280,
    borderRadius: 180,
    left: '42%',
    top: 160,
    backgroundColor: 'rgba(190,218,205,0.17)',
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
    gap: 18,
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
    color: '#202127',
    fontSize: 84,
    lineHeight: 84,
    letterSpacing: 0,
    fontWeight: '300',
  },
  heroTitleCompact: {
    fontSize: 44,
    lineHeight: 47,
    letterSpacing: 0,
  },
  heroSub: {
    maxWidth: 620,
    marginTop: 28,
    color: '#5E5A56',
    fontSize: 21,
    lineHeight: 34,
    fontWeight: '300',
  },
  heroSubCompact: {
    fontSize: 16,
    lineHeight: 26,
    marginTop: 18,
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
    marginTop: 6,
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
    backgroundColor: 'rgba(255,252,245,0.55)',
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
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formRowCompact: {
    flexDirection: 'column',
  },
  emailInput: {
    flex: 1,
    minHeight: 62,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.12)',
    backgroundColor: 'rgba(255,252,245,0.72)',
    color: '#202127',
    fontSize: FONT_SIZE.base,
    paddingHorizontal: 22,
    shadowColor: '#5B5044',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  emailInputCompact: {
    minHeight: 58,
  },
  primaryButton: {
    minHeight: 62,
    borderRadius: 19,
    backgroundColor: '#202127',
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#202127',
    shadowOpacity: 0.24,
    shadowRadius: 24,
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
    color: '#F4C89C',
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
    minHeight: 500,
    marginTop: 10,
    marginBottom: 14,
  },
  sceneLightColumn: {
    position: 'absolute',
    width: 300,
    height: 620,
    borderRadius: 170,
    right: 18,
    top: 12,
    backgroundColor: 'rgba(164,176,207,0.16)',
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
    width: 350,
    height: 430,
    alignSelf: 'center',
  },
  mirrorGlow: {
    position: 'absolute',
    width: '88%',
    height: '78%',
    borderRadius: 280,
    backgroundColor: 'rgba(181,176,229,0.38)',
  },
  mirrorAuraBlue: {
    position: 'absolute',
    right: 38,
    top: 92,
    width: '58%',
    height: '34%',
    borderRadius: 180,
    backgroundColor: 'rgba(153,190,229,0.42)',
  },
  mirrorAuraPeach: {
    position: 'absolute',
    bottom: 82,
    width: '72%',
    height: '36%',
    borderRadius: 190,
    backgroundColor: 'rgba(246,171,119,0.46)',
  },
  mirrorOrbShell: {
    width: '68%',
    height: '78%',
    borderRadius: 260,
    overflow: 'hidden',
    shadowColor: '#5E5866',
    shadowOpacity: 0.26,
    shadowRadius: 56,
    shadowOffset: { width: 0, height: 32 },
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
    top: 78,
    right: 12,
  },
  sceneChipEnergyCompact: {
    top: 196,
    right: -2,
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
    borderRadius: 34,
    backgroundColor: 'rgba(255,252,245,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.1)',
    padding: 26,
    shadowColor: '#493F38',
    shadowOpacity: 0.18,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 26 },
  },
  questionCardCompact: {
    width: '100%',
    maxWidth: 348,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    borderRadius: 28,
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
    marginTop: 20,
    fontSize: 26,
    lineHeight: 31,
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
    gap: 34,
  },
  sectionCopy: {
    flex: 1,
  },
  sectionLabel: {
    color: '#8C857B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginBottom: 22,
  },
  sectionLabelInverse: {
    color: 'rgba(255,248,237,0.54)',
  },
  sectionTitle: {
    maxWidth: 780,
    color: '#202127',
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: 0,
    fontWeight: '300',
  },
  sectionBody: {
    maxWidth: 680,
    marginTop: 22,
    color: '#5E5A56',
    fontSize: 19,
    lineHeight: 32,
    fontWeight: '300',
  },
  behaviorSectionV2: {
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 40,
    paddingVertical: 118,
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
    backgroundColor: '#EFE7DA',
    paddingHorizontal: 40,
    paddingVertical: 118,
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
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 40,
    paddingVertical: 118,
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
  },
  privacyTitle: {
    maxWidth: 780,
    color: '#FFF8ED',
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: 0,
    fontWeight: '300',
  },
  privacyBody: {
    maxWidth: 650,
    marginTop: SPACING.xl,
    color: 'rgba(255,248,237,0.76)',
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '300',
  },
  privacyLead: {
    marginTop: SPACING.lg,
    color: '#FFF8ED',
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '500',
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
    backgroundColor: '#F7F1E6',
    paddingHorizontal: 40,
    paddingVertical: 116,
    alignItems: 'center',
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
  finalSub: {
    marginTop: SPACING.md,
    marginBottom: -4,
    textAlign: 'center',
    color: '#655F58',
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '300',
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
    minHeight: 560,
    padding: 22,
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
  },
  trackingColumn: {
    flex: 0.75,
    gap: 10,
  },
  trackingChip: {
    alignSelf: 'flex-start',
    minHeight: 44,
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
  innerSignalGlow: {
    backgroundColor: 'rgba(255,252,245,0.86)',
  },
  trackingFootnote: {
    color: '#7B736A',
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
    maxWidth: 420,
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
    padding: 22,
    borderRadius: 34,
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
    minHeight: 126,
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
    backgroundColor: '#F7F1E6',
    paddingHorizontal: 40,
    paddingVertical: 132,
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
    gap: 10,
  },
  sectionBodyTight: {
    maxWidth: 420,
    color: '#5E5A56',
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
    gap: 18,
  },
  galleryOrb: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(184,190,230,0.2)',
  },
  productSurface: {
    width: 350,
    minHeight: 430,
    borderRadius: 42,
    padding: 26,
    backgroundColor: 'rgba(255,252,245,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.09)',
    shadowColor: '#493F38',
    shadowOpacity: 0.14,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 22 },
  },
  productSurfaceCenter: {
    minHeight: 480,
    zIndex: 4,
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
  },
  signalAreaOne: { marginTop: 16 },
  signalAreaTwo: { marginTop: 0 },
  signalAreaThree: { marginTop: 32 },
  signalAreaFour: { marginTop: -2 },
  signalAreaFive: { marginTop: 24 },
  signalAreaSix: { marginTop: 8 },
  patternSection: {
    backgroundColor: '#F0E8DC',
    paddingHorizontal: 40,
    paddingVertical: 132,
    overflow: 'hidden',
  },
  patternInstrument: {
    flex: 1,
    minHeight: 390,
    borderRadius: 46,
    backgroundColor: 'rgba(255,252,245,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
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
    backgroundColor: '#F7F1E6',
    paddingHorizontal: 40,
    paddingVertical: 126,
    overflow: 'hidden',
  },
  infoCardRow: {
    marginTop: 54,
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  infoCardRowCompact: {
    flexDirection: 'column',
  },
  infoCardWrap: {
    flex: 1,
  },
  infoCard: {
    minHeight: 330,
    borderRadius: 36,
    padding: 28,
    backgroundColor: 'rgba(255,252,245,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    shadowColor: '#5B5044',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
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
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 40,
    paddingVertical: 128,
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
    backgroundColor: '#F0E8DC',
    paddingHorizontal: 40,
    paddingVertical: 132,
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
    borderRadius: 46,
    backgroundColor: 'rgba(255,252,245,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    padding: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  hygieneSystemCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 22,
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
  hygieneMark: {
    width: 70,
    height: 104,
    opacity: 0.34,
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
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 40,
    paddingVertical: 128,
  },
  betaTimeline: {
    flex: 0.88,
    minHeight: 480,
    borderRadius: 46,
    backgroundColor: 'rgba(247,241,230,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    padding: 34,
    position: 'relative',
    gap: 22,
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
    backgroundColor: 'rgba(255,252,245,0.9)',
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
    backgroundColor: '#FFF9EF',
    paddingHorizontal: 40,
    paddingVertical: 132,
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
  },
  faqItem: {
    width: '49%',
    borderRadius: 28,
    backgroundColor: 'rgba(255,252,245,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(36,33,31,0.08)',
    padding: 20,
    shadowColor: '#5B5044',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  faqItemCompact: {
    width: '100%',
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
    backgroundColor: '#F0E8DC',
    paddingHorizontal: 40,
    paddingVertical: 132,
    overflow: 'hidden',
  },
  founderPortraitCard: {
    flex: 0.78,
    minHeight: 650,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#202127',
    position: 'relative',
    shadowColor: '#202127',
    shadowOpacity: 0.2,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 26 },
  },
  founderPortraitCardCompact: {
    minHeight: 520,
    borderRadius: 38,
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
    height: '52%',
    backgroundColor: 'rgba(32,33,39,0.58)',
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
    fontSize: 25,
    lineHeight: 33,
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
    backgroundColor: '#F7F1E6',
    paddingHorizontal: 40,
    paddingVertical: 94,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  footerGlow: {
    position: 'absolute',
    top: 30,
    width: 420,
    height: 280,
    borderRadius: 210,
    backgroundColor: 'rgba(184,190,230,0.16)',
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
  contactNote: {
    marginTop: SPACING.md,
    color: '#655F58',
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    textAlign: 'center',
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
});

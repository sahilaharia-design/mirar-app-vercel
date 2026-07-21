import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { BreathingMirror } from '../../components/ui/BreathingMirror';
import { OptionCard } from '../../components/assess/OptionCard';
import { AlignmentRing } from '../../components/home/AlignmentRing';
import { useAssessStore } from '../../stores/assess-store';
import { useAuthStore } from '../../stores/auth-store';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/with-timeout';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

// ── How-it-works icons — consistent 1.5px stroke, matches landing site ─────
function IconQuestion() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={2} fill={COLORS.slateMid} />
      <Circle cx={11} cy={11} r={7} stroke={COLORS.slateMid} strokeWidth={1.25} opacity={0.5} />
      <Circle cx={11} cy={11} r={10} stroke={COLORS.slateMid} strokeWidth={1.25} opacity={0.22} />
    </Svg>
  );
}
function IconAnswer() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4 11.5L9 16L18 6"
        stroke={COLORS.slateMid}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function IconSignal() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path
        d="M2 11H5.5L8 5L12 17L15 9L17 11H20"
        stroke={COLORS.slateMid}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ONBOARDING_KEY = 'mirar_onboarding_done';

// Stable ids — displayed via t('shared.q1_options.<id>') so English/Hindi/
// Gujarati selections all resolve to the same underlying value. Shared with
// app/assess/index.tsx (pre-auth path) so pre-filled selections match up.
const Q1_IDS = ['understand', 'off', 'habit', 'transition', 'reactivity', 'recommended', 'curious'] as const;

const Q2_CODES = ['IAP', 'EWB', 'FAF', 'RC', 'GAL', 'RA'] as const;
const Q2_COLORS: Record<string, string> = {
  IAP: '#7C6FA0',
  EWB: '#C07840',
  FAF: '#4A7CA8',
  RC: '#6A9870',
  GAL: '#A0884A',
  RA: '#B85A4A',
};

// Steps 1–6 map onto 4 visible "chapters": Welcome / How it works / About you / Your signal.
function chapterForStep(step: number): number {
  if (step <= 2) return step;
  if (step <= 5) return 3;
  return 4;
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dotStyles.dot, i < current ? dotStyles.dotActive : dotStyles.dotInactive]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: COLORS.slate },
  dotInactive: { backgroundColor: COLORS.border },
});

export default function OnboardingWizard() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [q1Selections, setQ1Selections] = useState<string[]>([]);
  const [q2Selections, setQ2Selections] = useState<string[]>([]);
  const [q2Index, setQ2Index] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const q1RevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { session } = useAuthStore();
  const assessStore = useAssessStore();

  // Returning user check — if already done, skip straight to tabs
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      if (v === 'true') router.replace('/(tabs)/');
    });
  }, []);

  // Pre-fill from assess-store (OAuth users who went through /assess/ pre-auth)
  useEffect(() => {
    if (assessStore.q1.length > 0) setQ1Selections(assessStore.q1);
    if (assessStore.q2.length > 0) setQ2Selections(assessStore.q2);
  }, []);

  // Step 4 (Q1 reveal) auto-advances after a beat — tap anywhere to skip ahead.
  useEffect(() => {
    if (step === 4) {
      q1RevealTimer.current = setTimeout(() => setStep(5), 2200);
      return () => {
        if (q1RevealTimer.current) clearTimeout(q1RevealTimer.current);
      };
    }
  }, [step]);

  const toggleQ1 = (opt: string) => {
    setQ1Selections((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  const toggleQ2 = (code: string) => {
    setQ2Selections((prev) => {
      if (prev.includes(code)) return prev.filter((x) => x !== code);
      if (prev.length >= 3) return prev;
      return [...prev, code];
    });
  };

  const handleFinish = async () => {
    setIsSaving(true);
    const userId = session?.user?.id;

    try {
      if (userId) {
        // Upsert assessment answers (may already exist if OAuth + assess/ path).
        // Best-effort — this is supplementary context, not required for the
        // account itself, so a failure here shouldn't strand the user on this
        // screen forever.
        const existing = assessStore.q1.length > 0 || assessStore.q2.length > 0;
        if (!existing) {
          try {
            await withTimeout(supabase.from('onboarding_assessments').upsert({
              user_id: userId,
              brought_here: q1Selections,
              misaligned_themes: q2Selections,
              checkin_frequency: null,
              last_felt_self: null,
            }, { onConflict: 'user_id' }));
          } catch (err) {
            console.error('[Mirar] saving onboarding assessment failed:', err);
          }
        }
        assessStore.reset();
      }

      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)/');
    } finally {
      setIsSaving(false);
    }
  };

  const next = () => setStep((s) => s + 1);

  // OAuth users who already answered via pre-auth /assess/ skip straight to the payoff.
  const nextFromHowItWorks = () => {
    if (assessStore.q1.length > 0 || assessStore.q2.length > 0) {
      setStep(6);
    } else {
      setStep(3);
    }
  };

  const skipReveal = () => {
    if (q1RevealTimer.current) clearTimeout(q1RevealTimer.current);
    setStep(5);
  };

  // Advance through Q2's sequential reveal — early-exits to the signal preview
  // once 3 are selected, respecting the two-minute promise.
  const advanceQ2 = (justSelected: boolean) => {
    const newCount = q2Selections.length + (justSelected ? 1 : 0);
    const nextIndex = q2Index + 1;
    if (newCount >= 3 || nextIndex >= Q2_CODES.length) {
      setStep(6);
    } else {
      setQ2Index(nextIndex);
    }
  };

  const handleQ2True = () => {
    toggleQ2(Q2_CODES[q2Index]);
    advanceQ2(true);
  };

  const handleQ2Skip = () => {
    advanceQ2(false);
  };

  // ── Step 1: Welcome ────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MirarLogo size="sm" />
          <ProgressDots total={4} current={1} />
        </View>
        <Animated.View entering={FadeIn.duration(500)} style={styles.bodyCenter}>
          <Animated.View entering={FadeIn.duration(700).delay(60)} style={styles.welcomeMirrorRow}>
            <BreathingMirror />
          </Animated.View>
          <Animated.Text entering={FadeInDown.duration(600).delay(100)} style={styles.displayTitle}>
            {t('wizard.welcome_title')}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(600).delay(250)} style={styles.bodyText}>
            {t('wizard.welcome_body')}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(600).delay(380)} style={styles.bodyMuted}>
            {t('wizard.welcome_muted')}
          </Animated.Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.footer}>
          <TouchableOpacity style={styles.ctaBtn} onPress={next} activeOpacity={0.82}>
            <Text style={styles.ctaBtnText}>{t('wizard.begin')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Step 2: How it works ───────────────────────────────────────────────────
  if (step === 2) {
    const howItWorks = [
      { key: 'question', Icon: IconQuestion, title: t('wizard.how_q_title'), desc: t('wizard.how_q_desc') },
      { key: 'answer', Icon: IconAnswer, title: t('wizard.how_a_title'), desc: t('wizard.how_a_desc') },
      { key: 'signal', Icon: IconSignal, title: t('wizard.how_s_title'), desc: t('wizard.how_s_desc') },
    ];
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MirarLogo size="sm" />
          <ProgressDots total={4} current={2} />
        </View>
        <Animated.View entering={FadeIn.duration(400)} style={styles.bodyCenter}>
          <Animated.Text entering={FadeInDown.duration(600).delay(80)} style={styles.displayTitle}>
            {t('wizard.how_title')}
          </Animated.Text>

          <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.howList}>
            {howItWorks.map((item, i) => (
              <Animated.View
                key={item.key}
                entering={FadeInRight.duration(500).delay(320 + i * 100)}
                style={styles.howRow}
              >
                <View style={styles.howIconWrap}>
                  <item.Icon />
                </View>
                <View style={styles.howTextBlock}>
                  <Text style={styles.howTitle}>{item.title}</Text>
                  <Text style={styles.howDesc}>{item.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.Text entering={FadeInDown.duration(500).delay(650)} style={styles.bodyMuted}>
            {t('wizard.how_muted')}
          </Animated.Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).delay(800)} style={styles.footer}>
          <TouchableOpacity style={styles.ctaBtn} onPress={nextFromHowItWorks} activeOpacity={0.82}>
            <Text style={styles.ctaBtnText}>{t('wizard.understood')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Step 3: Q1 — What brought you here? ───────────────────────────────────
  if (step === 3) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MirarLogo size="sm" />
          <ProgressDots total={4} current={3} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text entering={FadeInDown.duration(500).delay(60)} style={styles.questionTitle}>
            {t('wizard.q1_title')}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(500).delay(140)} style={styles.questionSub}>
            {t('wizard.q1_sub')}
          </Animated.Text>
          <Animated.View entering={FadeInDown.duration(500).delay(220)} style={styles.optionsList}>
            {Q1_IDS.map((id) => (
              <OptionCard
                key={id}
                label={t(`shared.q1_options.${id}`)}
                selected={q1Selections.includes(id)}
                onPress={() => toggleQ1(id)}
              />
            ))}
          </Animated.View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.ctaBtn, q1Selections.length === 0 && styles.ctaBtnDisabled]}
            onPress={next}
            disabled={q1Selections.length === 0}
            activeOpacity={0.82}
          >
            <Text style={styles.ctaBtnText}>{t('wizard.continue')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 4: Q1 reveal — the "we're paying attention" beat ─────────────────
  if (step === 4) {
    const topPick = Q1_IDS.find((id) => q1Selections.includes(id));
    const revealLine = topPick ? t(`wizard.reveal_${topPick}`) : t('wizard.reveal_default');
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MirarLogo size="sm" />
          <ProgressDots total={4} current={3} />
        </View>
        <TouchableOpacity style={styles.bodyCenter} activeOpacity={1} onPress={skipReveal}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.welcomeMirrorRow}>
            <BreathingMirror size={84} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.duration(500).delay(120)} style={styles.bodyText}>
            {revealLine}
          </Animated.Text>
          <Animated.Text entering={FadeIn.duration(500).delay(500)} style={styles.tapHint}>
            {t('wizard.tap_hint')}
          </Animated.Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Step 5: Q2 — one dimension at a time ──────────────────────────────────
  if (step === 5) {
    const code = Q2_CODES[q2Index];
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <MirarLogo size="sm" />
          <ProgressDots total={4} current={3} />
        </View>
        <View style={styles.bodyCenter}>
          <Text style={styles.q2ProgressText}>
            {t('wizard.q2_progress', { current: q2Index + 1, total: Q2_CODES.length })}
          </Text>
          <Animated.View key={code} entering={FadeInDown.duration(400)} style={styles.q2Card}>
            <View style={[styles.q2Dot, { backgroundColor: Q2_COLORS[code] }]} />
            <Text style={styles.q2Name}>{t(`shared.q2_dimensions.${code}.name`)}</Text>
            <Text style={styles.q2Desc}>{t(`shared.q2_dimensions.${code}.desc`)}</Text>
          </Animated.View>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleQ2True} activeOpacity={0.82}>
            <Text style={styles.ctaBtnText}>{t('wizard.q2_true')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={handleQ2Skip} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>{t('wizard.q2_skip')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 6: Signal preview — the payoff, then begin ───────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
        <ProgressDots total={4} current={4} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text entering={FadeInDown.duration(500).delay(60)} style={styles.questionTitle}>
          {t('wizard.signal_title')}
        </Animated.Text>

        <Animated.View entering={FadeIn.duration(600).delay(180)} style={styles.previewRingWrap}>
          <AlignmentRing score={null} status="Calibrating" trend={null} size={140} />
        </Animated.View>

        {q2Selections.length > 0 && (
          <View style={styles.previewCards}>
            {q2Selections.map((code, i) => {
              const color = Q2_COLORS[code];
              if (!color) return null;
              return (
                <Animated.View
                  key={code}
                  entering={FadeInDown.duration(400).delay(340 + i * 100)}
                  style={styles.previewCard}
                >
                  <View style={styles.previewCardHeader}>
                    <Text style={[styles.previewCardName, { color }]}>{t(`shared.q2_dimensions.${code}.name`)}</Text>
                    <View style={[styles.previewCardTag, { backgroundColor: `${color}1A` }]}>
                      <Text style={[styles.previewCardTagText, { color }]}>{t('wizard.noted_tag')}</Text>
                    </View>
                  </View>
                  <Text style={styles.previewCardDesc}>{t(`shared.q2_dimensions.${code}.desc`)}</Text>
                </Animated.View>
              );
            })}
          </View>
        )}

        <Animated.Text entering={FadeInDown.duration(500).delay(650)} style={styles.bodyMuted}>
          {t('wizard.signal_muted')}
        </Animated.Text>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaBtn, isSaving && styles.ctaBtnDisabled]}
          onPress={handleFinish}
          disabled={isSaving}
          activeOpacity={0.82}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.ctaBtnText}>{t('wizard.finish')}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  bodyCenter: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING['2xl'],
    gap: SPACING.xl,
    justifyContent: 'center',
  },
  welcomeMirrorRow: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  displayTitle: {
    fontSize: FONT_SIZE['3xl'],
    color: COLORS.slate,
    fontWeight: '200',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  bodyText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.slate,
    fontWeight: '300',
    lineHeight: 32,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  bodyMuted: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    fontWeight: '300',
    lineHeight: 28,
  },
  tapHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  howList: {
    gap: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  howIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  howTextBlock: { flex: 1, gap: 2 },
  howTitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    fontWeight: '500',
  },
  howDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  questionTitle: {
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.slate,
    fontWeight: '300',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  questionSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    marginTop: -SPACING.xs,
  },
  optionsList: { gap: SPACING.sm },
  // Step 5 — Q2 sequential
  q2ProgressText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  q2Card: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  q2Dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: SPACING.xs,
  },
  q2Name: {
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.slate,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  q2Desc: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    fontWeight: '300',
    lineHeight: 26,
    textAlign: 'center',
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    fontWeight: '400',
  },
  // Step 6 — signal preview
  previewRingWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  previewCards: {
    gap: SPACING.sm,
  },
  previewCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    gap: 4,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCardName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
  },
  previewCardTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  previewCardTagText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  previewCardDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  ctaBtn: {
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaBtnText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.white,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

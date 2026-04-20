/**
 * Mirar — Onboarding (rebuilt)
 * Brand: warm cream · slate text · blue-lavender→peach oval
 * Screens: What Mirar is · How it works · Privacy promise
 *
 * Deps: expo-linear-gradient, react-native-safe-area-context
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

// ─── Design tokens ───────────────────────────────────────────────────────────

const C = {
  bg:            '#F0EDE8',
  textPrimary:   '#4A4A55',
  textSecondary: '#7A7A85',
  textMuted:     '#AAAAAA',
  cardBg:        '#FAF8F5',
  dotInactive:   '#C5C0BA',
  ctaBg:         '#4A4A55',
  ctaText:       '#F0EDE8',
  ovalTop:       '#A8B4CE',
  ovalBottom:    '#E8A882',
};

// Serif: Georgia on iOS, generic serif on Android
const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
}) as string;

// ─── 6 alignment themes ───────────────────────────────────────────────────────

const THEMES = [
  { name: 'Inner Alignment\n& Purpose',  accent: '#8B9DC0' },
  { name: 'Energy &\nWell-being',        accent: '#E8A882' },
  { name: 'Focus &\nFlow',               accent: '#9EC0A8' },
  { name: 'Relational\nCapital',         accent: '#C0889A' },
  { name: 'Growth &\nLearning',          accent: '#A8C0C4' },
  { name: 'Resilience &\nAction',        accent: '#C8A882' },
];

// ─── Oval shape ───────────────────────────────────────────────────────────────

function Oval({
  width,
  height,
  topColor = C.ovalTop,
  bottomColor = C.ovalBottom,
  style,
}: {
  width: number;
  height: number;
  topColor?: string;
  bottomColor?: string;
  style?: object;
}) {
  return (
    <LinearGradient
      colors={[topColor, bottomColor]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[{ width, height, borderRadius: width / 2 }, style]}
    />
  );
}

// ─── Breathing oval (Screen 1 hero) ──────────────────────────────────────────

function BreathingOval() {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (reduced) return;
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.045,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [reduced]);

  return (
    <Animated.View
      style={{ opacity, transform: [{ scale }] }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Oval width={148} height={188} />
    </Animated.View>
  );
}

// ─── Nav bar ──────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <View style={s.navBar} accessibilityRole="header">
      <Oval width={18} height={24} />
      <Text style={s.navBrand}>Mirar</Text>
    </View>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({
  current,
  bottomInset,
}: {
  current: number;
  bottomInset: number;
}) {
  return (
    <View
      style={[s.dotsRow, { paddingBottom: Math.max(bottomInset, 20) }]}
      accessible
      accessibilityLabel={`Step ${current + 1} of 3`}
      accessibilityRole="progressbar"
    >
      {[0, 1, 2].map(i => (
        <View key={i} style={[s.dot, i === current && s.dotActive]} />
      ))}
    </View>
  );
}

// ─── Ghost CTA ────────────────────────────────────────────────────────────────

function GhostCTA({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.ghostBtn}
      activeOpacity={0.55}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={s.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen 1: What is Mirar ──────────────────────────────────────────────────
// Sequence: oval fades in → "Mirar" script appears → 2s hold → rest fades in

function Screen1({ onNext }: { onNext: () => void }) {
  const brandFade   = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(brandFade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={s.screen}>
      {/* Hero: breathing oval + brand name */}
      <View style={s.heroBlock}>
        <BreathingOval />
        <Animated.Text
          style={[s.brandScript, { opacity: brandFade }]}
          accessibilityElementsHidden
        >
          Mirar
        </Animated.Text>
      </View>

      {/* Body content fades in after 2s hold */}
      <Animated.View style={[s.contentBlock, { opacity: contentFade }]}>
        <Text style={s.headline} accessibilityRole="header">
          Your daily{'\n'}internal signal.
        </Text>
        <Text style={s.bodyText}>
          One honest question. Two minutes. Every day.
        </Text>
        <Text style={s.notText}>
          Not therapy. Not coaching. Not journaling.
        </Text>
      </Animated.View>

      <Animated.View style={[s.ctaBlock, { opacity: contentFade }]}>
        <GhostCTA label="See how it works →" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

// ─── Screen 2: How it works ───────────────────────────────────────────────────

const HOW_STEPS = [
  'One check-in per day. Signals across six themes.',
  'The system reflects patterns back. No interpretation.',
  'Drift detected before you notice it yourself.',
];

function Screen2({ onNext }: { onNext: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const cardW = (W - 28 * 2 - 12) / 2;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView
      style={{ width: W }}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade }}>

        <Text style={s.eyebrow}>SIX THEMES</Text>

        {/* 2-column theme grid */}
        <View style={s.themeGrid}>
          {THEMES.map((theme, i) => (
            <View key={i} style={{ width: cardW }}>
              <View
                style={s.themeCard}
                accessible
                accessibilityLabel={theme.name.replace('\n', ' ')}
              >
                <Oval
                  width={14}
                  height={18}
                  topColor={theme.accent + 'CC'}
                  bottomColor={theme.accent + '66'}
                  style={{ marginBottom: 10 }}
                />
                <Text style={s.themeCardName}>{theme.name}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* How steps */}
        <View style={s.stepsList}>
          {HOW_STEPS.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <Text style={s.stepNum} accessibilityElementsHidden>
                0{i + 1}
              </Text>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={s.ctaBlock}>
          <GhostCTA label="Your privacy →" onPress={onNext} />
        </View>

      </Animated.View>
    </ScrollView>
  );
}

// ─── Screen 3: Privacy ────────────────────────────────────────────────────────

const PROMISES = [
  'No comparison. Ever.',
  'No scores shared. No leaderboards.',
  'No coaching. No advice.',
];

function Screen3({ onBegin }: { onBegin: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={s.screen}>
      <Animated.View style={[s.contentBlock, { opacity: fade, justifyContent: 'center' }]}>

        <Text style={s.headline} accessibilityRole="header">
          This is{'\n'}yours alone.
        </Text>

        <View
          style={s.promisesList}
          accessibilityLabel="Privacy promises: No comparison, no scores shared, no coaching"
        >
          {PROMISES.map((p, i) => (
            <View key={i} style={s.promiseRow}>
              <View style={s.promiseMark} />
              <Text style={s.promiseText}>{p}</Text>
            </View>
          ))}
        </View>

        <Text style={s.closingLine}>
          Mirar is a mirror. Mirrors don't judge.
        </Text>

      </Animated.View>

      <Animated.View style={[s.ctaBlock, { opacity: fade, width: '100%' }]}>
        <TouchableOpacity
          onPress={onBegin}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Begin using Mirar"
          style={s.beginBtn}
        >
          <Text style={s.beginBtnText}>Begin</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OnboardingScreen({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const insets    = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const goTo = (p: number) => {
    scrollRef.current?.scrollTo({ x: p * W, animated: true });
    setPage(p);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <NavBar />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollEnd={e => {
          setPage(Math.round(e.nativeEvent.contentOffset.x / W));
        }}
        style={{ flex: 1 }}
      >
        <Screen1 onNext={() => goTo(1)} />
        <Screen2 onNext={() => goTo(2)} />
        <Screen3 onBegin={onComplete ?? (() => {})} />
      </ScrollView>

      <ProgressDots current={page} bottomInset={insets.bottom} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
  },
  navBrand: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 18,
    color: C.textPrimary,
    letterSpacing: 0.2,
  },

  // Screen shell
  screen: {
    width: W,
    flex: 1,
    paddingHorizontal: 28,
  },

  // Screen 1 hero
  heroBlock: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    gap: 18,
  },
  brandScript: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: 34,
    color: C.textPrimary,
    letterSpacing: 0.3,
  },

  // Content block
  contentBlock: {
    flex: 1,
    paddingTop: 4,
  },
  headline: {
    fontFamily: SERIF,
    fontSize: 36,
    fontWeight: '400',
    color: C.textPrimary,
    lineHeight: 46,
    letterSpacing: -0.3,
    marginBottom: 22,
  },
  bodyText: {
    fontSize: 17,
    fontWeight: '300',
    color: C.textSecondary,
    lineHeight: 27,
    marginBottom: 16,
  },
  notText: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 22,
  },

  // CTA area
  ctaBlock: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  ghostBtn: {
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: C.textPrimary,
  },

  // Screen 2
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 2.5,
    marginBottom: 20,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 36,
  },
  themeCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 16,
    minHeight: 92,
    justifyContent: 'flex-end',
  },
  themeCardName: {
    fontFamily: SERIF,
    fontSize: 13,
    fontWeight: '400',
    color: C.textPrimary,
    lineHeight: 20,
  },
  stepsList: {
    gap: 22,
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 1,
    marginTop: 2,
    width: 22,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '300',
    color: C.textSecondary,
    lineHeight: 24,
    flex: 1,
  },

  // Screen 3
  promisesList: {
    gap: 22,
    marginBottom: 36,
  },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promiseMark: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.textMuted,
    flexShrink: 0,
  },
  promiseText: {
    fontSize: 17,
    fontWeight: '400',
    color: C.textPrimary,
    lineHeight: 26,
    flex: 1,
  },
  closingLine: {
    fontSize: 13,
    fontStyle: 'italic',
    color: C.textMuted,
    lineHeight: 21,
  },
  beginBtn: {
    backgroundColor: C.ctaBg,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  },
  beginBtnText: {
    fontSize: 17,
    fontWeight: '500',
    color: C.ctaText,
    letterSpacing: 0.3,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.dotInactive,
  },
  dotActive: {
    width: 20,
    backgroundColor: C.textPrimary,
  },
});

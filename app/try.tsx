import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import { INNER_REP_V2 } from '../lib/innerRep/runtime/flag';
import { useTranslation } from 'react-i18next';
import { useColors } from '../contexts/theme-context';
import { FONTS, FONT_SIZE, SPACING, RADIUS } from '../lib/constants';
import { EVERYDAY_AREAS, scoreWord } from '../lib/everyday';

// Try-it-first: the landing page promises "five seconds, no account to begin",
// so this is the very first thing a visitor does — one this-or-that, an
// instant read — and only THEN are they asked for an account. Nothing is
// saved or sent from here (no session yet); the account step is how you keep
// it going. Deliberately no quiz, no writing, no login wall in front.
const PICKS = { left: 10, middle: 50, right: 90 } as const;
type PickKey = keyof typeof PICKS;

// v1 funnel (five-second check-in): retired when v2 is on; visitors go to sign-in.
export default function TryScreen() {
  if (INNER_REP_V2) return <Redirect href="/(auth)/login" />;
  return <LegacyTryScreen />;
}

function LegacyTryScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const area = EVERYDAY_AREAS.EWB;
  const [pick, setPick] = useState<PickKey | null>(null);

  const big = (key: 'left' | 'right', label: string) => (
    <TouchableOpacity
      key={key}
      onPress={() => setPick(key)}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[styles.big, { backgroundColor: colors.white, borderColor: colors.border }]}
    >
      <Text style={[styles.bigText, { color: colors.slate }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.paper }]}>
      <View style={styles.wrap}>
        {pick === null ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.stack}>
            <Text style={[styles.eyebrow, { color: colors.slateLight }]}>{t('try.eyebrow')}</Text>
            <Text style={[styles.question, { color: colors.ink }]}>{area.question}</Text>
            <View style={styles.row}>
              {big('left', area.left)}
              {big('right', area.right)}
            </View>
            <TouchableOpacity onPress={() => setPick('middle')} style={[styles.mid, { borderColor: colors.border }]}>
              <Text style={[styles.midText, { color: colors.slateMid }]}>{t('checkin.in_between')}</Text>
            </TouchableOpacity>
            <Text style={[styles.hint, { color: colors.slateLight }]}>{t('try.hint')}</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(450)} style={styles.stack}>
            <Text style={[styles.eyebrow, { color: colors.slateLight }]}>{t('try.result_eyebrow')}</Text>
            <Text style={[styles.number, { color: colors.slate }]}>{PICKS[pick]}</Text>
            <Text style={[styles.word, { color: colors.slateMid }]}>
              {t(`home.word_${scoreWord(PICKS[pick]).toLowerCase()}`)}
            </Text>
            <Text style={[styles.body, { color: colors.slate }]}>{t('try.result_body')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: colors.slate }]}
              accessibilityRole="button"
            >
              <Text style={[styles.ctaText, { color: colors.cream }]}>{t('try.cta')}</Text>
            </TouchableOpacity>
            <Text style={[styles.hint, { color: colors.slateLight }]}>{t('try.cta_note')}</Text>
            <TouchableOpacity onPress={() => setPick(null)} accessibilityRole="button">
              <Text style={[styles.again, { color: colors.slateMid }]}>{t('try.again')}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  stack: { gap: 20 },
  eyebrow: { fontSize: FONT_SIZE.xs, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: '500' },
  question: { fontFamily: FONTS.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  row: { flexDirection: 'row', gap: 12 },
  big: { flex: 1, minHeight: 140, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  bigText: { fontFamily: FONTS.display, fontSize: 26, textAlign: 'center' },
  mid: { alignSelf: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 },
  midText: { fontSize: 15, fontWeight: '500' },
  hint: { textAlign: 'center', fontSize: 13 },
  number: { fontFamily: FONTS.display, fontSize: 96, lineHeight: 100, letterSpacing: -2 },
  word: { fontSize: FONT_SIZE.md, fontWeight: '500', marginTop: -8 },
  body: { fontSize: FONT_SIZE.md, lineHeight: 26 },
  cta: { borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontSize: FONT_SIZE.base, fontWeight: '600' },
  again: { textAlign: 'center', fontSize: FONT_SIZE.sm, textDecorationLine: 'underline' },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth-store';
import { useInnerRepStore } from '../stores/inner-rep-store';
import { useColors } from '../contexts/theme-context';
import { FONTS, FONT_SIZE, SPACING } from '../lib/constants';
import { RepFlow } from '../components/inner-rep/RepFlow';
import { InsightCard } from '../components/inner-rep/InsightCard';
import { SafetyPanel } from '../components/inner-rep/SafetyPanel';
import { RepAnswer } from '../lib/innerRep/types';

// The whole rep, one screen: do it → "Done for today" (+ one honest line only
// if the evidence supports it). Reopening after completion shows the closing.
export default function InnerRepScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { session } = useAuthStore();
  const userId = session?.user?.id;
  const { today, doneToday, insight, isLoaded, load, complete, giveFeedback } = useInnerRepStore();
  const [safety, setSafety] = useState(false);

  useEffect(() => { if (userId && !isLoaded) load(userId); }, [userId, isLoaded]);

  const onComplete = async (answer: RepAnswer, durationMs: number) => {
    if (!userId) return;
    const res = await complete(userId, answer, durationMs);
    if (res.safety) setSafety(true);
  };
  const home = () => router.replace('/(tabs)');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.paper }]}>
      <View style={styles.top}>
        <Pressable onPress={home} accessibilityRole="button">
          <Text style={[styles.back, { color: colors.slateMid }]}>← {t('nav.today')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!isLoaded || !today ? (
          <ActivityIndicator color={colors.slateMid} accessibilityLabel={t('innerRep.loading')} />
        ) : safety ? (
          <SafetyPanel onContinue={home} />
        ) : doneToday ? (
          <View style={styles.done}>
            <Text style={[styles.doneTitle, { color: colors.ink }]} accessibilityRole="header">
              {today.closing ?? t('innerRep.done')}
            </Text>
            {insight && <InsightCard insight={insight} onFeedback={(f) => userId && giveFeedback(userId, f)} />}
            <Pressable onPress={home} accessibilityRole="button" style={[styles.btn, { backgroundColor: colors.slate }]}>
              <Text style={[styles.btnText, { color: colors.cream }]}>{t('innerRep.back_home')}</Text>
            </Pressable>
          </View>
        ) : (
          <RepFlow key={today.id} exercise={today} onComplete={onComplete} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  back: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  body: { padding: SPACING.lg, paddingTop: SPACING.xl, gap: SPACING.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  done: { gap: SPACING.lg },
  doneTitle: { fontFamily: FONTS.display, fontSize: 32, lineHeight: 38 },
  btn: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 28 },
  btnText: { fontFamily: FONTS.bodyMedium, fontSize: 15 },
});

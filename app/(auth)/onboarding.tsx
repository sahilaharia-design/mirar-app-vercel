import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useAssessStore } from '../../stores/assess-store';
import { generateMirarId } from '../../lib/scoring';
import { withTimeout } from '../../lib/with-timeout';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { FONT_SIZE, SPACING } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const [status, setStatus] = useState<'creating' | 'done' | 'error'>('creating');
  const { session, setUser } = useAuthStore();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!session?.user || hasRun.current) return;
    hasRun.current = true;
    createAccount();
  }, [session]);

  const createAccount = async () => {
    if (!session?.user) return;

    const now = new Date().toISOString();

    try {
      // Insert user row — idempotent via unique constraint on id
      const { data: user, error: userError } = await withTimeout(
        supabase
          .from('users')
          .insert({
            id: session.user.id,
            mirar_id: generateMirarId(),
            email: session.user.email,
            onboarding_completed: true,
            cycle_start_date: now,
            current_cycle: 1,
            language: useSettingsStore.getState().language,
          })
          .select()
          .single()
      );

      if (userError) {
        if (userError.code === '23505') {
          // User already exists — fetch their row and go straight to tabs
          try {
            const { data: existing } = await withTimeout(
              supabase.from('users').select('*').eq('id', session.user.id).single()
            );
            if (existing) setUser(existing);
          } catch {
            // Couldn't fetch the existing row — still safe to continue,
            // the tabs screen will load the user state itself.
          }
          router.replace('/(tabs)/');
          return;
        }
        console.error('User create error:', userError);
        setStatus('error');
        return;
      }

      // Only create cycle for brand-new users (user insert succeeded above).
      // Best-effort: an error here shouldn't strand a user who already has
      // a valid account row.
      try {
        await withTimeout(supabase.from('cycles').insert({
          user_id: session.user.id,
          cycle_number: 1,
          start_date: now,
          stage1_start: now,
          status: 'active',
        }));
      } catch (err) {
        console.error('Cycle create error:', err);
      }

      // Save assessment answers collected during pre-auth flow. Best-effort —
      // this is supplementary context, not required for the account to work.
      try {
        const { q1, q2, q3, q4, reset } = useAssessStore.getState();
        if (q1.length > 0 || q2.length > 0) {
          await withTimeout(supabase.from('onboarding_assessments').insert({
            user_id: session.user.id,
            brought_here: q1,
            misaligned_themes: q2,
            checkin_frequency: q3 || null,
            last_felt_self: q4 || null,
          }));
          reset();
        }
      } catch (err) {
        console.error('Onboarding assessment save error:', err);
      }

      if (user) setUser(user);
      setStatus('done');

      setTimeout(() => {
        router.replace('/(onboarding)/');
      }, 1200);
    } catch (err) {
      console.error('Account creation failed:', err);
      setStatus('error');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
      <View style={styles.header}>
        <MirarLogo size="sm" />
      </View>

      <View style={styles.center}>
        {status === 'creating' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
            <ActivityIndicator color={colors.slateMid} style={styles.spinner} />
            <Text style={[styles.label, { color: colors.slateMid }]}>{t('account_setup.creating')}</Text>
          </Animated.View>
        )}

        {status === 'done' && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
            <Text style={[styles.doneTitle, { color: colors.slate }]}>{t('account_setup.done_title')}</Text>
            <Text style={[styles.doneSub, { color: colors.slateLight }]}>{t('account_setup.done_sub')}</Text>
          </Animated.View>
        )}

        {status === 'error' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
            <Text style={[styles.errorText, { color: colors.slateMid }]}>
              {t('account_setup.error_text')}
            </Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  content: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  spinner: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.base,
    fontWeight: '300',
  },
  doneTitle: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '300',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  doneSub: {
    fontSize: FONT_SIZE.base,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT_SIZE.base,
    textAlign: 'center',
    lineHeight: 24,
  },
});

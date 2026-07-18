import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';
import { withTimeout } from '../../lib/with-timeout';

// Handles the OAuth/magic-link redirect from Supabase.
// Checks whether the user has a DB row to distinguish new vs returning users.
export default function AuthCallback() {
  // Expired/already-used links land here as ?error=access_denied&error_code=otp_expired
  // rather than as a session — without reading this, a stale link silently dumps
  // the user on a blank login form with no explanation.
  const { error_code } = useLocalSearchParams<{ error_code?: string }>();

  useEffect(() => {
    if (error_code) {
      router.replace({ pathname: '/(auth)/login', params: { auth_error: error_code } });
      return;
    }

    let cancelled = false;

    (async () => {
      let session: any = null;
      try {
        const res = await withTimeout(supabase.auth.getSession());
        session = res.data.session;
      } catch {
        // Couldn't reach auth at all — don't leave the spinner up forever,
        // send the user back to try the link again.
        if (!cancelled) {
          router.replace({ pathname: '/(auth)/login', params: { auth_error: 'no_session' } });
        }
        return;
      }

      if (cancelled) return;

      if (!session) {
        router.replace({ pathname: '/(auth)/login', params: { auth_error: 'no_session' } });
        return;
      }

      try {
        const { data: user } = await withTimeout(
          supabase.from('users').select('id').eq('id', session.user.id).single()
        );
        if (!cancelled) router.replace(user ? '/(tabs)/' : '/(auth)/onboarding');
      } catch {
        // Couldn't confirm new-vs-returning — default to onboarding, which
        // is idempotent for existing users (a unique-constraint conflict on
        // insert routes them straight to /(tabs)/ instead of erroring).
        if (!cancelled) router.replace('/(auth)/onboarding');
      }
    })();

    return () => { cancelled = true; };
  }, [error_code]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.slateMid} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

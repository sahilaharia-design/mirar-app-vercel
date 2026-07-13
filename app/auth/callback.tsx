import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace({ pathname: '/(auth)/login', params: { auth_error: 'no_session' } });
        return;
      }
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();
      router.replace(user ? '/(tabs)/' : '/(auth)/onboarding');
    });
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

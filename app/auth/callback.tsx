import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';

// Handles the OAuth redirect from Supabase (Google sign-in on web).
// Checks whether the user has a DB row to distinguish new vs returning users.
export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();
      router.replace(user ? '/(tabs)/' : '/(auth)/onboarding');
    });
  }, []);

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

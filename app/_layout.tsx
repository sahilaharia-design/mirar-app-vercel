import '../lib/i18n'; // init i18next before anything renders
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../stores/auth-store';
import { useSettingsStore } from '../stores/settings-store';
import { ThemeProvider } from '../contexts/theme-context';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/with-timeout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

function AppShell() {
  const initialize = useAuthStore((s) => s.initialize);
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isUserLoading = useAuthStore((s) => s.isUserLoading);
  const loadLanguage = useSettingsStore((s) => s.loadLanguage);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
    loadLanguage();
  }, []);

  // ── Deep link handler (native only) ────────────────────────────────────────
  // On mobile, Supabase magic link redirects to mirar://#access_token=...
  // We parse the fragment and call setSession() — onAuthStateChange fires next.
  useEffect(() => {
    if (Platform.OS === 'web') return; // web: Supabase handles via detectSessionInUrl

    const handleURL = async (url: string | null) => {
      if (!url) return;
      const fragment = url.split('#')[1];
      if (!fragment) return;
      const params = Object.fromEntries(new URLSearchParams(fragment));
      if (params.access_token && params.refresh_token) {
        try {
          await withTimeout(supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          }));
        } catch (err) {
          console.error('[Mirar] setSession from deep link failed:', err);
        }
      }
    };

    Linking.getInitialURL().then(handleURL);
    const sub = Linking.addEventListener('url', ({ url }) => handleURL(url));
    return () => sub.remove();
  }, []);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  // Wait for both initialization and the DB user-row fetch before routing.
  // session=true + user=null + !isUserLoading → new user, send to onboarding.
  // session=false → send to login unless already in auth/assess.
  useEffect(() => {
    if (!isInitialized || isUserLoading) return;

    const routeSegments = segments as string[];
    const inPublicRoot = routeSegments.length === 0 || routeSegments[0] === 'index' || routeSegments[0] === 'privacy';
    const inAuthCallback = routeSegments[0] === 'auth' && routeSegments[1] === 'callback';
    const inAuthGroup = segments[0] === '(auth)';
    const inAssessGroup = segments[0] === 'assess' || segments[0] === 'try';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      if (!inPublicRoot && !inAuthCallback && !inAuthGroup && !inAssessGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Authenticated but no DB row → new user arriving via magic link
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // Existing user on login/assess screen — redirect to their dashboard
    // (does NOT fire during onboarding.tsx account-creation, which uses segment 'onboarding')
    const onLoginScreen = segments[0] === '(auth)' && (segments as string[])[1] === 'login';
    const onAssessScreen = segments[0] === 'assess' || segments[0] === 'try';
    if (user && (onLoginScreen || onAssessScreen)) {
      router.replace('/(tabs)/');
    }
  }, [session, user, isInitialized, isUserLoading, segments]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="assess" options={{ headerShown: false }} />
        <Stack.Screen name="try" options={{ headerShown: false }} />
        <Stack.Screen name="inner-rep" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen
          name="report/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

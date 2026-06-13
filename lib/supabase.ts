import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Storage adapter: SecureStore on device, localStorage on web ──────────────
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      return Promise.resolve(localStorage.getItem(key));
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ─── Environment Variables ────────────────────────────────────────────────────
// Set these in your .env or app.config.ts before deploying
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Mirar] Supabase credentials not configured. ' +
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// ─── Supabase Client ──────────────────────────────────────────────────────────
// Dev/demo mode: EXPO_PUBLIC_DEV_MOCK=1 swaps in an in-memory mock client with
// a signed-in session and 14 days of fixture data (see lib/supabase-mock.ts).
// Used for design review, demos, and screenshots — never set in production.
const USE_MOCK = process.env.EXPO_PUBLIC_DEV_MOCK === '1';

const realSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const supabase = USE_MOCK
  ? (require('./supabase-mock').mockSupabase as typeof realSupabase)
  : realSupabase;

// ─── Typed Query Helpers ──────────────────────────────────────────────────────
export const db = {
  users: () => supabase.from('users'),
  cycles: () => supabase.from('cycles'),
  questions: () => supabase.from('questions'),
  options: () => supabase.from('options'),
  responses: () => supabase.from('responses'),
  themeScores: () => supabase.from('theme_scores'),
  reports: () => supabase.from('reports'),
  pushTokens: () => supabase.from('push_tokens'),
};

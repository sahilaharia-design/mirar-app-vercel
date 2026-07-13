import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { UserRow } from '../types/mirar';
import { registerPushToken } from '../lib/notifications';

interface AuthState {
  session: any | null;
  user: UserRow | null;
  isLoading: boolean;
  isInitialized: boolean;
  isUserLoading: boolean; // true while DB row fetch is in-flight

  initialize: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setUser: (user: UserRow | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  isUserLoading: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    // Mark user fetch in-flight before setting isInitialized so the auth
    // guard waits for the DB round-trip before making routing decisions.
    set({ session, isInitialized: true, isUserLoading: !!session?.user });

    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      set({ user: data ?? null, isUserLoading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, isUserLoading: !!session?.user });
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ user: data ?? null, isUserLoading: false });
        if (data?.id) {
          registerPushToken(data.id);
        }
      } else {
        set({ user: null, isUserLoading: false });
      }
    });
  },

  signInWithEmail: async (email: string) => {
    set({ isLoading: true });
    // Route through /auth/callback — same as Google/Apple below — so the
    // users-table check there is the single place that decides new vs
    // returning. Redirecting to bare origin skips that check entirely.
    const redirectTo = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://mirar-app.vercel.app/auth/callback')
      : 'mirar://auth/callback';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });
    set({ isLoading: false });
    return { error: error?.message ?? null };
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    const redirectTo = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://mirar-app.vercel.app/auth/callback')
      : 'mirar://auth/callback';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    set({ isLoading: false });
    return { error: error?.message ?? null };
  },

  signInWithApple: async () => {
    set({ isLoading: true });
    const redirectTo = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://mirar-app.vercel.app/auth/callback')
      : 'mirar://auth/callback';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo },
    });
    set({ isLoading: false });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  setUser: (user) => set({ user }),
}));

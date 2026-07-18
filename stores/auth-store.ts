import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { UserRow } from '../types/mirar';
import { registerPushToken } from '../lib/notifications';
import { withTimeout } from '../lib/with-timeout';

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
    let session: any = null;
    try {
      const res = await withTimeout(supabase.auth.getSession());
      session = res.data.session;
    } catch {
      // Can't reach auth right now — fall through as signed-out rather than
      // leaving isInitialized false forever (which would hang the app on a
      // permanent splash/loading screen).
    }

    // Mark user fetch in-flight before setting isInitialized so the auth
    // guard waits for the DB round-trip before making routing decisions.
    set({ session, isInitialized: true, isUserLoading: !!session?.user });

    if (session?.user) {
      try {
        const { data } = await withTimeout(
          supabase.from('users').select('*').eq('id', session.user.id).single()
        );
        set({ user: data ?? null, isUserLoading: false });
      } catch {
        set({ isUserLoading: false });
      }
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, isUserLoading: !!session?.user });
      if (session?.user) {
        try {
          const { data } = await withTimeout(
            supabase.from('users').select('*').eq('id', session.user.id).single()
          );
          set({ user: data ?? null, isUserLoading: false });
          if (data?.id) {
            registerPushToken(data.id);
          }
        } catch {
          set({ isUserLoading: false });
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
    try {
      const { error } = await withTimeout(supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      }));
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not reach the server. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    const redirectTo = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://mirar-app.vercel.app/auth/callback')
      : 'mirar://auth/callback';
    try {
      const { error } = await withTimeout(supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      }));
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not reach the server. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithApple: async () => {
    set({ isLoading: true });
    const redirectTo = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'https://mirar-app.vercel.app/auth/callback')
      : 'mirar://auth/callback';
    try {
      const { error } = await withTimeout(supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      }));
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not reach the server. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    // Always clear local session/user state, even if the remote signOut call
    // fails or times out (e.g. no network) — a user asking to sign out
    // should never be stuck signed in just because a request hung.
    try {
      await withTimeout(supabase.auth.signOut());
    } catch {
      // ignore — local state is cleared in finally regardless
    } finally {
      set({ session: null, user: null });
    }
  },

  setUser: (user) => set({ user }),
}));

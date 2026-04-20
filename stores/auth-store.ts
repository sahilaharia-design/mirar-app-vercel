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

  initialize: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setUser: (user: UserRow | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, isInitialized: true });

    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      set({ user: data ?? null });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ user: data ?? null });
        // Fire-and-forget: register push token after session confirmed
        if (data?.id) {
          registerPushToken(data.id);
        }
      } else {
        set({ user: null });
      }
    });
  },

  signInWithEmail: async (email: string) => {
    set({ isLoading: true });
    // Web: redirect to current origin (Supabase handles fragment auto-detection)
    // Mobile: redirect to app scheme so deep link handler can pick up the tokens
    const redirectTo = Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? window.location.origin : 'https://mirar-app.vercel.app')
      : 'mirar://';
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

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  setUser: (user) => set({ user }),
}));

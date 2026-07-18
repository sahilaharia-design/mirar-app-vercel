import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../lib/with-timeout';
import i18n, { SupportedLanguage } from '../lib/i18n';

interface SettingsState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

const LANG_KEY = 'mirar_language';

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',

  loadLanguage: async () => {
    const stored = await AsyncStorage.getItem(LANG_KEY) as SupportedLanguage | null;
    const lang = stored ?? 'en';
    set({ language: lang });
    i18n.changeLanguage(lang);
  },

  setLanguage: async (lang) => {
    // Local switch happens immediately regardless of network state — only
    // the server-side persistence below can fail without affecting what the
    // user sees right now.
    set({ language: lang });
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);

    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser());
      if (user) {
        // users.id IS the Supabase Auth user id (there is no auth_id column —
        // the previous filter matched zero rows, so language never persisted)
        await withTimeout(supabase.from('users').update({ language: lang }).eq('id', user.id));
      }
    } catch (err) {
      console.error('[Mirar] persisting language failed:', err);
    }
  },
}));

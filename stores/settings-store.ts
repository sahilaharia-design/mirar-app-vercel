import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
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
    set({ language: lang });
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('users').update({ language: lang }).eq('auth_id', user.id);
    }
  },
}));

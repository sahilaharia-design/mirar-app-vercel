import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en';
import hi from '../locales/hi';
import gu from '../locales/gu';

export type SupportedLanguage = 'en' | 'hi' | 'gu';

export const SUPPORTED_LANGUAGES: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    gu: { translation: gu },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

export function setLanguage(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
}

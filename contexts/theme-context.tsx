import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS } from '../lib/constants';
import { ColorScheme } from '../types/mirar';

const THEME_KEY = 'mirar_theme';

type Colors = typeof COLORS;

interface ThemeContextValue {
  isDark: boolean;
  colorScheme: ColorScheme;
  colors: Colors;
  toggleDark: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colorScheme: 'light',
  colors: COLORS,
  toggleDark: () => {},
  setColorScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('light');

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setColorSchemeState(stored);
      }
    });
  }, []);

  const isDark =
    colorScheme === 'dark' ||
    (colorScheme === 'system' && systemScheme === 'dark');

  const colors = (isDark ? DARK_COLORS : COLORS) as Colors;

  const toggleDark = useCallback(() => {
    const next = colorScheme === 'dark' ? 'light' : 'dark';
    setColorSchemeState(next);
    AsyncStorage.setItem(THEME_KEY, next);
  }, [colorScheme]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    AsyncStorage.setItem(THEME_KEY, scheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colorScheme, colors, toggleDark, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}

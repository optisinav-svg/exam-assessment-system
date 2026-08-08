import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  inputBackground: string;
  danger: string;
}

const LIGHT: ThemeColors = {
  background: '#F0F4FF',
  card: '#FFFFFF',
  text: '#222222',
  textSecondary: '#888888',
  border: '#E0E0E0',
  primary: '#4A6CF7',
  primaryText: '#FFFFFF',
  inputBackground: '#FFFFFF',
  danger: '#EF4444',
};

const DARK: ThemeColors = {
  background: '#0F1420',
  card: '#1B2333',
  text: '#F0F0F0',
  textSecondary: '#9AA3B5',
  border: '#2E3850',
  primary: '#6C86FF',
  primaryText: '#FFFFFF',
  inputBackground: '#232D42',
  danger: '#F87171',
};

const THEME_KEY = 'theme_preference'; // 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode;
  preference: ThemeMode | 'system';
  colors: ThemeColors;
  setPreference: (pref: ThemeMode | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  preference: 'system',
  colors: LIGHT,
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemeMode | 'system'>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setPreferenceState(saved);
        }
      } catch (error) {
        // sessiz geç, varsayılan 'system' kalır
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setPreference = (pref: ThemeMode | 'system') => {
    setPreferenceState(pref);
    SecureStore.setItemAsync(THEME_KEY, pref).catch(() => {});
  };

  const mode: ThemeMode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const colors = mode === 'dark' ? DARK : LIGHT;

  if (!isLoaded) {
    return null; // ilk yüklemede kısa bir an boş ekran, yanlış temayla flaşlamamak için
  }

  return (
    <ThemeContext.Provider value={{ mode, preference, colors, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

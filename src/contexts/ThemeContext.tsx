import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '../config/theme';

const THEME_KEY = '@yayika_theme';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  currentColors: typeof colors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  currentColors: colors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [loaded, setLoaded] = useState(false);
  const [userOverride, setUserOverride] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'dark') {
        setIsDark(true);
        setUserOverride(true);
      } else if (val === 'light') {
        setIsDark(false);
        setUserOverride(true);
      } else {
        setIsDark(systemScheme === 'dark');
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!userOverride && loaded) {
      setIsDark(systemScheme === 'dark');
    }
  }, [systemScheme, userOverride, loaded]);

  const toggleTheme = () => {
    setUserOverride(true);
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, currentColors: isDark ? darkColors : colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

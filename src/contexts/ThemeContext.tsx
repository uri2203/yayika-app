import React, { createContext, useContext, useState, ReactNode } from 'react';
import { colors, darkColors } from '../config/theme';

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
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, currentColors: isDark ? darkColors : colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

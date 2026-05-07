import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useMoneyMateStore } from '../store';
import { getColors, getShadows } from '../constants';

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ReturnType<typeof getColors>;
  shadows: ReturnType<typeof getShadows>;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { settings, updateSettings } = useMoneyMateStore();
  
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    settings.theme || systemColorScheme || 'light'
  );

  useEffect(() => {
    // Update theme when settings change
    if (settings.theme && settings.theme !== theme) {
      setThemeState(settings.theme);
    }
  }, [settings.theme]);

  useEffect(() => {
    // Update theme when system color scheme changes (if user hasn't set a preference)
    if (!settings.theme && systemColorScheme && systemColorScheme !== theme) {
      setThemeState(systemColorScheme);
    }
  }, [systemColorScheme, settings.theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    updateSettings({ theme: newTheme });
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    updateSettings({ theme: newTheme });
  };

  const colors = getColors(theme);
  const shadows = getShadows(theme);

  const value: ThemeContextType = {
    theme,
    colors,
    shadows,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

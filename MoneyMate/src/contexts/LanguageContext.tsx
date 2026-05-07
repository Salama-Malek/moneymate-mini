import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { TRANSLATIONS } from '../constants/translations';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../constants';
import { useMoneyMateStore } from '../store';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (languageCode: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
  availableLanguages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useMoneyMateStore();
  const [currentLanguage, setCurrentLanguage] = useState(settings.language || DEFAULT_LANGUAGE);

  // Check if current language is RTL (Arabic)
  const isRTL = currentLanguage === 'ar';

  // Update RTL layout when language changes
  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // Note: On Android, you might need to restart the app for RTL changes to take effect
    }
  }, [isRTL]);

  // Translation function
  const t = (key: string): string => {
    const translation = TRANSLATIONS[key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    const text = translation[currentLanguage as keyof typeof translation];
    if (!text) {
      console.warn(`Translation not found for key: ${key} and language: ${currentLanguage}`);
      return translation.en || key; // Fallback to English
    }
    
    return text;
  };

  // Set language function
  const setLanguage = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    updateSettings({ language: languageCode });
  };

  // Sync with store settings
  useEffect(() => {
    if (settings.language && settings.language !== currentLanguage) {
      setCurrentLanguage(settings.language);
    }
  }, [settings.language]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isRTL,
    availableLanguages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

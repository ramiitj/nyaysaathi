import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, LanguageConfig, getLanguageConfig, DEFAULT_LANGUAGE } from '@/config/languages';

interface LanguageContextType {
  language: LanguageCode;
  config: LanguageConfig;
  setLanguage: (code: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('nyay-saathi-language');
    return (saved as LanguageCode) || DEFAULT_LANGUAGE;
  });

  const config = getLanguageConfig(language);

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem('nyay-saathi-language', code);
  };

  useEffect(() => {
    // Update document direction for RTL languages
    document.documentElement.dir = config.direction;
    document.documentElement.lang = language.toLowerCase();
  }, [language, config.direction]);

  return (
    <LanguageContext.Provider value={{ language, config, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
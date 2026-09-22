import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate, getSavedLanguage, saveLanguage, getLanguageName } from '../config/i18n';

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getLanguageName: (lang: Language) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLanguage: () => {},
  t: (key: string) => key,
  getLanguageName: () => '',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('es');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSavedLanguage()
      .then((saved) => setLangState(saved))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
    saveLanguage(newLang).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  );

  if (!loaded) return null;

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, getLanguageName }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

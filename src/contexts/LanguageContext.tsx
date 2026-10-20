import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate, getSavedLanguage, saveLanguage, getLanguageName } from '../config/i18n';
import { supabase } from '../config/supabase';

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

function syncLangToProfile(lang: Language) {
  supabase.auth
    .getUser()
    .then(({ data, error }) => {
      const uid = data?.user?.id;
      if (error || !uid) return;
      return supabase.from('yayika_profiles').update({ lang }).eq('id', uid);
    })
    .catch(() => {});
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('es');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSavedLanguage()
      .then((saved) => {
        setLangState(saved);
        syncLangToProfile(saved);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
    saveLanguage(newLang).catch(() => {});
    syncLangToProfile(newLang);
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

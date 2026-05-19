import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import gu from '../locales/gu.json';
import hi from '../locales/hi.json';
import tl from '../locales/tl.json';

// ── Constants ──────────────────────────────────────────────────────────────
const STORAGE_KEY      = 'appLanguage';
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED        = { en, gu, hi, tl };

// ── Context ────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

// ── Provider ───────────────────────────────────────────────────────────────
export function LanguageProvider({ children }) {
  const [language, setLanguage]   = useState(DEFAULT_LANGUAGE);
  const [langLoaded, setLangLoaded] = useState(false);

  // On mount: load persisted language (or fall back to English)
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED[saved]) {
          setLanguage(saved);
        } else {
          // First install or invalid value — persist the default so it's explicit
          await AsyncStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
        }
      } catch (_) {
        // AsyncStorage failure: stay with default 'en'
      } finally {
        setLangLoaded(true);
      }
    })();
  }, []);

  // Persist and apply new language immediately — no restart needed
  const changeLanguage = useCallback(async (lang) => {
    if (!SUPPORTED[lang]) return;
    setLanguage(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
  }, []);

  // t() is memoised: only re-created when `language` changes.
  // This prevents every consumer from re-rendering on unrelated Provider updates.
  const t = useCallback(
    (key) => {
      const dict = SUPPORTED[language] ?? SUPPORTED[DEFAULT_LANGUAGE];
      return dict[key] ?? SUPPORTED[DEFAULT_LANGUAGE][key] ?? key;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, langLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};

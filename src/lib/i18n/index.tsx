import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import type { Locale } from '../platform/types';

// Import translation files
import messagesZh from '../i18n/messages/zh.json';
import messagesEn from '../i18n/messages/en.json';

const messages = {
  zh: messagesZh,
  en: messagesEn,
};

export type TranslationMessages = typeof messagesZh;

/**
 * I18n Context type
 */
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isInitialized: boolean;
}

// Create context with default values
const I18nContext = createContext<I18nContextType>({
  locale: 'zh',
  setLocale: () => {},
  isInitialized: false,
});

/**
 * I18n Provider component
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize locale from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('viewdeb-locale');
    console.log('[I18nProvider] Initializing locale from localStorage:', saved);
    if (saved === 'zh' || saved === 'en') {
      setLocaleState(saved);
    }
    setIsInitialized(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    console.log('[I18nProvider] setLocale called with:', newLocale, 'current:', locale);
    setLocaleState(newLocale);
    localStorage.setItem('viewdeb-locale', newLocale);
    console.log('[I18nProvider] Saved to localStorage, new value:', localStorage.getItem('viewdeb-locale'));
  };

  console.log('[I18nProvider] Providing locale:', locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, isInitialized }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Simple i18n hook (replaces next-intl)
 */
export function useI18n(locale: Locale) {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return { t };
}

/**
 * I18n hook for accessing locale state (uses Context)
 */
export function useLocale() {
  const context = useContext(I18nContext);
  console.log('[useLocale] Context locale:', context.locale);
  return context;
}

// Export all translation keys type for type safety
export type Messages = TranslationMessages;

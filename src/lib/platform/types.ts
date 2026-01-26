/**
 * Cross-platform type definitions
 * This file contains types that work across different platforms
 */

export type Locale = 'zh' | 'en';

export const locales: Locale[] = ['zh', 'en'];

export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
};

export type Theme = 'light' | 'dark' | 'system';

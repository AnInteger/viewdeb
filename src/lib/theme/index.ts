import { useState, useEffect } from 'react';
import type { Theme } from '../platform/types';

/**
 * Simple theme hook (replaces next-themes)
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get initial theme from localStorage or default to 'system'
    const saved = localStorage.getItem('viewdeb-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    return getSystemTheme(theme);
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('viewdeb-theme', newTheme);
    applyTheme(getSystemTheme(newTheme));
  };

  useEffect(() => {
    // Update resolved theme when system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
        applyTheme(systemTheme);
      };

      // Initial check
      handleChange();

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme);
      applyTheme(theme);
    }
  }, [theme]);

  return { theme, resolvedTheme, setTheme };
}

function getSystemTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

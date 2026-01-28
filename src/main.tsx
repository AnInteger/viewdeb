import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './lib/i18n';
import './app/globals.css';

// Initialize theme before rendering
function initTheme() {
  const saved = localStorage.getItem('viewdeb-theme');
  let theme: 'light' | 'dark' | 'system' = 'system';
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    theme = saved;
  }

  let resolvedTheme: 'light' | 'dark' = 'light';
  if (theme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolvedTheme = theme;
  }

  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);

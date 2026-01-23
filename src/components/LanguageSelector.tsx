'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/i18n-config';

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = (segments[0] || 'zh') as Locale;

  const handleLocaleChange = (newLocale: Locale) => {
    const remainingPath = segments.slice(1).join('/');
    const newPathname = `/${newLocale}${remainingPath ? '/' + remainingPath : ''}`;
    router.push(newPathname);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-slate-300"
      >
        <Languages className="w-5 h-5" />
        <span className="hidden sm:inline">{localeNames[currentLocale]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden min-w-[120px] dark:bg-slate-800 dark:border-slate-700">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`w-full px-4 py-2 text-left transition-colors ${
                  locale === currentLocale
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

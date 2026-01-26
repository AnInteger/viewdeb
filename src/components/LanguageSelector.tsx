import { useState } from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import { localeNames, locales, type Locale } from '@/lib/platform/types';

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-slate-300"
      >
        <Languages className="w-5 h-5" />
        <span className="hidden sm:inline">{localeNames[locale]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden min-w-[120px] dark:bg-slate-800 dark:border-slate-700">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`w-full px-4 py-2 text-left transition-colors ${
                  loc === locale
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {localeNames[loc]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

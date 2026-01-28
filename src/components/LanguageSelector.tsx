import { useState } from 'react';
import { Languages, Check } from 'lucide-react';
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
        className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">{localeNames[locale]}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 w-40 overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
            <div className="p-2 space-y-1">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left rounded-lg transition-all duration-150 ${
                    loc === locale
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white dark:from-blue-500 dark:to-blue-400'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{localeNames[loc]}</span>
                  {loc === locale && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

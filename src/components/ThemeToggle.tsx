import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'light'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600'
        }`}
        title="Light"
      >
        <Sun className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600'
        }`}
        title="Dark"
      >
        <Moon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'system'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600'
        }`}
        title="System"
      >
        <Monitor className="w-5 h-5" />
      </button>
    </div>
  );
}

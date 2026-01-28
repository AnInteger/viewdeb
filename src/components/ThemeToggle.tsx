import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const buttons = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
      {buttons.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`relative p-2 rounded-lg transition-all duration-200 ${
            theme === value
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white dark:from-blue-500 dark:to-blue-400 shadow-md shadow-blue-500/25'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

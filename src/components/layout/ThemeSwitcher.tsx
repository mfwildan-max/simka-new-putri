import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';
import { ThemeMode } from '../../types';

export const ThemeSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: React.ElementType }[] = [
    { mode: 'light', label: 'Terang', icon: Sun },
    { mode: 'dark', label: 'Gelap', icon: Moon },
    { mode: 'system', label: 'Sistem', icon: Laptop },
  ];

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0D1829] border border-slate-200 dark:border-[#1C2F4D] shadow-xs ${className}`}
      role="radiogroup"
      aria-label="Pilih Tema Tampilan"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = themeMode === opt.mode;

        return (
          <button
            key={opt.mode}
            onClick={() => setThemeMode(opt.mode)}
            title={`Mode ${opt.label}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-[#1E314D] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-[#132238]'
            }`}
            role="radio"
            aria-checked={isSelected}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

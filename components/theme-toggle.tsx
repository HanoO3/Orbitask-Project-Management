'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
      className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#5B82FF] transition-all flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="w-4.5 h-4.5 text-amber-400 animate-spin-slow" />
      ) : (
        <Moon className="w-4.5 h-4.5 text-indigo-500" />
      )}
    </button>
  );
}

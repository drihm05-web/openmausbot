'use client';

import { useCallback, useEffect, useState } from 'react';

export type AppThemeMode = 'dark' | 'light' | 'system';

function applyThemeClass(mode: AppThemeMode) {
  if (typeof document === 'undefined') return 'dark';
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.classList.toggle('light', resolved === 'light');
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function useAppTheme() {
  const [theme, setThemeState] = useState<AppThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = (window.localStorage.getItem('theme') as AppThemeMode | null) ?? 'dark';
    const valid: AppThemeMode =
      stored === 'light' || stored === 'system' || stored === 'dark' ? stored : 'dark';
    setThemeState(valid);
    setResolvedTheme(applyThemeClass(valid));

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = () => {
      const current = (window.localStorage.getItem('theme') as AppThemeMode | null) ?? 'dark';
      if (current === 'system') {
        setResolvedTheme(applyThemeClass('system'));
      }
    };
    media.addEventListener('change', onMediaChange);
    return () => media.removeEventListener('change', onMediaChange);
  }, []);

  const setTheme = useCallback((next: AppThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem('theme', next);
    setResolvedTheme(applyThemeClass(next));
  }, []);

  return { theme, resolvedTheme, setTheme };
}

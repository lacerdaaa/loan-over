import { useEffect, useState } from 'react';

const THEME_KEY = 'loanover-theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const readStoredTheme = (): string | null => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};

const initialDark = (): boolean => {
  const stored = readStoredTheme();
  if (stored) return stored.endsWith('dark');
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
};

export const useTheme = (business: boolean) => {
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    const theme = `loanover${business ? '-business' : ''}-${dark ? 'dark' : 'light'}`;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark, business]);

  return { dark, toggle: () => setDark((d) => !d) };
};

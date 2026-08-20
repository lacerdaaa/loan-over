import { useEffect, useState } from 'react';

const THEME_KEY = 'loanover-theme';

export const useTheme = (business: boolean) => {
  const [dark, setDark] = useState(() => (localStorage.getItem(THEME_KEY) ?? '').endsWith('dark'));

  useEffect(() => {
    const theme = `loanover${business ? '-business' : ''}-${dark ? 'dark' : 'light'}`;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark, business]);

  return { dark, toggle: () => setDark((d) => !d) };
};

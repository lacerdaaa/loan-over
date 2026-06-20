import { useEffect, useState } from 'react';

const THEME_KEY = 'loanover-theme';

export const useTheme = () => {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'loanover-dark');

  useEffect(() => {
    const theme = dark ? 'loanover-dark' : 'loanover-light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
};

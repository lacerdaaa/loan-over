import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const THEME_KEY = 'loanover-theme';

export const ThemeToggle = ({ collapsed }: { collapsed: boolean }) => {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'loanover-dark');

  useEffect(() => {
    const theme = dark ? 'loanover-dark' : 'loanover-light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [dark]);

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={() => setDark((d) => !d)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base-content/60 hover:text-base-content hover:bg-base-300 transition-colors w-full"
      title={dark ? 'Switch to light' : 'Switch to dark'}
    >
      <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
      {!collapsed && <span className="text-sm font-medium">{dark ? 'Light mode' : 'Dark mode'}</span>}
    </motion.button>
  );
};

import { createContext, useContext, useEffect, useState } from 'react';

const PRIVACY_KEY = 'loanover-privacy';
export const MASK = 'R$ ••••••';

interface PrivacyCtx {
  hidden: boolean;
  toggle: () => void;
  mask: (formatted: string) => string;
}

const Ctx = createContext<PrivacyCtx>({ hidden: false, toggle: () => {}, mask: (v) => v });

export const PrivacyProvider = ({ children }: { children: React.ReactNode }) => {
  const [hidden, setHidden] = useState(() => localStorage.getItem(PRIVACY_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(PRIVACY_KEY, hidden ? 'true' : 'false');
  }, [hidden]);

  const mask = (formatted: string) => (hidden ? MASK : formatted);

  return (
    <Ctx.Provider value={{ hidden, toggle: () => setHidden((h) => !h), mask }}>
      {children}
    </Ctx.Provider>
  );
};

export const usePrivacy = () => useContext(Ctx);

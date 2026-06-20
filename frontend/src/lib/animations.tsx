import { MotionConfig } from 'framer-motion';
import { createContext, useContext, useEffect, useState } from 'react';

const ANIM_KEY = 'loanover-animations';

interface AnimationsCtx {
  enabled: boolean;
  toggle: () => void;
}

const Ctx = createContext<AnimationsCtx>({ enabled: true, toggle: () => {} });

export const AnimationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(ANIM_KEY) !== 'false');

  useEffect(() => {
    localStorage.setItem(ANIM_KEY, enabled ? 'true' : 'false');
  }, [enabled]);

  return (
    <Ctx.Provider value={{ enabled, toggle: () => setEnabled((e) => !e) }}>
      <MotionConfig reducedMotion={enabled ? 'never' : 'always'}>
        {children}
      </MotionConfig>
    </Ctx.Provider>
  );
};

export const useAnimations = () => useContext(Ctx);

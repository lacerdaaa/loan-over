import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useAnimations } from '../../lib/animations';

interface Props {
  children: ReactNode;
}

export const PageTransition = ({ children }: Props) => {
  const { enabled } = useAnimations();
  return (
    <motion.div
      initial={{ opacity: 0, y: enabled ? 16 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: enabled ? 16 : 0 }}
      transition={{ duration: enabled ? 0.25 : 0, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

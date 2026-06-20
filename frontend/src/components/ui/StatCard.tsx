import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { useAnimations } from '../../lib/animations';
import { formatCurrency } from '../../lib/formatCurrency';
import { MASK, usePrivacy } from '../../lib/privacy';

interface Props {
  label: string;
  value: number;
  variant?: 'default' | 'positive' | 'negative';
  delay?: number;
}

export const StatCard = ({ label, value, variant = 'default', delay = 0 }: Props) => {
  const { hidden } = usePrivacy();
  const { enabled: animationsEnabled } = useAnimations();
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => formatCurrency(v));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: animationsEnabled ? 0.8 : 0,
      delay: animationsEnabled ? delay : 0,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [value, delay, motionValue, animationsEnabled]);

  const colorClass =
    variant === 'positive' ? 'text-success' :
    variant === 'negative' ? 'text-error' :
    'text-base-content';

  return (
    <motion.div
      initial={{ opacity: 0, y: animationsEnabled ? 12 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationsEnabled ? 0.3 : 0, delay: animationsEnabled ? delay : 0 }}
      className="card bg-base-200 shadow-sm border border-base-300 p-6"
    >
      <p className="text-sm text-base-content/60 font-medium uppercase tracking-wider mb-1">{label}</p>
      {hidden
        ? <p className={`text-3xl font-bold tracking-widest ${colorClass}`}>{MASK}</p>
        : <motion.p className={`text-3xl font-bold tabular-nums ${colorClass}`}>{display}</motion.p>
      }
    </motion.div>
  );
};

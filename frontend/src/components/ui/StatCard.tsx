import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { formatCurrency } from '../../lib/formatCurrency';

interface Props {
  label: string;
  value: number;
  variant?: 'default' | 'positive' | 'negative';
  delay?: number;
}

export const StatCard = ({ label, value, variant = 'default', delay = 0 }: Props) => {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => formatCurrency(v));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, delay, ease: 'easeOut' });
    return controls.stop;
  }, [value, delay, motionValue]);

  const colorClass =
    variant === 'positive' ? 'text-success' :
    variant === 'negative' ? 'text-error' :
    'text-base-content';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="card bg-base-200 shadow-sm border border-base-300 p-6"
    >
      <p className="text-sm text-base-content/60 font-medium uppercase tracking-wider mb-1">{label}</p>
      <motion.p className={`text-3xl font-bold tabular-nums ${colorClass}`}>{display}</motion.p>
    </motion.div>
  );
};

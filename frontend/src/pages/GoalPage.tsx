import { motion } from 'framer-motion';
import { useState } from 'react';
import { useGoal, useUpsertGoal } from '../api/goal';
import { useProjection } from '../api/projection';
import { useSnapshot } from '../api/snapshot';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();
const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const GoalPage = () => {
  const { data: goal } = useGoal();
  const snapshot = useSnapshot(MONTH, YEAR);
  const projection = useProjection(MONTH, YEAR, 24);
  const upsert = useUpsertGoal();

  const [form, setForm] = useState({ target_amount: goal?.target_amount ?? 0, deadline_month: goal?.deadline_month ?? MONTH, deadline_year: goal?.deadline_year ?? YEAR + 1 });

  const freeBalance = snapshot.data?.free_balance ?? 0;
  const targetAmount = goal?.target_amount ?? 0;
  const progress = targetAmount > 0 ? Math.min(freeBalance / targetAmount, 1) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const liberationEvents = projection.data?.flatMap((m) => m.events.filter((e) => e.type === 'liberation').map((e) => ({ ...e, month: m.month, year: m.year }))) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(form);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Savings Goal</h1>
          <p className="text-base-content/50 text-sm mt-0.5">Track progress toward your target</p>
        </div>

        <div className="card bg-base-200 border border-base-300 p-6 flex flex-col items-center gap-4">
          <svg width={160} height={160} className="-rotate-90">
            <circle cx={80} cy={80} r={RADIUS} fill="none" strokeWidth={10} className="stroke-base-300" />
            <motion.circle
              cx={80} cy={80} r={RADIUS} fill="none" strokeWidth={10}
              stroke="#10b981" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="text-center -mt-4">
            <p className="text-3xl font-bold text-base-content tabular-nums">{Math.round(progress * 100)}%</p>
            <p className="text-base-content/50 text-sm">{formatCurrency(freeBalance)} of {formatCurrency(targetAmount)}</p>
          </div>
        </div>

        {liberationEvents.length > 0 && (
          <div className="flex flex-col gap-2">
            {liberationEvents.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="alert bg-success/10 border border-success/30 text-sm">
                <span>🎉 <strong>{e.description}</strong> — redirecting this amount could accelerate your goal.</span>
              </motion.div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card bg-base-200 border border-base-300 p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-base-content">Set goal</h2>
          <label className="form-control">
            <span className="label-text text-xs mb-1">Target amount (R$)</span>
            <input type="number" step="0.01" className="input input-bordered input-sm" value={form.target_amount || ''} onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text text-xs mb-1">Deadline month</span>
              <select className="select select-bordered select-sm" value={form.deadline_month} onChange={(e) => setForm({ ...form, deadline_month: Number(e.target.value) })}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Deadline year</span>
              <input type="number" className="input input-bordered input-sm" value={form.deadline_year} onChange={(e) => setForm({ ...form, deadline_year: Number(e.target.value) })} />
            </label>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn btn-primary btn-sm" disabled={upsert.isPending}>Save goal</motion.button>
        </form>
      </div>
    </PageTransition>
  );
};

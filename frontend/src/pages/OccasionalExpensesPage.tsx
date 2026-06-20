import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCreateOccasionalExpense, useDeleteOccasionalExpense, useOccasionalExpenses } from '../api/occasional-expenses';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';

const now = new Date();
const EMPTY = { description: '', amount: 0, from_benefit: false };

export const OccasionalExpensesPage = () => {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: expenses = [] } = useOccasionalExpenses(month, year);
  const create = useCreateOccasionalExpense(month, year);
  const remove = useDeleteOccasionalExpense(month, year);

  const total = expenses.filter((e) => !e.from_benefit).reduce((s, e) => s + Number(e.amount), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, month, year },
      { onSuccess: () => { setOpen(false); setForm(EMPTY); } },
    );
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Occasional Expenses</h1>
            <p className="text-base-content/50 text-sm mt-0.5">One-time costs for a specific month</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
            + Add expense
          </motion.button>
        </div>

        <div className="flex gap-3">
          <select
            className="select select-bordered select-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <input
            type="number"
            className="input input-bordered input-sm w-24"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-2">
          {expenses.map((exp) => (
            <motion.div key={exp.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between card bg-base-200 border border-base-300 px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="font-medium text-base-content text-sm">{exp.description}</p>
                {exp.from_benefit && <span className="badge badge-warning badge-xs">benefit</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold text-sm ${exp.from_benefit ? 'text-warning' : 'text-error'}`}>
                  {formatCurrency(exp.amount)}
                </span>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => remove.mutate(exp.id)}
                >
                  ✕
                </motion.button>
              </div>
            </motion.div>
          ))}
          {expenses.length === 0 && (
            <p className="text-base-content/40 text-sm">No occasional expenses for this month.</p>
          )}
        </div>

        {expenses.length > 0 && (
          <div className="flex justify-between items-center border-t border-base-300 pt-4">
            <span className="text-sm text-base-content/60">Total deducted from free balance</span>
            <span className="font-bold text-error">{formatCurrency(total)}</span>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add occasional expense">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <span className="label-text text-xs mb-1">Description</span>
            <input
              className="input input-bordered input-sm"
              required
              placeholder="e.g. Car repair, Doctor visit"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="form-control">
            <span className="label-text text-xs mb-1">Amount (R$)</span>
            <input
              type="number"
              step="0.01"
              className="input input-bordered input-sm"
              required
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-warning checkbox-sm"
              checked={form.from_benefit}
              onChange={(e) => setForm({ ...form, from_benefit: e.target.checked })}
            />
            <span className="text-sm">Paid from benefit (food card, etc.)</span>
          </label>
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOpen(false)}>Cancel</button>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn btn-primary btn-sm flex-1" disabled={create.isPending}>Save</motion.button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
};

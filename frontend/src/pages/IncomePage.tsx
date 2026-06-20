import { motion } from 'framer-motion';
import { useState } from 'react';
import { type CreateIncomePayload, useCreateIncome, useDeleteIncome, useIncome } from '../api/income';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import type { IncomeType } from '../types/api';

const now = new Date();

export const IncomePage = () => {
  const [tab, setTab] = useState<IncomeType>('fixed');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: '', amount: 0, type: tab });

  const { data: incomes = [] } = useIncome(month, year);
  const create = useCreateIncome(month, year);
  const remove = useDeleteIncome(month, year);

  const filtered = incomes.filter((i) => i.type === tab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateIncomePayload = tab === 'fixed'
      ? { description: form.description, amount: form.amount, type: 'fixed', month: null, year: null }
      : { description: form.description, amount: form.amount, type: 'variable', month, year };
    create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Income</h1>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
            + Add income
          </motion.button>
        </div>

        <div className="tabs tabs-boxed w-fit">
          <button className={`tab ${tab === 'fixed' ? 'tab-active' : ''}`} onClick={() => setTab('fixed')}>Fixed</button>
          <button className={`tab ${tab === 'variable' ? 'tab-active' : ''}`} onClick={() => setTab('variable')}>Variable</button>
        </div>

        {tab === 'variable' && (
          <div className="flex gap-3">
            <select className="select select-bordered select-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}
            </select>
            <input type="number" className="input input-bordered input-sm w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {filtered.map((income) => (
            <motion.div key={income.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between card bg-base-200 border border-base-300 px-4 py-3">
              <div>
                <p className="font-medium text-base-content text-sm">{income.description}</p>
                {income.type === 'variable' && <p className="text-xs text-base-content/50">{income.month}/{income.year}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-success">{formatCurrency(income.amount)}</span>
                <motion.button whileTap={{ scale: 0.93 }} className="btn btn-ghost btn-xs text-error" onClick={() => remove.mutate(income.id)}>✕</motion.button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-base-content/40 text-sm">No {tab} incomes registered.</p>}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add income">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <span className="label-text text-xs mb-1">Description</span>
            <input className="input input-bordered input-sm" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="form-control">
            <span className="label-text text-xs mb-1">Amount (R$)</span>
            <input type="number" step="0.01" className="input input-bordered input-sm" required value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
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

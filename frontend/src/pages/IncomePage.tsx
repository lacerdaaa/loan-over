import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { type CreateIncomePayload, useAddDeduction, useCreateIncome, useDeleteIncome, useIncome, useRemoveDeduction } from '../api/income';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import type { Income, IncomeCategory, IncomeType } from '../types/api';

const now = new Date();
const CATEGORY_LABEL: Record<IncomeCategory, string> = { salary: 'Salary', rent: 'Rent', benefit: 'Benefit', other: 'Other' };

const deductions = (income: Income) => income.deductions ?? [];
const netAmount = (income: Income) =>
  income.amount - deductions(income).reduce((s, d) => s + Number(d.amount), 0);

type DeductionFormState = { incomeId: string; label: string; amount: string };

const DeductionRow = ({ income, month, year }: { income: Income; month: number; year: number }) => {
  const [showForm, setShowForm] = useState(false);
  const [deductionForm, setDeductionForm] = useState<DeductionFormState>({ incomeId: income.id, label: '', amount: '' });
  const addDeduction = useAddDeduction(income.id, month, year);
  const removeDeduction = useRemoveDeduction(income.id, month, year);
  const net = netAmount(income);
  const hasDeductions = deductions(income).length > 0;

  const submitDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    addDeduction.mutate(
      { label: deductionForm.label, amount: Number(deductionForm.amount) },
      { onSuccess: () => { setShowForm(false); setDeductionForm({ incomeId: income.id, label: '', amount: '' }); } },
    );
  };

  return (
    <div className="mt-2 space-y-1">
      {hasDeductions && (
        <div className="text-xs text-base-content/60 flex justify-between pr-1">
          <span>Gross</span>
          <span>{formatCurrency(income.amount)}</span>
        </div>
      )}
      {deductions(income).map((d) => (
        <div key={d.id} className="flex items-center justify-between text-xs text-error/80 pr-1">
          <span>– {d.label}</span>
          <div className="flex items-center gap-2">
            <span>({formatCurrency(d.amount)})</span>
            <button
              className="btn btn-ghost btn-xs text-error h-4 min-h-0 px-1"
              onClick={() => removeDeduction.mutate(d.id)}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
      {hasDeductions && (
        <div className="flex justify-between text-xs font-semibold text-success border-t border-base-300 pt-1 pr-1">
          <span>Net</span>
          <span>{formatCurrency(net)}</span>
        </div>
      )}
      {showForm ? (
        <form onSubmit={submitDeduction} className="flex gap-2 mt-1">
          <input
            placeholder="Label"
            className="input input-bordered input-xs flex-1"
            required
            value={deductionForm.label}
            onChange={(e) => setDeductionForm({ ...deductionForm, label: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            className="input input-bordered input-xs w-24"
            required
            value={deductionForm.amount}
            onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
          />
          <button type="submit" className="btn btn-primary btn-xs" disabled={addDeduction.isPending}>Add</button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowForm(false)}><X size={14} /></button>
        </form>
      ) : (
        <button className="text-xs text-primary/70 hover:text-primary mt-1" onClick={() => setShowForm(true)}>
          + Add deduction
        </button>
      )}
    </div>
  );
};

export const IncomePage = () => {
  const [tab, setTab] = useState<IncomeType>('fixed');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: '', amount: 0, type: tab, category: 'other' as IncomeCategory });

  const { data: incomes = [] } = useIncome(month, year);
  const create = useCreateIncome(month, year);
  const remove = useDeleteIncome(month, year);

  const filtered = incomes.filter((i) => i.type === tab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateIncomePayload = tab === 'fixed'
      ? { description: form.description, amount: form.amount, type: 'fixed', category: form.category, month: null, year: null }
      : { description: form.description, amount: form.amount, type: 'variable', category: form.category, month, year };
    create.mutate(payload, { onSuccess: () => setOpen(false) });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-base-content">Income</h1>
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
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
            <input type="number" className="input input-bordered input-sm w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {filtered.map((income) => (
            <motion.div key={income.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card bg-base-200 border border-base-300 px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-base-content text-sm">{income.description}</p>
                  <span className={`badge badge-xs capitalize ${income.category === 'benefit' ? 'badge-warning' : 'badge-outline'}`}>
                    {CATEGORY_LABEL[income.category ?? 'other']}
                  </span>
                  {income.category === 'benefit' && (
                    <span className="text-xs text-warning/70">restricted</span>
                  )}
                  {income.type === 'variable' && (
                    <span className="text-xs text-base-content/50">{income.month}/{income.year}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="font-semibold text-success text-sm">
                    {formatCurrency(deductions(income).length > 0 ? netAmount(income) : income.amount)}
                  </span>
                  <motion.button whileTap={{ scale: 0.93 }} className="btn btn-ghost btn-xs text-error" onClick={() => remove.mutate(income.id)}><X size={14} /></motion.button>
                </div>
              </div>
              <DeductionRow income={income} month={month} year={year} />
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
            <span className="label-text text-xs mb-1">Category</span>
            <select className="select select-bordered select-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as IncomeCategory })}>
              <option value="salary">Salary</option>
              <option value="rent">Rent</option>
              <option value="benefit">Benefit (food card, transport, etc.)</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="form-control">
            <span className="label-text text-xs mb-1">Gross amount (R$)</span>
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

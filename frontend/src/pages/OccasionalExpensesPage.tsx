import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useCreateOccasionalExpense, useDeleteOccasionalExpense, useOccasionalExpenses } from '../api/occasional-expenses';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { MonthNav } from '../components/ui/MonthNav';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import { usePrivacy } from '../lib/privacy';

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
  const { hidden, mask } = usePrivacy();

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
      <div className="flex flex-col gap-6 w-full">
        <PageHeader
          title="Gastos Ocasionais"
          subtitle={<MonthNav month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
          action={
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5" data-tutorial="add-occasional">
              <Plus size={14} /> Adicionar gasto
            </motion.button>
          }
        />

        <div className="card bg-base-200 border border-base-300 divide-y divide-base-300">
          {expenses.length === 0 ? (
            <p className="px-4 py-8 text-sm text-base-content/40 text-center">Nenhum gasto neste mês.</p>
          ) : (
            <>
              {expenses.map((exp) => (
                <motion.div
                  key={exp.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <p className={`text-sm font-medium text-base-content truncate transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>
                      {exp.description}
                    </p>
                    {exp.from_benefit && (
                      <span className="badge badge-warning badge-xs shrink-0">benefício</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-semibold tabular-nums ${exp.from_benefit ? 'text-warning' : 'text-base-content'}`}>
                      {mask(formatCurrency(exp.amount))}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      aria-label="Excluir gasto"
                      className="btn btn-ghost btn-xs text-base-content/30 hover:text-error"
                      onClick={() => remove.mutate(exp.id)}
                    >
                      <X size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-xs text-base-content/50">Total deduzido do saldo livre</span>
                <span className="text-sm font-bold text-base-content tabular-nums">{mask(formatCurrency(total))}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo gasto ocasional">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Descrição">
            <input
              className="input input-bordered input-sm"
              required
              placeholder="Ex.: Conserto do carro, Consulta médica"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Valor (R$)">
            <input
              type="number"
              step="0.01"
              className="input input-bordered input-sm"
              required
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-warning checkbox-sm"
              checked={form.from_benefit}
              onChange={(e) => setForm({ ...form, from_benefit: e.target.checked })}
            />
            <span className="text-sm">Pago com benefício (vale-refeição, etc.)</span>
          </label>
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOpen(false)}>Cancelar</button>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn btn-primary btn-sm flex-1" disabled={create.isPending}>Salvar</motion.button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
};

import { motion } from 'framer-motion';
import { ListChecks, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useCreateFixedExpense, useDeleteFixedExpense, useFixedExpenses, useUpdateFixedExpense } from '../api/fixed-expenses';
import { Field } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import { labelsFor } from '../lib/labels';
import { usePrivacy } from '../lib/privacy';
import { useBusinessMode } from '../lib/useBusinessMode';

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

const EMPTY = { name: '', amount: 0, due_day: 1, active: true, from_benefit: false, valid_from_month: 0, valid_from_year: CURRENT_YEAR };

const monthName = (m: number) => new Date(0, m - 1).toLocaleString('pt-BR', { month: 'short' });

const isFuture = (exp: { valid_from_month?: number | null; valid_from_year?: number | null }) => {
  if (!exp.valid_from_month || !exp.valid_from_year) return false;
  if (exp.valid_from_year > CURRENT_YEAR) return true;
  return exp.valid_from_year === CURRENT_YEAR && exp.valid_from_month > CURRENT_MONTH;
};

export const FixedExpensesPage = () => {
  const { data: expenses = [] } = useFixedExpenses();
  const create = useCreateFixedExpense();
  const update = useUpdateFixedExpense();
  const remove = useDeleteFixedExpense();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const { hidden, mask } = usePrivacy();
  const labels = labelsFor(useBusinessMode());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      amount: form.amount,
      due_day: form.due_day,
      active: form.active,
      from_benefit: form.from_benefit,
      ...(form.valid_from_month > 0
        ? { valid_from_month: form.valid_from_month, valid_from_year: form.valid_from_year }
        : {}),
    };
    create.mutate(payload, { onSuccess: () => { setOpen(false); setForm(EMPTY); } });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <PageHeader
          title={labels.fixedExpenses}
          subtitle={`${expenses.filter((e) => e.active).length} ativo(s)`}
          action={
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5">
              <Plus size={14} /> Adicionar gasto
            </motion.button>
          }
        />

        {expenses.length === 0 ? (
          <div className="card bg-base-200 border border-primary/15 p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListChecks size={22} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base-content">Nenhum gasto fixo cadastrado</p>
              <p className="text-sm text-base-content/50 mt-1 max-w-xs">Aluguel, internet, academia — gastos que se repetem todo mês.</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5 mt-1">
              <Plus size={14} /> Adicionar gasto
            </motion.button>
          </div>
        ) : (
        <div className="overflow-x-auto card bg-base-200 border border-base-300">
          <table className="table table-sm">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase">
                <th>Nome</th><th>Valor</th><th>Vencimento</th><th>Origem</th><th>Início</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <motion.tr key={exp.id} layout className={exp.active ? (isFuture(exp) ? 'opacity-60' : '') : 'opacity-40'}>
                  <td className={`font-medium ${exp.active ? '' : 'line-through'}`}>
                    <span className={`transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>{exp.name}</span>
                    {exp.from_benefit && (
                      <span className="badge badge-warning badge-xs ml-2">benefício</span>
                    )}
                  </td>
                  <td className="tabular-nums">{mask(formatCurrency(exp.amount))}</td>
                  <td>Dia {exp.due_day}</td>
                  <td className="text-xs text-base-content/50">
                    {exp.from_benefit ? 'Restrito' : 'Salário'}
                  </td>
                  <td>
                    {exp.valid_from_month && exp.valid_from_year ? (
                      <span className="badge badge-info badge-xs">
                        {monthName(exp.valid_from_month)}/{exp.valid_from_year}
                      </span>
                    ) : (
                      <span className="text-xs text-base-content/30">—</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`badge badge-sm cursor-pointer select-none transition-colors ${exp.active ? 'badge-success' : 'badge-ghost text-base-content/40'}`}
                      onClick={() => update.mutate({ id: exp.id, active: !exp.active })}
                    >
                      {exp.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td>
                    <motion.button whileTap={{ scale: 0.93 }} aria-label="Excluir gasto" className="btn btn-ghost btn-xs text-error" onClick={() => remove.mutate(exp.id)}><X size={14} /></motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo gasto fixo">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Nome">
            <input className="input input-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)">
              <input type="number" step="0.01" className="input input-sm" required value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </Field>
            <Field label="Dia de vencimento">
              <input type="number" min={1} max={31} className="input input-sm" required value={form.due_day} onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })} />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="label-text text-xs">Começa em (opcional)</span>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="select select-sm"
                value={form.valid_from_month}
                onChange={(e) => setForm({ ...form, valid_from_month: Number(e.target.value) })}
              >
                <option value={0}>Sem restrição</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input input-sm"
                disabled={!form.valid_from_month}
                value={form.valid_from_year}
                onChange={(e) => setForm({ ...form, valid_from_year: Number(e.target.value) })}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-warning checkbox-sm"
              checked={form.from_benefit}
              onChange={(e) => setForm({ ...form, from_benefit: e.target.checked })}
            />
            <span className="text-sm">Pago com benefício (vale-refeição, transporte, etc.)</span>
          </label>
          {form.from_benefit && (
            <p className="text-xs text-warning/80 -mt-1">Este gasto não deduz do saldo livre — é coberto por fundos restritos.</p>
          )}
          <div className="flex gap-2 mt-2">
            <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => setOpen(false)}>Cancelar</button>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn btn-primary btn-sm flex-1" disabled={create.isPending}>Salvar</motion.button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
};

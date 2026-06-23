import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useCreateFixedExpense, useDeleteFixedExpense, useFixedExpenses, useUpdateFixedExpense } from '../api/fixed-expenses';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/ui/PageTransition';
import { formatCurrency } from '../lib/formatCurrency';
import { usePrivacy } from '../lib/privacy';

const EMPTY = { name: '', amount: 0, due_day: 1, active: true, from_benefit: false };

export const FixedExpensesPage = () => {
  const { data: expenses = [] } = useFixedExpenses();
  const create = useCreateFixedExpense();
  const update = useUpdateFixedExpense();
  const remove = useDeleteFixedExpense();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const { hidden, mask } = usePrivacy();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setOpen(false); setForm(EMPTY); } });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Gastos Fixos</h1>
            <p className="text-base-content/50 text-sm mt-0.5">{expenses.filter((e) => e.active).length} ativo(s)</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm">+ Adicionar gasto</motion.button>
        </div>

        <div className="overflow-x-auto card bg-base-200 border border-base-300">
          <table className="table table-sm">
            <thead>
              <tr className="text-base-content/50 text-xs uppercase">
                <th>Nome</th><th>Valor</th><th>Vencimento</th><th>Origem</th><th>Ativo</th><th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <motion.tr key={exp.id} layout className={exp.active ? '' : 'opacity-40'}>
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
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={exp.active}
                      onChange={() => update.mutate({ id: exp.id, active: !exp.active })}
                    />
                  </td>
                  <td>
                    <motion.button whileTap={{ scale: 0.93 }} className="btn btn-ghost btn-xs text-error" onClick={() => remove.mutate(exp.id)}><X size={14} /></motion.button>
                  </td>
                </motion.tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={6} className="text-center text-base-content/40 py-6">Nenhum gasto fixo cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo gasto fixo">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <span className="label-text text-xs mb-1">Nome</span>
            <input className="input input-bordered input-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text text-xs mb-1">Valor (R$)</span>
              <input type="number" step="0.01" className="input input-bordered input-sm" required value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Dia de vencimento</span>
              <input type="number" min={1} max={31} className="input input-bordered input-sm" required value={form.due_day} onChange={(e) => setForm({ ...form, due_day: Number(e.target.value) })} />
            </label>
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

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useCreateDebt, useDebts } from '../api/debts';
import { DebtCard } from '../components/ui/DebtCard';
import { Modal } from '../components/ui/Modal';
import { PageTransition } from '../components/ui/PageTransition';

const EMPTY_FORM = { name: '', installment_amount: 0, principal: 0, monthly_rate: 0, total_installments: 0, paid_installments: 0, start_date: '', hasInterest: false };

export const DebtsPage = () => {
  const { data: debts = [], isLoading } = useDebts();
  const create = useCreateDebt();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = form.hasInterest
      ? { name: form.name, principal: form.principal, monthly_rate: form.monthly_rate / 100, total_installments: form.total_installments, paid_installments: form.paid_installments, start_date: form.start_date }
      : { name: form.name, installment_amount: form.installment_amount, total_installments: form.total_installments, paid_installments: form.paid_installments, start_date: form.start_date };
    create.mutate(payload as Parameters<typeof create.mutate>[0], { onSuccess: () => { setOpen(false); setForm(EMPTY_FORM); } });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-base-content">Dívidas</h1>
            <p className="text-base-content/50 text-sm mt-0.5">{debts.filter((d) => !d.closed).length} em aberto · {debts.filter((d) => d.closed).length} quitadas</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
            + Adicionar dívida
          </motion.button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card bg-base-200 border border-base-300 h-36 animate-pulse" />)}
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" layout>
            {debts.map((debt) => <DebtCard key={debt.id} debt={debt} />)}
          </motion.div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova dívida">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control">
            <span className="label-text text-xs mb-1">Nome</span>
            <input className="input input-bordered input-sm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-warning checkbox-sm"
              checked={form.hasInterest}
              onChange={(e) => setForm({ ...form, hasInterest: e.target.checked })}
            />
            <span className="text-sm">Tem juros (Tabela Price)</span>
          </label>

          {form.hasInterest ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text text-xs mb-1">Principal (R$)</span>
                <input type="number" step="0.01" className="input input-bordered input-sm" required value={form.principal || ''} onChange={(e) => setForm({ ...form, principal: Number(e.target.value) })} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs mb-1">Taxa (% a.m.)</span>
                <input type="number" step="0.01" className="input input-bordered input-sm" required value={form.monthly_rate || ''} onChange={(e) => setForm({ ...form, monthly_rate: Number(e.target.value) })} />
              </label>
            </div>
          ) : (
            <label className="form-control">
              <span className="label-text text-xs mb-1">Parcela (R$)</span>
              <input type="number" step="0.01" className="input input-bordered input-sm" required value={form.installment_amount || ''} onChange={(e) => setForm({ ...form, installment_amount: Number(e.target.value) })} />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text text-xs mb-1">Total de parcelas</span>
              <input type="number" className="input input-bordered input-sm" required value={form.total_installments || ''} onChange={(e) => setForm({ ...form, total_installments: Number(e.target.value) })} />
            </label>
            <label className="form-control">
              <span className="label-text text-xs mb-1">Já pagas</span>
              <input type="number" className="input input-bordered input-sm" value={form.paid_installments} onChange={(e) => setForm({ ...form, paid_installments: Number(e.target.value) })} />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text text-xs mb-1">Data de início</span>
            <input type="date" className="input input-bordered input-sm" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
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

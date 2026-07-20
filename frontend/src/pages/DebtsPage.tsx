import { motion } from 'framer-motion';
import { CreditCard, Plus } from 'lucide-react';
import { useState } from 'react';
import { useCreateDebt, useDebts } from '../api/debts';
import { DebtCard } from '../components/ui/DebtCard';
import { DebtForm, type DebtFormValues } from '../components/ui/DebtForm';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';

const EMPTY_DEBT_FORM: DebtFormValues = {
  name: '',
  installment_amount: 0,
  principal: 0,
  monthly_rate: 0,
  total_installments: 0,
  paid_installments: 0,
  start_date: '',
  hasInterest: false,
};

export const DebtsPage = () => {
  const { data: debts = [], isLoading } = useDebts();
  const create = useCreateDebt();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_DEBT_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = form.hasInterest
      ? { name: form.name, principal: form.principal, monthly_rate: form.monthly_rate / 100, total_installments: form.total_installments, paid_installments: form.paid_installments, start_date: form.start_date }
      : { name: form.name, installment_amount: form.installment_amount, total_installments: form.total_installments, paid_installments: form.paid_installments, start_date: form.start_date };
    create.mutate(payload as Parameters<typeof create.mutate>[0], { onSuccess: () => { setOpen(false); setForm(EMPTY_DEBT_FORM); } });
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">
        <PageHeader
          title="Dívidas"
          subtitle={`${debts.filter((d) => !d.closed).length} em aberto · ${debts.filter((d) => d.closed).length} quitadas`}
          action={
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5">
              <Plus size={14} /> Adicionar dívida
            </motion.button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card bg-base-200 border border-base-300 h-36 animate-pulse" />)}
          </div>
        ) : debts.length === 0 ? (
          <div className="card bg-base-200 border border-primary/15 p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard size={22} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base-content">Nenhuma dívida cadastrada</p>
              <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                Cadastre suas dívidas para ver a projeção de quando cada uma termina.
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn btn-primary btn-sm gap-1.5 mt-1">
              <Plus size={14} /> Adicionar primeira dívida
            </motion.button>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" layout>
            {debts.map((debt) => <DebtCard key={debt.id} debt={debt} />)}
          </motion.div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova dívida">
        <DebtForm
          values={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          pending={create.isPending}
        />
      </Modal>
    </PageTransition>
  );
};

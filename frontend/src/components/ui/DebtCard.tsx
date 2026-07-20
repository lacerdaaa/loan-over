import { AnimatePresence, motion } from 'framer-motion';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDeleteDebt, usePayInstallment, useUpdateDebt } from '../../api/debts';
import { payoffMonth, remainingBalance } from '../../lib/debt';
import { formatCurrency } from '../../lib/formatCurrency';
import { usePrivacy } from '../../lib/privacy';
import type { Debt } from '../../types/api';
import { DebtForm, type DebtFormValues } from './DebtForm';
import { Modal } from './Modal';

interface Props {
  debt: Debt;
}

const toDateInput = (date: Date | string) =>
  new Date(date).toISOString().slice(0, 10);

const formFromDebt = (debt: Debt): DebtFormValues => ({
  name: debt.name,
  installment_amount: Number(debt.installment_amount),
  principal: Number(debt.principal ?? 0),
  monthly_rate: Number(debt.monthly_rate ?? 0) * 100,
  total_installments: debt.total_installments,
  paid_installments: debt.paid_installments,
  start_date: toDateInput(debt.start_date),
  hasInterest: !!debt.monthly_rate,
});

export const DebtCard = ({ debt }: Props) => {
  const pay = usePayInstallment();
  const update = useUpdateDebt();
  const remove = useDeleteDebt();
  const { hidden, mask } = usePrivacy();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DebtFormValues>(() => formFromDebt(debt));

  const progress = debt.total_installments > 0
    ? (debt.paid_installments / debt.total_installments) * 100
    : 0;
  const remaining = debt.total_installments - debt.paid_installments;
  const payoffCost = remainingBalance(debt);
  const faceCost = remaining * Number(debt.installment_amount);
  const showPayoffCost = !!debt.monthly_rate && !debt.closed && payoffCost < faceCost - 0.01;

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = form.hasInterest
      ? { id: debt.id, name: form.name, principal: form.principal, monthly_rate: form.monthly_rate / 100, total_installments: form.total_installments, paid_installments: form.paid_installments, start_date: form.start_date }
      : { id: debt.id, name: form.name, installment_amount: form.installment_amount, monthly_rate: null, principal: null, total_installments: form.total_installments, paid_installments: form.paid_installments, start_date: form.start_date };
    update.mutate(payload as Parameters<typeof update.mutate>[0], { onSuccess: () => setEditing(false) });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: debt.closed ? 0.5 : 1, scale: 1 }}
        className="card bg-base-200 border border-base-300 shadow-sm p-5 flex flex-col gap-3"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`font-semibold text-base-content transition-[filter] ${hidden ? 'blur-sm select-none' : ''}`}>{debt.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-base-content/60 tabular-nums">{mask(formatCurrency(debt.installment_amount))}/mês</p>
              {debt.monthly_rate ? (
                <span className="badge badge-ghost badge-xs tabular-nums">{(Number(debt.monthly_rate) * 100).toFixed(2)}% a.m.</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AnimatePresence>
              {debt.closed && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="badge badge-success gap-1 mr-1">
                  <Check size={12} /> Quitado
                </motion.span>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.93 }}
              aria-label="Editar dívida"
              className="btn btn-ghost btn-xs text-base-content/30 hover:text-primary"
              onClick={() => { setForm(formFromDebt(debt)); setEditing(true); setConfirming(false); }}
            >
              <Pencil size={14} />
            </motion.button>

            <AnimatePresence mode="wait">
              {confirming ? (
                <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-1">
                  <span className="text-xs text-error font-medium">Excluir?</span>
                  <button className="btn btn-error btn-xs" disabled={remove.isPending} onClick={() => remove.mutate(debt.id)}>Sim</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => setConfirming(false)}>Não</button>
                </motion.div>
              ) : (
                <motion.button
                  key="trash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.93 }}
                  aria-label="Excluir dívida"
                  className="btn btn-ghost btn-xs text-base-content/30 hover:text-error"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <progress className="progress progress-primary w-full" value={progress} max={100} />
          <div className="flex justify-between text-xs text-base-content/50 mt-1">
            <span>{debt.paid_installments} de {debt.total_installments} pagas</span>
            <span>quitação: {payoffMonth(debt.start_date, debt.total_installments)}</span>
          </div>
          {showPayoffCost && (
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-base-content/40">Quitar hoje</span>
              <span className="font-semibold text-success tabular-nums">{mask(formatCurrency(payoffCost))}</span>
            </div>
          )}
        </div>

        {!debt.closed && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn btn-primary btn-sm"
            disabled={pay.isPending}
            onClick={() => pay.mutate(debt.id)}
          >
            {pay.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
            Pagar parcela · {remaining} restantes
          </motion.button>
        )}
      </motion.div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar dívida">
        <DebtForm
          values={form}
          onChange={setForm}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          pending={update.isPending}
        />
      </Modal>
    </>
  );
};

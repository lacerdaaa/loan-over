import { AnimatePresence, motion } from 'framer-motion';
import { usePayInstallment } from '../../api/debts';
import { formatCurrency } from '../../lib/formatCurrency';
import { monthLabel } from '../../lib/monthLabel';
import type { Debt } from '../../types/api';

interface Props {
  debt: Debt;
}

const payoffDate = (debt: Debt) => {
  const start = new Date(debt.start_date);
  start.setMonth(start.getMonth() + debt.total_installments);
  return monthLabel(start.getMonth() + 1, start.getFullYear());
};

export const DebtCard = ({ debt }: Props) => {
  const pay = usePayInstallment();
  const progress = debt.total_installments > 0
    ? (debt.paid_installments / debt.total_installments) * 100
    : 0;
  const remaining = debt.total_installments - debt.paid_installments;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: debt.closed ? 0.5 : 1, scale: 1 }}
      className="card bg-base-200 border border-base-300 shadow-sm p-5 flex flex-col gap-3"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-base-content">{debt.name}</h3>
          <p className="text-sm text-base-content/60">{formatCurrency(debt.installment_amount)}/month</p>
        </div>
        <AnimatePresence>
          {debt.closed && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="badge badge-success gap-1"
            >
              ✓ Paid off
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div>
        <progress
          className="progress progress-primary w-full"
          value={progress}
          max={100}
        />
        <div className="flex justify-between text-xs text-base-content/50 mt-1">
          <span>{debt.paid_installments} of {debt.total_installments} paid</span>
          <span>payoff: {payoffDate(debt)}</span>
        </div>
      </div>

      {!debt.closed && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary btn-sm"
          disabled={pay.isPending}
          onClick={() => pay.mutate(debt.id)}
        >
          {pay.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
          Pay installment · {remaining} left
        </motion.button>
      )}
    </motion.div>
  );
};

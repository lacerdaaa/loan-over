import type { Debt } from '../types/api';

export const remainingBalance = (debt: Debt): number => {
  const n = debt.total_installments - debt.paid_installments;
  const pmt = Number(debt.installment_amount);
  const r = Number(debt.monthly_rate ?? 0);
  if (!r || !debt.principal) return n * pmt;
  return (pmt * (1 - Math.pow(1 + r, -n))) / r;
};

export const naturalPayoffMonths = (debt: Debt): number => {
  if (!debt.monthly_rate || !debt.principal) {
    return debt.total_installments - debt.paid_installments;
  }
  const pmt = Number(debt.installment_amount);
  const r = Number(debt.monthly_rate);
  let balance = remainingBalance(debt);
  let months = 0;
  while (balance > 0.01 && months < 1200) {
    const interest = balance * r;
    balance -= pmt - interest;
    months++;
  }
  return months;
};

import type { Debt } from '../types/api';
import { addMonths, currentPeriod } from './date';
import { monthLabel } from './monthLabel';

export const MAX_PAYOFF_MONTHS = 120;
const BALANCE_EPSILON = 0.01;

export const remainingInstallments = (debt: Debt): number =>
  Math.max(0, debt.total_installments - debt.paid_installments);

/** Month in which the debt is fully paid, matching the projection's liberation event. */
export const payoffMonth = (debt: Debt, today = currentPeriod()): string => {
  const { month, year } = addMonths(today.month, today.year, remainingInstallments(debt));
  return monthLabel(month, year);
};

export const remainingBalance = (debt: Debt): number => {
  const n = remainingInstallments(debt);
  const pmt = debt.installment_amount;
  const r = debt.monthly_rate ?? 0;
  if (!r || !debt.principal) return n * pmt;
  return (pmt * (1 - Math.pow(1 + r, -n))) / r;
};

/** Months to pay the debt off by installments alone, capped at MAX_PAYOFF_MONTHS. */
export const naturalPayoffMonths = (debt: Debt): number => {
  const rate = debt.monthly_rate ?? 0;
  if (!rate || !debt.principal) return remainingInstallments(debt);
  let balance = remainingBalance(debt);
  let months = 0;
  while (balance > BALANCE_EPSILON && months < MAX_PAYOFF_MONTHS) {
    balance -= debt.installment_amount - balance * rate;
    months++;
  }
  return months;
};

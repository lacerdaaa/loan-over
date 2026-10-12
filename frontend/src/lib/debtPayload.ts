import type { DebtPayload } from '../api/debts';
import type { DebtFormValues } from '../components/ui/DebtForm';

const PERCENT = 100;

export const debtPayloadFromForm = (form: DebtFormValues): DebtPayload => {
  const base = {
    name: form.name,
    total_installments: form.total_installments,
    paid_installments: form.paid_installments,
    start_date: form.start_date,
  };
  return form.hasInterest
    ? { ...base, principal: form.principal, monthly_rate: form.monthly_rate / PERCENT }
    : { ...base, installment_amount: form.installment_amount, principal: null, monthly_rate: null };
};

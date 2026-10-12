import { describe, expect, it } from 'vitest';
import type { DebtFormValues } from '../components/ui/DebtForm';
import { debtPayloadFromForm } from './debtPayload';

const interestForm = (monthlyRatePercent: number): DebtFormValues => ({
  name: 'Financiamento',
  installment_amount: 0,
  principal: 10000,
  monthly_rate: monthlyRatePercent,
  total_installments: 12,
  paid_installments: 0,
  start_date: '2026-01-01',
  hasInterest: true,
});

describe('debtPayloadFromForm', () => {
  describe('when the debt has interest', () => {
    it.each([
      [1.07, 0.0107],
      [2.9, 0.029],
      [0.57, 0.0057],
    ])('converts a %s%% monthly rate to %s without floating point tails', (percent, fraction) => {
      const payload = debtPayloadFromForm(interestForm(percent));

      expect(payload.monthly_rate).toBe(fraction);
    });
  });

  describe('when the debt has no interest', () => {
    it('clears principal and monthly rate', () => {
      const payload = debtPayloadFromForm({ ...interestForm(1), hasInterest: false, installment_amount: 500 });

      expect(payload).toMatchObject({ installment_amount: 500, principal: null, monthly_rate: null });
    });
  });
});

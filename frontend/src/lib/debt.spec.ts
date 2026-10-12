import { describe, expect, it } from 'vitest';
import type { Debt } from '../types/api';
import {
  MAX_PAYOFF_MONTHS,
  naturalPayoffMonths,
  payoffMonth,
  remainingBalance,
  remainingInstallments,
} from './debt';

const debt = (overrides: Partial<Debt> = {}): Debt => ({
  id: 'd1',
  name: 'Empréstimo',
  installment_amount: 100,
  total_installments: 10,
  paid_installments: 0,
  start_date: '2026-01-01',
  closed: false,
  principal: null,
  monthly_rate: null,
  ...overrides,
});

const TODAY = { month: 10, year: 2026 };

describe('remainingInstallments', () => {
  it('subtracts paid installments from the total', () => {
    expect(remainingInstallments(debt({ total_installments: 10, paid_installments: 4 }))).toBe(6);
  });

  it('never goes below zero when more were paid than planned', () => {
    expect(remainingInstallments(debt({ total_installments: 10, paid_installments: 12 }))).toBe(0);
  });
});

describe('payoffMonth', () => {
  describe('when the last installment falls in the same year', () => {
    it('labels the month that many installments from today', () => {
      const label = payoffMonth(debt({ total_installments: 2, paid_installments: 0 }), TODAY);

      expect(label).toBe('Dez 2026');
    });
  });

  describe('when the payoff crosses a year boundary', () => {
    it('rolls into the next year', () => {
      const label = payoffMonth(debt({ total_installments: 5, paid_installments: 0 }), TODAY);

      expect(label).toBe('Mar 2027');
    });
  });

  describe('when no installments remain', () => {
    it('is the current month', () => {
      const label = payoffMonth(debt({ total_installments: 3, paid_installments: 3 }), TODAY);

      expect(label).toBe('Out 2026');
    });
  });
});

describe('remainingBalance', () => {
  describe('when the debt has no interest', () => {
    it('is the remaining installments times the installment amount', () => {
      const balance = remainingBalance(debt({ total_installments: 10, paid_installments: 4 }));

      expect(balance).toBe(600);
    });
  });

  describe('when a rate is set but the principal is missing', () => {
    it('ignores the rate', () => {
      const balance = remainingBalance(debt({ monthly_rate: 0.02, principal: null }));

      expect(balance).toBe(1000);
    });
  });

  describe('when the debt is a Price-table loan', () => {
    it('is the present value of the remaining installments', () => {
      const balance = remainingBalance(
        debt({ principal: 1000, monthly_rate: 0.01, installment_amount: 100, total_installments: 12 }),
      );

      expect(balance).toBeCloseTo((100 * (1 - Math.pow(1.01, -12))) / 0.01, 6);
    });
  });
});

describe('naturalPayoffMonths', () => {
  describe('when the debt has no interest', () => {
    it('equals the remaining installments', () => {
      expect(naturalPayoffMonths(debt({ total_installments: 10, paid_installments: 4 }))).toBe(6);
    });
  });

  describe('when no installments remain on an interest-bearing debt', () => {
    it('is zero months', () => {
      const months = naturalPayoffMonths(
        debt({ principal: 1000, monthly_rate: 0.01, total_installments: 5, paid_installments: 5 }),
      );

      expect(months).toBe(0);
    });
  });

  describe('when the debt is a Price-table loan paid on schedule', () => {
    it('takes about as many months as the remaining installments', () => {
      const months = naturalPayoffMonths(
        debt({ principal: 1000, monthly_rate: 0.01, installment_amount: 88.85, total_installments: 12 }),
      );

      expect(months).toBeGreaterThanOrEqual(11);
      expect(months).toBeLessThanOrEqual(12);
    });
  });

  describe('when the loan lasts longer than the maximum payoff horizon', () => {
    it('stops at the maximum payoff horizon', () => {
      const months = naturalPayoffMonths(
        debt({ principal: 8000, monthly_rate: 0.01, installment_amount: 100, total_installments: 200 }),
      );

      expect(months).toBe(MAX_PAYOFF_MONTHS);
    });
  });
});

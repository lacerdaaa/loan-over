import { describe, expect, it } from 'vitest';
import { toDebt } from './debts';
import { toFixedExpense } from './fixed-expenses';
import { toGoal } from './goal';
import { toIncome } from './income';
import { toNullableNumber } from './numbers';
import { toOccasionalExpense } from './occasional-expenses';
import { toProjectedMonth } from './projection';

describe('toNullableNumber', () => {
  it('converts numeric strings (as PostgreSQL decimals arrive) to numbers', () => {
    expect(toNullableNumber('12.50')).toBe(12.5);
  });

  it('keeps numbers as they are, including zero', () => {
    expect(toNullableNumber(0)).toBe(0);
  });

  it('turns null and undefined into null', () => {
    expect(toNullableNumber(null)).toBeNull();
    expect(toNullableNumber(undefined)).toBeNull();
  });
});

describe('toDebt', () => {
  const raw = {
    id: 'd1',
    name: 'Carro',
    installment_amount: '450.00',
    total_installments: 24,
    paid_installments: 3,
    start_date: '2026-01-01',
    closed: false,
  };

  it('converts decimal strings to numbers', () => {
    const debt = toDebt({ ...raw, principal: '9000.00', monthly_rate: '0.0149' });

    expect(debt.installment_amount).toBe(450);
    expect(debt.principal).toBe(9000);
    expect(debt.monthly_rate).toBe(0.0149);
  });

  it('keeps interest fields empty for debts without a Price table', () => {
    const debt = toDebt({ ...raw, principal: null });

    expect(debt.principal).toBeNull();
    expect(debt.monthly_rate).toBeNull();
  });

  it('keeps the other fields untouched', () => {
    expect(toDebt(raw)).toMatchObject({ id: 'd1', name: 'Carro', total_installments: 24, closed: false });
  });
});

describe('toGoal', () => {
  const raw = { id: 'g1', target_amount: '5000.00', deadline_month: 12, deadline_year: 2027, monthly_min: '200.00' };

  it('converts decimal strings to numbers', () => {
    const goal = toGoal({ ...raw, saved_amount: '1250.40' });

    expect(goal.target_amount).toBe(5000);
    expect(goal.monthly_min).toBe(200);
    expect(goal.saved_amount).toBe(1250.4);
  });

  it('defaults the saved amount to zero when the API omits it', () => {
    expect(toGoal(raw).saved_amount).toBe(0);
    expect(toGoal({ ...raw, saved_amount: null }).saved_amount).toBe(0);
  });

  it('keeps a missing monthly minimum as null', () => {
    expect(toGoal({ ...raw, monthly_min: null }).monthly_min).toBeNull();
  });
});

describe('toFixedExpense', () => {
  const raw = {
    id: 'f1',
    name: 'Aluguel',
    amount: '1500.00',
    due_day: 5,
    active: true,
    from_benefit: false,
  };

  it('converts the amount to a number', () => {
    expect(toFixedExpense(raw).amount).toBe(1500);
  });

  it('converts the validity start to numbers, or null when absent', () => {
    const withValidity = toFixedExpense({ ...raw, valid_from_month: 3, valid_from_year: 2027 });
    const without = toFixedExpense(raw);

    expect(withValidity.valid_from_month).toBe(3);
    expect(withValidity.valid_from_year).toBe(2027);
    expect(without.valid_from_month).toBeNull();
    expect(without.valid_from_year).toBeNull();
  });
});

describe('toIncome', () => {
  const raw = {
    id: 'i1',
    type: 'fixed' as const,
    category: 'salary' as const,
    amount: '5000.00',
    month: null,
    year: null,
    description: 'Salário',
  };

  it('converts the amount and every deduction amount to numbers', () => {
    const income = toIncome({
      ...raw,
      deductions: [{ id: 'x1', label: 'INSS', amount: '550.25' }],
    });

    expect(income.amount).toBe(5000);
    expect(income.deductions).toEqual([{ id: 'x1', label: 'INSS', amount: 550.25 }]);
  });

  it('uses an empty deductions list when the API omits it', () => {
    expect(toIncome(raw).deductions).toEqual([]);
  });
});

describe('toOccasionalExpense', () => {
  it('converts the amount to a number', () => {
    const expense = toOccasionalExpense({
      id: 'o1',
      description: 'Dentista',
      amount: '320.90',
      month: 11,
      year: 2026,
      from_benefit: false,
    });

    expect(expense.amount).toBe(320.9);
    expect(expense.description).toBe('Dentista');
  });
});

describe('toProjectedMonth', () => {
  const raw = {
    month: 11,
    year: 2026,
    free_balance: 300,
    events: [],
    active_debts: 2,
    total_outflow: 1200,
  };

  it('converts the cumulative balance string to a number', () => {
    expect(toProjectedMonth({ ...raw, cumulative_balance: '900.50' }).cumulative_balance).toBe(900.5);
  });

  it('treats a missing or null cumulative balance as zero', () => {
    expect(toProjectedMonth(raw).cumulative_balance).toBe(0);
    expect(toProjectedMonth({ ...raw, cumulative_balance: null }).cumulative_balance).toBe(0);
  });
});

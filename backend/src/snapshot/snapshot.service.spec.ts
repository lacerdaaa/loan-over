import { Test, TestingModule } from '@nestjs/testing';
import { Debt } from '../debt/debt.entity';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { IncomeDeduction } from '../income/income-deduction.entity';
import { Income } from '../income/income.entity';
import { OccasionalExpense } from '../occasional-expense/occasional-expense.entity';
import { IncomeCategory, IncomeType } from '../shared/types';
import { SnapshotService } from './snapshot.service';

const makeIncome = (amount: number, category = IncomeCategory.OTHER, deductions: Partial<IncomeDeduction>[] = []): Income =>
  ({ id: '1', type: IncomeType.FIXED, category, amount, month: null, year: null, description: 'test', deductions }) as Income;

const makeExpense = (amount: number, active = true, from_benefit = false): FixedExpense =>
  ({ id: '1', name: 'test', amount, due_day: 5, active, from_benefit }) as FixedExpense;

const makeDebt = (installment_amount: number, closed = false, total = 10, paid = 0): Debt =>
  ({ id: '1', name: 'test', installment_amount, total_installments: total, paid_installments: paid, start_date: new Date(), closed }) as Debt;

const makeOccasional = (amount: number, from_benefit = false): OccasionalExpense =>
  ({ id: '1', description: 'test', amount, month: 6, year: 2026, from_benefit }) as OccasionalExpense;

const compute = (service: SnapshotService, overrides: Parameters<SnapshotService['compute']>[0]) =>
  service.compute({ month: 6, year: 2026, incomes: [], fixedExpenses: [], debts: [], occasionalExpenses: [], ...overrides });

describe('SnapshotService', () => {
  let service: SnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SnapshotService],
    }).compile();

    service = module.get(SnapshotService);
  });

  describe('compute', () => {
    it('calculates free_balance as net income minus debts minus fixed and occasional expenses', () => {
      const result = compute(service, {
        incomes: [makeIncome(5000)],
        fixedExpenses: [makeExpense(1000)],
        debts: [makeDebt(500)],
        occasionalExpenses: [makeOccasional(200)],
      });

      expect(result.total_income).toBe(5000);
      expect(result.total_fixed).toBe(1000);
      expect(result.total_debts).toBe(500);
      expect(result.total_occasional).toBe(200);
      expect(result.free_balance).toBe(3300);
    });

    it('computes total_debt_balance as remaining installments times installment amount', () => {
      const result = compute(service, {
        debts: [makeDebt(500, false, 12, 4), makeDebt(300, false, 6, 6)],
      });

      expect(result.total_debt_balance).toBe(4000); // (12-4)*500 = 4000, (6-6)*300 = 0
    });

    it('excludes closed debts from total_debt_balance', () => {
      const result = compute(service, {
        debts: [makeDebt(500, true, 12, 0)],
      });

      expect(result.total_debt_balance).toBe(0);
    });

    it('uses net amount (gross minus deductions) for total_income', () => {
      const result = compute(service, {
        incomes: [makeIncome(6000, IncomeCategory.SALARY, [{ amount: 660 }, { amount: 420 }])],
      });

      expect(result.total_income).toBe(4920);
      expect(result.free_balance).toBe(4920);
    });

    it('excludes benefit incomes from total_income and free_balance', () => {
      const result = compute(service, {
        incomes: [makeIncome(5000), makeIncome(990, IncomeCategory.BENEFIT)],
      });

      expect(result.total_income).toBe(5000);
      expect(result.free_balance).toBe(5000);
    });

    it('sums benefit incomes into total_benefit', () => {
      const result = compute(service, {
        incomes: [makeIncome(5000), makeIncome(990, IncomeCategory.BENEFIT), makeIncome(200, IncomeCategory.BENEFIT)],
      });

      expect(result.total_benefit).toBe(1190);
    });

    it('excludes from_benefit fixed expenses from total_fixed', () => {
      const result = compute(service, {
        incomes: [makeIncome(5000)],
        fixedExpenses: [makeExpense(800, true, true), makeExpense(200)],
      });

      expect(result.total_fixed).toBe(200);
      expect(result.free_balance).toBe(4800);
    });

    it('excludes from_benefit occasional expenses from total_occasional', () => {
      const result = compute(service, {
        incomes: [makeIncome(5000)],
        occasionalExpenses: [makeOccasional(300, true), makeOccasional(100)],
      });

      expect(result.total_occasional).toBe(100);
      expect(result.free_balance).toBe(4900);
    });

    it('excludes inactive fixed expenses from calculation', () => {
      const result = compute(service, {
        incomes: [makeIncome(5000)],
        fixedExpenses: [makeExpense(1000, false)],
      });

      expect(result.total_fixed).toBe(0);
      expect(result.free_balance).toBe(5000);
    });

    it('excludes closed debts from monthly total_debts', () => {
      const result = compute(service, {
        incomes: [makeIncome(5000)],
        debts: [makeDebt(500, true)],
      });

      expect(result.total_debts).toBe(0);
      expect(result.free_balance).toBe(5000);
    });
  });
});

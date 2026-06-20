import { Test, TestingModule } from '@nestjs/testing';
import { Debt } from '../debt/debt.entity';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { IncomeDeduction } from '../income/income-deduction.entity';
import { Income } from '../income/income.entity';
import { IncomeCategory, IncomeType } from '../shared/types';
import { SnapshotService } from './snapshot.service';

const makeIncome = (amount: number, deductions: Partial<IncomeDeduction>[] = []): Income =>
  ({ id: '1', type: IncomeType.FIXED, category: IncomeCategory.OTHER, amount, month: null, year: null, description: 'test', deductions }) as Income;

const makeExpense = (amount: number, active = true): FixedExpense =>
  ({ id: '1', name: 'test', amount, due_day: 5, active }) as FixedExpense;

const makeDebt = (installment_amount: number, closed = false): Debt =>
  ({ id: '1', name: 'test', installment_amount, total_installments: 10, paid_installments: 0, start_date: new Date(), closed }) as Debt;

describe('SnapshotService', () => {
  let service: SnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SnapshotService],
    }).compile();

    service = module.get(SnapshotService);
  });

  describe('compute', () => {
    it('calculates free_balance as net income minus debts minus fixed expenses', () => {
      const incomes = [makeIncome(5000)];
      const expenses = [makeExpense(1000)];
      const debts = [makeDebt(500)];

      const result = service.compute({ month: 6, year: 2026, incomes, fixedExpenses: expenses, debts });

      expect(result.total_income).toBe(5000);
      expect(result.total_fixed).toBe(1000);
      expect(result.total_debts).toBe(500);
      expect(result.free_balance).toBe(3500);
    });

    it('uses net amount (gross minus deductions) for total_income', () => {
      const incomes = [makeIncome(6000, [{ amount: 660 }, { amount: 420 }])];

      const result = service.compute({ month: 6, year: 2026, incomes, fixedExpenses: [], debts: [] });

      expect(result.total_income).toBe(4920);
      expect(result.free_balance).toBe(4920);
    });

    it('excludes inactive fixed expenses from calculation', () => {
      const incomes = [makeIncome(5000)];
      const expenses = [makeExpense(1000, false)];

      const result = service.compute({ month: 6, year: 2026, incomes, fixedExpenses: expenses, debts: [] });

      expect(result.total_fixed).toBe(0);
      expect(result.free_balance).toBe(5000);
    });

    it('excludes closed debts from calculation', () => {
      const incomes = [makeIncome(5000)];
      const debts = [makeDebt(500, true)];

      const result = service.compute({ month: 6, year: 2026, incomes, fixedExpenses: [], debts });

      expect(result.total_debts).toBe(0);
      expect(result.free_balance).toBe(5000);
    });

    it('sums net amounts across multiple incomes', () => {
      const incomes = [
        makeIncome(3000, [{ amount: 300 }]),
        makeIncome(2000),
      ];

      const result = service.compute({ month: 6, year: 2026, incomes, fixedExpenses: [], debts: [] });

      expect(result.total_income).toBe(4700);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Debt } from '../debt/debt.entity';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { Income } from '../income/income.entity';
import { IncomeCategory, IncomeType } from '../shared/types';
import { ProjectionService } from './projection.service';

const makeIncome = (amount: number, deductions: { amount: number }[] = []): Income =>
  ({ id: '1', type: IncomeType.FIXED, category: IncomeCategory.OTHER, amount, month: null, year: null, description: 'Salary', deductions }) as Income;

const makeExpense = (amount: number): FixedExpense =>
  ({ id: '1', name: 'Rent', amount, due_day: 5, active: true }) as FixedExpense;

const makeDebt = (overrides: Partial<Debt>): Debt =>
  ({
    id: '1',
    name: 'Car',
    installment_amount: 500,
    total_installments: 12,
    paid_installments: 0,
    start_date: new Date('2026-01-01'),
    closed: false,
    ...overrides,
  }) as Debt;

describe('ProjectionService', () => {
  let service: ProjectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectionService],
    }).compile();

    service = module.get(ProjectionService);
  });

  describe('project', () => {
    it('returns the correct number of projected months', () => {
      const result = service.project({
        incomes: [makeIncome(5000)],
        fixedExpenses: [],
        debts: [],
        referenceMonth: 6,
        referenceYear: 2026,
      }, 12);

      expect(result).toHaveLength(12);
    });

    it('uses net income (gross minus deductions) in free_balance', () => {
      const income = makeIncome(6000, [{ amount: 660 }, { amount: 420 }]);

      const result = service.project({
        incomes: [income],
        fixedExpenses: [],
        debts: [],
        referenceMonth: 6,
        referenceYear: 2026,
      }, 1);

      expect(result[0]?.free_balance).toBe(4920);
    });

    it('marks the month a debt finishes as a liberation event', () => {
      const debt = makeDebt({ installment_amount: 500, total_installments: 3, paid_installments: 2 });

      const result = service.project({
        incomes: [makeIncome(5000)],
        fixedExpenses: [],
        debts: [debt],
        referenceMonth: 6,
        referenceYear: 2026,
      }, 3);

      const liberationMonth = result.find((m) => m.events.some((e) => e.type === 'liberation'));
      expect(liberationMonth).toBeDefined();
      expect(liberationMonth?.events[0].amount).toBe(500);
    });

    it('does not count a closed debt in total_outflow', () => {
      const closed = makeDebt({ installment_amount: 500, closed: true });

      const result = service.project({
        incomes: [makeIncome(5000)],
        fixedExpenses: [],
        debts: [closed],
        referenceMonth: 6,
        referenceYear: 2026,
      }, 3);

      expect(result[0]?.total_outflow).toBe(0);
    });

    it('compounds freed installment into free_balance from liberation month onward', () => {
      const debt = makeDebt({ installment_amount: 500, total_installments: 1, paid_installments: 0 });

      const result = service.project({
        incomes: [makeIncome(5000)],
        fixedExpenses: [makeExpense(1000)],
        debts: [debt],
        referenceMonth: 6,
        referenceYear: 2026,
      }, 3);

      // Month 1: debt still active → free_balance = 5000 - 1000 - 500 = 3500
      // Month 2: liberation → free_balance = 5000 - 1000 = 4000
      // Month 3: compounded → free_balance = 5000 - 1000 = 4000
      expect(result[0]?.free_balance).toBe(3500);
      expect(result[1]?.free_balance).toBe(4000);
      expect(result[2]?.free_balance).toBe(4000);
    });
  });
});

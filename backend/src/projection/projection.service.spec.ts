import { Test, TestingModule } from '@nestjs/testing';
import { Debt } from '../debt/debt.entity';
import { Employee, EmployeeRegime } from '../employee/employee.entity';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { Income } from '../income/income.entity';
import { IncomeCategory, IncomeType } from '../shared/types';
import { ProjectionService } from './projection.service';

const makeIncome = (
  amount: number,
  category = IncomeCategory.OTHER,
  deductions: { amount: number }[] = [],
): Income =>
  ({
    id: '1',
    type: IncomeType.FIXED,
    category,
    amount,
    month: null,
    year: null,
    description: 'Salary',
    deductions,
  }) as Income;

const makeExpense = (
  amount: number,
  from_benefit = false,
  valid_from_month: number | null = null,
  valid_from_year: number | null = null,
): FixedExpense =>
  ({
    id: '1',
    name: 'Rent',
    amount,
    due_day: 5,
    active: true,
    from_benefit,
    valid_from_month,
    valid_from_year,
  }) as FixedExpense;

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

const makeEmployee = (overrides: Partial<Employee> = {}): Employee =>
  ({
    id: '1',
    name: 'Alice',
    regime: 'clt' as EmployeeRegime,
    gross_salary: 3000,
    monthly_benefits: 0,
    active: true,
    ...overrides,
  }) as Employee;

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
      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        12,
      );

      expect(result).toHaveLength(12);
    });

    it('excludes benefit incomes from free_balance', () => {
      const result = service.project(
        {
          incomes: [makeIncome(5000), makeIncome(990, IncomeCategory.BENEFIT)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        1,
      );

      expect(result[0]?.free_balance).toBe(5000);
    });

    it('excludes from_benefit expenses from total_outflow', () => {
      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [makeExpense(800, true), makeExpense(200)],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        1,
      );

      expect(result[0]?.total_outflow).toBe(200);
      expect(result[0]?.free_balance).toBe(4800);
    });

    it('uses net income (gross minus deductions) in free_balance', () => {
      const income = makeIncome(6000, IncomeCategory.SALARY, [{ amount: 660 }, { amount: 420 }]);

      const result = service.project(
        {
          incomes: [income],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        1,
      );

      expect(result[0]?.free_balance).toBe(4920);
    });

    it('marks the month a debt finishes as a liberation event', () => {
      const debt = makeDebt({
        installment_amount: 500,
        total_installments: 3,
        paid_installments: 2,
      });

      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [],
          debts: [debt],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        3,
      );

      const liberationMonth = result.find((m) => m.events.some((e) => e.type === 'liberation'));
      expect(liberationMonth).toBeDefined();
      expect(liberationMonth?.events[0].amount).toBe(500);
    });

    it('does not count a closed debt in total_outflow', () => {
      const closed = makeDebt({ installment_amount: 500, closed: true });

      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [],
          debts: [closed],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        3,
      );

      expect(result[0]?.total_outflow).toBe(0);
    });

    it('excludes a fixed expense with future valid_from from months before it starts', () => {
      // referenceMonth=6, valid_from=8 → expense absent in months 7 and 8 projected (offsets 1,2), present from month 9 (offset 3)
      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [makeExpense(1000, false, 8, 2026)],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        4,
      );

      // month 7 (offset 1): valid_from=8/2026 not yet → no expense
      expect(result[0]?.total_outflow).toBe(0);
      expect(result[0]?.free_balance).toBe(5000);
      // month 8 (offset 2): valid_from=8/2026 → included
      expect(result[1]?.total_outflow).toBe(1000);
      expect(result[1]?.free_balance).toBe(4000);
      // month 9 (offset 3): still included
      expect(result[2]?.total_outflow).toBe(1000);
    });

    it('compounds freed installment into free_balance from liberation month onward', () => {
      const debt = makeDebt({
        installment_amount: 500,
        total_installments: 1,
        paid_installments: 0,
      });

      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [makeExpense(1000)],
          debts: [debt],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        3,
      );

      // Month 1: debt still active → free_balance = 5000 - 1000 - 500 = 3500
      // Month 2: liberation → free_balance = 5000 - 1000 = 4000
      // Month 3: compounded → free_balance = 5000 - 1000 = 4000
      expect(result[0]?.free_balance).toBe(3500);
      expect(result[1]?.free_balance).toBe(4000);
      expect(result[2]?.free_balance).toBe(4000);
    });
  });

  describe('when a starting cash balance is provided', () => {
    it('accumulates each month free_balance onto the running cash_balance', () => {
      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [makeExpense(1000)],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
          startingCashBalance: 2000,
        },
        3,
      );

      // free_balance each month = 5000 - 1000 = 4000
      expect(result[0]?.cash_balance).toBe(6000);
      expect(result[1]?.cash_balance).toBe(10000);
      expect(result[2]?.cash_balance).toBe(14000);
    });

    it('grows faster after a liberation frees an installment', () => {
      const debt = makeDebt({
        installment_amount: 500,
        total_installments: 1,
        paid_installments: 0,
      });

      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [makeExpense(1000)],
          debts: [debt],
          referenceMonth: 6,
          referenceYear: 2026,
          startingCashBalance: 0,
        },
        3,
      );

      // Month 1: debt active → free_balance 3500 → cash_balance 3500
      // Month 2: liberation → free_balance 4000 → cash_balance 7500
      // Month 3: freed → free_balance 4000 → cash_balance 11500
      expect(result[0]?.cash_balance).toBe(3500);
      expect(result[1]?.cash_balance).toBe(7500);
      expect(result[2]?.cash_balance).toBe(11500);
    });

    it('lets the cash_balance cross below zero when outflow exceeds income', () => {
      const result = service.project(
        {
          incomes: [makeIncome(1000)],
          fixedExpenses: [makeExpense(1500)],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
          startingCashBalance: 800,
        },
        3,
      );

      // free_balance each month = 1000 - 1500 = -500
      expect(result[0]?.cash_balance).toBe(300);
      expect(result[1]?.cash_balance).toBe(-200);
      expect(result[2]?.cash_balance).toBe(-700);
    });

    it('accumulates from a zero starting balance', () => {
      const result = service.project(
        {
          incomes: [makeIncome(3000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
          startingCashBalance: 0,
        },
        2,
      );

      expect(result[0]?.cash_balance).toBe(3000);
      expect(result[1]?.cash_balance).toBe(6000);
    });
  });

  describe('when employees and a tax regime are provided', () => {
    it('subtracts the monthly cash cost of payroll from free_balance and total_outflow', () => {
      const result = service.project(
        {
          incomes: [makeIncome(10000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
          employees: [makeEmployee({ regime: 'clt', gross_salary: 3000 })],
          taxRegime: 'simples',
        },
        1,
      );

      // monthly cash cost = 3000 + 3000*0.08 = 3240
      expect(result[0]?.total_outflow).toBe(3240);
      expect(result[0]?.free_balance).toBe(6760);
    });

    it('emits a payroll event for the first 13th installment in November', () => {
      const result = service.project(
        {
          incomes: [makeIncome(10000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 10,
          referenceYear: 2026,
          employees: [makeEmployee({ regime: 'clt', gross_salary: 3000 })],
          taxRegime: 'simples',
        },
        3,
      );

      // offset 1 → November 2026
      const november = result[0];
      const payroll = november?.events.find((e) => e.type === 'payroll');
      expect(payroll?.description).toBe('13º salário — 1ª parcela');
      expect(payroll?.amount).toBe(1500);
    });

    it('emits a payroll event for the second 13th installment in December', () => {
      const result = service.project(
        {
          incomes: [makeIncome(10000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 11,
          referenceYear: 2026,
          employees: [makeEmployee({ regime: 'clt', gross_salary: 3000 })],
          taxRegime: 'simples',
        },
        1,
      );

      // offset 1 → December 2026
      const december = result[0];
      const payroll = december?.events.find((e) => e.type === 'payroll');
      expect(payroll?.description).toBe('13º salário — 2ª parcela');
      expect(payroll?.amount).toBe(1500);
    });

    it('removes the 13th installment amount from free_balance in November and December', () => {
      const result = service.project(
        {
          incomes: [makeIncome(10000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 10,
          referenceYear: 2026,
          employees: [makeEmployee({ regime: 'clt', gross_salary: 3000 })],
          taxRegime: 'simples',
        },
        3,
      );

      // November (offset 1): 10000 - 3240 monthly - 1500 thirteenth = 5260
      expect(result[0]?.free_balance).toBe(5260);
      // December (offset 2): also 5260
      expect(result[1]?.free_balance).toBe(5260);
      // January (offset 3): back to 10000 - 3240 = 6760
      expect(result[2]?.free_balance).toBe(6760);
    });

    it('omits the payroll event when the 13th base is zero (only PJ contractors)', () => {
      const result = service.project(
        {
          incomes: [makeIncome(10000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 10,
          referenceYear: 2026,
          employees: [makeEmployee({ regime: 'pj', gross_salary: 8000 })],
          taxRegime: 'simples',
        },
        1,
      );

      // November has no CLT payroll → no payroll event
      expect(result[0]?.events.some((e) => e.type === 'payroll')).toBe(false);
    });
  });

  describe('when no employees are provided', () => {
    it('produces months with no payroll event and no payroll in total_outflow', () => {
      const result = service.project(
        {
          incomes: [makeIncome(10000)],
          fixedExpenses: [],
          debts: [],
          referenceMonth: 10,
          referenceYear: 2026,
        },
        3,
      );

      for (const month of result) {
        expect(month.events.some((e) => e.type === 'payroll')).toBe(false);
      }
      expect(result[0]?.total_outflow).toBe(0);
      expect(result[0]?.free_balance).toBe(10000);
    });
  });

  describe('when no starting cash balance is provided', () => {
    it('omits the cash_balance key from every projected month', () => {
      const result = service.project(
        {
          incomes: [makeIncome(5000)],
          fixedExpenses: [makeExpense(1000)],
          debts: [],
          referenceMonth: 6,
          referenceYear: 2026,
        },
        3,
      );

      for (const month of result) {
        expect(month).not.toHaveProperty('cash_balance');
      }
    });
  });
});

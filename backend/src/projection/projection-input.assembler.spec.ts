import { ConfigService } from '@nestjs/config';
import { Debt } from '../debt/debt.entity';
import { DebtService } from '../debt/debt.service';
import { Employee } from '../employee/employee.entity';
import { EmployeeService } from '../employee/employee.service';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { Goal } from '../goal/goal.entity';
import { GoalService } from '../goal/goal.service';
import { Income } from '../income/income.entity';
import { IncomeService } from '../income/income.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { ProjectionInputAssembler } from './projection-input.assembler';

const USER_ID = 'user-uuid';
const MONTH = 6;
const YEAR = 2026;
const CASH_BALANCE = 80000;
const SAVED_AMOUNT = 1500.5;

const incomes = [{ id: 'i1' }] as Income[];
const debts = [{ id: 'd1' }] as Debt[];
const fixedExpenses = [{ id: 'f1' }] as FixedExpense[];
const employees = [{ id: 'e1' }] as Employee[];
const goal = { saved_amount: '1500.50' } as unknown as Goal;
const organization = {
  tax_regime: 'lucro',
  cash_balance: String(CASH_BALANCE),
} as unknown as Organization;

interface Services {
  income: { findForMonth: jest.Mock };
  debt: { findAll: jest.Mock };
  fixed: { findAll: jest.Mock };
  organization: { find: jest.Mock };
  employee: { findAll: jest.Mock };
  goal: { find: jest.Mock };
}

const buildAssembler = (
  businessFlag: string | undefined,
): { assembler: ProjectionInputAssembler; services: Services } => {
  const services: Services = {
    income: { findForMonth: jest.fn().mockResolvedValue(incomes) },
    debt: { findAll: jest.fn().mockResolvedValue(debts) },
    fixed: { findAll: jest.fn().mockResolvedValue(fixedExpenses) },
    organization: { find: jest.fn().mockResolvedValue(organization) },
    employee: { findAll: jest.fn().mockResolvedValue(employees) },
    goal: { find: jest.fn().mockResolvedValue(goal) },
  };
  const config = { get: jest.fn().mockReturnValue(businessFlag) };
  const assembler = new ProjectionInputAssembler(
    services.income as unknown as IncomeService,
    services.debt as unknown as DebtService,
    services.fixed as unknown as FixedExpenseService,
    services.organization as unknown as OrganizationService,
    services.employee as unknown as EmployeeService,
    services.goal as unknown as GoalService,
    config as unknown as ConfigService,
  );
  return { assembler, services };
};

describe('ProjectionInputAssembler', () => {
  describe('when the business feature is off (personal user)', () => {
    it('gathers the personal entities and the reference month', async () => {
      const { assembler, services } = buildAssembler(undefined);

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input).toEqual({
        incomes,
        debts,
        fixedExpenses,
        referenceMonth: MONTH,
        referenceYear: YEAR,
        startingSavings: SAVED_AMOUNT,
      });
      expect(services.income.findForMonth).toHaveBeenCalledWith(USER_ID, MONTH, YEAR);
    });

    it('starts the accumulated balance from the goal saved_amount as a number', async () => {
      const { assembler } = buildAssembler(undefined);

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.startingSavings).toBe(SAVED_AMOUNT);
    });

    it('starts from zero savings when the user has no goal', async () => {
      const { assembler, services } = buildAssembler(undefined);
      services.goal.find.mockResolvedValue(null);

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.startingSavings).toBeUndefined();
    });

    it('does not load the organization or employees', async () => {
      const { assembler, services } = buildAssembler('false');

      await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(services.organization.find).not.toHaveBeenCalled();
      expect(services.employee.findAll).not.toHaveBeenCalled();
    });
  });

  describe('when the business feature is on and the user has an organization', () => {
    it('adds the starting cash balance as a number, employees and the tax regime', async () => {
      const { assembler } = buildAssembler('true');

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.startingCashBalance).toBe(CASH_BALANCE);
      expect(input.employees).toBe(employees);
      expect(input.taxRegime).toBe('lucro');
    });

    it('does not use the personal goal as starting savings', async () => {
      const { assembler } = buildAssembler('true');

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.startingSavings).toBeUndefined();
    });
  });

  describe('when the business feature is on but the user has no organization', () => {
    it('omits the business inputs', async () => {
      const { assembler, services } = buildAssembler('true');
      services.organization.find.mockResolvedValue(null);

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.startingCashBalance).toBeUndefined();
      expect(input.employees).toBeUndefined();
      expect(input.taxRegime).toBeUndefined();
    });

    it('treats the user as personal and uses the goal saved_amount', async () => {
      const { assembler, services } = buildAssembler('true');
      services.organization.find.mockResolvedValue(null);

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.startingSavings).toBe(SAVED_AMOUNT);
    });
  });
});

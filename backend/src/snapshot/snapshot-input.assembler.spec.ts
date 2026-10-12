import { ConfigService } from '@nestjs/config';
import { Debt } from '../debt/debt.entity';
import { DebtService } from '../debt/debt.service';
import { Employee } from '../employee/employee.entity';
import { EmployeeService } from '../employee/employee.service';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { Income } from '../income/income.entity';
import { IncomeService } from '../income/income.service';
import { OccasionalExpense } from '../occasional-expense/occasional-expense.entity';
import { OccasionalExpenseService } from '../occasional-expense/occasional-expense.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { SnapshotInputAssembler } from './snapshot-input.assembler';

const USER_ID = 'user-uuid';
const MONTH = 6;
const YEAR = 2026;

const incomes = [{ id: 'i1' }] as Income[];
const debts = [{ id: 'd1' }] as Debt[];
const fixedExpenses = [{ id: 'f1' }] as FixedExpense[];
const occasionalExpenses = [{ id: 'o1' }] as OccasionalExpense[];
const employees = [{ id: 'e1' }] as Employee[];
const organization = { tax_regime: 'simples' } as Organization;

interface Services {
  income: { findForMonth: jest.Mock };
  debt: { findAll: jest.Mock };
  fixed: { findAll: jest.Mock };
  occasional: { findForMonth: jest.Mock };
  organization: { find: jest.Mock };
  employee: { findAll: jest.Mock };
}

const buildAssembler = (
  businessFlag: string | undefined,
): { assembler: SnapshotInputAssembler; services: Services } => {
  const services: Services = {
    income: { findForMonth: jest.fn().mockResolvedValue(incomes) },
    debt: { findAll: jest.fn().mockResolvedValue(debts) },
    fixed: { findAll: jest.fn().mockResolvedValue(fixedExpenses) },
    occasional: { findForMonth: jest.fn().mockResolvedValue(occasionalExpenses) },
    organization: { find: jest.fn().mockResolvedValue(organization) },
    employee: { findAll: jest.fn().mockResolvedValue(employees) },
  };
  const config = { get: jest.fn().mockReturnValue(businessFlag) };
  const assembler = new SnapshotInputAssembler(
    services.income as unknown as IncomeService,
    services.debt as unknown as DebtService,
    services.fixed as unknown as FixedExpenseService,
    services.occasional as unknown as OccasionalExpenseService,
    services.organization as unknown as OrganizationService,
    services.employee as unknown as EmployeeService,
    config as unknown as ConfigService,
  );
  return { assembler, services };
};

describe('SnapshotInputAssembler', () => {
  describe('when the business feature is off (personal user)', () => {
    it('gathers the personal entities for the requested month', async () => {
      const { assembler, services } = buildAssembler(undefined);

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input).toEqual({
        month: MONTH,
        year: YEAR,
        incomes,
        debts,
        fixedExpenses,
        occasionalExpenses,
      });
      expect(services.income.findForMonth).toHaveBeenCalledWith(USER_ID, MONTH, YEAR);
      expect(services.occasional.findForMonth).toHaveBeenCalledWith(USER_ID, MONTH, YEAR);
    });

    it('does not load the organization or employees', async () => {
      const { assembler, services } = buildAssembler('false');

      await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(services.organization.find).not.toHaveBeenCalled();
      expect(services.employee.findAll).not.toHaveBeenCalled();
    });
  });

  describe('when the business feature is on and the user has an organization', () => {
    it('adds employees and the tax regime', async () => {
      const { assembler } = buildAssembler('true');

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.employees).toBe(employees);
      expect(input.taxRegime).toBe('simples');
    });
  });

  describe('when the business feature is on but the user has no organization', () => {
    it('omits employees and the tax regime', async () => {
      const { assembler, services } = buildAssembler('true');
      services.organization.find.mockResolvedValue(null);

      const input = await assembler.assemble(USER_ID, MONTH, YEAR);

      expect(input.employees).toBeUndefined();
      expect(input.taxRegime).toBeUndefined();
    });
  });
});

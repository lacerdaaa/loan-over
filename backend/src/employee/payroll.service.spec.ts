import { Test, TestingModule } from '@nestjs/testing';
import { TaxRegime } from '../organization/organization.entity';
import { Employee, EmployeeRegime } from './employee.entity';
import {
  FGTS_RATE,
  INSS_PATRONAL_RATE,
  RAT_TERCEIROS_RATE,
  THIRTEENTH_PROVISION,
  VACATION_PROVISION,
} from './payroll.constants';
import { PayrollService } from './payroll.service';

const makeEmployee = (overrides: Partial<Employee> = {}): Employee =>
  ({
    id: 'emp-1',
    name: 'Alice',
    regime: 'clt' as EmployeeRegime,
    gross_salary: 3000,
    monthly_benefits: 0,
    active: true,
    ...overrides,
  }) as Employee;

describe('PayrollService', () => {
  let service: PayrollService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollService],
    }).compile();

    service = module.get(PayrollService);
  });

  describe('employeeCost — accrual (competência) view', () => {
    describe('for a CLT employee under the simples regime', () => {
      it('adds FGTS and 13th/vacation provisions but no employer INSS', () => {
        const employee = makeEmployee({ regime: 'clt', gross_salary: 3000, monthly_benefits: 500 });

        const cost = service.employeeCost(employee, 'simples');

        expect(cost.salary).toBe(3000);
        expect(cost.fgts).toBe(3000 * FGTS_RATE);
        expect(cost.thirteenth).toBe(3000 * THIRTEENTH_PROVISION);
        expect(cost.vacation).toBe(3000 * VACATION_PROVISION);
        expect(cost.inss).toBe(0);
        expect(cost.benefits).toBe(500);
        expect(cost.total).toBe(
          3000 + 3000 * FGTS_RATE + 3000 * THIRTEENTH_PROVISION + 3000 * VACATION_PROVISION + 500,
        );
      });
    });

    describe('for a CLT employee under the lucro regime', () => {
      it('adds employer INSS plus RAT/terceiros on top of the simples encargos', () => {
        const employee = makeEmployee({ regime: 'clt', gross_salary: 3000, monthly_benefits: 0 });

        const cost = service.employeeCost(employee, 'lucro');

        expect(cost.inss).toBe(3000 * (INSS_PATRONAL_RATE + RAT_TERCEIROS_RATE));
        expect(cost.total).toBe(
          3000 +
            3000 * FGTS_RATE +
            3000 * THIRTEENTH_PROVISION +
            3000 * VACATION_PROVISION +
            3000 * (INSS_PATRONAL_RATE + RAT_TERCEIROS_RATE),
        );
      });
    });

    describe('for a PJ employee', () => {
      it('charges only the invoice and benefits, with zero encargos', () => {
        const employee = makeEmployee({ regime: 'pj', gross_salary: 8000, monthly_benefits: 200 });

        const cost = service.employeeCost(employee, 'lucro');

        expect(cost.salary).toBe(8000);
        expect(cost.benefits).toBe(200);
        expect(cost.total).toBe(8200);
        expect(cost.fgts).toBeUndefined();
        expect(cost.thirteenth).toBeUndefined();
        expect(cost.vacation).toBeUndefined();
        expect(cost.inss).toBeUndefined();
      });
    });

    it('reads decimal string columns through Number()', () => {
      const employee = makeEmployee({
        regime: 'clt',
        gross_salary: '3000.00' as unknown as number,
        monthly_benefits: '500.00' as unknown as number,
      });

      const cost = service.employeeCost(employee, 'simples');

      expect(cost.salary).toBe(3000);
      expect(cost.benefits).toBe(500);
    });
  });

  describe('monthlyCashCost — cash view', () => {
    it('sums CLT salary, FGTS, INSS (lucro) and benefits, excluding 13th/vacation provisions', () => {
      const employees = [
        makeEmployee({ regime: 'clt', gross_salary: 3000, monthly_benefits: 500 }),
      ];

      const cost = service.monthlyCashCost(employees, 'lucro');

      expect(cost).toBe(
        3000 + 3000 * FGTS_RATE + 3000 * (INSS_PATRONAL_RATE + RAT_TERCEIROS_RATE) + 500,
      );
    });

    it('omits employer INSS for CLT under the simples regime', () => {
      const employees = [
        makeEmployee({ regime: 'clt', gross_salary: 3000, monthly_benefits: 500 }),
      ];

      const cost = service.monthlyCashCost(employees, 'simples');

      expect(cost).toBe(3000 + 3000 * FGTS_RATE + 500);
    });

    it('charges a PJ contractor only invoice plus benefits', () => {
      const employees = [makeEmployee({ regime: 'pj', gross_salary: 8000, monthly_benefits: 200 })];

      const cost = service.monthlyCashCost(employees, 'lucro');

      expect(cost).toBe(8200);
    });

    it('ignores inactive employees', () => {
      const employees = [
        makeEmployee({ regime: 'clt', gross_salary: 3000, active: false }),
        makeEmployee({ id: 'emp-2', regime: 'pj', gross_salary: 8000, active: true }),
      ];

      const cost = service.monthlyCashCost(employees, 'simples');

      expect(cost).toBe(8000);
    });

    it('returns zero for an empty roster', () => {
      expect(service.monthlyCashCost([], 'simples')).toBe(0);
    });
  });

  describe('thirteenthInstallment', () => {
    it('is half the active CLT salary base', () => {
      const employees = [
        makeEmployee({ id: 'a', regime: 'clt', gross_salary: 3000 }),
        makeEmployee({ id: 'b', regime: 'clt', gross_salary: 1000 }),
      ];

      expect(service.thirteenthInstallment(employees)).toBe(2000);
    });

    it('excludes PJ contractors from the 13th base', () => {
      const employees = [
        makeEmployee({ id: 'a', regime: 'clt', gross_salary: 3000 }),
        makeEmployee({ id: 'b', regime: 'pj', gross_salary: 8000 }),
      ];

      expect(service.thirteenthInstallment(employees)).toBe(1500);
    });

    it('excludes inactive CLT employees from the 13th base', () => {
      const employees = [
        makeEmployee({ id: 'a', regime: 'clt', gross_salary: 3000, active: false }),
      ];

      expect(service.thirteenthInstallment(employees)).toBe(0);
    });
  });
});

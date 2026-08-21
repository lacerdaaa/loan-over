import { Injectable } from '@nestjs/common';
import { TaxRegime } from '../organization/organization.entity';
import { Employee } from './employee.entity';
import {
  FGTS_RATE,
  INSS_PATRONAL_RATE,
  RAT_TERCEIROS_RATE,
  THIRTEENTH_PROVISION,
  VACATION_PROVISION,
} from './payroll.constants';

const THIRTEENTH_INSTALLMENTS = 2;

export interface EmployeeCostBreakdown {
  salary: number;
  benefits: number;
  total: number;
  fgts?: number;
  thirteenth?: number;
  vacation?: number;
  inss?: number;
}

@Injectable()
export class PayrollService {
  employeeCost(employee: Employee, taxRegime: TaxRegime): EmployeeCostBreakdown {
    const salary = Number(employee.gross_salary);
    const benefits = Number(employee.monthly_benefits);

    if (employee.regime === 'pj') {
      return { salary, benefits, total: salary + benefits };
    }

    const fgts = salary * FGTS_RATE;
    const thirteenth = salary * THIRTEENTH_PROVISION;
    const vacation = salary * VACATION_PROVISION;
    const inss = taxRegime === 'lucro' ? salary * (INSS_PATRONAL_RATE + RAT_TERCEIROS_RATE) : 0;
    const total = salary + fgts + thirteenth + vacation + inss + benefits;

    return { salary, fgts, thirteenth, vacation, inss, benefits, total };
  }

  monthlyCashCost(employees: Employee[], taxRegime: TaxRegime): number {
    return employees
      .filter((e) => e.active)
      .reduce((sum, e) => sum + this.employeeCashCost(e, taxRegime), 0);
  }

  thirteenthInstallment(employees: Employee[]): number {
    const cltBase = employees
      .filter((e) => e.active && e.regime === 'clt')
      .reduce((sum, e) => sum + Number(e.gross_salary), 0);

    return cltBase / THIRTEENTH_INSTALLMENTS;
  }

  private employeeCashCost(employee: Employee, taxRegime: TaxRegime): number {
    const salary = Number(employee.gross_salary);
    const benefits = Number(employee.monthly_benefits);

    if (employee.regime === 'pj') {
      return salary + benefits;
    }

    const fgts = salary * FGTS_RATE;
    const inss = taxRegime === 'lucro' ? salary * (INSS_PATRONAL_RATE + RAT_TERCEIROS_RATE) : 0;

    return salary + fgts + inss + benefits;
  }
}

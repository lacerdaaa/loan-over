// Mirror of backend/src/employee/payroll.constants.ts + PayrollService.employeeCost().
// The backend is the source of truth for projection calculations — keep these in sync.
import type { EmployeeRegime, TaxRegime } from '../types/api';

const FGTS_RATE = 0.08;
const THIRTEENTH_PROVISION = 1 / 12;
const VACATION_PROVISION = (4 / 3) / 12;
const INSS_PATRONAL_RATE = 0.2;
const RAT_TERCEIROS_RATE = 0.088;

export interface EmployeeCostBreakdown {
  salary: number;
  benefits: number;
  total: number;
  fgts?: number;
  thirteenth?: number;
  vacation?: number;
  inss?: number;
}

export const employeeCost = (
  grossSalary: number,
  monthlyBenefits: number,
  regime: EmployeeRegime,
  taxRegime: TaxRegime,
): EmployeeCostBreakdown => {
  const salary = grossSalary;
  const benefits = monthlyBenefits;

  if (regime === 'pj') {
    return { salary, benefits, total: salary + benefits };
  }

  const fgts = salary * FGTS_RATE;
  const thirteenth = salary * THIRTEENTH_PROVISION;
  const vacation = salary * VACATION_PROVISION;
  const inss = taxRegime === 'lucro' ? salary * (INSS_PATRONAL_RATE + RAT_TERCEIROS_RATE) : 0;
  const total = salary + fgts + thirteenth + vacation + inss + benefits;

  return { salary, fgts, thirteenth, vacation, inss, benefits, total };
};

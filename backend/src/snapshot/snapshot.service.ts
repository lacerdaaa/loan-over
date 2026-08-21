import { Injectable } from '@nestjs/common';
import { Debt } from '../debt/debt.entity';
import { Employee } from '../employee/employee.entity';
import { PayrollService } from '../employee/payroll.service';
import { isExpenseActiveForMonth } from '../fixed-expense/fixed-expense.utils';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { netAmount } from '../income/income.utils';
import { Income } from '../income/income.entity';
import { OccasionalExpense } from '../occasional-expense/occasional-expense.entity';
import { TaxRegime } from '../organization/organization.entity';
import { IncomeCategory, MonthlySnapshot } from '../shared/types';

const NOVEMBER = 11;
const DECEMBER = 12;

interface ComputeInput {
  month: number;
  year: number;
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  occasionalExpenses: OccasionalExpense[];
  employees?: Employee[];
  taxRegime?: TaxRegime;
}

@Injectable()
export class SnapshotService {
  private readonly payrollService = new PayrollService();

  compute({
    month,
    year,
    incomes,
    fixedExpenses,
    debts,
    occasionalExpenses,
    employees,
    taxRegime,
  }: ComputeInput): MonthlySnapshot {
    const total_income = incomes
      .filter((i) => i.category !== IncomeCategory.BENEFIT)
      .reduce((sum, i) => sum + netAmount(i), 0);

    const total_fixed = fixedExpenses
      .filter((e) => e.active && !e.from_benefit && isExpenseActiveForMonth(e, month, year))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const total_debts = debts
      .filter((d) => !d.closed)
      .reduce((sum, d) => sum + Number(d.installment_amount), 0);

    const total_occasional = occasionalExpenses
      .filter((e) => !e.from_benefit)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const total_benefit = incomes
      .filter((i) => i.category === IncomeCategory.BENEFIT)
      .reduce((sum, i) => sum + netAmount(i), 0);

    const total_debt_balance = debts
      .filter((d) => !d.closed)
      .reduce(
        (sum, d) =>
          sum + (d.total_installments - d.paid_installments) * Number(d.installment_amount),
        0,
      );

    const total_payroll = this.computePayroll(month, employees, taxRegime);
    const free_balance =
      total_income - total_fixed - total_debts - total_occasional - (total_payroll ?? 0);

    return {
      month,
      year,
      total_income,
      total_fixed,
      total_debts,
      total_occasional,
      total_benefit,
      total_debt_balance,
      free_balance,
      ...(total_payroll !== undefined && { total_payroll }),
    };
  }

  private computePayroll(
    month: number,
    employees?: Employee[],
    taxRegime?: TaxRegime,
  ): number | undefined {
    if (!employees || !taxRegime) return undefined;

    const monthly = this.payrollService.monthlyCashCost(employees, taxRegime);
    const thirteenth =
      month === NOVEMBER || month === DECEMBER
        ? this.payrollService.thirteenthInstallment(employees)
        : 0;

    return monthly + thirteenth;
  }
}

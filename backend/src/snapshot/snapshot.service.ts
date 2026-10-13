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

export interface ComputeInput {
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

  compute(input: ComputeInput): MonthlySnapshot {
    const { month, year } = input;
    const totals = this.sumTotals(input);
    const total_payroll = this.computePayroll(month, input.employees, input.taxRegime);
    const free_balance =
      totals.total_income -
      totals.total_fixed -
      totals.total_debts -
      totals.total_occasional -
      (total_payroll ?? 0);

    return {
      month,
      year,
      ...totals,
      free_balance,
      ...(total_payroll !== undefined && { total_payroll }),
    };
  }

  private sumTotals({
    month,
    year,
    incomes,
    fixedExpenses,
    debts,
    occasionalExpenses,
  }: ComputeInput): Omit<MonthlySnapshot, 'month' | 'year' | 'free_balance' | 'total_payroll'> {
    const openDebts = debts.filter((d) => !d.closed);
    const isBenefit = (i: Income): boolean => i.category === IncomeCategory.BENEFIT;
    const sumNet = (list: Income[]): number => list.reduce((sum, i) => sum + netAmount(i), 0);
    const sumAmount = (list: Array<{ amount: number }>): number =>
      list.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      total_income: sumNet(incomes.filter((i) => !isBenefit(i))),
      total_fixed: sumAmount(
        fixedExpenses.filter(
          (e) => e.active && !e.from_benefit && isExpenseActiveForMonth(e, month, year),
        ),
      ),
      total_debts: openDebts.reduce((sum, d) => sum + Number(d.installment_amount), 0),
      total_occasional: sumAmount(occasionalExpenses.filter((e) => !e.from_benefit)),
      total_benefit: sumNet(incomes.filter(isBenefit)),
      total_debt_balance: openDebts.reduce(
        (sum, d) =>
          sum + (d.total_installments - d.paid_installments) * Number(d.installment_amount),
        0,
      ),
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

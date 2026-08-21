import { Injectable } from '@nestjs/common';
import { Debt } from '../debt/debt.entity';
import { Employee } from '../employee/employee.entity';
import { PayrollService } from '../employee/payroll.service';
import { isExpenseActiveForMonth } from '../fixed-expense/fixed-expense.utils';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { netAmount } from '../income/income.utils';
import { Income } from '../income/income.entity';
import { TaxRegime } from '../organization/organization.entity';
import { IncomeCategory, IncomeType, ProjectedMonth, ProjectionEvent } from '../shared/types';

const NOVEMBER = 11;
const DECEMBER = 12;

export interface ProjectionInput {
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  referenceMonth: number;
  referenceYear: number;
  startingCashBalance?: number;
  employees?: Employee[];
  taxRegime?: TaxRegime;
}

@Injectable()
export class ProjectionService {
  private readonly payrollService = new PayrollService();

  project(input: ProjectionInput, horizonMonths: number): ProjectedMonth[] {
    const months: ProjectedMonth[] = [];
    const baseIncome = this.sumFixedIncome(input.incomes);
    const payrollCash = this.monthlyPayrollCash(input);
    let runningCash = input.startingCashBalance;

    for (let offset = 0; offset < horizonMonths; offset++) {
      const { month, year } = this.addMonths(input.referenceMonth, input.referenceYear, offset + 1);
      const monthFixed = this.sumActiveExpensesForMonth(input.fixedExpenses, month, year);
      const activeDebtTotal = this.sumActiveDebtInstallments(input.debts, offset);
      const events = this.buildEvents(input.debts, offset);
      const thirteenth = this.payrollEventFor(input, month, events);
      const monthOutflow = monthFixed + activeDebtTotal + payrollCash + thirteenth;
      const freeBalance = baseIncome - monthOutflow;

      const projected: ProjectedMonth = {
        month,
        year,
        free_balance: freeBalance,
        events,
        active_debts: this.countActiveDebts(input.debts, offset),
        total_outflow: monthOutflow,
      };

      if (runningCash !== undefined) {
        runningCash += freeBalance;
        projected.cash_balance = runningCash;
      }

      months.push(projected);
    }

    return months;
  }

  private monthlyPayrollCash(input: ProjectionInput): number {
    if (!input.employees || !input.taxRegime) return 0;
    return this.payrollService.monthlyCashCost(input.employees, input.taxRegime);
  }

  private payrollEventFor(
    input: ProjectionInput,
    month: number,
    events: ProjectionEvent[],
  ): number {
    if (!input.employees || !input.taxRegime) return 0;
    if (month !== NOVEMBER && month !== DECEMBER) return 0;

    const amount = this.payrollService.thirteenthInstallment(input.employees);
    if (amount <= 0) return 0;

    const description =
      month === NOVEMBER ? '13º salário — 1ª parcela' : '13º salário — 2ª parcela';
    events.push({ type: 'payroll', description, amount });
    return amount;
  }

  private sumFixedIncome(incomes: Income[]): number {
    return incomes
      .filter((i) => i.type === IncomeType.FIXED && i.category !== IncomeCategory.BENEFIT)
      .reduce((sum, i) => sum + netAmount(i), 0);
  }

  private sumActiveExpensesForMonth(expenses: FixedExpense[], month: number, year: number): number {
    return expenses
      .filter((e) => e.active && !e.from_benefit && isExpenseActiveForMonth(e, month, year))
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }

  private sumActiveDebtInstallments(debts: Debt[], offset: number): number {
    return debts
      .filter((d) => this.isDebtActiveAtOffset(d, offset))
      .reduce((sum, d) => sum + Number(d.installment_amount), 0);
  }

  private countActiveDebts(debts: Debt[], offset: number): number {
    return debts.filter((d) => this.isDebtActiveAtOffset(d, offset)).length;
  }

  private isDebtActiveAtOffset(debt: Debt, offset: number): boolean {
    if (debt.closed) return false;
    const remaining = debt.total_installments - debt.paid_installments;
    return offset < remaining;
  }

  private buildEvents(debts: Debt[], offset: number): ProjectionEvent[] {
    return debts.flatMap((d) => this.eventsForDebt(d, offset));
  }

  private eventsForDebt(debt: Debt, offset: number): ProjectionEvent[] {
    if (debt.closed) return [];
    const remaining = debt.total_installments - debt.paid_installments;

    if (offset === remaining) {
      return [
        {
          type: 'liberation',
          description: `${debt.name} quitada — R$${debt.installment_amount}/mês liberados`,
          amount: Number(debt.installment_amount),
        },
      ];
    }

    if (offset === remaining - 1) {
      return [
        {
          type: 'alert',
          description: `${debt.name} — última parcela no próximo mês`,
          amount: Number(debt.installment_amount),
        },
      ];
    }

    return [];
  }

  private addMonths(month: number, year: number, n: number): { month: number; year: number } {
    const date = new Date(year, month - 1 + n, 1);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }
}

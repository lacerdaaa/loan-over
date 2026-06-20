import { Injectable } from '@nestjs/common';
import { Debt } from '../debt/debt.entity';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { netAmount } from '../income/income.utils';
import { Income } from '../income/income.entity';
import { IncomeType, ProjectedMonth, ProjectionEvent } from '../shared/types';

export interface ProjectionInput {
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  referenceMonth: number;
  referenceYear: number;
}

@Injectable()
export class ProjectionService {
  project(input: ProjectionInput, horizonMonths: number): ProjectedMonth[] {
    const months: ProjectedMonth[] = [];
    const baseIncome = this.sumFixedIncome(input.incomes);
    const baseFixed = this.sumActiveExpenses(input.fixedExpenses);

    for (let offset = 0; offset < horizonMonths; offset++) {
      const { month, year } = this.addMonths(input.referenceMonth, input.referenceYear, offset + 1);
      const events = this.buildEvents(input.debts, offset);
      const activeDebtTotal = this.sumActiveDebtInstallments(input.debts, offset);

      months.push({
        month,
        year,
        free_balance: baseIncome - baseFixed - activeDebtTotal,
        events,
        active_debts: this.countActiveDebts(input.debts, offset),
        total_outflow: baseFixed + activeDebtTotal,
      });
    }

    return months;
  }

  private sumFixedIncome(incomes: Income[]): number {
    return incomes
      .filter((i) => i.type === IncomeType.FIXED)
      .reduce((sum, i) => sum + netAmount(i), 0);
  }

  private sumActiveExpenses(expenses: FixedExpense[]): number {
    return expenses.filter((e) => e.active).reduce((sum, e) => sum + Number(e.amount), 0);
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
      return [{
        type: 'liberation',
        description: `${debt.name} fully paid — R$${debt.installment_amount}/month freed`,
        amount: Number(debt.installment_amount),
      }];
    }

    if (offset === remaining - 1) {
      return [{
        type: 'alert',
        description: `${debt.name} — last installment next month`,
        amount: Number(debt.installment_amount),
      }];
    }

    return [];
  }

  private addMonths(month: number, year: number, n: number): { month: number; year: number } {
    const date = new Date(year, month - 1 + n, 1);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }
}

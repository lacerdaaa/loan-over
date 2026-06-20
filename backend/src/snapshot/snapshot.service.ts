import { Injectable } from '@nestjs/common';
import { Debt } from '../debt/debt.entity';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { netAmount } from '../income/income.utils';
import { Income } from '../income/income.entity';
import { OccasionalExpense } from '../occasional-expense/occasional-expense.entity';
import { IncomeCategory, MonthlySnapshot } from '../shared/types';

interface ComputeInput {
  month: number;
  year: number;
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
  occasionalExpenses: OccasionalExpense[];
}

@Injectable()
export class SnapshotService {
  compute({ month, year, incomes, fixedExpenses, debts, occasionalExpenses }: ComputeInput): MonthlySnapshot {
    const total_income = incomes
      .filter((i) => i.category !== IncomeCategory.BENEFIT)
      .reduce((sum, i) => sum + netAmount(i), 0);

    const total_fixed = fixedExpenses
      .filter((e) => e.active && !e.from_benefit)
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
      .reduce((sum, d) => sum + (d.total_installments - d.paid_installments) * Number(d.installment_amount), 0);

    return {
      month,
      year,
      total_income,
      total_fixed,
      total_debts,
      total_occasional,
      total_benefit,
      total_debt_balance,
      free_balance: total_income - total_fixed - total_debts - total_occasional,
    };
  }
}

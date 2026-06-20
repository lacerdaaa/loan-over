import { Injectable } from '@nestjs/common';
import { Debt } from '../debt/debt.entity';
import { FixedExpense } from '../fixed-expense/fixed-expense.entity';
import { netAmount } from '../income/income.utils';
import { Income } from '../income/income.entity';
import { IncomeCategory, MonthlySnapshot } from '../shared/types';

interface ComputeInput {
  month: number;
  year: number;
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  debts: Debt[];
}

@Injectable()
export class SnapshotService {
  compute({ month, year, incomes, fixedExpenses, debts }: ComputeInput): MonthlySnapshot {
    const total_income = incomes
      .filter((i) => i.category !== IncomeCategory.BENEFIT)
      .reduce((sum, i) => sum + netAmount(i), 0);
    const total_fixed = fixedExpenses
      .filter((e) => e.active && !e.from_benefit)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const total_debts = debts
      .filter((d) => !d.closed)
      .reduce((sum, d) => sum + Number(d.installment_amount), 0);

    return {
      month,
      year,
      total_income,
      total_fixed,
      total_debts,
      free_balance: total_income - total_fixed - total_debts,
    };
  }
}

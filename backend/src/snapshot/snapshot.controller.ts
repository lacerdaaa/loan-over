import { Controller, Get, Query } from '@nestjs/common';
import { DebtService } from '../debt/debt.service';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { IncomeService } from '../income/income.service';
import { MonthlySnapshot } from '../shared/types';
import { SnapshotService } from './snapshot.service';

@Controller('snapshot')
export class SnapshotController {
  constructor(
    private readonly snapshotService: SnapshotService,
    private readonly incomeService: IncomeService,
    private readonly debtService: DebtService,
    private readonly fixedExpenseService: FixedExpenseService,
  ) {}

  @Get()
  async get(
    @Query('month') month: number,
    @Query('year') year: number,
  ): Promise<MonthlySnapshot> {
    const m = Number(month);
    const y = Number(year);

    const [incomes, debts, fixedExpenses] = await Promise.all([
      this.incomeService.findForMonth(m, y),
      this.debtService.findAll(),
      this.fixedExpenseService.findAll(),
    ]);

    return this.snapshotService.compute({ month: m, year: y, incomes, debts, fixedExpenses });
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DebtService } from '../debt/debt.service';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { IncomeService } from '../income/income.service';
import { OccasionalExpenseService } from '../occasional-expense/occasional-expense.service';
import { MonthlySnapshot } from '../shared/types';
import { SnapshotService } from './snapshot.service';

@ApiTags('snapshot')
@Controller('snapshot')
export class SnapshotController {
  constructor(
    private readonly snapshotService: SnapshotService,
    private readonly incomeService: IncomeService,
    private readonly debtService: DebtService,
    private readonly fixedExpenseService: FixedExpenseService,
    private readonly occasionalExpenseService: OccasionalExpenseService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get monthly cash-flow snapshot',
    description:
      'Computes total_income, total_debts, total_fixed, total_occasional, total_debt_balance and free_balance for the given month. ' +
      'Closed debts, inactive expenses, benefit incomes, and from_benefit expenses are excluded from free_balance.',
  })
  @ApiQuery({ name: 'month', required: true, example: 6 })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiOkResponse({ description: 'MonthlySnapshot' })
  async get(
    @Query('month') month: number,
    @Query('year') year: number,
  ): Promise<MonthlySnapshot> {
    const m = Number(month);
    const y = Number(year);

    const [incomes, debts, fixedExpenses, occasionalExpenses] = await Promise.all([
      this.incomeService.findForMonth(m, y),
      this.debtService.findAll(),
      this.fixedExpenseService.findAll(),
      this.occasionalExpenseService.findForMonth(m, y),
    ]);

    return this.snapshotService.compute({ month: m, year: y, incomes, debts, fixedExpenses, occasionalExpenses });
  }
}

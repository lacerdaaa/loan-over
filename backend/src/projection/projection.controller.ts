import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DebtService } from '../debt/debt.service';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { IncomeService } from '../income/income.service';
import { ProjectedMonth } from '../shared/types';
import { ProjectionService } from './projection.service';

const DEFAULT_HORIZON = 24;

@ApiTags('projection')
@Controller('projection')
export class ProjectionController {
  constructor(
    private readonly projectionService: ProjectionService,
    private readonly incomeService: IncomeService,
    private readonly debtService: DebtService,
    private readonly fixedExpenseService: FixedExpenseService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get N-month cash-flow projection',
    description:
      'Projects free_balance month by month. Detects when each debt is fully paid and emits a ' +
      '"liberation" event — the freed installment amount compounds into free_balance from that month onward. ' +
      'Also emits an "alert" event the month before a debt closes.',
  })
  @ApiQuery({ name: 'month', required: false, example: 6, description: 'Reference month (defaults to current)' })
  @ApiQuery({ name: 'year', required: false, example: 2026, description: 'Reference year (defaults to current)' })
  @ApiQuery({ name: 'horizon', required: false, example: 24, description: 'Number of months to project (default 24)' })
  @ApiOkResponse({ description: 'Array of ProjectedMonth' })
  async get(
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('horizon') horizon?: number,
  ): Promise<ProjectedMonth[]> {
    const now = new Date();
    const refMonth = Number(month) || now.getMonth() + 1;
    const refYear = Number(year) || now.getFullYear();
    const horizonMonths = Number(horizon) || DEFAULT_HORIZON;

    const [incomes, debts, fixedExpenses] = await Promise.all([
      this.incomeService.findForMonth(refMonth, refYear),
      this.debtService.findAll(),
      this.fixedExpenseService.findAll(),
    ]);

    return this.projectionService.project(
      { incomes, debts, fixedExpenses, referenceMonth: refMonth, referenceYear: refYear },
      horizonMonths,
    );
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { DebtService } from '../debt/debt.service';
import { FixedExpenseService } from '../fixed-expense/fixed-expense.service';
import { IncomeService } from '../income/income.service';
import { ProjectedMonth } from '../shared/types';
import { ProjectionService } from './projection.service';

const DEFAULT_HORIZON = 24;

@Controller('projection')
export class ProjectionController {
  constructor(
    private readonly projectionService: ProjectionService,
    private readonly incomeService: IncomeService,
    private readonly debtService: DebtService,
    private readonly fixedExpenseService: FixedExpenseService,
  ) {}

  @Get()
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

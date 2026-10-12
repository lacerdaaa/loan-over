import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MonthYearQueryDto } from '../shared/dto/month-year-query.dto';
import { MonthlySnapshot } from '../shared/types';
import { SnapshotInputAssembler } from './snapshot-input.assembler';
import { SnapshotService } from './snapshot.service';

@ApiTags('snapshot')
@Controller('snapshot')
export class SnapshotController {
  constructor(
    private readonly snapshotService: SnapshotService,
    private readonly inputAssembler: SnapshotInputAssembler,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get monthly cash-flow snapshot',
    description:
      'Computes total_income, total_debts, total_fixed, total_occasional, total_debt_balance and free_balance for the given month. ' +
      'Closed debts, inactive expenses, benefit incomes, and from_benefit expenses are excluded from free_balance.',
  })
  @ApiOkResponse({ description: 'MonthlySnapshot' })
  async get(
    @CurrentUser() userId: string,
    @Query() query: MonthYearQueryDto,
  ): Promise<MonthlySnapshot> {
    const input = await this.inputAssembler.assemble(userId, query.month, query.year);
    return this.snapshotService.compute(input);
  }
}

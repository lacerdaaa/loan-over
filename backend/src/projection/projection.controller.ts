import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectionQueryDto, DEFAULT_HORIZON } from './dto/projection-query.dto';
import { ProjectedMonth } from '../shared/types';
import { ProjectionAccessService } from './projection-access.service';
import { ProjectionInputAssembler } from './projection-input.assembler';
import { ProjectionService } from './projection.service';

@ApiTags('projection')
@Controller('projection')
export class ProjectionController {
  constructor(
    private readonly projectionService: ProjectionService,
    private readonly inputAssembler: ProjectionInputAssembler,
    private readonly access: ProjectionAccessService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get N-month cash-flow projection',
    description:
      'Projects free_balance month by month. Detects when each debt is fully paid and emits a ' +
      '"liberation" event — the freed installment amount compounds into free_balance from that month onward. ' +
      'Also emits an "alert" event the month before a debt closes.',
  })
  @ApiOkResponse({ description: 'Array of ProjectedMonth (horizon above 24 requires Pro: 403)' })
  async get(
    @CurrentUser() userId: string,
    @Query() query: ProjectionQueryDto,
  ): Promise<ProjectedMonth[]> {
    const now = new Date();
    const refMonth = query.month ?? now.getMonth() + 1;
    const refYear = query.year ?? now.getFullYear();
    const horizonMonths = query.horizon ?? DEFAULT_HORIZON;

    await this.access.assertHorizonAllowed(userId, horizonMonths);
    const input = await this.inputAssembler.assemble(userId, refMonth, refYear);
    return this.projectionService.project(input, horizonMonths);
  }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectionQueryDto, DEFAULT_HORIZON } from './dto/projection-query.dto';
import { ProjectedMonth } from '../shared/types';
import { ProjectionAccessService } from './projection-access.service';
import { ProjectionInputAssembler } from './projection-input.assembler';
import { ProjectionService, SimulationResult } from './projection.service';
import { SimulateProjectionDto } from './dto/simulate-projection.dto';

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

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simulate a what-if scenario against the baseline projection (Pro)',
    description:
      'Adds hypothetical debts and extra monthly income/expense to the projection and returns ' +
      'both the unchanged baseline and the scenario.',
  })
  @ApiOkResponse({
    description: '{ baseline, scenario } — both arrays of ProjectedMonth (403 without Pro)',
  })
  async simulate(
    @CurrentUser() userId: string,
    @Body() dto: SimulateProjectionDto,
  ): Promise<SimulationResult> {
    await this.access.assertSimulatorAllowed(userId);
    const now = new Date();
    const input = await this.inputAssembler.assemble(userId, now.getMonth() + 1, now.getFullYear());
    return this.projectionService.simulate(input, dto.horizon ?? DEFAULT_HORIZON, dto);
  }
}

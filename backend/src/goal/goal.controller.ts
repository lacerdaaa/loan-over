import { Body, Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertGoalDto } from './dto/upsert-goal.dto';
import { Goal } from './goal.entity';
import { GoalService } from './goal.service';

@ApiTags('goal')
@Controller('goal')
export class GoalController {
  constructor(private readonly service: GoalService) {}

  @Get()
  @ApiOperation({ summary: 'Get the savings goal' })
  @ApiOkResponse({ type: Goal })
  find(): Promise<Goal | null> {
    return this.service.find();
  }

  @Post()
  @ApiOperation({ summary: 'Create or update the savings goal', description: 'Single-record upsert — there is only one goal at a time.' })
  @ApiOkResponse({ type: Goal })
  upsert(@Body() dto: UpsertGoalDto): Promise<Goal> {
    return this.service.upsert(dto);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove the savings goal' })
  @ApiNoContentResponse()
  remove(): Promise<void> {
    return this.service.remove();
  }
}

import { Body, Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import { UpsertGoalDto } from './dto/upsert-goal.dto';
import { Goal } from './goal.entity';
import { GoalService } from './goal.service';

@Controller('goal')
export class GoalController {
  constructor(private readonly service: GoalService) {}

  @Get()
  find(): Promise<Goal | null> {
    return this.service.find();
  }

  @Post()
  upsert(@Body() dto: UpsertGoalDto): Promise<Goal> {
    return this.service.upsert(dto);
  }

  @Delete()
  @HttpCode(204)
  remove(): Promise<void> {
    return this.service.remove();
  }
}

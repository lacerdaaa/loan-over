import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { FixedExpense } from './fixed-expense.entity';
import { FixedExpenseService } from './fixed-expense.service';

@ApiTags('fixed-expenses')
@Controller('fixed-expenses')
export class FixedExpenseController {
  constructor(private readonly service: FixedExpenseService) {}

  @Get()
  @ApiOperation({ summary: 'List all fixed expenses' })
  @ApiOkResponse({ type: [FixedExpense] })
  findAll(@CurrentUser() userId: string): Promise<FixedExpense[]> {
    return this.service.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a fixed expense' })
  @ApiOkResponse({ type: FixedExpense })
  create(@CurrentUser() userId: string, @Body() dto: CreateFixedExpenseDto): Promise<FixedExpense> {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a fixed expense',
    description: 'Use active=false to exclude from calculations without deleting.',
  })
  @ApiOkResponse({ type: FixedExpense })
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateFixedExpenseDto,
  ): Promise<FixedExpense> {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a fixed expense' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string, @CurrentUser() userId: string): Promise<void> {
    return this.service.remove(id, userId);
  }
}

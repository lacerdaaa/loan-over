import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateOccasionalExpenseDto } from './dto/create-occasional-expense.dto';
import { OccasionalExpense } from './occasional-expense.entity';
import { OccasionalExpenseService } from './occasional-expense.service';

@ApiTags('occasional-expenses')
@Controller('occasional-expenses')
export class OccasionalExpenseController {
  constructor(private readonly service: OccasionalExpenseService) {}

  @Get()
  @ApiOperation({ summary: 'List occasional expenses for a given month' })
  @ApiQuery({ name: 'month', required: true, example: 6 })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiOkResponse({ type: [OccasionalExpense] })
  findForMonth(
    @Query('month') month: number,
    @Query('year') year: number,
  ): Promise<OccasionalExpense[]> {
    return this.service.findForMonth(Number(month), Number(year));
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register an occasional expense for a specific month' })
  @ApiCreatedResponse({ type: OccasionalExpense })
  create(@Body() dto: CreateOccasionalExpenseDto): Promise<OccasionalExpense> {
    return this.service.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an occasional expense' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

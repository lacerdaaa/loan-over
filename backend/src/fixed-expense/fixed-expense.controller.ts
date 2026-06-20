import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CreateFixedExpenseDto } from './dto/create-fixed-expense.dto';
import { UpdateFixedExpenseDto } from './dto/update-fixed-expense.dto';
import { FixedExpense } from './fixed-expense.entity';
import { FixedExpenseService } from './fixed-expense.service';

@Controller('fixed-expenses')
export class FixedExpenseController {
  constructor(private readonly service: FixedExpenseService) {}

  @Get()
  findAll(): Promise<FixedExpense[]> {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateFixedExpenseDto): Promise<FixedExpense> {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFixedExpenseDto): Promise<FixedExpense> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { Income } from './income.entity';
import { IncomeService } from './income.service';

@Controller('income')
export class IncomeController {
  constructor(private readonly service: IncomeService) {}

  @Get()
  findForMonth(
    @Query('month') month: number,
    @Query('year') year: number,
  ): Promise<Income[]> {
    return this.service.findForMonth(Number(month), Number(year));
  }

  @Post()
  create(@Body() dto: CreateIncomeDto): Promise<Income> {
    return this.service.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

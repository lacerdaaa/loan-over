import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateIncomeDto } from './dto/create-income.dto';
import { Income } from './income.entity';
import { IncomeService } from './income.service';

@ApiTags('income')
@Controller('income')
export class IncomeController {
  constructor(private readonly service: IncomeService) {}

  @Get()
  @ApiOperation({ summary: 'List incomes for a given month', description: 'Returns all fixed incomes plus variable incomes registered for the specified month/year.' })
  @ApiQuery({ name: 'month', required: true, example: 6 })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiOkResponse({ type: [Income] })
  findForMonth(
    @Query('month') month: number,
    @Query('year') year: number,
  ): Promise<Income[]> {
    return this.service.findForMonth(Number(month), Number(year));
  }

  @Post()
  @ApiOperation({ summary: 'Create an income source' })
  @ApiOkResponse({ type: Income })
  create(@Body() dto: CreateIncomeDto): Promise<Income> {
    return this.service.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an income source' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

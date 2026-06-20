import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { CreateIncomeDto } from './dto/create-income.dto';
import { IncomeDeduction } from './income-deduction.entity';
import { Income } from './income.entity';
import { IncomeService } from './income.service';

@ApiTags('income')
@Controller('income')
export class IncomeController {
  constructor(private readonly service: IncomeService) {}

  @Get()
  @ApiOperation({ summary: 'List incomes for a given month', description: 'Returns all fixed incomes plus variable incomes registered for the specified month/year. Amounts are gross; deductions are included in each income.' })
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
  @ApiOperation({ summary: 'Create an income source', description: 'Pass optional deductions to create them atomically with the income.' })
  @ApiCreatedResponse({ type: Income })
  @HttpCode(201)
  create(@Body() dto: CreateIncomeDto): Promise<Income> {
    return this.service.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an income source and all its deductions' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Post(':id/deductions')
  @ApiOperation({ summary: 'Add a deduction to an income', description: 'Use for INSS, IRRF, IPTU, sister shares, etc.' })
  @ApiCreatedResponse({ type: IncomeDeduction })
  @HttpCode(201)
  addDeduction(
    @Param('id') id: string,
    @Body() dto: CreateDeductionDto,
  ): Promise<IncomeDeduction> {
    return this.service.addDeduction(id, dto);
  }

  @Delete(':id/deductions/:deductionId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a deduction from an income' })
  @ApiNoContentResponse()
  removeDeduction(@Param('deductionId') deductionId: string): Promise<void> {
    return this.service.removeDeduction(deductionId);
  }
}

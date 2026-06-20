import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateDebtDto } from './dto/create-debt.dto';
import { Debt } from './debt.entity';
import { DebtService } from './debt.service';

@ApiTags('debts')
@Controller('debts')
export class DebtController {
  constructor(private readonly service: DebtService) {}

  @Get()
  @ApiOperation({ summary: 'List all debts' })
  @ApiOkResponse({ type: [Debt] })
  findAll(): Promise<Debt[]> {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Register a new debt' })
  @ApiOkResponse({ type: Debt })
  create(@Body() dto: CreateDebtDto): Promise<Debt> {
    return this.service.create(dto);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Pay one installment', description: 'Increments paid_installments by 1. Automatically sets closed=true when the last installment is paid.' })
  @ApiOkResponse({ type: Debt })
  payInstallment(@Param('id') id: string): Promise<Debt> {
    return this.service.payInstallment(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a debt' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

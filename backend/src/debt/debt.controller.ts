import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CreateDebtDto } from './dto/create-debt.dto';
import { Debt } from './debt.entity';
import { DebtService } from './debt.service';

@Controller('debts')
export class DebtController {
  constructor(private readonly service: DebtService) {}

  @Get()
  findAll(): Promise<Debt[]> {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateDebtDto): Promise<Debt> {
    return this.service.create(dto);
  }

  @Patch(':id/pay')
  payInstallment(@Param('id') id: string): Promise<Debt> {
    return this.service.payInstallment(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}

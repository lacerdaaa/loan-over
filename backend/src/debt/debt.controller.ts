import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { Debt } from './debt.entity';
import { DebtService } from './debt.service';

@ApiTags('debts')
@Controller('debts')
export class DebtController {
  constructor(private readonly service: DebtService) {}

  @Get()
  @ApiOperation({ summary: 'List all debts' })
  @ApiOkResponse({ type: [Debt] })
  findAll(@CurrentUser() userId: string): Promise<Debt[]> {
    return this.service.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new debt' })
  @ApiOkResponse({ type: Debt })
  create(@CurrentUser() userId: string, @Body() dto: CreateDebtDto): Promise<Debt> {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a debt' })
  @ApiOkResponse({ type: Debt })
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateDebtDto,
  ): Promise<Debt> {
    return this.service.update(id, userId, dto);
  }

  @Patch(':id/pay')
  @ApiOperation({
    summary: 'Pay one installment',
    description: 'Increments paid_installments by 1. Automatically sets closed=true when the last installment is paid.',
  })
  @ApiOkResponse({ type: Debt })
  payInstallment(@Param('id') id: string, @CurrentUser() userId: string): Promise<Debt> {
    return this.service.payInstallment(id, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a debt' })
  @ApiNoContentResponse()
  remove(@Param('id') id: string, @CurrentUser() userId: string): Promise<void> {
    return this.service.remove(id, userId);
  }
}

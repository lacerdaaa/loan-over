import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BusinessFeatureGuard } from '../auth/guards/business-feature.guard';
import { BankTransaction } from './bank-transaction.entity';
import { BankTransactionService } from './bank-transaction.service';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('bank-transactions')
@Controller('bank-transactions')
@UseGuards(BusinessFeatureGuard)
export class BankTransactionController {
  constructor(private readonly service: BankTransactionService) {}

  @Get()
  @ApiOperation({ summary: 'List bank transactions for a given month and year' })
  @ApiQuery({ name: 'month', type: Number })
  @ApiQuery({ name: 'year', type: Number })
  @ApiOkResponse({ type: BankTransaction, isArray: true })
  findForMonth(
    @CurrentUser() userId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ): Promise<BankTransaction[]> {
    return this.service.findForMonth(userId, Number(month), Number(year));
  }

  @Post('import')
  @ApiOperation({ summary: 'Import bank transactions (max 500 per batch, deduped by hash)' })
  @ApiOkResponse({ description: '{ imported: number; skipped: number }' })
  import(
    @CurrentUser() userId: string,
    @Body() dto: ImportTransactionsDto,
  ): Promise<{ imported: number; skipped: number }> {
    return this.service.import(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Set or clear the match on a bank transaction' })
  @ApiOkResponse({ type: BankTransaction })
  updateMatch(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<BankTransaction> {
    return this.service.updateMatch(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a bank transaction' })
  @ApiNoContentResponse()
  remove(@CurrentUser() userId: string, @Param('id') id: string): Promise<void> {
    return this.service.remove(userId, id);
  }
}

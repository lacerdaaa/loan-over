import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MonthYearQueryDto } from '../shared/dto/month-year-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateOccasionalExpenseDto } from './dto/create-occasional-expense.dto';
import { OccasionalExpense } from './occasional-expense.entity';
import { OccasionalExpenseService } from './occasional-expense.service';

@ApiTags('occasional-expenses')
@Controller('occasional-expenses')
export class OccasionalExpenseController {
  constructor(private readonly service: OccasionalExpenseService) {}

  @Get()
  @ApiOperation({ summary: 'List occasional expenses for a given month' })
  @ApiOkResponse({ type: [OccasionalExpense] })
  findForMonth(
    @CurrentUser() userId: string,
    @Query() query: MonthYearQueryDto,
  ): Promise<OccasionalExpense[]> {
    return this.service.findForMonth(userId, query.month, query.year);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register an occasional expense for a specific month' })
  @ApiCreatedResponse({ type: OccasionalExpense })
  create(
    @CurrentUser() userId: string,
    @Body() dto: CreateOccasionalExpenseDto,
  ): Promise<OccasionalExpense> {
    return this.service.create(userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an occasional expense' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() userId: string): Promise<void> {
    return this.service.remove(id, userId);
  }
}

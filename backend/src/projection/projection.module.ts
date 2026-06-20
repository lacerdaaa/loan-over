import { Module } from '@nestjs/common';
import { DebtModule } from '../debt/debt.module';
import { FixedExpenseModule } from '../fixed-expense/fixed-expense.module';
import { IncomeModule } from '../income/income.module';
import { ProjectionController } from './projection.controller';
import { ProjectionService } from './projection.service';

@Module({
  imports: [IncomeModule, DebtModule, FixedExpenseModule],
  controllers: [ProjectionController],
  providers: [ProjectionService],
  exports: [ProjectionService],
})
export class ProjectionModule {}

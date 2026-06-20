import { Module } from '@nestjs/common';
import { DebtModule } from '../debt/debt.module';
import { FixedExpenseModule } from '../fixed-expense/fixed-expense.module';
import { IncomeModule } from '../income/income.module';
import { OccasionalExpenseModule } from '../occasional-expense/occasional-expense.module';
import { SnapshotController } from './snapshot.controller';
import { SnapshotService } from './snapshot.service';

@Module({
  imports: [IncomeModule, DebtModule, FixedExpenseModule, OccasionalExpenseModule],
  controllers: [SnapshotController],
  providers: [SnapshotService],
  exports: [SnapshotService],
})
export class SnapshotModule {}

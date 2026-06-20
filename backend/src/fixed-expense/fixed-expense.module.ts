import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedExpenseController } from './fixed-expense.controller';
import { FixedExpense } from './fixed-expense.entity';
import { FixedExpenseService } from './fixed-expense.service';

@Module({
  imports: [TypeOrmModule.forFeature([FixedExpense])],
  controllers: [FixedExpenseController],
  providers: [FixedExpenseService],
  exports: [FixedExpenseService],
})
export class FixedExpenseModule {}

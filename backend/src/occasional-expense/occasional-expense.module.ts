import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OccasionalExpenseController } from './occasional-expense.controller';
import { OccasionalExpense } from './occasional-expense.entity';
import { OccasionalExpenseService } from './occasional-expense.service';

@Module({
  imports: [TypeOrmModule.forFeature([OccasionalExpense])],
  controllers: [OccasionalExpenseController],
  providers: [OccasionalExpenseService],
  exports: [OccasionalExpenseService],
})
export class OccasionalExpenseModule {}

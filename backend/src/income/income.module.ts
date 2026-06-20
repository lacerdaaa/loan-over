import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomeController } from './income.controller';
import { IncomeDeduction } from './income-deduction.entity';
import { Income } from './income.entity';
import { IncomeService } from './income.service';

@Module({
  imports: [TypeOrmModule.forFeature([Income, IncomeDeduction])],
  controllers: [IncomeController],
  providers: [IncomeService],
  exports: [IncomeService],
})
export class IncomeModule {}

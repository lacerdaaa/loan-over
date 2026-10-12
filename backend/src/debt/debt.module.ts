import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared/shared.module';
import { DebtController } from './debt.controller';
import { Debt } from './debt.entity';
import { DebtService } from './debt.service';

@Module({
  imports: [TypeOrmModule.forFeature([Debt]), SharedModule],
  controllers: [DebtController],
  providers: [DebtService],
  exports: [DebtService],
})
export class DebtModule {}

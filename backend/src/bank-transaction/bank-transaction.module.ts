import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankTransactionController } from './bank-transaction.controller';
import { BankTransaction } from './bank-transaction.entity';
import { BankTransactionService } from './bank-transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([BankTransaction])],
  controllers: [BankTransactionController],
  providers: [BankTransactionService],
  exports: [BankTransactionService],
})
export class BankTransactionModule {}

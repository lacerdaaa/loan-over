import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TransactionLineDto {
  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  declare date: string;

  @ApiProperty({ example: 'Pagamento cliente' })
  @IsString()
  @IsNotEmpty()
  declare description: string;

  @ApiProperty({ example: 1500.0, description: 'Positive = credit, negative = debit' })
  @IsNumber({ maxDecimalPlaces: 2 })
  declare amount: number;
}

export class ImportTransactionsDto {
  @ApiProperty({ type: [TransactionLineDto], maxItems: 500 })
  @ValidateNested({ each: true })
  @Type(() => TransactionLineDto)
  @ArrayMaxSize(500)
  declare transactions: TransactionLineDto[];
}

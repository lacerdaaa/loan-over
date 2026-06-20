import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDebtDto {
  @ApiProperty({ example: 'Car loan' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ example: 850.00, description: 'Monthly installment amount in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare installment_amount: number;

  @ApiProperty({ example: 48, description: 'Total number of installments' })
  @IsInt()
  @Min(1)
  declare total_installments: number;

  @ApiPropertyOptional({ example: 12, description: 'Installments already paid before registration' })
  @IsOptional()
  @IsInt()
  @Min(0)
  paid_installments?: number;

  @ApiProperty({ example: '2024-03-01', description: 'Date of the first installment (ISO 8601)' })
  @IsDateString()
  declare start_date: string;
}

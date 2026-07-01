import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDebtDto {
  @ApiProperty({ example: 'Car loan' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiPropertyOptional({ example: 850.00, description: 'Monthly installment in BRL. Omit when providing principal + monthly_rate.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  installment_amount?: number;

  @ApiPropertyOptional({ example: 5000.00, description: 'Original loan principal (for interest-bearing debts)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  principal?: number;

  @ApiPropertyOptional({ example: 0.0199, description: 'Monthly interest rate as a decimal (e.g. 0.0199 = 1.99% a.m.)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  monthly_rate?: number;

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

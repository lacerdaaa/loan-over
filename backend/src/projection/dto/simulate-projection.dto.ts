import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { StartOffsetsWithinHorizon } from './start-offsets-within-horizon.validator';
import { DEFAULT_HORIZON, MAX_HORIZON, MIN_HORIZON } from './projection-query.dto';

export const MAX_HYPOTHETICAL_DEBTS = 10;
export const MIN_INSTALLMENTS = 1;
export const MAX_INSTALLMENTS = 360;
export const MIN_AMOUNT = 0.01;

export class HypotheticalDebtDto {
  @ApiProperty({ example: 'Notebook' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ example: 350, description: 'Monthly installment in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(MIN_AMOUNT)
  declare installment_amount: number;

  @ApiProperty({
    example: 10,
    description: `Number of installments (${MIN_INSTALLMENTS}..${MAX_INSTALLMENTS})`,
  })
  @IsInt()
  @Min(MIN_INSTALLMENTS)
  @Max(MAX_INSTALLMENTS)
  declare installments: number;

  @ApiProperty({ example: 0, description: 'Projected month (0-based) of the first installment' })
  @IsInt()
  @Min(0)
  declare start_offset: number;
}

export class SimulateProjectionDto {
  @ApiPropertyOptional({
    example: DEFAULT_HORIZON,
    description: `Months to project (default ${DEFAULT_HORIZON}, max ${MAX_HORIZON})`,
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_HORIZON)
  @Max(MAX_HORIZON)
  horizon?: number;

  @ApiPropertyOptional({
    type: [HypotheticalDebtDto],
    description: `Up to ${MAX_HYPOTHETICAL_DEBTS} debts`,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_HYPOTHETICAL_DEBTS)
  @ValidateNested({ each: true })
  @Type(() => HypotheticalDebtDto)
  @StartOffsetsWithinHorizon(DEFAULT_HORIZON)
  hypothetical_debts?: HypotheticalDebtDto[];

  @ApiPropertyOptional({ example: 0, description: 'Extra income added to every projected month' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extra_monthly_income?: number;

  @ApiPropertyOptional({ example: 0, description: 'Extra expense added to every projected month' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extra_monthly_expense?: number;
}

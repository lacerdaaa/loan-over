import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { IncomeCategory, IncomeType } from '../../shared/types';
import { CreateDeductionDto } from './create-deduction.dto';

export class CreateIncomeDto {
  @ApiProperty({ enum: IncomeType, description: 'Fixed income repeats every month; variable must be registered per month' })
  @IsEnum(IncomeType)
  declare type: IncomeType;

  @ApiProperty({ enum: IncomeCategory, default: IncomeCategory.OTHER })
  @IsEnum(IncomeCategory)
  declare category: IncomeCategory;

  @ApiProperty({ example: 6000.00, description: 'Gross amount in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare amount: number;

  @ApiPropertyOptional({ example: 6, description: 'Required when type is variable' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Required when type is variable' })
  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiProperty({ example: 'Main salary' })
  @IsString()
  @IsNotEmpty()
  declare description: string;

  @ApiPropertyOptional({ type: [CreateDeductionDto], description: 'Initial deductions (INSS, IRRF, etc.)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeductionDto)
  deductions?: CreateDeductionDto[];
}

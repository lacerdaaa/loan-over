import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { IncomeType } from '../../shared/types';

export class CreateIncomeDto {
  @ApiProperty({ enum: IncomeType, description: 'Fixed income repeats every month; variable must be registered per month' })
  @IsEnum(IncomeType)
  declare type: IncomeType;

  @ApiProperty({ example: 5000.00, description: 'Gross amount in BRL' })
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

  @ApiProperty({ example: 'Salary' })
  @IsString()
  @IsNotEmpty()
  declare description: string;
}

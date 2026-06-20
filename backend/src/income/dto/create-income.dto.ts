import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { IncomeType } from '../../shared/types';

export class CreateIncomeDto {
  @IsEnum(IncomeType)
  declare type: IncomeType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare amount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;

  @IsString()
  @IsNotEmpty()
  declare description: string;
}

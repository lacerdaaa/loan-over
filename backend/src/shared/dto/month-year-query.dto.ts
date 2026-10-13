import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export const MIN_MONTH = 1;
export const MAX_MONTH = 12;
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

export class MonthYearQueryDto {
  @ApiProperty({ example: 6, minimum: MIN_MONTH, maximum: MAX_MONTH })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_MONTH)
  @Max(MAX_MONTH)
  declare month: number;

  @ApiProperty({ example: 2026, minimum: MIN_YEAR, maximum: MAX_YEAR })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  @Max(MAX_YEAR)
  declare year: number;
}

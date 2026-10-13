import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_MONTH, MAX_YEAR, MIN_MONTH, MIN_YEAR } from '../../shared/dto/month-year-query.dto';

export const DEFAULT_HORIZON = 24;
export const MIN_HORIZON = 1;
export const MAX_HORIZON = 60;

export class ProjectionQueryDto {
  @ApiPropertyOptional({ example: 6, description: 'Reference month (defaults to current)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_MONTH)
  @Max(MAX_MONTH)
  month?: number;

  @ApiPropertyOptional({ example: 2026, description: 'Reference year (defaults to current)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_YEAR)
  @Max(MAX_YEAR)
  year?: number;

  @ApiPropertyOptional({
    example: DEFAULT_HORIZON,
    description: `Number of months to project (default ${DEFAULT_HORIZON}, max ${MAX_HORIZON})`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_HORIZON)
  @Max(MAX_HORIZON)
  horizon?: number;
}

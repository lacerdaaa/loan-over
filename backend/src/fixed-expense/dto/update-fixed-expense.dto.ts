import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateFixedExpenseDto {
  @ApiPropertyOptional({ example: 'Rent' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1500.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  due_day?: number;

  @ApiPropertyOptional({ example: false, description: 'Set to false to exclude from monthly calculations without deleting' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateOccasionalExpenseDto {
  @ApiProperty({ example: 'Car repair' })
  @IsString()
  @IsNotEmpty()
  declare description: string;

  @ApiProperty({ example: 800.00, description: 'Amount in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare amount: number;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(1)
  @Max(12)
  declare month: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  declare year: number;

  @ApiPropertyOptional({ example: false, default: false, description: 'True when paid from a restricted benefit' })
  @IsOptional()
  @IsBoolean()
  from_benefit?: boolean;
}

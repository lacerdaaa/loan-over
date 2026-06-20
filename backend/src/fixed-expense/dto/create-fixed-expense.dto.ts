import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateFixedExpenseDto {
  @ApiProperty({ example: 'Health plan' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ example: 450.00, description: 'Monthly amount in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare amount: number;

  @ApiProperty({ example: 10, description: 'Day of month the expense is due (1–31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  declare due_day: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: false, default: false, description: 'True when this expense is paid from a restricted benefit (food card, etc.) — excluded from free_balance' })
  @IsOptional()
  @IsBoolean()
  from_benefit?: boolean;
}

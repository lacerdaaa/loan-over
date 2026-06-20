import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class UpsertGoalDto {
  @ApiProperty({ example: 10000.00, description: 'Target savings amount in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare target_amount: number;

  @ApiProperty({ example: 12, description: 'Target month (1–12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  declare deadline_month: number;

  @ApiProperty({ example: 2027 })
  @IsInt()
  @Min(2000)
  declare deadline_year: number;
}

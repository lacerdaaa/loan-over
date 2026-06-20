import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class UpsertGoalDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare target_amount: number;

  @IsInt()
  @Min(1)
  @Max(12)
  declare deadline_month: number;

  @IsInt()
  @Min(2000)
  declare deadline_year: number;
}

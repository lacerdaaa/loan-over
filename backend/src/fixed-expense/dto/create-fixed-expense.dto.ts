import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateFixedExpenseDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare amount: number;

  @IsInt()
  @Min(1)
  @Max(31)
  declare due_day: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDebtDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare installment_amount: number;

  @IsInt()
  @Min(1)
  declare total_installments: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  paid_installments?: number;

  @IsDateString()
  declare start_date: string;
}

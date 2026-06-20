import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateDeductionDto {
  @ApiProperty({ example: 'INSS', description: 'Label for this deduction (INSS, IRRF, IPTU, Sister Ana, etc.)' })
  @IsString()
  @IsNotEmpty()
  declare label: string;

  @ApiProperty({ example: 660.00, description: 'Deduction amount in BRL (positive number)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  declare amount: number;
}

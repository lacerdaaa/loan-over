import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertOrganizationDto {
  @ApiProperty({ example: 'Acme Ltda', description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({
    example: '12.345.678/0001-90',
    required: false,
    description: 'Brazilian company registration number',
  })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiProperty({ example: 80000.0, description: 'Current cash balance in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declare cash_balance: number;
}

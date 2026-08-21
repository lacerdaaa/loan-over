import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { EmployeeRegime } from '../employee.entity';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Alice Silva' })
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @ApiProperty({ example: 'clt', enum: ['clt', 'pj'] })
  @IsIn(['clt', 'pj'])
  declare regime: EmployeeRegime;

  @ApiProperty({ example: 5000.0, description: 'Gross monthly salary in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declare gross_salary: number;

  @ApiPropertyOptional({ example: 500.0, default: 0, description: 'Monthly benefits in BRL' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthly_benefits?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

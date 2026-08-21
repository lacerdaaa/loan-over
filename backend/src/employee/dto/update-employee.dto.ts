import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { EmployeeRegime } from '../employee.entity';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Alice Silva' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'pj', enum: ['clt', 'pj'] })
  @IsOptional()
  @IsIn(['clt', 'pj'])
  regime?: EmployeeRegime;

  @ApiPropertyOptional({ example: 6000.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gross_salary?: number;

  @ApiPropertyOptional({ example: 600.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthly_benefits?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

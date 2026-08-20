import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { type AccountType } from '../user.entity';

export class UpdateAccountTypeDto {
  @ApiProperty({ enum: ['personal', 'business'], example: 'business' })
  @IsIn(['personal', 'business'])
  declare account_type: AccountType;
}

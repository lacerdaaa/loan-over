import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UnsubscribeQueryDto {
  @ApiProperty({ description: 'Signed unsubscribe token received by e-mail' })
  @IsString()
  @MinLength(1)
  declare token: string;
}

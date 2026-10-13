import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Alerts for last installment and debt payoff' })
  @IsOptional()
  @IsBoolean()
  declare email_notifications?: boolean;

  @ApiPropertyOptional({ description: 'Monthly report (Pro)' })
  @IsOptional()
  @IsBoolean()
  declare monthly_report?: boolean;
}

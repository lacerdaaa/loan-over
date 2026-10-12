import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationPreferences } from '../user/user.entity';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationPreferencesService } from './notification-preferences.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly preferences: NotificationPreferencesService) {}

  @Get('preferences')
  @ApiOperation({ summary: 'Get e-mail notification preferences' })
  @ApiOkResponse({ description: 'email_notifications and monthly_report flags' })
  getPreferences(@CurrentUser() userId: string): Promise<NotificationPreferences> {
    return this.preferences.get(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update e-mail notification preferences (monthly report is Pro)' })
  @ApiOkResponse({ description: 'Updated preferences' })
  updatePreferences(
    @CurrentUser() userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    return this.preferences.update(userId, dto);
  }
}

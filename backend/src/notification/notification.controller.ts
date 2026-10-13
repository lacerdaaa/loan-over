import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationPreferences } from '../user/user.entity';
import { UnsubscribeQueryDto } from './dto/unsubscribe-query.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationService } from './notification.service';

const TEST_EMAIL_LIMIT = 3;
const ONE_HOUR_MS = 3_600_000;

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly preferences: NotificationPreferencesService,
    private readonly notifications: NotificationService,
  ) {}

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

  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: TEST_EMAIL_LIMIT, ttl: ONE_HOUR_MS } })
  @ApiOperation({ summary: 'Send a test e-mail to the current user (3 per hour)' })
  @ApiNoContentResponse({ description: 'Test e-mail sent (or skipped when no API key is set)' })
  sendTest(@CurrentUser() userId: string): Promise<void> {
    return this.notifications.sendTest(userId);
  }

  @Public()
  @Get('unsubscribe')
  @Redirect()
  @ApiOperation({ summary: 'Unsubscribe from all e-mail notifications via signed token' })
  async unsubscribe(@Query() query: UnsubscribeQueryDto): Promise<{ url: string }> {
    return { url: await this.notifications.unsubscribe(query.token) };
  }
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntitlementService, PRO_REQUIRED_MESSAGE } from '../billing/entitlement.service';
import { NotificationPreferences, User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

const toPreferences = (user: User): NotificationPreferences => ({
  email_notifications: user.email_notifications,
  monthly_report: user.monthly_report,
});

@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly userService: UserService,
    private readonly entitlements: EntitlementService,
  ) {}

  async get(userId: string): Promise<NotificationPreferences> {
    return toPreferences(await this.requireUser(userId));
  }

  async update(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    const user = await this.requireUser(userId);
    if (dto.monthly_report === true && !this.entitlements.isPro(user)) {
      throw new ForbiddenException(PRO_REQUIRED_MESSAGE);
    }
    const updated = await this.userService.updateNotificationPreferences(userId, { ...dto });
    return toPreferences(updated);
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user;
  }
}

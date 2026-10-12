import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { UserModule } from '../user/user.module';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [UserModule, BillingModule],
  controllers: [NotificationController],
  providers: [NotificationPreferencesService],
})
export class NotificationModule {}

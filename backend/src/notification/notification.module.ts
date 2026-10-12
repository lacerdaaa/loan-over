import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BillingModule } from '../billing/billing.module';
import { DebtModule } from '../debt/debt.module';
import { ProjectionModule } from '../projection/projection.module';
import { SnapshotModule } from '../snapshot/snapshot.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { EmailService } from './email.service';
import { MonthlyReportBuilder } from './monthly-report.builder';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationComposer } from './notification.composer';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';
import { UnsubscribeTokenService } from './unsubscribe-token.service';

@Module({
  imports: [
    UserModule,
    BillingModule,
    DebtModule,
    SharedModule,
    SnapshotModule,
    ProjectionModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET') }),
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationPreferencesService,
    NotificationComposer,
    NotificationScheduler,
    NotificationService,
    MonthlyReportBuilder,
    EmailService,
    UnsubscribeTokenService,
  ],
})
export class NotificationModule {}

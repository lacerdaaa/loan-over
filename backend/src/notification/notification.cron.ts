import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SCHEDULER_LOCK_KEYS, SchedulerLockService } from '../shared/scheduler-lock.service';
import { NotificationScheduler } from './notification.scheduler';

const MONTHLY_CRON = '0 9 1 * *';
const CRON_TIME_ZONE = 'America/Sao_Paulo';

/** Triggers the monthly notification run at 09:00 BRT, after the debt cron at 00:00 BRT. */
@Injectable()
export class NotificationCron {
  constructor(
    private readonly scheduler: NotificationScheduler,
    private readonly schedulerLock: SchedulerLockService,
  ) {}

  @Cron(MONTHLY_CRON, { timeZone: CRON_TIME_ZONE })
  async handleMonthlyCron(): Promise<void> {
    await this.schedulerLock.runExclusive(SCHEDULER_LOCK_KEYS.NOTIFICATION_MONTHLY, () =>
      this.scheduler.runMonthly(new Date()),
    );
  }
}

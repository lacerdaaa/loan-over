import { SCHEDULER_LOCK_KEYS, SchedulerLockService } from '../shared/scheduler-lock.service';
import { NotificationCron } from './notification.cron';
import { NotificationScheduler } from './notification.scheduler';

describe('NotificationCron', () => {
  let scheduler: { runMonthly: jest.Mock };
  let schedulerLock: { runExclusive: jest.Mock };
  let cron: NotificationCron;

  beforeEach(() => {
    scheduler = { runMonthly: jest.fn().mockResolvedValue(undefined) };
    schedulerLock = {
      runExclusive: jest.fn((_key: number, job: () => Promise<void>) => job().then(() => true)),
    };
    cron = new NotificationCron(
      scheduler as unknown as NotificationScheduler,
      schedulerLock as unknown as SchedulerLockService,
    );
  });

  describe('when the cron fires and the lock is free', () => {
    it('runs the monthly job for the current date under the notification lock', async () => {
      await cron.handleMonthlyCron();

      expect(schedulerLock.runExclusive).toHaveBeenCalledWith(
        SCHEDULER_LOCK_KEYS.NOTIFICATION_MONTHLY,
        expect.any(Function),
      );
      expect(scheduler.runMonthly).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  describe('when another instance already holds the lock', () => {
    it('skips the run', async () => {
      schedulerLock.runExclusive.mockResolvedValue(false);

      await cron.handleMonthlyCron();

      expect(scheduler.runMonthly).not.toHaveBeenCalled();
    });
  });
});

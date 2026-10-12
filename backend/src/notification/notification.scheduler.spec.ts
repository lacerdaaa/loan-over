import { Logger } from '@nestjs/common';
import { EntitlementService } from '../billing/entitlement.service';
import { Debt } from '../debt/debt.entity';
import { DebtService } from '../debt/debt.service';
import { SCHEDULER_LOCK_KEYS, SchedulerLockService } from '../shared/scheduler-lock.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { EmailService } from './email.service';
import { MonthlyReportBuilder } from './monthly-report.builder';
import { MonthlyReportData, NotificationComposer } from './notification.composer';
import { NotificationScheduler, RECIPIENT_BATCH_SIZE } from './notification.scheduler';
import { UnsubscribeTokenService } from './unsubscribe-token.service';

const NOW = new Date('2027-03-01T12:00:00Z');
const MONTH_START = '2027-03-01';
const UNSUBSCRIBE_URL = 'https://api.example.com/unsub';

const makeUser = (id: string, overrides: Partial<User> = {}): User =>
  ({
    id,
    email: `${id}@example.com`,
    name: `Name ${id}`,
    email_notifications: true,
    monthly_report: false,
    ...overrides,
  }) as User;

const makeDebt = (name: string, overrides: Partial<Debt> = {}): Debt =>
  ({
    name,
    installment_amount: 100,
    total_installments: 10,
    paid_installments: 3,
    closed: false,
    last_paid_month: MONTH_START,
    ...overrides,
  }) as Debt;

const REPORT: MonthlyReportData = {
  month: 3,
  year: 2027,
  total_income: 1,
  total_fixed: 1,
  total_debts: 1,
  total_occasional: 1,
  free_balance: 1,
  upcomingLiberations: [],
};

describe('NotificationScheduler', () => {
  let userService: { findNotificationRecipients: jest.Mock };
  let debtService: { findAll: jest.Mock };
  let entitlements: { isPro: jest.Mock };
  let reportBuilder: { build: jest.Mock };
  let emailService: { send: jest.Mock };
  let schedulerLock: { runExclusive: jest.Mock };
  let scheduler: NotificationScheduler;

  const sentTo = (): string[] =>
    emailService.send.mock.calls.map((c: Array<{ to: string }>) => c[0]?.to ?? '');

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    userService = { findNotificationRecipients: jest.fn().mockResolvedValue([]) };
    debtService = { findAll: jest.fn().mockResolvedValue([]) };
    entitlements = { isPro: jest.fn().mockReturnValue(true) };
    reportBuilder = { build: jest.fn().mockResolvedValue(REPORT) };
    emailService = { send: jest.fn().mockResolvedValue(undefined) };
    schedulerLock = {
      runExclusive: jest.fn((_key: number, job: () => Promise<void>) => job().then(() => true)),
    };
    scheduler = new NotificationScheduler(
      userService as unknown as UserService,
      debtService as unknown as DebtService,
      entitlements as unknown as EntitlementService,
      reportBuilder as unknown as MonthlyReportBuilder,
      new NotificationComposer(),
      emailService as unknown as EmailService,
      { buildUrl: () => UNSUBSCRIBE_URL } as unknown as UnsubscribeTokenService,
      schedulerLock as unknown as SchedulerLockService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  describe('when a user has a debt with one installment remaining', () => {
    it('sends an alert that the last installment is next month', async () => {
      userService.findNotificationRecipients.mockResolvedValue([makeUser('a')]);
      debtService.findAll.mockResolvedValue([makeDebt('Notebook', { paid_installments: 9 })]);

      await scheduler.runMonthly(NOW);

      expect(sentTo()).toEqual(['a@example.com']);
      expect(emailService.send.mock.calls[0]?.[0]).toMatchObject({
        subject: 'Última parcela chegando',
      });
    });
  });

  describe('when a debt closed this month', () => {
    it('sends a liberation notice', async () => {
      userService.findNotificationRecipients.mockResolvedValue([makeUser('a')]);
      debtService.findAll.mockResolvedValue([
        makeDebt('Carro', { closed: true, paid_installments: 10 }),
      ]);

      await scheduler.runMonthly(NOW);

      expect(emailService.send.mock.calls[0]?.[0]).toMatchObject({
        subject: 'Dinheiro liberado nas suas dívidas',
      });
    });

    it('ignores debts that closed in an earlier month', async () => {
      userService.findNotificationRecipients.mockResolvedValue([makeUser('a')]);
      debtService.findAll.mockResolvedValue([
        makeDebt('Antiga', { closed: true, last_paid_month: '2027-02-01' }),
      ]);

      await scheduler.runMonthly(NOW);

      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe('when a user has no name on record', () => {
    it('greets them with a generic fallback', async () => {
      userService.findNotificationRecipients.mockResolvedValue([makeUser('a', { name: '' })]);
      debtService.findAll.mockResolvedValue([makeDebt('Notebook', { paid_installments: 9 })]);

      await scheduler.runMonthly(NOW);

      expect(emailService.send.mock.calls[0]?.[0]).toMatchObject({
        text: expect.stringContaining('Olá, você') as string,
      });
    });
  });

  describe('when a user has nothing to be told', () => {
    it('sends no email', async () => {
      userService.findNotificationRecipients.mockResolvedValue([makeUser('a')]);
      debtService.findAll.mockResolvedValue([makeDebt('Longa', { paid_installments: 2 })]);

      await scheduler.runMonthly(NOW);

      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe('when a user only opted in to alerts', () => {
    it('never builds the monthly report', async () => {
      userService.findNotificationRecipients.mockResolvedValue([makeUser('a')]);

      await scheduler.runMonthly(NOW);

      expect(reportBuilder.build).not.toHaveBeenCalled();
    });
  });

  describe('when a user opted in to the monthly report', () => {
    const reportUser = makeUser('r', { email_notifications: false, monthly_report: true });

    it('sends the report even when there are no alerts, without reading debts', async () => {
      userService.findNotificationRecipients.mockResolvedValue([reportUser]);

      await scheduler.runMonthly(NOW);

      expect(reportBuilder.build).toHaveBeenCalledWith('r', NOW);
      expect(debtService.findAll).not.toHaveBeenCalled();
      expect(emailService.send.mock.calls[0]?.[0]).toMatchObject({
        subject: 'Seu relatório de março de 2027',
      });
    });

    it('skips the report when the user is not Pro', async () => {
      entitlements.isPro.mockReturnValue(false);
      userService.findNotificationRecipients.mockResolvedValue([reportUser]);

      await scheduler.runMonthly(NOW);

      expect(reportBuilder.build).not.toHaveBeenCalled();
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe('when sending to one user fails', () => {
    it('still notifies the remaining users and logs the failure', async () => {
      userService.findNotificationRecipients.mockResolvedValue([
        makeUser('a'),
        makeUser('b'),
        makeUser('c'),
      ]);
      debtService.findAll.mockResolvedValue([makeDebt('Notebook', { paid_installments: 9 })]);
      emailService.send.mockImplementation((message: { to: string }) =>
        message.to === 'b@example.com' ? Promise.reject(new Error('boom')) : Promise.resolve(),
      );

      await scheduler.runMonthly(NOW);

      expect(sentTo()).toEqual(['a@example.com', 'b@example.com', 'c@example.com']);
      expect(Logger.prototype.error).toHaveBeenCalledTimes(1);
    });

    it('logs failures that are not Error instances', async () => {
      userService.findNotificationRecipients.mockResolvedValue([makeUser('a')]);
      debtService.findAll.mockRejectedValue('db down');

      await scheduler.runMonthly(NOW);

      expect(Logger.prototype.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('when there are more recipients than one batch', () => {
    it('keeps paging with the last user id as cursor until a short batch', async () => {
      const fullBatch = Array.from({ length: RECIPIENT_BATCH_SIZE }, (_, i) => makeUser(`u${i}`));
      userService.findNotificationRecipients
        .mockResolvedValueOnce(fullBatch)
        .mockResolvedValueOnce([makeUser('last')]);

      await scheduler.runMonthly(NOW);

      expect(userService.findNotificationRecipients).toHaveBeenNthCalledWith(
        1,
        undefined,
        RECIPIENT_BATCH_SIZE,
      );
      expect(userService.findNotificationRecipients).toHaveBeenNthCalledWith(
        2,
        `u${RECIPIENT_BATCH_SIZE - 1}`,
        RECIPIENT_BATCH_SIZE,
      );
      expect(userService.findNotificationRecipients).toHaveBeenCalledTimes(2);
    });
  });

  describe('when the cron fires', () => {
    it('runs the monthly job for the current date', async () => {
      const run = jest.spyOn(scheduler, 'runMonthly').mockResolvedValue();

      await scheduler.handleMonthlyCron();

      expect(run).toHaveBeenCalledWith(expect.any(Date));
      expect(schedulerLock.runExclusive).toHaveBeenCalledWith(
        SCHEDULER_LOCK_KEYS.NOTIFICATION_MONTHLY,
        expect.any(Function),
      );
    });

    it('skips the run when another instance already holds the lock', async () => {
      const run = jest.spyOn(scheduler, 'runMonthly').mockResolvedValue();
      schedulerLock.runExclusive.mockResolvedValue(false);

      await scheduler.handleMonthlyCron();

      expect(run).not.toHaveBeenCalled();
    });
  });
});

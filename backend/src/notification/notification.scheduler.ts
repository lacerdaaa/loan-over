import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntitlementService } from '../billing/entitlement.service';
import { Debt } from '../debt/debt.entity';
import { monthStartKey } from '../debt/debt-month.utils';
import { DebtService } from '../debt/debt.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { EmailService } from './email.service';
import { MonthlyReportBuilder } from './monthly-report.builder';
import { NotificationComposer } from './notification.composer';
import { UnsubscribeTokenService } from './unsubscribe-token.service';

export const RECIPIENT_BATCH_SIZE = 100;
const MONTHLY_CRON = '0 9 1 * *';
const CRON_TIME_ZONE = 'America/Sao_Paulo';
const FALLBACK_USER_NAME = 'você';
const LAST_INSTALLMENT_REMAINING = 1;

interface DebtAlerts {
  lastInstallmentNextMonth: Debt[];
  finalInstallmentThisMonth: Debt[];
}

const NO_ALERTS: DebtAlerts = { lastInstallmentNextMonth: [], finalInstallmentThisMonth: [] };

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly userService: UserService,
    private readonly debtService: DebtService,
    private readonly entitlements: EntitlementService,
    private readonly reportBuilder: MonthlyReportBuilder,
    private readonly composer: NotificationComposer,
    private readonly emailService: EmailService,
    private readonly unsubscribeTokens: UnsubscribeTokenService,
  ) {}

  @Cron(MONTHLY_CRON, { timeZone: CRON_TIME_ZONE })
  async handleMonthlyCron(): Promise<void> {
    await this.runMonthly(new Date());
  }

  async runMonthly(now: Date): Promise<void> {
    let cursor: string | undefined;
    let batch: User[];
    do {
      batch = await this.userService.findNotificationRecipients(cursor, RECIPIENT_BATCH_SIZE);
      await Promise.all(batch.map((user) => this.notifySafely(user, now)));
      cursor = batch.at(-1)?.id;
    } while (batch.length === RECIPIENT_BATCH_SIZE);
  }

  private async notifySafely(user: User, now: Date): Promise<void> {
    try {
      await this.notify(user, now);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Notification failed for user ${user.id}: ${reason}`);
    }
  }

  private async notify(user: User, now: Date): Promise<void> {
    const alerts = user.email_notifications ? await this.alertsFor(user.id, now) : NO_ALERTS;
    const wantsReport = user.monthly_report && this.entitlements.isPro(user);
    const report = wantsReport ? await this.reportBuilder.build(user.id, now) : undefined;

    const email = this.composer.compose({
      userName: user.name || FALLBACK_USER_NAME,
      ...alerts,
      report,
      unsubscribeUrl: this.unsubscribeTokens.buildUrl(user.id),
    });
    if (email) await this.emailService.send({ to: user.email, ...email });
  }

  private async alertsFor(userId: string, now: Date): Promise<DebtAlerts> {
    const debts = await this.debtService.findAll(userId);
    const monthStart = monthStartKey(now);
    return {
      lastInstallmentNextMonth: debts.filter(
        (d) =>
          !d.closed && d.total_installments - d.paid_installments === LAST_INSTALLMENT_REMAINING,
      ),
      finalInstallmentThisMonth: debts.filter((d) => d.closed && d.last_paid_month === monthStart),
    };
  }
}

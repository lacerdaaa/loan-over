import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';

export const PRO_REQUIRED_MESSAGE = 'Recurso disponível no plano Pro';

const PRO_SUBSCRIPTION_STATUSES: readonly string[] = ['active', 'trialing'];

@Injectable()
export class EntitlementService {
  constructor(private readonly config: ConfigService) {}

  isBillingEnabled(): boolean {
    return this.config.get<string>('FEATURE_BILLING') === 'true';
  }

  isPro(user: User): boolean {
    if (!this.isBillingEnabled()) return true;
    return (
      user.plan === 'pro' &&
      user.subscription_status !== null &&
      PRO_SUBSCRIPTION_STATUSES.includes(user.subscription_status)
    );
  }
}

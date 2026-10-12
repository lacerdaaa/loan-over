import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserPlan } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { EntitlementService } from './entitlement.service';
import { StripeGateway } from './stripe.gateway';

export interface BillingStatus {
  billing_enabled: boolean;
  plan: UserPlan;
  is_pro: boolean;
  status: string | null;
  current_period_end: string | null;
}

export interface BillingUrl {
  url: string;
}

const ALREADY_SUBSCRIBED_MESSAGE = 'Assinatura já ativa';
const NO_CUSTOMER_MESSAGE = 'Nenhuma assinatura encontrada para este usuário';

@Injectable()
export class BillingService {
  constructor(
    private readonly userService: UserService,
    private readonly gateway: StripeGateway,
    private readonly entitlements: EntitlementService,
    private readonly config: ConfigService,
  ) {}

  async getStatus(userId: string): Promise<BillingStatus> {
    const user = await this.requireUser(userId);
    return {
      billing_enabled: this.entitlements.isBillingEnabled(),
      plan: user.plan,
      is_pro: this.entitlements.isPro(user),
      status: user.subscription_status,
      current_period_end: user.current_period_end?.toISOString() ?? null,
    };
  }

  async createCheckout(userId: string): Promise<BillingUrl> {
    const user = await this.requireUser(userId);
    if (user.stripe_subscription_id && this.entitlements.isPro(user)) {
      throw new ConflictException(ALREADY_SUBSCRIBED_MESSAGE);
    }
    const customerId = await this.ensureCustomer(user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const url = await this.gateway.createCheckoutSession({
      customerId,
      userId,
      priceId: this.config.get<string>('STRIPE_PRICE_PRO') ?? '',
      successUrl: `${frontendUrl}/billing/success`,
      cancelUrl: `${frontendUrl}/billing/cancel`,
    });
    return { url };
  }

  async createPortal(userId: string): Promise<BillingUrl> {
    const user = await this.requireUser(userId);
    if (!user.stripe_customer_id) throw new BadRequestException(NO_CUSTOMER_MESSAGE);
    const url = await this.gateway.createPortalSession(
      user.stripe_customer_id,
      `${this.config.get<string>('FRONTEND_URL')}/dashboard`,
    );
    return { url };
  }

  private async ensureCustomer(user: User): Promise<string> {
    if (user.stripe_customer_id) return user.stripe_customer_id;
    const customerId = await this.gateway.createCustomer({
      email: user.email,
      name: user.name,
      userId: user.id,
    });
    await this.userService.updateBilling(user.id, { stripe_customer_id: customerId });
    return customerId;
  }

  private async requireUser(userId: string): Promise<User> {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    return user;
  }
}

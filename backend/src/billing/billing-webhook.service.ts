import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { UserService } from '../user/user.service';
import { StripeGateway } from './stripe.gateway';
import { toBillingFields } from './subscription.mapper';

const INVALID_WEBHOOK_MESSAGE = 'Invalid Stripe webhook signature';

const idOf = (value: string | { id: string }): string =>
  typeof value === 'string' ? value : value.id;

@Injectable()
export class BillingWebhookService {
  constructor(
    private readonly gateway: StripeGateway,
    private readonly userService: UserService,
  ) {}

  async handle(rawBody: Buffer | undefined, signature: string | undefined): Promise<void> {
    const event = this.verify(rawBody, signature);
    switch (event.type) {
      case 'checkout.session.completed':
        return this.onCheckoutCompleted(event.data.object);
      case 'customer.subscription.updated':
        return this.syncSubscription(event.data.object);
      case 'customer.subscription.deleted':
        return this.syncSubscription({ ...event.data.object, status: 'canceled' });
      default:
        return;
    }
  }

  private verify(rawBody: Buffer | undefined, signature: string | undefined): Stripe.Event {
    if (!rawBody || !signature) throw new BadRequestException(INVALID_WEBHOOK_MESSAGE);
    try {
      return this.gateway.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException(INVALID_WEBHOOK_MESSAGE);
    }
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (!session.client_reference_id || !session.subscription) return;
    const subscription = await this.gateway.retrieveSubscription(idOf(session.subscription));
    await this.userService.updateBilling(
      session.client_reference_id,
      toBillingFields(subscription),
    );
  }

  private async syncSubscription(subscription: Stripe.Subscription): Promise<void> {
    const user = await this.userService.findByStripeCustomerId(idOf(subscription.customer));
    if (!user) return;
    await this.userService.updateBilling(user.id, toBillingFields(subscription));
  }
}

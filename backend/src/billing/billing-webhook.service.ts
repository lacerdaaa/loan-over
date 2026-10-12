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
      case 'customer.subscription.deleted':
        return this.syncCurrentSubscription(event.data.object);
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

  /**
   * Events can arrive late or out of order, and may belong to a subscription the user
   * no longer has. Only the user's current subscription is synced, from its live state.
   */
  private async syncCurrentSubscription(eventSubscription: Stripe.Subscription): Promise<void> {
    const user = await this.userService.findByStripeCustomerId(idOf(eventSubscription.customer));
    if (!user) return;
    if (user.stripe_subscription_id && user.stripe_subscription_id !== eventSubscription.id) return;
    const live = await this.gateway.retrieveSubscription(eventSubscription.id);
    await this.userService.updateBilling(user.id, toBillingFields(live));
  }
}

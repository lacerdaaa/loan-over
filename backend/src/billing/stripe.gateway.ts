import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CheckoutSessionParams {
  customerId: string;
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

@Injectable()
export class StripeGateway {
  private client?: Stripe;

  constructor(private readonly config: ConfigService) {}

  async createCustomer(params: {
    email: string;
    name: string | null;
    userId: string;
  }): Promise<string> {
    const customer = await this.stripe().customers.create({
      email: params.email,
      name: params.name ?? undefined,
      metadata: { user_id: params.userId },
    });
    return customer.id;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<string> {
    const session = await this.stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: params.customerId,
      client_reference_id: params.userId,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
    if (!session.url) throw new Error('Stripe did not return a checkout URL');
    return session.url;
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe().webhooks.constructEvent(
      rawBody,
      signature,
      this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '',
    );
  }

  retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe().subscriptions.retrieve(subscriptionId);
  }

  private stripe(): Stripe {
    this.client ??= new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') ?? '');
    return this.client;
  }
}

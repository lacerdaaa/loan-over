import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { BillingWebhookService } from './billing-webhook.service';
import { StripeGateway } from './stripe.gateway';

const RAW_BODY = Buffer.from('{}');
const SIGNATURE = 't=1,v1=abc';
const PERIOD_END_SECONDS = 1_794_000_000;

const makeSubscription = (status: string): Stripe.Subscription =>
  ({
    id: 'sub_1',
    customer: 'cus_1',
    status,
    items: { data: [{ current_period_end: PERIOD_END_SECONDS }] },
  }) as unknown as Stripe.Subscription;

const makeEvent = (type: string, object: unknown): Stripe.Event =>
  ({ type, data: { object } }) as unknown as Stripe.Event;

describe('BillingWebhookService', () => {
  let service: BillingWebhookService;
  let gateway: { constructWebhookEvent: jest.Mock; retrieveSubscription: jest.Mock };
  let userService: { findByStripeCustomerId: jest.Mock; updateBilling: jest.Mock };

  beforeEach(() => {
    gateway = { constructWebhookEvent: jest.fn(), retrieveSubscription: jest.fn() };
    userService = {
      findByStripeCustomerId: jest.fn().mockResolvedValue({ id: 'user-1' } as User),
      updateBilling: jest.fn().mockResolvedValue(undefined),
    };
    service = new BillingWebhookService(
      gateway as unknown as StripeGateway,
      userService as unknown as UserService,
    );
  });

  describe('when the signature is invalid', () => {
    it('rejects the request with a bad request error', async () => {
      gateway.constructWebhookEvent.mockImplementation(() => {
        throw new Error('bad signature');
      });

      await expect(service.handle(RAW_BODY, SIGNATURE)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('when the signature header or body is missing', () => {
    it('rejects the request without calling Stripe', async () => {
      await expect(service.handle(undefined, undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(gateway.constructWebhookEvent).not.toHaveBeenCalled();
    });
  });

  describe('when a checkout session completes', () => {
    it('links customer and subscription to the referenced user as Pro', async () => {
      gateway.constructWebhookEvent.mockReturnValue(
        makeEvent('checkout.session.completed', {
          client_reference_id: 'user-1',
          customer: 'cus_1',
          subscription: 'sub_1',
        }),
      );
      gateway.retrieveSubscription.mockResolvedValue(makeSubscription('active'));

      await service.handle(RAW_BODY, SIGNATURE);

      expect(gateway.retrieveSubscription).toHaveBeenCalledWith('sub_1');
      expect(userService.updateBilling).toHaveBeenCalledWith('user-1', {
        plan: 'pro',
        stripe_customer_id: 'cus_1',
        stripe_subscription_id: 'sub_1',
        subscription_status: 'active',
        current_period_end: new Date(PERIOD_END_SECONDS * 1000),
      });
    });

    it('accepts an expanded subscription object', async () => {
      gateway.constructWebhookEvent.mockReturnValue(
        makeEvent('checkout.session.completed', {
          client_reference_id: 'user-1',
          subscription: { id: 'sub_1' },
        }),
      );
      gateway.retrieveSubscription.mockResolvedValue(makeSubscription('active'));

      await service.handle(RAW_BODY, SIGNATURE);

      expect(gateway.retrieveSubscription).toHaveBeenCalledWith('sub_1');
    });

    it('ignores a session without user reference or subscription', async () => {
      gateway.constructWebhookEvent.mockReturnValue(
        makeEvent('checkout.session.completed', { client_reference_id: null, subscription: null }),
      );

      await service.handle(RAW_BODY, SIGNATURE);

      expect(userService.updateBilling).not.toHaveBeenCalled();
    });
  });

  describe('when a subscription is updated', () => {
    it('syncs the user found by Stripe customer id', async () => {
      gateway.constructWebhookEvent.mockReturnValue(
        makeEvent('customer.subscription.updated', makeSubscription('past_due')),
      );

      await service.handle(RAW_BODY, SIGNATURE);

      expect(userService.findByStripeCustomerId).toHaveBeenCalledWith('cus_1');
      expect(userService.updateBilling).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ plan: 'pro', subscription_status: 'past_due' }),
      );
    });

    it('does nothing when no user owns that customer', async () => {
      userService.findByStripeCustomerId.mockResolvedValue(null);
      gateway.constructWebhookEvent.mockReturnValue(
        makeEvent('customer.subscription.updated', makeSubscription('active')),
      );

      await service.handle(RAW_BODY, SIGNATURE);

      expect(userService.updateBilling).not.toHaveBeenCalled();
    });
  });

  describe('when a subscription is deleted', () => {
    it('moves the user back to the free plan as canceled', async () => {
      gateway.constructWebhookEvent.mockReturnValue(
        makeEvent('customer.subscription.deleted', makeSubscription('active')),
      );

      await service.handle(RAW_BODY, SIGNATURE);

      expect(userService.updateBilling).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ plan: 'free', subscription_status: 'canceled' }),
      );
    });

    it('does nothing when no user owns that customer', async () => {
      userService.findByStripeCustomerId.mockResolvedValue(null);
      gateway.constructWebhookEvent.mockReturnValue(
        makeEvent('customer.subscription.deleted', makeSubscription('canceled')),
      );

      await service.handle(RAW_BODY, SIGNATURE);

      expect(userService.updateBilling).not.toHaveBeenCalled();
    });
  });

  describe('when the event type is unknown', () => {
    it('acknowledges it without changing anything', async () => {
      gateway.constructWebhookEvent.mockReturnValue(makeEvent('invoice.paid', {}));

      await expect(service.handle(RAW_BODY, SIGNATURE)).resolves.toBeUndefined();
      expect(userService.updateBilling).not.toHaveBeenCalled();
    });
  });
});

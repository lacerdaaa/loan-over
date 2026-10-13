import Stripe from 'stripe';
import { toBillingFields } from './subscription.mapper';

const PERIOD_END_SECONDS = 1_794_000_000;

const makeSubscription = (
  overrides: Partial<Record<string, unknown>> = {},
  periodEnd: number | null = PERIOD_END_SECONDS,
): Stripe.Subscription =>
  ({
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    items: { data: periodEnd === null ? [] : [{ current_period_end: periodEnd }] },
    ...overrides,
  }) as unknown as Stripe.Subscription;

describe('toBillingFields', () => {
  describe('when the subscription is active', () => {
    it('maps it to the Pro plan with ids, status and renewal date', () => {
      const fields = toBillingFields(makeSubscription());

      expect(fields).toEqual({
        plan: 'pro',
        stripe_customer_id: 'cus_1',
        stripe_subscription_id: 'sub_1',
        subscription_status: 'active',
        current_period_end: new Date(PERIOD_END_SECONDS * 1000),
      });
    });
  });

  describe('when the customer is an expanded object', () => {
    it('uses its id', () => {
      const fields = toBillingFields(makeSubscription({ customer: { id: 'cus_obj' } }));

      expect(fields.stripe_customer_id).toBe('cus_obj');
    });
  });

  describe('when the subscription is in trial', () => {
    it('keeps the Pro plan with the trialing status', () => {
      const fields = toBillingFields(makeSubscription({ status: 'trialing' }));

      expect(fields).toMatchObject({ plan: 'pro', subscription_status: 'trialing' });
    });
  });

  describe('when the payment is past due', () => {
    it('keeps the Pro plan so Stripe retries can recover it, with the past_due status', () => {
      const fields = toBillingFields(makeSubscription({ status: 'past_due' }));

      expect(fields).toMatchObject({ plan: 'pro', subscription_status: 'past_due' });
    });
  });

  describe('when the subscription is canceled', () => {
    it('drops back to the free plan', () => {
      const fields = toBillingFields(makeSubscription({ status: 'canceled' }));

      expect(fields).toMatchObject({ plan: 'free', subscription_status: 'canceled' });
    });
  });

  describe('when the subscription expired before the first payment', () => {
    it('drops back to the free plan', () => {
      const fields = toBillingFields(makeSubscription({ status: 'incomplete_expired' }));

      expect(fields.plan).toBe('free');
    });
  });

  describe('when the subscription has no items', () => {
    it('leaves the renewal date empty', () => {
      const fields = toBillingFields(makeSubscription({}, null));

      expect(fields.current_period_end).toBeNull();
    });
  });
});

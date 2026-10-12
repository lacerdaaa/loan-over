import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeGateway } from './stripe.gateway';

const WEBHOOK_SECRET = 'whsec_test_secret';

const buildGateway = (): StripeGateway => {
  const values: Record<string, string> = {
    STRIPE_SECRET_KEY: 'sk_test_dummy',
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  };
  return new StripeGateway({ get: (key: string) => values[key] } as unknown as ConfigService);
};

describe('StripeGateway', () => {
  describe('when a webhook payload is signed with the configured secret', () => {
    it('returns the parsed event', () => {
      const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'ping' });
      const header = new Stripe('sk_test_dummy').webhooks.generateTestHeaderString({
        payload,
        secret: WEBHOOK_SECRET,
      });

      const event = buildGateway().constructWebhookEvent(Buffer.from(payload), header);

      expect(event.id).toBe('evt_1');
    });
  });

  describe('when the signature does not match', () => {
    it('throws', () => {
      const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'ping' });

      expect(() =>
        buildGateway().constructWebhookEvent(Buffer.from(payload), 't=1,v1=bad'),
      ).toThrow();
    });
  });
});

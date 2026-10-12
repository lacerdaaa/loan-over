import { describe, expect, it } from 'vitest';
import { BILLING_POLL_INTERVAL_MS, BILLING_POLL_MAX_ATTEMPTS, billingPollInterval } from './billingPolling';

describe('billingPollInterval', () => {
  describe('when the subscription is not confirmed yet', () => {
    it('keeps polling at the configured interval', () => {
      expect(billingPollInterval({ isPro: false, attempts: 1 })).toBe(BILLING_POLL_INTERVAL_MS);
    });
  });

  describe('when the subscription is confirmed', () => {
    it('stops polling', () => {
      expect(billingPollInterval({ isPro: true, attempts: 1 })).toBe(false);
    });
  });

  describe('when the maximum number of attempts is reached', () => {
    it('stops polling', () => {
      expect(billingPollInterval({ isPro: false, attempts: BILLING_POLL_MAX_ATTEMPTS })).toBe(false);
    });
  });
});

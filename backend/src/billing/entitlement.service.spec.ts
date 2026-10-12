import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { EntitlementService } from './entitlement.service';

const buildService = (billingFlag: string | undefined): EntitlementService =>
  new EntitlementService({ get: () => billingFlag } as unknown as ConfigService);

const userWith = (plan: User['plan'], status: string | null): User =>
  ({ id: 'user-1', plan, subscription_status: status }) as User;

describe('EntitlementService', () => {
  describe('when billing is disabled', () => {
    it('treats every user as Pro, even a free one', () => {
      const freeUser = userWith('free', null);

      expect(buildService(undefined).isPro(freeUser)).toBe(true);
      expect(buildService('false').isPro(freeUser)).toBe(true);
    });
  });

  describe('when billing is enabled', () => {
    const service = buildService('true');

    it('does not treat a free user as Pro', () => {
      expect(service.isPro(userWith('free', null))).toBe(false);
    });

    it('treats a Pro user with an active subscription as Pro', () => {
      expect(service.isPro(userWith('pro', 'active'))).toBe(true);
    });

    it('treats a Pro user in a trial as Pro', () => {
      expect(service.isPro(userWith('pro', 'trialing'))).toBe(true);
    });

    it('does not treat a Pro user with a past-due subscription as Pro', () => {
      expect(service.isPro(userWith('pro', 'past_due'))).toBe(false);
    });

    it('does not treat a Pro user without a subscription status as Pro', () => {
      expect(service.isPro(userWith('pro', null))).toBe(false);
    });

    it('does not treat a free user with a leftover active status as Pro', () => {
      expect(service.isPro(userWith('free', 'active'))).toBe(false);
    });
  });
});

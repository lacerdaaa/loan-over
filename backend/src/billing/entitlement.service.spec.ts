import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { EntitlementService } from './entitlement.service';

const buildService = (billingFlag: string | undefined): EntitlementService =>
  new EntitlementService({ get: () => billingFlag } as unknown as ConfigService);

describe('EntitlementService', () => {
  const user = { id: 'user-1' } as User;

  describe('when billing is disabled', () => {
    it('treats every user as Pro', () => {
      expect(buildService(undefined).isPro(user)).toBe(true);
      expect(buildService('false').isPro(user)).toBe(true);
    });
  });

  describe('when billing is enabled', () => {
    it('does not treat the user as Pro until plans exist', () => {
      expect(buildService('true').isPro(user)).toBe(false);
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { BillingFeatureGuard } from './billing-feature.guard';

const makeGuard = (billingEnabled: boolean): BillingFeatureGuard =>
  new BillingFeatureGuard({ isBillingEnabled: () => billingEnabled } as EntitlementService);

describe('BillingFeatureGuard', () => {
  it('lets the request through when billing is enabled', () => {
    expect(makeGuard(true).canActivate()).toBe(true);
  });

  it('answers 404 when billing is disabled', () => {
    expect(() => makeGuard(false).canActivate()).toThrow(NotFoundException);
  });
});

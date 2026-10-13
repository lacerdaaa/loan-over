import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';

@Injectable()
export class BillingFeatureGuard implements CanActivate {
  constructor(private readonly entitlements: EntitlementService) {}

  canActivate(): boolean {
    if (this.entitlements.isBillingEnabled()) return true;
    throw new NotFoundException();
  }
}

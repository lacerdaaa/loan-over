import { Module } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { StripeGateway } from './stripe.gateway';

@Module({
  providers: [EntitlementService, StripeGateway],
  exports: [EntitlementService, StripeGateway],
})
export class BillingModule {}

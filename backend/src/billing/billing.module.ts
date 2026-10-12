import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { BillingFeatureGuard } from './billing-feature.guard';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { EntitlementService } from './entitlement.service';
import { StripeGateway } from './stripe.gateway';

@Module({
  imports: [UserModule],
  controllers: [BillingController],
  providers: [EntitlementService, StripeGateway, BillingService, BillingFeatureGuard],
  exports: [EntitlementService, StripeGateway],
})
export class BillingModule {}

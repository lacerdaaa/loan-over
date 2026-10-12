import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillingFeatureGuard } from './billing-feature.guard';
import { BillingWebhookService } from './billing-webhook.service';
import { BillingService, BillingStatus, BillingUrl } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly webhook: BillingWebhookService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Plan, entitlement and renewal date of the current user' })
  @ApiOkResponse({ description: 'BillingStatus (works with billing disabled: is_pro is true)' })
  status(@CurrentUser() userId: string): Promise<BillingStatus> {
    return this.billing.getStatus(userId);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BillingFeatureGuard)
  @ApiOperation({ summary: 'Create a Stripe Checkout session for the Pro subscription' })
  @ApiOkResponse({ description: 'Checkout URL' })
  checkout(@CurrentUser() userId: string): Promise<BillingUrl> {
    return this.billing.createCheckout(userId);
  }

  @Post('portal')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BillingFeatureGuard)
  @ApiOperation({ summary: 'Create a Stripe Customer Portal session' })
  @ApiOkResponse({ description: 'Portal URL (400 when the user has no Stripe customer)' })
  portal(@CurrentUser() userId: string): Promise<BillingUrl> {
    return this.billing.createPortal(userId);
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(BillingFeatureGuard)
  @ApiOperation({ summary: 'Stripe webhook (signature verified against the raw body)' })
  @ApiOkResponse({ description: 'Event acknowledged (400 on invalid signature)' })
  stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<void> {
    return this.webhook.handle(request.rawBody, signature);
  }
}

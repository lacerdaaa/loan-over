import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { BillingService } from './billing.service';
import { EntitlementService } from './entitlement.service';
import { StripeGateway } from './stripe.gateway';

const USER_ID = 'user-1';
const FRONTEND_URL = 'https://app.test';
const PRICE_ID = 'price_pro';
const PERIOD_END = new Date('2026-11-12T00:00:00.000Z');

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: USER_ID,
    email: 'ana@example.com',
    name: 'Ana',
    plan: 'free',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: null,
    current_period_end: null,
    ...overrides,
  }) as User;

describe('BillingService', () => {
  let service: BillingService;
  let userService: { findById: jest.Mock; updateBilling: jest.Mock };
  let gateway: {
    createCustomer: jest.Mock;
    createCheckoutSession: jest.Mock;
    createPortalSession: jest.Mock;
  };
  let entitlements: { isPro: jest.Mock; isBillingEnabled: jest.Mock };

  beforeEach(() => {
    userService = { findById: jest.fn(), updateBilling: jest.fn() };
    gateway = {
      createCustomer: jest.fn().mockResolvedValue('cus_new'),
      createCheckoutSession: jest.fn().mockResolvedValue('https://stripe.test/checkout'),
      createPortalSession: jest.fn().mockResolvedValue('https://stripe.test/portal'),
    };
    entitlements = { isPro: jest.fn().mockReturnValue(false), isBillingEnabled: jest.fn() };
    const config = {
      get: (key: string) => ({ FRONTEND_URL, STRIPE_PRICE_PRO: PRICE_ID })[key],
    } as unknown as ConfigService;
    service = new BillingService(
      userService as unknown as UserService,
      gateway as unknown as StripeGateway,
      entitlements as unknown as EntitlementService,
      config,
    );
  });

  describe('status', () => {
    it('reports the plan, entitlement and renewal date of the user', async () => {
      userService.findById.mockResolvedValue(
        makeUser({ plan: 'pro', subscription_status: 'active', current_period_end: PERIOD_END }),
      );
      entitlements.isBillingEnabled.mockReturnValue(true);
      entitlements.isPro.mockReturnValue(true);

      const status = await service.getStatus(USER_ID);

      expect(status).toEqual({
        billing_enabled: true,
        plan: 'pro',
        is_pro: true,
        status: 'active',
        current_period_end: PERIOD_END.toISOString(),
      });
    });

    it('reports nulls for a user that never subscribed', async () => {
      userService.findById.mockResolvedValue(makeUser());
      entitlements.isBillingEnabled.mockReturnValue(false);
      entitlements.isPro.mockReturnValue(true);

      const status = await service.getStatus(USER_ID);

      expect(status).toEqual({
        billing_enabled: false,
        plan: 'free',
        is_pro: true,
        status: null,
        current_period_end: null,
      });
    });

    it('throws when the user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.getStatus(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkout', () => {
    it('creates a Stripe customer for a user without one and stores it', async () => {
      userService.findById.mockResolvedValue(makeUser());

      const result = await service.createCheckout(USER_ID);

      expect(gateway.createCustomer).toHaveBeenCalledWith({
        email: 'ana@example.com',
        name: 'Ana',
        userId: USER_ID,
      });
      expect(userService.updateBilling).toHaveBeenCalledWith(USER_ID, {
        stripe_customer_id: 'cus_new',
      });
      expect(result).toEqual({ url: 'https://stripe.test/checkout' });
    });

    it('reuses the existing Stripe customer', async () => {
      userService.findById.mockResolvedValue(makeUser({ stripe_customer_id: 'cus_old' }));

      await service.createCheckout(USER_ID);

      expect(gateway.createCustomer).not.toHaveBeenCalled();
      expect(userService.updateBilling).not.toHaveBeenCalled();
    });

    it('opens a subscription checkout for the Pro price tied to the user', async () => {
      userService.findById.mockResolvedValue(makeUser({ stripe_customer_id: 'cus_old' }));

      await service.createCheckout(USER_ID);

      expect(gateway.createCheckoutSession).toHaveBeenCalledWith({
        customerId: 'cus_old',
        userId: USER_ID,
        priceId: PRICE_ID,
        successUrl: `${FRONTEND_URL}/billing/success`,
        cancelUrl: `${FRONTEND_URL}/billing/cancel`,
      });
    });

    it('throws when the user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.createCheckout(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('portal', () => {
    it('opens the customer portal for a user with a Stripe customer', async () => {
      userService.findById.mockResolvedValue(makeUser({ stripe_customer_id: 'cus_old' }));

      const result = await service.createPortal(USER_ID);

      expect(gateway.createPortalSession).toHaveBeenCalledWith(
        'cus_old',
        `${FRONTEND_URL}/dashboard`,
      );
      expect(result).toEqual({ url: 'https://stripe.test/portal' });
    });

    it('rejects a user that has no Stripe customer yet', async () => {
      userService.findById.mockResolvedValue(makeUser());

      await expect(service.createPortal(USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws when the user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.createPortal(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

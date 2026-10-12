import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { StripeGateway } from './../src/billing/stripe.gateway';
import { User } from './../src/user/user.entity';

const PRO_REQUIRED_MESSAGE = 'Recurso disponível no plano Pro';
const CHECKOUT_URL = 'https://stripe.test/checkout';
const CUSTOMER_ID = 'cus_e2e_billing';
const PERIOD_END_SECONDS = 1_794_000_000;
const FREE_HORIZON_LIMIT = 24;
const PRO_HORIZON = 60;

describe('Billing and entitlements (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;
  const gateway = {
    createCustomer: jest.fn(),
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    constructWebhookEvent: jest.fn(),
    retrieveSubscription: jest.fn(),
  };

  const auth = (req: request.Test): request.Test => req.set('Authorization', `Bearer ${token}`);
  const loadUser = (): Promise<User | null> =>
    dataSource.getRepository(User).findOne({ where: { id: userId } });
  const postWebhook = (): request.Test =>
    request(app.getHttpServer())
      .post('/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 't=1,v1=sig')
      .send('{"id":"evt_1"}');
  const subscriptionEvent = (type: string, status: string): void => {
    const subscription = {
      id: 'sub_e2e',
      customer: CUSTOMER_ID,
      status,
      items: { data: [{ current_period_end: PERIOD_END_SECONDS }] },
    };
    gateway.constructWebhookEvent.mockReturnValue({ type, data: { object: subscription } });
    gateway.retrieveSubscription.mockResolvedValue(subscription);
  };

  beforeAll(async () => {
    delete process.env.FEATURE_BILLING;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StripeGateway)
      .useValue(gateway)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(getDataSourceToken());
    const users = dataSource.getRepository(User);
    const saved = await users.save(
      users.create({
        google_id: `billing-e2e-${Date.now()}`,
        email: 'billing-e2e@example.com',
        name: 'Billing User',
        avatar: '',
      }),
    );
    userId = saved.id;
    token = app.get(JwtService).sign({ sub: userId, email: saved.email, name: saved.name });
  });

  afterAll(async () => {
    delete process.env.FEATURE_BILLING;
    await dataSource.getRepository(User).delete({ id: userId });
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    gateway.createCustomer.mockResolvedValue(CUSTOMER_ID);
    gateway.createCheckoutSession.mockResolvedValue(CHECKOUT_URL);
    gateway.createPortalSession.mockResolvedValue('https://stripe.test/portal');
  });

  afterEach(() => {
    delete process.env.FEATURE_BILLING;
  });

  describe('when billing is disabled', () => {
    it('reports every user as Pro on GET /billing/status', async () => {
      const response = await auth(request(app.getHttpServer()).get('/billing/status')).expect(200);

      expect(response.body).toEqual({
        billing_enabled: false,
        plan: 'free',
        is_pro: true,
        status: null,
        current_period_end: null,
      });
    });

    it.each([['checkout'], ['portal']])('answers 404 on POST /billing/%s', async (path) => {
      await auth(request(app.getHttpServer()).post(`/billing/${path}`)).expect(404);
    });

    it('answers 404 on POST /billing/webhook', async () => {
      await postWebhook().expect(404);
    });

    it('allows long horizons and the simulator', async () => {
      await auth(request(app.getHttpServer()).get(`/projection?horizon=${PRO_HORIZON}`)).expect(
        200,
      );
      await auth(request(app.getHttpServer()).post('/projection/simulate').send({})).expect(200);
    });
  });

  describe('when billing is enabled', () => {
    beforeEach(() => {
      process.env.FEATURE_BILLING = 'true';
    });

    it('reports a new user as free on GET /billing/status', async () => {
      const response = await auth(request(app.getHttpServer()).get('/billing/status')).expect(200);

      expect(response.body).toMatchObject({ billing_enabled: true, plan: 'free', is_pro: false });
    });

    it('returns the checkout URL and stores the Stripe customer id', async () => {
      const response = await auth(request(app.getHttpServer()).post('/billing/checkout')).expect(
        200,
      );

      expect(response.body).toEqual({ url: CHECKOUT_URL });
      expect((await loadUser())?.stripe_customer_id).toBe(CUSTOMER_ID);
    });

    it('returns the portal URL once the user has a Stripe customer', async () => {
      const response = await auth(request(app.getHttpServer()).post('/billing/portal')).expect(200);

      expect(response.body).toEqual({ url: 'https://stripe.test/portal' });
    });

    it('rejects a webhook with an invalid signature', async () => {
      gateway.constructWebhookEvent.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      await postWebhook().expect(400);
    });

    it('acknowledges unknown webhook events without changes', async () => {
      gateway.constructWebhookEvent.mockReturnValue({ type: 'invoice.paid', data: { object: {} } });

      await postWebhook().expect(200);
    });

    it('blocks long horizons and the simulator for free users', async () => {
      const projection = await auth(
        request(app.getHttpServer()).get(`/projection?horizon=${PRO_HORIZON}`),
      ).expect(403);
      const simulate = await auth(
        request(app.getHttpServer()).post('/projection/simulate').send({}),
      ).expect(403);

      expect(projection.body).toMatchObject({ message: PRO_REQUIRED_MESSAGE });
      expect(simulate.body).toMatchObject({ message: PRO_REQUIRED_MESSAGE });
    });

    it('still serves horizons within the free limit', async () => {
      await auth(
        request(app.getHttpServer()).get(`/projection?horizon=${FREE_HORIZON_LIMIT}`),
      ).expect(200);
    });

    describe('after a customer.subscription.updated webhook activates the subscription', () => {
      beforeEach(async () => {
        subscriptionEvent('customer.subscription.updated', 'active');
        await postWebhook().expect(200);
      });

      it('flips the user to Pro on GET /billing/status', async () => {
        const response = await auth(request(app.getHttpServer()).get('/billing/status')).expect(
          200,
        );

        expect(response.body).toEqual({
          billing_enabled: true,
          plan: 'pro',
          is_pro: true,
          status: 'active',
          current_period_end: new Date(PERIOD_END_SECONDS * 1000).toISOString(),
        });
      });

      it('allows the 60 month projection', async () => {
        const response = await auth(
          request(app.getHttpServer()).get(`/projection?horizon=${PRO_HORIZON}`),
        ).expect(200);

        expect(response.body).toHaveLength(PRO_HORIZON);
      });

      it('simulates a hypothetical debt with a liberation event', async () => {
        const response = await auth(
          request(app.getHttpServer())
            .post('/projection/simulate')
            .send({
              horizon: 6,
              hypothetical_debts: [
                { name: 'Notebook', installment_amount: 350, installments: 2, start_offset: 0 },
              ],
            }),
        ).expect(200);

        const body = response.body as {
          baseline: { free_balance: number; events: { type: string; debt_name?: string }[] }[];
          scenario: { free_balance: number; events: { type: string; debt_name?: string }[] }[];
        };
        expect(body.baseline).toHaveLength(6);
        expect(body.scenario).toHaveLength(6);
        expect(body.scenario[0]?.free_balance).toBe((body.baseline[0]?.free_balance ?? 0) - 350);
        expect(body.scenario[2]?.events).toEqual([
          expect.objectContaining({ type: 'liberation', debt_name: 'Notebook' }),
        ]);
        expect(body.baseline.flatMap((m) => m.events)).toEqual([]);
      });

      it('rejects an invalid simulator payload', async () => {
        await auth(
          request(app.getHttpServer())
            .post('/projection/simulate')
            .send({
              horizon: 6,
              hypothetical_debts: [
                { name: 'X', installment_amount: 1, installments: 1, start_offset: 6 },
              ],
            }),
        ).expect(400);
      });

      it('moves the user back to free when the subscription is deleted', async () => {
        subscriptionEvent('customer.subscription.deleted', 'canceled');
        await postWebhook().expect(200);

        const user = await loadUser();
        expect(user).toMatchObject({ plan: 'free', subscription_status: 'canceled' });
      });
    });
  });
});

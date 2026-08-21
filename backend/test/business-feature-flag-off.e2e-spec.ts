import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Income } from './../src/income/income.entity';
import { Organization } from './../src/organization/organization.entity';
import { IncomeCategory, IncomeType } from './../src/shared/types';
import { User } from './../src/user/user.entity';

describe('Business feature flag OFF (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;
  const email = 'flag-off-e2e@company.com';

  const auth = (req: request.Test): request.Test => req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    process.env.FEATURE_BUSINESS = 'false';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(getDataSourceToken());
    const users = dataSource.getRepository(User);
    const saved = await users.save(
      users.create({ google_id: `flag-off-${Date.now()}`, email, name: 'Flag Off', avatar: '' }),
    );
    userId = saved.id;
    token = app.get(JwtService).sign({ sub: userId, email, name: 'Flag Off', avatar: '' });

    const incomes = dataSource.getRepository(Income);
    await incomes.save(
      incomes.create({
        user: { id: userId },
        type: IncomeType.FIXED,
        category: IncomeCategory.OTHER,
        amount: 5000,
        description: 'Contract revenue',
        deductions: [],
      }),
    );

    // Seed an organization row directly — the API cannot create one while the flag is off.
    const orgs = dataSource.getRepository(Organization);
    await orgs.save(orgs.create({ user: { id: userId }, name: 'Hidden Co', cash_balance: 10000 }));
  });

  afterAll(async () => {
    await dataSource.getRepository(Income).delete({ user: { id: userId } });
    await dataSource.getRepository(Organization).delete({ user: { id: userId } });
    await dataSource.getRepository(User).delete({ id: userId });
    await app.close();
  });

  describe('user account-type endpoint', () => {
    it('hides PATCH /users/me behind a 404', () => {
      return auth(
        request(app.getHttpServer()).patch('/users/me').send({ account_type: 'business' }),
      ).expect(404);
    });
  });

  describe('organization endpoints', () => {
    it('hides GET /organization behind a 404', () => {
      return auth(request(app.getHttpServer()).get('/organization')).expect(404);
    });

    it('hides POST /organization behind a 404', () => {
      return auth(
        request(app.getHttpServer())
          .post('/organization')
          .send({ name: 'Acme', cash_balance: 5000 }),
      ).expect(404);
    });
  });

  describe('employees endpoints', () => {
    it('hides GET /employees behind a 404', () => {
      return auth(request(app.getHttpServer()).get('/employees')).expect(404);
    });

    it('hides POST /employees behind a 404', () => {
      return auth(
        request(app.getHttpServer())
          .post('/employees')
          .send({ name: 'Alice', regime: 'clt', gross_salary: 3000 }),
      ).expect(404);
    });
  });

  describe('projection', () => {
    it('omits cash_balance even though an organization row exists', async () => {
      const response = await auth(
        request(app.getHttpServer()).get('/projection').query({ month: 6, year: 2026, horizon: 3 }),
      ).expect(200);

      expect(response.body).toHaveLength(3);
      for (const month of response.body) {
        expect(month).not.toHaveProperty('cash_balance');
      }
    });
  });

  describe('auth/me', () => {
    it('still returns account_type (null) — not gated by the flag', async () => {
      const response = await auth(request(app.getHttpServer()).get('/auth/me')).expect(200);

      expect(response.body).toHaveProperty('account_type', null);
      expect(response.body.email).toBe(email);
    });
  });
});

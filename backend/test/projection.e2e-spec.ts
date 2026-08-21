import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Employee } from './../src/employee/employee.entity';
import { Income } from './../src/income/income.entity';
import { Organization } from './../src/organization/organization.entity';
import { IncomeCategory, IncomeType } from './../src/shared/types';
import { User } from './../src/user/user.entity';

describe('ProjectionController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;
  const email = 'projection-e2e@company.com';

  const auth = (req: request.Test): request.Test => req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    process.env.FEATURE_BUSINESS = 'true';
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
      users.create({
        google_id: `proj-e2e-${Date.now()}`,
        email,
        name: 'Runway Owner',
        avatar: '',
      }),
    );
    userId = saved.id;
    token = app.get(JwtService).sign({ sub: userId, email, name: 'Runway Owner', avatar: '' });

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
  });

  afterAll(async () => {
    await dataSource.getRepository(Income).delete({ user: { id: userId } });
    await dataSource.getRepository(Employee).delete({ user: { id: userId } });
    await dataSource.getRepository(Organization).delete({ user: { id: userId } });
    await dataSource.getRepository(User).delete({ id: userId });
    await app.close();
  });

  describe('when the user has no organization', () => {
    it('omits cash_balance from the projected months', async () => {
      const response = await auth(
        request(app.getHttpServer()).get('/projection').query({ month: 6, year: 2026, horizon: 3 }),
      ).expect(200);

      expect(response.body).toHaveLength(3);
      for (const month of response.body) {
        expect(month).not.toHaveProperty('cash_balance');
      }
    });
  });

  describe('when the user has an organization with a cash balance', () => {
    it('seeds the runway from the organization cash_balance and compounds free_balance', async () => {
      await auth(
        request(app.getHttpServer())
          .post('/organization')
          .send({ name: 'Runway Co', cash_balance: 10000 }),
      ).expect(201);

      const response = await auth(
        request(app.getHttpServer()).get('/projection').query({ month: 6, year: 2026, horizon: 3 }),
      ).expect(200);

      // free_balance each month = 5000 income, no expenses/debts
      expect(response.body[0].cash_balance).toBe(15000);
      expect(response.body[1].cash_balance).toBe(20000);
      expect(response.body[2].cash_balance).toBe(25000);
    });
  });

  describe('when the organization employs a CLT worker', () => {
    it('emits a 13th-salary payroll event in November', async () => {
      await auth(
        request(app.getHttpServer())
          .post('/employees')
          .send({ name: 'Alice', regime: 'clt', gross_salary: 3000 }),
      ).expect(201);

      const response = await auth(
        request(app.getHttpServer())
          .get('/projection')
          .query({ month: 10, year: 2026, horizon: 3 }),
      ).expect(200);

      // offset 1 → November 2026
      const november = response.body[0];
      const payroll = november.events.find((e: { type: string }) => e.type === 'payroll');
      expect(payroll).toBeDefined();
      expect(payroll.amount).toBe(1500);
    });
  });
});

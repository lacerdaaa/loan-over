import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Income } from './../src/income/income.entity';
import { IncomeCategory, IncomeType } from './../src/shared/types';
import { User } from './../src/user/user.entity';

describe('Personal modules input validation (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const userIds: string[] = [];
  const tokens: Record<'a' | 'b', string> = { a: '', b: '' };
  const incomeIds: string[] = [];
  let deductionId: string;

  const auth = (req: request.Test, who: 'a' | 'b' = 'a'): request.Test =>
    req.set('Authorization', `Bearer ${tokens[who]}`);

  const createUser = async (label: 'a' | 'b'): Promise<void> => {
    const users = dataSource.getRepository(User);
    const email = `personal-validation-${label}@company.com`;
    const saved = await users.save(
      users.create({
        google_id: `pv-e2e-${label}-${Date.now()}`,
        email,
        name: `User ${label}`,
        avatar: '',
      }),
    );
    userIds.push(saved.id);
    tokens[label] = app
      .get(JwtService)
      .sign({ sub: saved.id, email, name: `User ${label}`, avatar: '' });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    dataSource = app.get(getDataSourceToken());

    await createUser('a');
    await createUser('b');

    const created = await auth(
      request(app.getHttpServer())
        .post('/income')
        .send({
          type: IncomeType.FIXED,
          category: IncomeCategory.SALARY,
          amount: 5000,
          description: 'Salary',
          deductions: [{ label: 'INSS', amount: 500 }],
        }),
    ).expect(201);
    const body = created.body as Income;
    incomeIds.push(body.id);
    deductionId = body.deductions[0]?.id ?? '';
  });

  afterAll(async () => {
    await dataSource.getRepository(Income).delete(incomeIds);
    await dataSource.getRepository(User).delete(userIds);
    await app.close();
  });

  describe('when the month query param is out of range', () => {
    it.each(['/income', '/occasional-expenses', '/snapshot'])(
      'rejects GET %s with 400',
      async (path) => {
        await auth(request(app.getHttpServer()).get(path).query({ month: 13, year: 2026 })).expect(
          400,
        );
      },
    );
  });

  describe('when the year query param is not a number', () => {
    it('rejects GET /snapshot with 400', async () => {
      await auth(
        request(app.getHttpServer()).get('/snapshot').query({ month: 6, year: 'abc' }),
      ).expect(400);
    });
  });

  describe('when a valid month and year are given', () => {
    it('accepts GET /snapshot', async () => {
      await auth(
        request(app.getHttpServer()).get('/snapshot').query({ month: 6, year: 2026 }),
      ).expect(200);
    });
  });

  describe('when the id path param is not a UUID', () => {
    it.each([
      ['delete', '/debts/not-a-uuid'],
      ['delete', '/income/not-a-uuid'],
      ['delete', '/fixed-expenses/not-a-uuid'],
      ['delete', '/occasional-expenses/not-a-uuid'],
    ])('rejects %s %s with 400', async (_method, path) => {
      await auth(request(app.getHttpServer()).delete(path)).expect(400);
    });
  });

  describe('when the projection horizon is too large', () => {
    it('rejects GET /projection with 400', async () => {
      await auth(request(app.getHttpServer()).get('/projection').query({ horizon: 1000 })).expect(
        400,
      );
    });

    it('defaults to 24 months when horizon is omitted', async () => {
      const response = await auth(request(app.getHttpServer()).get('/projection')).expect(200);

      expect(response.body).toHaveLength(24);
    });
  });

  describe("when another user tries to delete someone else's deduction", () => {
    it('responds 404 and keeps the deduction', async () => {
      const url = `/income/${incomeIds[0]}/deductions/${deductionId}`;

      await auth(request(app.getHttpServer()).delete(url), 'b').expect(404);

      await auth(request(app.getHttpServer()).delete(url), 'a').expect(204);
    });
  });
});

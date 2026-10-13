import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Debt } from './../src/debt/debt.entity';
import { FixedExpense } from './../src/fixed-expense/fixed-expense.entity';
import { Goal } from './../src/goal/goal.entity';
import { Income } from './../src/income/income.entity';
import { OccasionalExpense } from './../src/occasional-expense/occasional-expense.entity';
import { IncomeCategory, IncomeType, MonthlySnapshot, ProjectedMonth } from './../src/shared/types';
import { User } from './../src/user/user.entity';

type Who = 'a' | 'b';

const REFERENCE = { month: 6, year: 2026 };
const SAVED_AMOUNT = 1500;

describe('Personal flow (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const userIds: string[] = [];
  const tokens: Record<Who, string> = { a: '', b: '' };
  const ids = { income: '', fixed: '', plainDebt: '', priceDebt: '', occasional: '', lastDebt: '' };

  const auth = (req: request.Test, who: Who = 'a'): request.Test =>
    req.set('Authorization', `Bearer ${tokens[who]}`);

  const http = (): ReturnType<typeof request> => request(app.getHttpServer());

  const createUser = async (label: Who): Promise<void> => {
    const users = dataSource.getRepository(User);
    const email = `personal-flow-${label}@company.com`;
    const saved = await users.save(
      users.create({
        google_id: `pf-e2e-${label}-${Date.now()}`,
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

  const post = async <T>(path: string, body: object, who: Who = 'a'): Promise<T> => {
    const response = await auth(http().post(path).send(body), who).expect(201);
    return response.body as T;
  };

  beforeAll(async () => {
    delete process.env.FEATURE_BUSINESS;
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
  });

  afterAll(async () => {
    await dataSource.getRepository(Income).delete({ user: { id: userIds[0] } });
    await dataSource.getRepository(User).delete(userIds);
    await app.close();
  });

  describe('when user A registers their finances', () => {
    it('creates an income with deductions', async () => {
      const income = await post<Income>('/income', {
        type: IncomeType.FIXED,
        category: IncomeCategory.SALARY,
        amount: 5000,
        description: 'Salary',
        deductions: [{ label: 'INSS', amount: 500 }],
      });

      ids.income = income.id;
      expect(income.deductions).toHaveLength(1);
    });

    it('creates a fixed expense', async () => {
      const expense = await post<FixedExpense>('/fixed-expenses', {
        name: 'Rent',
        amount: 1000,
        due_day: 5,
      });

      ids.fixed = expense.id;
      expect(expense.active).toBe(true);
    });

    it('creates a plain debt from a fixed installment', async () => {
      const debt = await post<Debt>('/debts', {
        name: 'Car',
        installment_amount: 500,
        total_installments: 12,
        start_date: '2026-01-01',
      });

      ids.plainDebt = debt.id;
      expect(Number(debt.installment_amount)).toBe(500);
    });

    it('creates a Price debt with a zero rate as principal divided by installments', async () => {
      const debt = await post<Debt>('/debts', {
        name: 'Phone',
        principal: 200,
        monthly_rate: 0,
        total_installments: 2,
        paid_installments: 1,
        start_date: '2026-01-01',
      });

      ids.priceDebt = debt.id;
      expect(Number(debt.installment_amount)).toBe(100);
    });

    it('creates an occasional expense for the month', async () => {
      const expense = await post<OccasionalExpense>('/occasional-expenses', {
        description: 'Car repair',
        amount: 200,
        ...REFERENCE,
      });

      ids.occasional = expense.id;
      expect(Number(expense.amount)).toBe(200);
    });
  });

  describe('when user A asks for the monthly snapshot', () => {
    it('nets deductions and subtracts debts, fixed and occasional expenses', async () => {
      const response = await auth(http().get('/snapshot').query(REFERENCE)).expect(200);

      const snapshot = response.body as MonthlySnapshot;
      expect(snapshot.total_income).toBe(4500);
      expect(snapshot.total_fixed).toBe(1000);
      expect(snapshot.total_debts).toBe(600);
      expect(snapshot.total_occasional).toBe(200);
      expect(snapshot.total_debt_balance).toBe(6100);
      expect(snapshot.free_balance).toBe(2700);
      expect(snapshot).not.toHaveProperty('total_payroll');
    });
  });

  describe('when user A saves a goal', () => {
    const goal = { target_amount: 10000, deadline_month: 12, deadline_year: 2027 };

    it('stores saved_amount and monthly_min', async () => {
      const response = await auth(
        http()
          .post('/goal')
          .send({ ...goal, monthly_min: 500, saved_amount: SAVED_AMOUNT }),
      ).expect(201);

      const saved = response.body as Goal;
      expect(Number(saved.saved_amount)).toBe(SAVED_AMOUNT);
      expect(Number(saved.monthly_min)).toBe(500);
    });

    it('clears monthly_min when omitted but keeps saved_amount', async () => {
      await auth(http().post('/goal').send(goal)).expect(201);

      const response = await auth(http().get('/goal')).expect(200);

      const stored = response.body as Goal;
      expect(stored.monthly_min).toBeNull();
      expect(Number(stored.saved_amount)).toBe(SAVED_AMOUNT);
    });
  });

  describe('when user A asks for the projection (personal mode)', () => {
    const fetchProjection = async (): Promise<ProjectedMonth[]> => {
      const response = await auth(
        http()
          .get('/projection')
          .query({ ...REFERENCE, horizon: 3 }),
      ).expect(200);
      return response.body as ProjectedMonth[];
    };

    it('emits a liberation event that identifies the debt', async () => {
      const months = await fetchProjection();

      const liberation = months.flatMap((m) => m.events).find((e) => e.type === 'liberation');
      expect(liberation?.debt_id).toBe(ids.priceDebt);
      expect(liberation?.debt_name).toBe('Phone');
    });

    it('accumulates free_balance on top of the goal saved_amount', async () => {
      const months = await fetchProjection();

      expect(months.map((m) => m.free_balance)).toEqual([2900, 3000, 3000]);
      expect(months.map((m) => m.cumulative_balance)).toEqual([4400, 7400, 10400]);
      expect(months[0]).not.toHaveProperty('cash_balance');
    });
  });

  describe('when user A pays installments', () => {
    it('closes the debt when the last installment is paid', async () => {
      const last = await post<Debt>('/debts', {
        name: 'Last one',
        installment_amount: 50,
        total_installments: 2,
        paid_installments: 1,
        start_date: '2026-01-01',
      });
      ids.lastDebt = last.id;

      const response = await auth(http().patch(`/debts/${last.id}/pay`)).expect(200);

      const paid = response.body as Debt;
      expect(paid.paid_installments).toBe(2);
      expect(paid.closed).toBe(true);
    });

    it('rejects paying a closed debt', async () => {
      await auth(http().patch(`/debts/${ids.lastDebt}/pay`)).expect(400);
    });
  });

  describe("when user B touches user A's records", () => {
    it.each([
      ['PATCH', 'debts', 'plainDebt', { name: 'Hacked' }],
      ['DELETE', 'debts', 'plainDebt', undefined],
      ['PATCH', 'fixed-expenses', 'fixed', { name: 'Hacked' }],
      ['DELETE', 'fixed-expenses', 'fixed', undefined],
      ['DELETE', 'occasional-expenses', 'occasional', undefined],
      ['DELETE', 'income', 'income', undefined],
    ] as const)('responds 404 to %s /%s', async (method, path, key, body) => {
      const url = `/${path}/${ids[key]}`;
      const req = method === 'PATCH' ? http().patch(url).send(body) : http().delete(url);

      await auth(req, 'b').expect(404);
    });

    it('also responds 404 when B pays A’s installment', async () => {
      await auth(http().patch(`/debts/${ids.plainDebt}/pay`), 'b').expect(404);
    });

    it('keeps every record intact for user A', async () => {
      const debts = await auth(http().get('/debts')).expect(200);
      const fixed = await auth(http().get('/fixed-expenses')).expect(200);

      expect((debts.body as Debt[]).map((d) => d.id)).toContain(ids.plainDebt);
      expect((debts.body as Debt[]).find((d) => d.id === ids.plainDebt)?.name).toBe('Car');
      expect((fixed.body as FixedExpense[]).map((e) => e.id)).toContain(ids.fixed);
    });
  });

  describe("when user B lists their own data after A's records exist", () => {
    it.each([
      ['/debts', undefined],
      ['/fixed-expenses', undefined],
      ['/income', REFERENCE],
      ['/occasional-expenses', REFERENCE],
    ])('GET %s does not include any of A’s rows', async (path, query) => {
      const response = await auth(
        http()
          .get(path)
          .query(query ?? {}),
        'b',
      ).expect(200);

      expect(response.body).toEqual([]);
    });

    it('computes an empty snapshot and no goal for B', async () => {
      const snapshot = await auth(http().get('/snapshot').query(REFERENCE), 'b').expect(200);
      const goal = await auth(http().get('/goal'), 'b').expect(200);

      expect((snapshot.body as MonthlySnapshot).free_balance).toBe(0);
      expect(goal.body).toEqual({});
    });
  });
});

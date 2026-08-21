import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Employee } from './../src/employee/employee.entity';
import { User } from './../src/user/user.entity';

describe('EmployeeController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;
  const email = 'employee-e2e@company.com';

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
        google_id: `emp-e2e-${Date.now()}`,
        email,
        name: 'Emp Owner',
        avatar: '',
      }),
    );
    userId = saved.id;
    token = app.get(JwtService).sign({ sub: userId, email, name: 'Emp Owner', avatar: '' });
  });

  afterAll(async () => {
    await dataSource.getRepository(Employee).delete({ user: { id: userId } });
    await dataSource.getRepository(User).delete({ id: userId });
    await app.close();
  });

  describe('GET /employees', () => {
    it('returns an empty array before any employee is created', () => {
      return auth(request(app.getHttpServer()).get('/employees')).expect(200).expect([]);
    });
  });

  describe('POST /employees', () => {
    let createdId: string;

    it('creates a CLT employee and returns it', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/employees')
          .send({ name: 'Alice Silva', regime: 'clt', gross_salary: 5000 }),
      ).expect(201);

      expect(response.body.name).toBe('Alice Silva');
      expect(response.body.regime).toBe('clt');
      expect(Number(response.body.gross_salary)).toBe(5000);
      expect(Number(response.body.monthly_benefits)).toBe(0);
      expect(response.body.active).toBe(true);
      createdId = response.body.id as string;
    });

    it('creates a PJ employee with monthly_benefits', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/employees')
          .send({ name: 'Bob Costa', regime: 'pj', gross_salary: 8000, monthly_benefits: 500 }),
      ).expect(201);

      expect(response.body.regime).toBe('pj');
      expect(Number(response.body.monthly_benefits)).toBe(500);
    });

    it('rejects a missing name', () => {
      return auth(
        request(app.getHttpServer())
          .post('/employees')
          .send({ regime: 'clt', gross_salary: 3000 }),
      ).expect(400);
    });

    it('rejects an invalid regime', () => {
      return auth(
        request(app.getHttpServer())
          .post('/employees')
          .send({ name: 'Bad', regime: 'freelancer', gross_salary: 3000 }),
      ).expect(400);
    });

    it('rejects a negative gross_salary', () => {
      return auth(
        request(app.getHttpServer())
          .post('/employees')
          .send({ name: 'Bad', regime: 'clt', gross_salary: -100 }),
      ).expect(400);
    });

    describe('PATCH /employees/:id', () => {
      it('updates the employee and returns it', async () => {
        const response = await auth(
          request(app.getHttpServer())
            .patch(`/employees/${createdId}`)
            .send({ gross_salary: 6000, active: false }),
        ).expect(200);

        expect(Number(response.body.gross_salary)).toBe(6000);
        expect(response.body.active).toBe(false);
      });

      it('returns 404 when employee does not exist', () => {
        return auth(
          request(app.getHttpServer())
            .patch('/employees/00000000-0000-0000-0000-000000000000')
            .send({ gross_salary: 1000 }),
        ).expect(404);
      });
    });

    describe('DELETE /employees/:id', () => {
      it('deletes the employee and returns 204', () => {
        return auth(
          request(app.getHttpServer()).delete(`/employees/${createdId}`),
        ).expect(204);
      });

      it('returns 404 when employee does not exist', () => {
        return auth(
          request(app.getHttpServer()).delete('/employees/00000000-0000-0000-0000-000000000000'),
        ).expect(404);
      });
    });
  });
});

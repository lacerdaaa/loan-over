import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { User } from './../src/user/user.entity';

const PRO_REQUIRED_MESSAGE = 'Recurso disponível no plano Pro';

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;

  const auth = (req: request.Test): request.Test => req.set('Authorization', `Bearer ${token}`);
  const loadUser = (): Promise<User | null> =>
    dataSource.getRepository(User).findOne({ where: { id: userId } });

  beforeAll(async () => {
    delete process.env.FEATURE_BILLING;
    delete process.env.RESEND_API_KEY;
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
        google_id: `notification-e2e-${Date.now()}`,
        email: 'notification-e2e@example.com',
        name: 'Notification User',
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

  describe('GET /notifications/preferences', () => {
    it('returns alerts on and monthly report off for a new user', async () => {
      const response = await auth(
        request(app.getHttpServer()).get('/notifications/preferences'),
      ).expect(200);

      expect(response.body).toEqual({ email_notifications: true, monthly_report: false });
    });
  });

  describe('PATCH /notifications/preferences', () => {
    afterEach(() => {
      delete process.env.FEATURE_BILLING;
    });

    it('updates only the sent preference', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .patch('/notifications/preferences')
          .send({ email_notifications: false }),
      ).expect(200);

      expect(response.body).toEqual({ email_notifications: false, monthly_report: false });
    });

    it('rejects non-boolean values', () => {
      return auth(
        request(app.getHttpServer())
          .patch('/notifications/preferences')
          .send({ monthly_report: 'yes' }),
      ).expect(400);
    });

    it('enables the monthly report when billing is not enforced', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .patch('/notifications/preferences')
          .send({ monthly_report: true }),
      ).expect(200);

      expect(response.body.monthly_report).toBe(true);
    });

    it('answers 403 with the Pro message when billing is enforced and the user is not Pro', async () => {
      process.env.FEATURE_BILLING = 'true';

      const response = await auth(
        request(app.getHttpServer())
          .patch('/notifications/preferences')
          .send({ monthly_report: true }),
      ).expect(403);

      expect(response.body.message).toBe(PRO_REQUIRED_MESSAGE);
    });

    it('still allows turning the monthly report off without Pro', async () => {
      process.env.FEATURE_BILLING = 'true';

      const response = await auth(
        request(app.getHttpServer())
          .patch('/notifications/preferences')
          .send({ monthly_report: false }),
      ).expect(200);

      expect(response.body.monthly_report).toBe(false);
      expect((await loadUser())?.monthly_report).toBe(false);
    });
  });
});

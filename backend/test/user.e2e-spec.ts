import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { User } from './../src/user/user.entity';

describe('UserController + auth/me (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;
  const email = 'user-e2e@company.com';

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
        google_id: `user-e2e-${Date.now()}`,
        email,
        name: 'Account User',
        avatar: '',
      }),
    );
    userId = saved.id;
    token = app.get(JwtService).sign({ sub: userId, email, name: 'Account User', avatar: '' });
  });

  afterAll(async () => {
    await dataSource.getRepository(User).delete({ id: userId });
    await app.close();
  });

  describe('PATCH /users/me', () => {
    it('sets the account type to business', async () => {
      const response = await auth(
        request(app.getHttpServer()).patch('/users/me').send({ account_type: 'business' }),
      ).expect(200);

      expect(response.body.account_type).toBe('business');
    });

    it('rejects an account type outside the allowed set', () => {
      return auth(
        request(app.getHttpServer()).patch('/users/me').send({ account_type: 'enterprise' }),
      ).expect(400);
    });
  });

  describe('GET /auth/me', () => {
    it('returns the persisted account_type and omits google_id', async () => {
      await auth(
        request(app.getHttpServer()).patch('/users/me').send({ account_type: 'personal' }),
      ).expect(200);

      const response = await auth(request(app.getHttpServer()).get('/auth/me')).expect(200);

      expect(response.body.account_type).toBe('personal');
      expect(response.body.email).toBe(email);
      expect(response.body).not.toHaveProperty('google_id');
    });
  });
});

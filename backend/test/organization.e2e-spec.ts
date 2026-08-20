import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Organization } from './../src/organization/organization.entity';
import { User } from './../src/user/user.entity';

describe('OrganizationController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;
  const email = 'org-e2e@company.com';

  const auth = (req: request.Test): request.Test => req.set('Authorization', `Bearer ${token}`);

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
    const users = dataSource.getRepository(User);
    const saved = await users.save(
      users.create({ google_id: `org-e2e-${Date.now()}`, email, name: 'Org Owner', avatar: '' }),
    );
    userId = saved.id;
    token = app.get(JwtService).sign({ sub: userId, email, name: 'Org Owner', avatar: '' });
  });

  afterAll(async () => {
    await dataSource.getRepository(Organization).delete({ user: { id: userId } });
    await dataSource.getRepository(User).delete({ id: userId });
    await app.close();
  });

  describe('GET /organization', () => {
    it('returns null before any organization is created', () => {
      return auth(request(app.getHttpServer()).get('/organization')).expect(200).expect('');
    });
  });

  describe('POST /organization', () => {
    it('creates the organization and returns it', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/organization')
          .send({ name: 'Acme Ltda', cnpj: '12.345.678/0001-90', cash_balance: 80000 }),
      ).expect(201);

      expect(response.body.name).toBe('Acme Ltda');
      expect(response.body.cnpj).toBe('12.345.678/0001-90');
      expect(Number(response.body.cash_balance)).toBe(80000);
    });

    it('updates the same organization on a second POST', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/organization')
          .send({ name: 'Acme Renamed', cash_balance: 95000 }),
      ).expect(201);

      expect(response.body.name).toBe('Acme Renamed');

      const listed = await auth(request(app.getHttpServer()).get('/organization')).expect(200);
      expect(listed.body.name).toBe('Acme Renamed');
    });

    it('rejects a negative cash_balance', () => {
      return auth(
        request(app.getHttpServer())
          .post('/organization')
          .send({ name: 'Bad Co', cash_balance: -1 }),
      ).expect(400);
    });

    it('rejects a missing name', () => {
      return auth(
        request(app.getHttpServer()).post('/organization').send({ cash_balance: 1000 }),
      ).expect(400);
    });
  });
});

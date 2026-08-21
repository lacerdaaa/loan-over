import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';
import { BankTransaction } from './../src/bank-transaction/bank-transaction.entity';
import { User } from './../src/user/user.entity';

describe('BankTransactions (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let userId: string;
  let token: string;
  const email = 'bank-tx-e2e@company.com';

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
        google_id: `bank-tx-${Date.now()}`,
        email,
        name: 'Bank Tester',
        avatar: '',
      }),
    );
    userId = saved.id;
    token = app.get(JwtService).sign({ sub: userId, email, name: 'Bank Tester', avatar: '' });
  });

  afterAll(async () => {
    await dataSource.getRepository(BankTransaction).delete({ user: { id: userId } });
    await dataSource.getRepository(User).delete({ id: userId });
    await app.close();
  });

  describe('GET /bank-transactions', () => {
    it('returns an empty list when no transactions exist for the month', async () => {
      const response = await auth(
        request(app.getHttpServer()).get('/bank-transactions').query({ month: 1, year: 2020 }),
      ).expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('POST /bank-transactions/import', () => {
    it('imports a batch of transactions and returns { imported, skipped }', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/bank-transactions/import')
          .send({
            transactions: [
              { date: '2026-06-10', description: 'Receita contrato', amount: 5000 },
              { date: '2026-06-15', description: 'Aluguel escritório', amount: -2000 },
            ],
          }),
      ).expect(201);

      expect(response.body.imported).toBe(2);
      expect(response.body.skipped).toBe(0);
    });

    it('reimporting the same batch increments skipped and not imported', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/bank-transactions/import')
          .send({
            transactions: [
              { date: '2026-06-10', description: 'Receita contrato', amount: 5000 },
              { date: '2026-06-15', description: 'Aluguel escritório', amount: -2000 },
            ],
          }),
      ).expect(201);

      expect(response.body.imported).toBe(0);
      expect(response.body.skipped).toBe(2);
    });

    it('deduplicates within the same batch', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/bank-transactions/import')
          .send({
            transactions: [
              { date: '2026-07-01', description: 'Duplicate entry', amount: 100 },
              { date: '2026-07-01', description: 'Duplicate entry', amount: 100 },
            ],
          }),
      ).expect(201);

      expect(response.body.imported).toBe(1);
      expect(response.body.skipped).toBe(1);
    });

    it('returns 400 when transactions array exceeds 500 items', async () => {
      const transactions = Array.from({ length: 501 }, (_, i) => ({
        date: '2026-06-01',
        description: `Entry ${i}`,
        amount: i + 1,
      }));

      await auth(
        request(app.getHttpServer()).post('/bank-transactions/import').send({ transactions }),
      ).expect(400);
    });
  });

  describe('PATCH /bank-transactions/:id', () => {
    let txId: string;

    beforeAll(async () => {
      const response = await auth(
        request(app.getHttpServer())
          .post('/bank-transactions/import')
          .send({
            transactions: [
              { date: '2026-08-05', description: 'To be matched', amount: 800 },
            ],
          }),
      ).expect(201);

      expect(response.body.imported).toBe(1);

      const list = await auth(
        request(app.getHttpServer())
          .get('/bank-transactions')
          .query({ month: 8, year: 2026 }),
      ).expect(200);

      txId = (list.body as BankTransaction[])[0]!.id;
    });

    it('sets matched_kind and matched_id on the transaction', async () => {
      const matchedId = 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d';
      const response = await auth(
        request(app.getHttpServer())
          .patch(`/bank-transactions/${txId}`)
          .send({ matched_kind: 'income', matched_id: matchedId }),
      ).expect(200);

      expect(response.body.matched_kind).toBe('income');
      expect(response.body.matched_id).toBe(matchedId);
    });

    it('forces matched_id to null when matched_kind is ignored', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .patch(`/bank-transactions/${txId}`)
          .send({ matched_kind: 'ignored', matched_id: 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d' }),
      ).expect(200);

      expect(response.body.matched_kind).toBe('ignored');
      expect(response.body.matched_id).toBeNull();
    });

    it('unmatches the transaction when matched_kind is null', async () => {
      const response = await auth(
        request(app.getHttpServer())
          .patch(`/bank-transactions/${txId}`)
          .send({ matched_kind: null }),
      ).expect(200);

      expect(response.body.matched_kind).toBeNull();
      expect(response.body.matched_id).toBeNull();
    });

    it('returns 404 for a transaction that does not belong to the user', async () => {
      await auth(
        request(app.getHttpServer())
          .patch('/bank-transactions/f47ac10b-58cc-4372-a567-0e02b2c3d479')
          .send({ matched_kind: 'income' }),
      ).expect(404);
    });
  });

  describe('DELETE /bank-transactions/:id', () => {
    it('deletes the transaction and returns 204', async () => {
      const importRes = await auth(
        request(app.getHttpServer())
          .post('/bank-transactions/import')
          .send({
            transactions: [{ date: '2026-09-01', description: 'To delete', amount: 300 }],
          }),
      ).expect(201);
      expect(importRes.body.imported).toBe(1);

      const list = await auth(
        request(app.getHttpServer())
          .get('/bank-transactions')
          .query({ month: 9, year: 2026 }),
      ).expect(200);

      const id = (list.body as BankTransaction[])[0]!.id;

      await auth(
        request(app.getHttpServer()).delete(`/bank-transactions/${id}`),
      ).expect(204);
    });

    it('returns 404 when deleting a non-existent transaction', async () => {
      await auth(
        request(app.getHttpServer()).delete('/bank-transactions/f47ac10b-58cc-4372-a567-0e02b2c3d479'),
      ).expect(404);
    });
  });
});

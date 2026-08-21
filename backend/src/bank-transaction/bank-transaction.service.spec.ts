import { createHash } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankTransaction } from './bank-transaction.entity';
import { BankTransactionService } from './bank-transaction.service';

const USER_ID = 'user-uuid';

function makeHash(userId: string, date: string, amount: number, description: string): string {
  return createHash('sha256').update(`${userId}|${date}|${amount}|${description}`).digest('hex');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: Partial<BankTransaction>) => data as BankTransaction),
  save: jest.fn() as jest.MockedFunction<AnyFn>,
  delete: jest.fn(),
});

const makeTx = (overrides: Partial<BankTransaction> = {}): BankTransaction =>
  ({
    id: 'tx-1',
    date: '2026-06-15',
    description: 'Pagamento cliente',
    amount: 1500,
    month: 6,
    year: 2026,
    matched_kind: null,
    matched_id: null,
    import_hash: 'abc123',
    ...overrides,
  }) as unknown as BankTransaction;

describe('BankTransactionService', () => {
  let service: BankTransactionService;
  let repo: jest.Mocked<Repository<BankTransaction>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankTransactionService,
        { provide: getRepositoryToken(BankTransaction), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(BankTransactionService);
    repo = module.get(getRepositoryToken(BankTransaction));
  });

  describe('findForMonth', () => {
    it('returns transactions for the given user, month and year ordered by date', async () => {
      const txs = [makeTx(), makeTx({ id: 'tx-2' })];
      repo.find.mockResolvedValue(txs);

      const result = await service.findForMonth(USER_ID, 6, 2026);

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: USER_ID }, month: 6, year: 2026 },
        order: { date: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('import', () => {
    it('inserts new transactions and returns { imported, skipped }', async () => {
      repo.find.mockResolvedValue([]);
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entities) => entities);

      const dto = {
        transactions: [
          { date: '2026-06-15', description: 'Pagamento cliente', amount: 1500 },
          { date: '2026-06-20', description: 'Aluguel', amount: -2000 },
        ],
      };

      const result = await service.import(USER_ID, dto);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('skips a transaction when its import_hash already exists for the user', async () => {
      const hash = makeHash(USER_ID, '2026-06-15', 1500, 'Pagamento cliente');
      repo.find.mockResolvedValue([{ import_hash: hash } as BankTransaction]);
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entities) => entities);

      const dto = {
        transactions: [
          { date: '2026-06-15', description: 'Pagamento cliente', amount: 1500 },
        ],
      };

      const result = await service.import(USER_ID, dto);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('deduplicates transactions within the same batch', async () => {
      repo.find.mockResolvedValue([]);
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entities) => entities);

      const dto = {
        transactions: [
          { date: '2026-06-15', description: 'Pagamento cliente', amount: 1500 },
          { date: '2026-06-15', description: 'Pagamento cliente', amount: 1500 },
        ],
      };

      const result = await service.import(USER_ID, dto);

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('derives month and year from the date field, not from the client', async () => {
      repo.find.mockResolvedValue([]);
      let savedEntities: BankTransaction[] = [];
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entities) => {
        savedEntities = entities as BankTransaction[];
        return entities;
      });

      const dto = {
        transactions: [{ date: '2026-11-03', description: 'Receita', amount: 800 }],
      };

      await service.import(USER_ID, dto);

      expect(savedEntities[0]?.month).toBe(11);
      expect(savedEntities[0]?.year).toBe(2026);
    });

    it('does not throw on duplicate — counts it as skipped', async () => {
      const hash = makeHash(USER_ID, '2026-06-15', 1500, 'Pagamento cliente');
      repo.find.mockResolvedValue([{ import_hash: hash } as BankTransaction]);
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entities) => entities);

      const dto = {
        transactions: [{ date: '2026-06-15', description: 'Pagamento cliente', amount: 1500 }],
      };

      await expect(service.import(USER_ID, dto)).resolves.toMatchObject({
        imported: 0,
        skipped: 1,
      });
    });
  });

  describe('updateMatch', () => {
    it('sets matched_kind and matched_id on the transaction', async () => {
      const tx = makeTx();
      const updated = makeTx({ matched_kind: 'income', matched_id: 'income-uuid' });
      repo.findOne.mockResolvedValue(tx);
      repo.save.mockResolvedValue(updated);

      const result = await service.updateMatch(USER_ID, 'tx-1', {
        matched_kind: 'income',
        matched_id: 'income-uuid',
      });

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'tx-1', user: { id: USER_ID } },
      });
      expect(result.matched_kind).toBe('income');
      expect(result.matched_id).toBe('income-uuid');
    });

    it('forces matched_id to null when matched_kind is ignored', async () => {
      const tx = makeTx({ matched_kind: 'income', matched_id: 'some-uuid' });
      repo.findOne.mockResolvedValue(tx);
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entity) => entity);

      await service.updateMatch(USER_ID, 'tx-1', {
        matched_kind: 'ignored',
        matched_id: 'some-uuid',
      });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ matched_kind: 'ignored', matched_id: null }),
      );
    });

    it('forces matched_id to null when matched_kind is payroll', async () => {
      const tx = makeTx({ matched_kind: 'income', matched_id: 'some-uuid' });
      repo.findOne.mockResolvedValue(tx);
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entity) => entity);

      await service.updateMatch(USER_ID, 'tx-1', {
        matched_kind: 'payroll',
        matched_id: 'some-uuid',
      });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ matched_kind: 'payroll', matched_id: null }),
      );
    });

    it('zeros both matched_kind and matched_id when matched_kind is null (unmatch)', async () => {
      const tx = makeTx({ matched_kind: 'income', matched_id: 'income-uuid' });
      repo.findOne.mockResolvedValue(tx);
      (repo.save as jest.MockedFunction<AnyFn>).mockImplementation(async (entity) => entity);

      await service.updateMatch(USER_ID, 'tx-1', { matched_kind: null });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ matched_kind: null, matched_id: null }),
      );
    });

    it('throws NotFoundException when transaction does not belong to the user', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMatch(USER_ID, 'ghost', { matched_kind: 'income' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('includes the id in the NotFoundException message', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMatch(USER_ID, 'ghost-id', { matched_kind: 'income' }),
      ).rejects.toThrow('ghost-id');
    });
  });

  describe('remove', () => {
    it('deletes the transaction when it exists', async () => {
      repo.findOne.mockResolvedValue(makeTx());
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(USER_ID, 'tx-1');

      expect(repo.delete).toHaveBeenCalledWith('tx-1');
    });

    it('throws NotFoundException when transaction does not belong to the user', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('includes the id in the NotFoundException message', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'ghost-id')).rejects.toThrow('ghost-id');
    });
  });
});

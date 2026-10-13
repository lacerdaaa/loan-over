import { User } from '../user/user.entity';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { OccasionalExpense } from './occasional-expense.entity';
import { OccasionalExpenseService } from './occasional-expense.service';

const USER_ID = 'user-uuid';

const mockRepository = (): Record<
  'find' | 'findOne' | 'create' | 'save' | 'delete',
  jest.Mock
> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makeExpense = (overrides: Partial<OccasionalExpense> = {}): OccasionalExpense => ({
  id: 'uuid-1',
  user: { id: USER_ID } as User,
  description: 'Car repair',
  amount: 800,
  month: 6,
  year: 2026,
  from_benefit: false,
  ...overrides,
});

describe('OccasionalExpenseService', () => {
  let service: OccasionalExpenseService;
  let repo: jest.Mocked<Repository<OccasionalExpense>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccasionalExpenseService,
        { provide: getRepositoryToken(OccasionalExpense), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(OccasionalExpenseService);
    repo = module.get(getRepositoryToken(OccasionalExpense));
  });

  describe('findForMonth', () => {
    it('returns expenses matching the given month and year', async () => {
      const expense = makeExpense({ month: 6, year: 2026 });
      repo.find.mockResolvedValue([expense]);

      const result = await service.findForMonth(USER_ID, 6, 2026);

      expect(result).toContainEqual(expense);
    });
  });

  describe('create', () => {
    it('saves a new occasional expense and returns it', async () => {
      const dto = { description: 'Car repair', amount: 800, month: 6, year: 2026 };
      const saved = makeExpense();

      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(USER_ID, dto);

      expect(result.description).toBe('Car repair');
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the row scoped to the id and the owning user', async () => {
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove('uuid-1', USER_ID)).resolves.toBeUndefined();

      expect(repo.delete).toHaveBeenCalledWith({ id: 'uuid-1', user: { id: USER_ID } });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      repo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove('ghost', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

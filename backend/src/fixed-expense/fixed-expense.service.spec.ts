import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { FixedExpense } from './fixed-expense.entity';
import { FixedExpenseService } from './fixed-expense.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makeExpense = (overrides: Partial<FixedExpense> = {}): FixedExpense => ({
  id: 'uuid-1',
  name: 'Rent',
  amount: 1200,
  due_day: 5,
  active: true,
  ...overrides,
});

describe('FixedExpenseService', () => {
  let service: FixedExpenseService;
  let repo: jest.Mocked<Repository<FixedExpense>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixedExpenseService,
        { provide: getRepositoryToken(FixedExpense), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(FixedExpenseService);
    repo = module.get(getRepositoryToken(FixedExpense));
  });

  describe('findActive', () => {
    it('returns only active expenses', async () => {
      const active = makeExpense({ active: true });
      const inactive = makeExpense({ id: 'uuid-2', active: false });
      repo.find.mockResolvedValue([active, inactive]);

      const result = await service.findAll();

      expect(result).toContainEqual(active);
      expect(result).toContainEqual(inactive);
    });
  });

  describe('update', () => {
    it('toggles active status', async () => {
      const expense = makeExpense({ active: true });
      const updated = { ...expense, active: false };

      repo.findOneBy.mockResolvedValue(expense);
      repo.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { active: false });

      expect(result.active).toBe(false);
    });

    it('throws NotFoundException when expense does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('ghost', { active: false })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when expense does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { IncomeType } from '../shared/types';
import { CreateIncomeDto } from './dto/create-income.dto';
import { Income } from './income.entity';
import { IncomeService } from './income.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('IncomeService', () => {
  let service: IncomeService;
  let repo: jest.Mocked<Repository<Income>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        { provide: getRepositoryToken(Income), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(IncomeService);
    repo = module.get(getRepositoryToken(Income));
  });

  describe('findForMonth', () => {
    it('returns fixed incomes regardless of month/year', async () => {
      const fixed: Income = { id: '1', type: IncomeType.FIXED, amount: 5000, month: null, year: null, description: 'Salary' };
      repo.find.mockResolvedValue([fixed]);

      const result = await service.findForMonth(6, 2026);

      expect(result).toContainEqual(fixed);
    });

    it('returns variable incomes only when month and year match', async () => {
      const variable: Income = { id: '2', type: IncomeType.VARIABLE, amount: 1000, month: 6, year: 2026, description: 'Freelance' };
      repo.find.mockResolvedValue([variable]);

      const result = await service.findForMonth(6, 2026);

      expect(result).toContainEqual(variable);
    });
  });

  describe('create', () => {
    it('saves a new income and returns it', async () => {
      const dto: CreateIncomeDto = { type: IncomeType.FIXED, amount: 3000, description: 'Wage' };
      const saved: Income = { id: 'uuid-1', ...dto, month: null, year: null };

      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(result).toEqual(saved);
      expect(repo.save).toHaveBeenCalledWith(saved);
    });
  });

  describe('remove', () => {
    it('deletes an existing income', async () => {
      repo.findOneBy.mockResolvedValue({ id: '1' } as Income);
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove('1')).resolves.not.toThrow();
      expect(repo.delete).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundException when income does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});

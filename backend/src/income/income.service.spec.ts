import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { IncomeCategory, IncomeType } from '../shared/types';
import { CreateIncomeDto } from './dto/create-income.dto';
import { IncomeDeduction } from './income-deduction.entity';
import { Income } from './income.entity';
import { IncomeService } from './income.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makeIncome = (overrides: Partial<Income> = {}): Income => ({
  id: '1',
  type: IncomeType.FIXED,
  category: IncomeCategory.SALARY,
  amount: 6000,
  month: null,
  year: null,
  description: 'Salary',
  deductions: [],
  ...overrides,
});

const makeDeduction = (amount: number, label = 'INSS'): IncomeDeduction =>
  ({ id: 'd1', label, amount } as IncomeDeduction);

describe('IncomeService', () => {
  let service: IncomeService;
  let repo: jest.Mocked<Repository<Income>>;
  let deductionRepo: jest.Mocked<Repository<IncomeDeduction>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeService,
        { provide: getRepositoryToken(Income), useFactory: mockRepository },
        { provide: getRepositoryToken(IncomeDeduction), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(IncomeService);
    repo = module.get(getRepositoryToken(Income));
    deductionRepo = module.get(getRepositoryToken(IncomeDeduction));
  });

  describe('findForMonth', () => {
    it('returns fixed incomes regardless of month/year', async () => {
      const fixed = makeIncome({ type: IncomeType.FIXED });
      repo.find.mockResolvedValue([fixed]);

      const result = await service.findForMonth(6, 2026);

      expect(result).toContainEqual(fixed);
    });

    it('returns variable incomes only when month and year match', async () => {
      const variable = makeIncome({ type: IncomeType.VARIABLE, month: 6, year: 2026 });
      repo.find.mockResolvedValue([variable]);

      const result = await service.findForMonth(6, 2026);

      expect(result).toContainEqual(variable);
    });
  });

  describe('netAmount', () => {
    it('returns gross amount when there are no deductions', () => {
      const income = makeIncome({ amount: 6000, deductions: [] });
      expect(service.netAmount(income)).toBe(6000);
    });

    it('subtracts all deductions from gross amount', () => {
      const income = makeIncome({
        amount: 6000,
        deductions: [makeDeduction(660, 'INSS'), makeDeduction(420, 'IRRF'), makeDeduction(200, 'Health')],
      });
      expect(service.netAmount(income)).toBe(4720);
    });
  });

  describe('create', () => {
    it('saves a new income with category and returns it', async () => {
      const dto: CreateIncomeDto = { type: IncomeType.FIXED, category: IncomeCategory.SALARY, amount: 6000, description: 'Salary' };
      const saved = makeIncome();

      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(result.category).toBe(IncomeCategory.SALARY);
      expect(repo.save).toHaveBeenCalledWith(saved);
    });
  });

  describe('addDeduction', () => {
    it('saves a deduction linked to the income', async () => {
      const income = makeIncome();
      const deduction = makeDeduction(660);

      repo.findOne.mockResolvedValue(income);
      deductionRepo.create.mockReturnValue(deduction);
      deductionRepo.save.mockResolvedValue(deduction);

      const result = await service.addDeduction('1', { label: 'INSS', amount: 660 });

      expect(result.label).toBe('INSS');
      expect(deductionRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when income does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.addDeduction('ghost', { label: 'INSS', amount: 660 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeDeduction', () => {
    it('deletes a deduction by id', async () => {
      deductionRepo.findOneBy.mockResolvedValue(makeDeduction(660));
      deductionRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.removeDeduction('d1')).resolves.not.toThrow();
      expect(deductionRepo.delete).toHaveBeenCalledWith('d1');
    });

    it('throws NotFoundException when deduction does not exist', async () => {
      deductionRepo.findOneBy.mockResolvedValue(null);

      await expect(service.removeDeduction('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when income does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});

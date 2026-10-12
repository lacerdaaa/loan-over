import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { IncomeCategory, IncomeType } from '../shared/types';
import { CreateIncomeDto } from './dto/create-income.dto';
import { IncomeDeduction } from './income-deduction.entity';
import { Income } from './income.entity';
import { IncomeService } from './income.service';

const USER_ID = 'user-uuid';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
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
  ({ id: 'd1', label, amount }) as IncomeDeduction;

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

      const result = await service.findForMonth(USER_ID, 6, 2026);

      expect(result).toContainEqual(fixed);
    });

    it('returns variable incomes only when month and year match', async () => {
      const variable = makeIncome({ type: IncomeType.VARIABLE, month: 6, year: 2026 });
      repo.find.mockResolvedValue([variable]);

      const result = await service.findForMonth(USER_ID, 6, 2026);

      expect(result).toContainEqual(variable);
    });
  });

  describe('create', () => {
    it('saves a new income with category and returns it', async () => {
      const dto: CreateIncomeDto = {
        type: IncomeType.FIXED,
        category: IncomeCategory.SALARY,
        amount: 6000,
        description: 'Salary',
      };
      const saved = makeIncome();

      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(USER_ID, dto);

      expect(result.category).toBe(IncomeCategory.SALARY);
      expect(repo.save).toHaveBeenCalledWith(saved);
    });

    it('persists the deductions given in the dto', async () => {
      const dto: CreateIncomeDto = {
        type: IncomeType.FIXED,
        category: IncomeCategory.SALARY,
        amount: 6000,
        description: 'Salary',
        deductions: [{ label: 'INSS', amount: 660 }],
      };
      repo.create.mockImplementation((entity) => entity as Income);
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Income));

      await service.create(USER_ID, dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ deductions: [{ label: 'INSS', amount: 660 }] }),
      );
    });
  });

  describe('addDeduction', () => {
    it('saves a deduction linked to the income', async () => {
      const income = makeIncome();
      const deduction = makeDeduction(660);

      repo.findOne.mockResolvedValue(income);
      deductionRepo.create.mockReturnValue(deduction);
      deductionRepo.save.mockResolvedValue(deduction);

      const result = await service.addDeduction(USER_ID, '1', { label: 'INSS', amount: 660 });

      expect(result.label).toBe('INSS');
      expect(deductionRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when income does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.addDeduction(USER_ID, 'ghost', { label: 'INSS', amount: 660 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeDeduction', () => {
    it('deletes a deduction that belongs to the income owned by the user', async () => {
      deductionRepo.findOne.mockResolvedValue(makeDeduction(660));
      deductionRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.removeDeduction('d1', '1', USER_ID)).resolves.not.toThrow();

      expect(deductionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'd1', income: { id: '1', user: { id: USER_ID } } },
      });
      expect(deductionRepo.delete).toHaveBeenCalledWith('d1');
    });

    it('throws NotFoundException when the deduction is not in the user income', async () => {
      deductionRepo.findOne.mockResolvedValue(null);

      await expect(service.removeDeduction('d1', '1', 'other-user')).rejects.toThrow(
        NotFoundException,
      );
      expect(deductionRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when income does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('ghost', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Debt } from './debt.entity';
import { DebtService } from './debt.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

const USER_ID = 'user-uuid';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const makeDebt = (overrides: Partial<Debt> = {}): Debt => ({
  id: 'uuid-1',
  name: 'Car loan',
  installment_amount: 500,
  total_installments: 12,
  paid_installments: 0,
  start_date: new Date('2026-01-01'),
  closed: false,
  ...overrides,
});

describe('DebtService', () => {
  let service: DebtService;
  let repo: jest.Mocked<Repository<Debt>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DebtService, { provide: getRepositoryToken(Debt), useFactory: mockRepository }],
    }).compile();

    service = module.get(DebtService);
    repo = module.get(getRepositoryToken(Debt));
  });

  describe('create', () => {
    it('creates a debt with closed=false by default', async () => {
      const dto: CreateDebtDto = {
        name: 'Laptop',
        installment_amount: 200,
        total_installments: 10,
        start_date: '2026-01-01',
      };
      const saved = makeDebt({ name: 'Laptop', installment_amount: 200, total_installments: 10 });

      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(USER_ID, dto);

      expect(result.closed).toBe(false);
      expect(result.paid_installments).toBe(0);
    });
  });

  describe('create with Price table', () => {
    const baseDto: CreateDebtDto = {
      name: 'Loan',
      total_installments: 12,
      start_date: '2026-01-01',
    };

    beforeEach(() => {
      repo.create.mockImplementation((entity) => entity as Debt);
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Debt));
    });

    it('computes the PMT from principal and monthly rate', async () => {
      const result = await service.create(USER_ID, {
        ...baseDto,
        principal: 1000,
        monthly_rate: 0.01,
      });

      expect(result.installment_amount).toBeCloseTo(88.85, 2);
    });

    it('divides the principal evenly when the monthly rate is zero', async () => {
      const result = await service.create(USER_ID, {
        ...baseDto,
        principal: 1200,
        monthly_rate: 0,
      });

      expect(result.installment_amount).toBe(100);
    });

    it('closes the debt when it is created already fully paid', async () => {
      const result = await service.create(USER_ID, {
        ...baseDto,
        installment_amount: 100,
        paid_installments: 12,
      });

      expect(result.closed).toBe(true);
    });
  });

  describe('update', () => {
    const priceDebt = (): Debt =>
      makeDebt({
        principal: '1200' as unknown as number,
        monthly_rate: '0.0000' as unknown as number,
        installment_amount: 100,
      });
    const patch = async (debt: Debt, dto: UpdateDebtDto): Promise<Debt> => {
      repo.findOne.mockResolvedValue(debt);
      repo.save.mockImplementation((entity) => Promise.resolve(entity as Debt));
      return service.update('uuid-1', USER_ID, dto);
    };

    it('recomputes the installment using a stored zero rate when the term changes', async () => {
      const result = await patch(priceDebt(), { total_installments: 24 });

      expect(result.installment_amount).toBe(50);
    });

    it('keeps the installment when only unrelated fields change', async () => {
      const result = await patch(priceDebt(), { name: 'Renamed' });

      expect(result.installment_amount).toBe(100);
      expect(result.name).toBe('Renamed');
    });

    it('applies a bare installment_amount patch on a debt without Price data', async () => {
      const result = await patch(makeDebt(), { installment_amount: 650 });

      expect(result.installment_amount).toBe(650);
    });

    it('closes the debt when paid installments reach the total', async () => {
      const result = await patch(makeDebt(), { paid_installments: 12 });

      expect(result.closed).toBe(true);
    });

    it('throws NotFoundException when the debt does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('ghost', USER_ID, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('payInstallment', () => {
    it('increments paid_installments by 1', async () => {
      const debt = makeDebt({ paid_installments: 2, total_installments: 12 });
      repo.findOne.mockResolvedValue(debt);
      repo.save.mockResolvedValue({ ...debt, paid_installments: 3 });

      const result = await service.payInstallment('uuid-1', USER_ID);

      expect(result.paid_installments).toBe(3);
    });

    it('sets closed=true when last installment is paid', async () => {
      const debt = makeDebt({ paid_installments: 11, total_installments: 12 });
      repo.findOne.mockResolvedValue(debt);
      repo.save.mockResolvedValue({ ...debt, paid_installments: 12, closed: true });

      const result = await service.payInstallment('uuid-1', USER_ID);

      expect(result.closed).toBe(true);
      expect(result.paid_installments).toBe(12);
    });

    it('throws BadRequestException when debt is already closed', async () => {
      const debt = makeDebt({ paid_installments: 12, total_installments: 12, closed: true });
      repo.findOne.mockResolvedValue(debt);

      await expect(service.payInstallment('uuid-1', USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when debt does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.payInstallment('ghost', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when debt does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('ghost', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

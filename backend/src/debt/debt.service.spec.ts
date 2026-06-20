import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Debt } from './debt.entity';
import { DebtService } from './debt.service';
import { CreateDebtDto } from './dto/create-debt.dto';

const mockRepository = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
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
      providers: [
        DebtService,
        { provide: getRepositoryToken(Debt), useFactory: mockRepository },
      ],
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

      const result = await service.create(dto);

      expect(result.closed).toBe(false);
      expect(result.paid_installments).toBe(0);
    });
  });

  describe('payInstallment', () => {
    it('increments paid_installments by 1', async () => {
      const debt = makeDebt({ paid_installments: 2, total_installments: 12 });
      repo.findOneBy.mockResolvedValue(debt);
      repo.save.mockResolvedValue({ ...debt, paid_installments: 3 });

      const result = await service.payInstallment('uuid-1');

      expect(result.paid_installments).toBe(3);
    });

    it('sets closed=true when last installment is paid', async () => {
      const debt = makeDebt({ paid_installments: 11, total_installments: 12 });
      repo.findOneBy.mockResolvedValue(debt);
      repo.save.mockResolvedValue({ ...debt, paid_installments: 12, closed: true });

      const result = await service.payInstallment('uuid-1');

      expect(result.closed).toBe(true);
      expect(result.paid_installments).toBe(12);
    });

    it('throws BadRequestException when debt is already closed', async () => {
      const debt = makeDebt({ paid_installments: 12, total_installments: 12, closed: true });
      repo.findOneBy.mockResolvedValue(debt);

      await expect(service.payInstallment('uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when debt does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.payInstallment('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when debt does not exist', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});

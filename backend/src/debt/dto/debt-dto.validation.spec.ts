import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDebtDto } from './create-debt.dto';
import { UpdateDebtDto } from './update-debt.dto';

const baseCreate = { name: 'Loan', total_installments: 12, start_date: '2026-01-01' };

const errorsFor = async <T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> => {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((e) => e.property);
};

describe('CreateDebtDto validation', () => {
  describe('when neither installment_amount nor principal+monthly_rate is given', () => {
    it('is rejected', async () => {
      expect(await errorsFor(CreateDebtDto, baseCreate)).toContain('installment_amount');
    });
  });

  describe('when only principal is given without monthly_rate', () => {
    it('is rejected', async () => {
      const errors = await errorsFor(CreateDebtDto, { ...baseCreate, principal: 1000 });
      expect(errors).toContain('installment_amount');
    });
  });

  describe('when installment_amount is given', () => {
    it('is accepted', async () => {
      expect(await errorsFor(CreateDebtDto, { ...baseCreate, installment_amount: 100 })).toEqual(
        [],
      );
    });
  });

  describe('when principal and monthly_rate are given', () => {
    it('is accepted, including a zero rate', async () => {
      const plain = { ...baseCreate, principal: 1000, monthly_rate: 0 };
      expect(await errorsFor(CreateDebtDto, plain)).toEqual([]);
    });
  });

  describe('when paid_installments exceeds total_installments', () => {
    it('is rejected', async () => {
      const plain = { ...baseCreate, installment_amount: 100, paid_installments: 13 };
      expect(await errorsFor(CreateDebtDto, plain)).toContain('paid_installments');
    });

    it('accepts paid_installments equal to total_installments', async () => {
      const plain = { ...baseCreate, installment_amount: 100, paid_installments: 12 };
      expect(await errorsFor(CreateDebtDto, plain)).toEqual([]);
    });
  });
});

describe('UpdateDebtDto validation', () => {
  describe('when paid_installments exceeds total_installments', () => {
    it('is rejected', async () => {
      const plain = { total_installments: 6, paid_installments: 7 };
      expect(await errorsFor(UpdateDebtDto, plain)).toContain('paid_installments');
    });
  });

  describe('when only one of the two counters is sent', () => {
    it('is accepted', async () => {
      expect(await errorsFor(UpdateDebtDto, { paid_installments: 7 })).toEqual([]);
    });
  });
});

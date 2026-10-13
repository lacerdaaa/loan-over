import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SimulateProjectionDto } from './simulate-projection.dto';

const validDebt = { name: 'Notebook', installment_amount: 350, installments: 10, start_offset: 0 };

const errorsFor = async (payload: object): Promise<string[]> => {
  const errors = await validate(plainToInstance(SimulateProjectionDto, payload));
  return errors.map((e) => e.property);
};

describe('SimulateProjectionDto', () => {
  describe('when every field is omitted', () => {
    it('is valid', async () => {
      expect(await errorsFor({})).toEqual([]);
    });
  });

  describe('when the payload follows the contract', () => {
    it('is valid', async () => {
      const payload = {
        horizon: 36,
        hypothetical_debts: [validDebt],
        extra_monthly_income: 100.5,
        extra_monthly_expense: 0,
      };

      expect(await errorsFor(payload)).toEqual([]);
    });
  });

  describe('when there are more than 10 hypothetical debts', () => {
    it('is rejected', async () => {
      const debts = Array.from({ length: 11 }, () => validDebt);

      expect(await errorsFor({ hypothetical_debts: debts })).toEqual(['hypothetical_debts']);
    });
  });

  describe.each([
    ['a non-positive installment amount', { installment_amount: 0 }],
    ['an installment amount with 3 decimals', { installment_amount: 10.123 }],
    ['zero installments', { installments: 0 }],
    ['more than 360 installments', { installments: 361 }],
    ['a fractional installment count', { installments: 2.5 }],
    ['a negative start offset', { start_offset: -1 }],
    ['an empty name', { name: '' }],
  ])('when a hypothetical debt has %s', (_label, override) => {
    it('is rejected', async () => {
      const errors = await errorsFor({ hypothetical_debts: [{ ...validDebt, ...override }] });

      expect(errors).toEqual(['hypothetical_debts']);
    });
  });

  describe('when start_offset reaches the horizon', () => {
    it('is rejected against the explicit horizon', async () => {
      const errors = await errorsFor({
        horizon: 12,
        hypothetical_debts: [{ ...validDebt, start_offset: 12 }],
      });

      expect(errors).toEqual(['hypothetical_debts']);
    });

    it('is rejected against the default horizon of 24', async () => {
      const errors = await errorsFor({ hypothetical_debts: [{ ...validDebt, start_offset: 24 }] });

      expect(errors).toEqual(['hypothetical_debts']);
    });

    it('is accepted one month before the horizon', async () => {
      const errors = await errorsFor({
        horizon: 12,
        hypothetical_debts: [{ ...validDebt, start_offset: 11 }],
      });

      expect(errors).toEqual([]);
    });
  });

  describe.each([
    ['horizon below 1', { horizon: 0 }],
    ['horizon above 60', { horizon: 61 }],
    ['negative extra income', { extra_monthly_income: -1 }],
    ['negative extra expense', { extra_monthly_expense: -1 }],
  ])('when the payload has %s', (_label, payload) => {
    it('is rejected', async () => {
      expect(await errorsFor(payload)).toHaveLength(1);
    });
  });
});

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertGoalDto } from './upsert-goal.dto';

const baseGoal = { target_amount: 10000, deadline_month: 12, deadline_year: 2027 };

const errorsFor = async (plain: Record<string, unknown>): Promise<string[]> => {
  const errors = await validate(plainToInstance(UpsertGoalDto, plain));
  return errors.map((e) => e.property);
};

describe('UpsertGoalDto validation', () => {
  describe('saved_amount', () => {
    it('is optional', async () => {
      expect(await errorsFor(baseGoal)).toEqual([]);
    });

    it('accepts zero and values with two decimals', async () => {
      expect(await errorsFor({ ...baseGoal, saved_amount: 0 })).toEqual([]);
      expect(await errorsFor({ ...baseGoal, saved_amount: 1500.55 })).toEqual([]);
    });

    it('rejects negative values', async () => {
      expect(await errorsFor({ ...baseGoal, saved_amount: -1 })).toContain('saved_amount');
    });

    it('rejects more than two decimal places', async () => {
      expect(await errorsFor({ ...baseGoal, saved_amount: 10.123 })).toContain('saved_amount');
    });
  });
});

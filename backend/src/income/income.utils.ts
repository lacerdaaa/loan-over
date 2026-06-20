import { Income } from './income.entity';

export const netAmount = (income: Income): number =>
  Number(income.amount) -
  (income.deductions ?? []).reduce((sum, d) => sum + Number(d.amount), 0);

export enum IncomeType {
  FIXED = 'fixed',
  VARIABLE = 'variable',
}

export enum IncomeCategory {
  SALARY = 'salary',
  RENT = 'rent',
  OTHER = 'other',
}

export type ProjectionEventType = 'liberation' | 'alert';

export interface ProjectionEvent {
  type: ProjectionEventType;
  description: string;
  amount: number;
}

export interface ProjectedMonth {
  month: number;
  year: number;
  free_balance: number;
  events: ProjectionEvent[];
  active_debts: number;
  total_outflow: number;
}

export interface MonthlySnapshot {
  month: number;
  year: number;
  total_income: number;
  total_debts: number;
  total_fixed: number;
  free_balance: number;
}

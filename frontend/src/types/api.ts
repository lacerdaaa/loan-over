export type IncomeType = 'fixed' | 'variable';

export interface Income {
  id: string;
  type: IncomeType;
  amount: number;
  month: number | null;
  year: number | null;
  description: string;
}

export interface Debt {
  id: string;
  name: string;
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  start_date: string;
  closed: boolean;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  active: boolean;
}

export interface Goal {
  id: string;
  target_amount: number;
  deadline_month: number;
  deadline_year: number;
}

export interface MonthlySnapshot {
  month: number;
  year: number;
  total_income: number;
  total_debts: number;
  total_fixed: number;
  free_balance: number;
}

export interface ProjectionEvent {
  type: 'liberation' | 'alert';
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

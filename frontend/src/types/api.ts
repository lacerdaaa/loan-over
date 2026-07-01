export type IncomeType = 'fixed' | 'variable';
export type IncomeCategory = 'salary' | 'rent' | 'benefit' | 'other';

export interface IncomeDeduction {
  id: string;
  label: string;
  amount: number;
}

export interface Income {
  id: string;
  type: IncomeType;
  category: IncomeCategory;
  amount: number;
  month: number | null;
  year: number | null;
  description: string;
  deductions: IncomeDeduction[];
}

export interface Debt {
  id: string;
  name: string;
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  start_date: string;
  closed: boolean;
  principal?: number | null;
  monthly_rate?: number | null;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  active: boolean;
  from_benefit: boolean;
}

export interface Goal {
  id: string;
  target_amount: number;
  deadline_month: number;
  deadline_year: number;
  monthly_min: number | null;
}

export interface OccasionalExpense {
  id: string;
  description: string;
  amount: number;
  month: number;
  year: number;
  from_benefit: boolean;
}

export interface MonthlySnapshot {
  month: number;
  year: number;
  total_income: number;
  total_debts: number;
  total_fixed: number;
  total_occasional: number;
  total_benefit: number;
  total_debt_balance: number;
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

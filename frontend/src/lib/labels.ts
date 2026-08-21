import type { AccountType } from '../types/api';

export type LabelKey =
  | 'dashboard'
  | 'timeline'
  | 'debts'
  | 'income'
  | 'fixedExpenses'
  | 'occasionalExpenses'
  | 'goal'
  | 'people';

export const LABELS: Record<AccountType, Record<LabelKey, string>> = {
  personal: {
    dashboard: 'Dashboard',
    timeline: 'Cronograma',
    debts: 'Dívidas',
    income: 'Renda',
    fixedExpenses: 'Gastos Fixos',
    occasionalExpenses: 'Gastos do Mês',
    goal: 'Meta',
    people: 'Pessoas',
  },
  business: {
    dashboard: 'Dashboard',
    timeline: 'Cronograma',
    debts: 'Financiamentos',
    income: 'Receitas',
    fixedExpenses: 'Custos Fixos',
    occasionalExpenses: 'Despesas do Mês',
    goal: 'Meta',
    people: 'Pessoas',
  },
};

export const labelsFor = (business: boolean): Record<LabelKey, string> =>
  LABELS[business ? 'business' : 'personal'];

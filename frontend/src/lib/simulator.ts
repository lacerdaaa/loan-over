import type { ProjectedMonth } from '../types/api';

export const MAX_HYPOTHETICAL_DEBTS = 10;
const MONTHS_PER_YEAR = 12;

export interface DebtDraft {
  name: string;
  installment_amount: string;
  installments: string;
  /** Month picker value in the `YYYY-MM` format. */
  start_month: string;
}

export interface SimulationForm {
  horizon: number;
  debts: DebtDraft[];
  extra_income: string;
  extra_expense: string;
}

export interface HypotheticalDebtPayload {
  name: string;
  installment_amount: number;
  installments: number;
  start_offset: number;
}

export interface SimulationPayload {
  horizon: number;
  hypothetical_debts: HypotheticalDebtPayload[];
  extra_monthly_income: number;
  extra_monthly_expense: number;
}

export interface LowestMonth {
  month: number;
  year: number;
  free_balance: number;
}

export interface Comparison {
  lowestFreeBalance: LowestMonth | null;
  firstNegativeMonth: ProjectedMonth | null;
  cumulativeDifference: number;
  /** Months the last payoff moves in the scenario (positive = later); null when either side has no payoff. */
  payoffShiftMonths: number | null;
}

export interface ChartRow {
  month: number;
  year: number;
  baseline_free: number;
  scenario_free: number;
  baseline_cumulative: number;
  scenario_cumulative: number;
}

export const nextMonthOf = (now: Date): { month: number; year: number } => {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
};

export const toMonthInput = (month: number, year: number): string =>
  `${year}-${String(month).padStart(2, '0')}`;

/** Offset in months from next month (0 = next month) for a `YYYY-MM` picker value; null when malformed. */
export const monthInputToOffset = (value: string, now: Date): number | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const next = nextMonthOf(now);
  return (Number(match[1]) - next.year) * MONTHS_PER_YEAR + (Number(match[2]) - next.month);
};

/** The `YYYY-MM` picker value `offset` months after next month. */
export const offsetToMonthInput = (offset: number, now: Date): string => {
  const date = new Date(now.getFullYear(), now.getMonth() + 1 + offset, 1);
  return toMonthInput(date.getMonth() + 1, date.getFullYear());
};

export const emptyDebtDraft = (now: Date): DebtDraft => ({
  name: '',
  installment_amount: '',
  installments: '',
  start_month: offsetToMonthInput(0, now),
});

const toDebtPayload = (draft: DebtDraft, horizon: number, now: Date): HypotheticalDebtPayload | null => {
  const offset = monthInputToOffset(draft.start_month, now);
  const amount = Number(draft.installment_amount);
  const installments = Number(draft.installments);
  const valid =
    draft.name.trim() !== '' &&
    amount > 0 &&
    Number.isInteger(installments) &&
    installments >= 1 &&
    offset !== null &&
    offset >= 0 &&
    offset < horizon;
  return valid
    ? { name: draft.name.trim(), installment_amount: amount, installments, start_offset: offset }
    : null;
};

/** Returns the request body, or null when any field is invalid. */
export const buildSimulationPayload = (form: SimulationForm, now: Date): SimulationPayload | null => {
  const debts = form.debts.map((draft) => toDebtPayload(draft, form.horizon, now));
  const extraIncome = Number(form.extra_income || 0);
  const extraExpense = Number(form.extra_expense || 0);
  const hasInvalidDebt = debts.some((d) => d === null);
  if (hasInvalidDebt || !(extraIncome >= 0) || !(extraExpense >= 0)) return null;
  return {
    horizon: form.horizon,
    hypothetical_debts: debts as HypotheticalDebtPayload[],
    extra_monthly_income: extraIncome,
    extra_monthly_expense: extraExpense,
  };
};

const lastPayoffIndex = (months: ProjectedMonth[]): number | null => {
  const index = months.map((m) => m.events.some((e) => e.type === 'liberation')).lastIndexOf(true);
  return index === -1 ? null : index;
};

const lowestMonth = (months: ProjectedMonth[]): LowestMonth | null =>
  months.reduce<LowestMonth | null>(
    (lowest, m) => (lowest === null || m.free_balance < lowest.free_balance ? m : lowest),
    null,
  );

export const compareScenarios = (baseline: ProjectedMonth[], scenario: ProjectedMonth[]): Comparison => {
  const baselinePayoff = lastPayoffIndex(baseline);
  const scenarioPayoff = lastPayoffIndex(scenario);
  const lastCumulative = (months: ProjectedMonth[]) => months[months.length - 1]?.cumulative_balance ?? 0;
  return {
    lowestFreeBalance: lowestMonth(scenario),
    firstNegativeMonth: scenario.find((m) => m.free_balance < 0) ?? null,
    cumulativeDifference: lastCumulative(scenario) - lastCumulative(baseline),
    payoffShiftMonths:
      baselinePayoff === null || scenarioPayoff === null ? null : scenarioPayoff - baselinePayoff,
  };
};

export const buildChartRows = (baseline: ProjectedMonth[], scenario: ProjectedMonth[]): ChartRow[] =>
  scenario.map((s, i) => ({
    month: s.month,
    year: s.year,
    baseline_free: baseline[i]?.free_balance ?? 0,
    scenario_free: s.free_balance,
    baseline_cumulative: baseline[i]?.cumulative_balance ?? 0,
    scenario_cumulative: s.cumulative_balance,
  }));

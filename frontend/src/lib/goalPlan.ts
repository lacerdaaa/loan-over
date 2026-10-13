import type { Debt, ProjectedMonth } from '../types/api';
import { addMonths, currentPeriod } from './date';
import { MAX_PAYOFF_MONTHS, naturalPayoffMonths, remainingBalance } from './debt';
import { monthLabel } from './monthLabel';

const PAID_OFF_THRESHOLD = 0.01;
const MAX_SUGGESTIONS = 3;

export interface DebtResult {
  id: string;
  name: string;
  installment: number;
  trueRemainingBalance: number;
  snowballPayoffOffset: number;
  naturalPayoffOffset: number;
  monthsSaved: number;
}

export interface SimResult {
  debtFreeOffset: number | null;
  goalOffset: number | null;
  debtOrder: DebtResult[];
  postDebtMonthlyFree: number;
}

/** Money diverted straight to the goal from `fromOffset` onward, instead of feeding the debt snowball. */
export interface Redirect {
  fromOffset: number;
  amount: number;
}

export interface SimInput {
  openDebts: Debt[];
  /** Free balance of the first projected month (excludes one-offs, consistent with the Timeline). */
  baseFreeBalance: number;
  monthlyMin: number;
  targetAmount: number;
  /** Amount already saved; cumulative savings start from here. */
  savedAmount: number;
  redirect?: Redirect;
}

interface DebtState {
  id: string;
  name: string;
  installment: number;
  rate: number;
  balance: number;
  initialBalance: number;
  freed: boolean;
  snowballPayoffOffset: number;
  naturalPayoffOffset: number;
}

const toDebtState = (d: Debt): DebtState => {
  const balance = remainingBalance(d);
  return {
    id: d.id,
    name: d.name,
    installment: d.installment_amount,
    rate: d.monthly_rate ?? 0,
    balance,
    initialBalance: balance,
    freed: false,
    snowballPayoffOffset: 0,
    naturalPayoffOffset: naturalPayoffMonths(d),
  };
};

// Applies extra money to the smallest debts in order; what a debt cannot absorb rolls to the next one.
const applyExtraPayment = (states: DebtState[], extra: number): void => {
  let remainingExtra = extra;
  for (const d of states) {
    if (remainingExtra <= 0) return;
    if (d.freed) continue;
    const paid = Math.min(remainingExtra, Math.max(0, d.balance));
    d.balance -= paid;
    remainingExtra -= paid;
  }
};

// Advances every open debt by one installment and returns the installment amounts freed this month.
const advanceInstallments = (states: DebtState[], offset: number): number => {
  let freedInstallments = 0;
  for (const d of states) {
    if (d.freed) continue;
    d.balance -= d.installment - d.balance * d.rate;
    if (d.balance > PAID_OFF_THRESHOLD) continue;
    d.freed = true;
    d.snowballPayoffOffset = offset;
    freedInstallments += d.installment;
  }
  return freedInstallments;
};

const toDebtResult = (d: DebtState): DebtResult => {
  const snowballOffset = d.snowballPayoffOffset || d.naturalPayoffOffset;
  return {
    id: d.id,
    name: d.name,
    installment: d.installment,
    trueRemainingBalance: d.initialBalance,
    snowballPayoffOffset: snowballOffset,
    naturalPayoffOffset: d.naturalPayoffOffset,
    monthsSaved: Math.max(0, d.naturalPayoffOffset - snowballOffset),
  };
};

const redirectedAmount = (redirect: Redirect | undefined, offset: number): number =>
  redirect && offset >= redirect.fromOffset ? redirect.amount : 0;

export const simulate = (input: SimInput): SimResult => {
  const { openDebts, baseFreeBalance, monthlyMin, targetAmount, savedAmount, redirect } = input;
  const states = openDebts.map(toDebtState).sort((a, b) => a.balance - b.balance);

  let freeBal = baseFreeBalance;
  let cumSavings = savedAmount;
  let debtFreeOffset: number | null = states.length === 0 ? 0 : null;
  let goalOffset: number | null = savedAmount >= targetAmount && targetAmount > 0 ? 0 : null;

  for (let offset = 1; offset <= MAX_PAYOFF_MONTHS; offset++) {
    if (debtFreeOffset === null) {
      const available = Math.max(0, freeBal);
      const reserved = Math.min(monthlyMin + redirectedAmount(redirect, offset), available);
      cumSavings += reserved;
      applyExtraPayment(states, available - reserved);
      freeBal += advanceInstallments(states, offset);
      if (states.every((d) => d.freed)) debtFreeOffset = offset;
    } else {
      cumSavings += Math.max(0, freeBal);
    }

    if (targetAmount > 0 && cumSavings >= targetAmount && goalOffset === null) {
      goalOffset = offset;
    }

    if (debtFreeOffset !== null && (goalOffset !== null || targetAmount === 0)) break;
  }

  return { debtFreeOffset, goalOffset, debtOrder: states.map(toDebtResult), postDebtMonthlyFree: freeBal };
};

export const offsetToLabel = (offset: number | null, today = currentPeriod()): string => {
  if (offset === null) return '—';
  const { month, year } = addMonths(today.month, today.year, offset);
  return monthLabel(month, year);
};

export const savedProgressPercent = (savedAmount: number, targetAmount: number): number => {
  if (targetAmount <= 0) return 0;
  return Math.min(100, Math.max(0, (savedAmount / targetAmount) * 100));
};

/** Whole months from today to the deadline month; negative once the deadline month has passed. */
export const monthsUntilDeadline = (
  deadlineMonth: number,
  deadlineYear: number,
  today = currentPeriod(),
): number => (deadlineYear - today.year) * 12 + (deadlineMonth - today.month);

/**
 * Monthly amount needed to reach the target by the deadline, or null when the deadline has passed.
 * A deadline in the current month needs the whole remainder at once, so months are floored at 1.
 */
export const requiredMonthlyContribution = (
  targetAmount: number,
  savedAmount: number,
  monthsLeft: number,
): number | null => {
  const remaining = Math.max(0, targetAmount - savedAmount);
  if (remaining === 0) return 0;
  if (monthsLeft < 0) return null;
  return remaining / Math.max(1, monthsLeft);
};

export type GoalStatus =
  | { kind: 'achieved' }
  | { kind: 'on_track' }
  | { kind: 'late'; monthsLate: number }
  | { kind: 'expired' }
  | { kind: 'unreachable' };

/** Compares the simulated goal-reach offset against the deadline. */
export const evaluateGoalStatus = (
  targetAmount: number,
  savedAmount: number,
  goalOffset: number | null,
  monthsLeft: number,
): GoalStatus => {
  if (targetAmount > 0 && savedAmount >= targetAmount) return { kind: 'achieved' };
  if (monthsLeft < 0) return { kind: 'expired' };
  if (goalOffset === null) return { kind: 'unreachable' };
  if (goalOffset <= monthsLeft) return { kind: 'on_track' };
  return { kind: 'late', monthsLate: goalOffset - monthsLeft };
};

export interface LiberationSuggestion {
  debtName: string;
  month: number;
  year: number;
  amount: number;
  /** Months sooner the goal is reached when this amount goes to it; 0 when it makes no difference. */
  monthsEarlier: number;
}

interface UpcomingLiberation {
  debtName: string;
  month: number;
  year: number;
  amount: number;
  offset: number;
}

export const upcomingLiberations = (projection: ProjectedMonth[], limit = MAX_SUGGESTIONS): UpcomingLiberation[] =>
  projection
    .flatMap((m, offset) =>
      m.events
        .filter((e) => e.type === 'liberation' && e.debt_name && e.amount > 0)
        .map((e) => ({ debtName: e.debt_name ?? '', month: m.month, year: m.year, amount: e.amount, offset })),
    )
    .slice(0, limit);

/** Months sooner the goal is reached by redirecting a freed installment (available from the month after payoff). */
export const monthsEarlierWithRedirect = (input: SimInput, liberation: UpcomingLiberation): number => {
  const baseline = simulate(input).goalOffset;
  const redirected = simulate({
    ...input,
    redirect: { fromOffset: liberation.offset + 1, amount: liberation.amount },
  }).goalOffset;
  if (redirected === null) return 0;
  const baselineOffset = baseline ?? MAX_PAYOFF_MONTHS + 1;
  return Math.max(0, baselineOffset - redirected);
};

export const buildLiberationSuggestions = (
  projection: ProjectedMonth[],
  input: SimInput,
): LiberationSuggestion[] =>
  upcomingLiberations(projection).map((lib) => ({
    debtName: lib.debtName,
    month: lib.month,
    year: lib.year,
    amount: lib.amount,
    monthsEarlier: input.targetAmount > 0 ? monthsEarlierWithRedirect(input, lib) : 0,
  }));

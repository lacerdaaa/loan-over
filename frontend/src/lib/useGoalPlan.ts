import { useMemo } from 'react';
import { useDebts } from '../api/debts';
import { useGoal } from '../api/goal';
import { useProjection } from '../api/projection';
import { currentPeriod } from './date';
import {
  buildLiberationSuggestions,
  evaluateGoalStatus,
  monthsUntilDeadline,
  requiredMonthlyContribution,
  simulate,
} from './goalPlan';

const PLAN_HORIZON = 24;

/** Everything the goal page and dashboard need: simulation, deadline status and liberation suggestions. */
export const useGoalPlan = () => {
  const { month, year } = currentPeriod();
  const { data: goal } = useGoal();
  const { data: allDebts } = useDebts();
  const { data: projection } = useProjection(month, year, PLAN_HORIZON);

  const targetAmount = goal?.target_amount ?? 0;
  const monthlyMin = goal?.monthly_min ?? 0;
  const savedAmount = goal?.saved_amount ?? 0;
  // Base free balance comes from the first projected month (same source as the Timeline, one-offs excluded).
  const baseFreeBalance = projection?.[0]?.free_balance ?? 0;
  const openDebts = useMemo(() => (allDebts ?? []).filter((d) => !d.closed), [allDebts]);

  const result = useMemo(
    () => simulate({ openDebts, baseFreeBalance, monthlyMin, targetAmount, savedAmount }),
    [openDebts, baseFreeBalance, monthlyMin, targetAmount, savedAmount],
  );

  const suggestions = useMemo(
    () => buildLiberationSuggestions(projection ?? [], { openDebts, baseFreeBalance, monthlyMin, targetAmount, savedAmount }),
    [projection, openDebts, baseFreeBalance, monthlyMin, targetAmount, savedAmount],
  );

  const monthsLeft = goal ? monthsUntilDeadline(goal.deadline_month, goal.deadline_year) : 0;
  const status = goal ? evaluateGoalStatus(targetAmount, savedAmount, result.goalOffset, monthsLeft) : null;
  const requiredMonthly = goal ? requiredMonthlyContribution(targetAmount, savedAmount, monthsLeft) : null;

  return { goal: goal ?? null, openDebts, baseFreeBalance, result, suggestions, monthsLeft, status, requiredMonthly };
};

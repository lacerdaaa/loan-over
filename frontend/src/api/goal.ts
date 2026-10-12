import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Goal } from '../types/api';
import { client } from './client';
import { invalidateFinancials } from './invalidate';
import { toNullableNumber } from './numbers';

type RawGoal = Omit<Goal, 'target_amount' | 'monthly_min' | 'saved_amount'> & {
  target_amount: number | string;
  monthly_min: number | string | null;
  saved_amount?: number | string | null;
};

export type GoalInput = Omit<Goal, 'id' | 'saved_amount'> & { saved_amount?: number };

const toGoal = (raw: RawGoal): Goal => ({
  ...raw,
  target_amount: Number(raw.target_amount),
  monthly_min: toNullableNumber(raw.monthly_min),
  saved_amount: toNullableNumber(raw.saved_amount) ?? 0,
});

const QUERY_KEY = ['goal'];

export const useGoal = () =>
  useQuery<Goal | null>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<RawGoal | null>('/goal');
      return res.data ? toGoal(res.data) : null;
    },
  });

export const useUpsertGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GoalInput) =>
      client.post<RawGoal>('/goal', data).then((r) => toGoal(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      invalidateFinancials(qc);
    },
  });
};

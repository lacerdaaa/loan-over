import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FixedExpense } from '../types/api';
import { client } from './client';
import { invalidateFinancials } from './invalidate';
import { toNullableNumber } from './numbers';

type RawFixedExpense = Omit<FixedExpense, 'amount'> & { amount: number | string };

const toFixedExpense = (raw: RawFixedExpense): FixedExpense => ({
  ...raw,
  amount: Number(raw.amount),
  valid_from_month: toNullableNumber(raw.valid_from_month),
  valid_from_year: toNullableNumber(raw.valid_from_year),
});

const QUERY_KEY = ['fixed-expenses'];

export const useFixedExpenses = () =>
  useQuery<FixedExpense[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<RawFixedExpense[]>('/fixed-expenses');
      return res.data.map(toFixedExpense);
    },
  });

export const useCreateFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FixedExpense, 'id'>) =>
      client.post<RawFixedExpense>('/fixed-expenses', data).then((r) => toFixedExpense(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      invalidateFinancials(qc);
    },
  });
};

export const useUpdateFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<FixedExpense> & { id: string }) =>
      client.patch<RawFixedExpense>(`/fixed-expenses/${id}`, data).then((r) => toFixedExpense(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      invalidateFinancials(qc);
    },
  });
};

export const useDeleteFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/fixed-expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      invalidateFinancials(qc);
    },
  });
};

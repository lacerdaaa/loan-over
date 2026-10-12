import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OccasionalExpense } from '../types/api';
import { client } from './client';
import { invalidateFinancials } from './invalidate';

type RawOccasionalExpense = Omit<OccasionalExpense, 'amount'> & { amount: number | string };

const toOccasionalExpense = (raw: RawOccasionalExpense): OccasionalExpense => ({
  ...raw,
  amount: Number(raw.amount),
});

const QUERY_PREFIX = ['occasional-expenses'];
const queryKey = (month: number, year: number) => [...QUERY_PREFIX, month, year];

export const useOccasionalExpenses = (month: number, year: number) =>
  useQuery<OccasionalExpense[]>({
    queryKey: queryKey(month, year),
    queryFn: async () => {
      const res = await client.get<RawOccasionalExpense[]>('/occasional-expenses', {
        params: { month, year },
      });
      return res.data.map(toOccasionalExpense);
    },
  });

export const useCreateOccasionalExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<OccasionalExpense, 'id'>) =>
      client
        .post<RawOccasionalExpense>('/occasional-expenses', data)
        .then((r) => toOccasionalExpense(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_PREFIX });
      invalidateFinancials(qc);
    },
  });
};

export const useDeleteOccasionalExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/occasional-expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_PREFIX });
      invalidateFinancials(qc);
    },
  });
};

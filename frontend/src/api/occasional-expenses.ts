import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OccasionalExpense } from '../types/api';
import { client } from './client';

type RawOccasionalExpense = Omit<OccasionalExpense, 'amount'> & { amount: number | string };

const toOccasionalExpense = (raw: RawOccasionalExpense): OccasionalExpense => ({
  ...raw,
  amount: Number(raw.amount),
});

const queryKey = (month: number, year: number) => ['occasional-expenses', month, year];

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

export const useCreateOccasionalExpense = (month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<OccasionalExpense, 'id'>) =>
      client
        .post<RawOccasionalExpense>('/occasional-expenses', data)
        .then((r) => toOccasionalExpense(r.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(month, year) }),
  });
};

export const useDeleteOccasionalExpense = (month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/occasional-expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(month, year) }),
  });
};

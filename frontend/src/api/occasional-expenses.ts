import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OccasionalExpense } from '../types/api';
import { client } from './client';

const queryKey = (month: number, year: number) => ['occasional-expenses', month, year];

export const useOccasionalExpenses = (month: number, year: number) =>
  useQuery<OccasionalExpense[]>({
    queryKey: queryKey(month, year),
    queryFn: async () => {
      const res = await client.get<OccasionalExpense[]>('/occasional-expenses', { params: { month, year } });
      return res.data;
    },
  });

export const useCreateOccasionalExpense = (month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<OccasionalExpense, 'id'>) =>
      client.post<OccasionalExpense>('/occasional-expenses', data).then((r) => r.data),
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

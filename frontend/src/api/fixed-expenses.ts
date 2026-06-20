import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FixedExpense } from '../types/api';
import { client } from './client';

const QUERY_KEY = ['fixed-expenses'];

export const useFixedExpenses = () =>
  useQuery<FixedExpense[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<FixedExpense[]>('/fixed-expenses');
      return res.data;
    },
  });

export const useCreateFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FixedExpense, 'id'>) =>
      client.post<FixedExpense>('/fixed-expenses', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useUpdateFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<FixedExpense> & { id: string }) =>
      client.patch<FixedExpense>(`/fixed-expenses/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useDeleteFixedExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/fixed-expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

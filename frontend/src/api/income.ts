import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Income } from '../types/api';
import { client } from './client';

const queryKey = (month: number, year: number) => ['income', month, year];

export const useIncome = (month: number, year: number) =>
  useQuery<Income[]>({
    queryKey: queryKey(month, year),
    queryFn: async () => {
      const res = await client.get<Income[]>('/income', { params: { month, year } });
      return res.data;
    },
  });

export type CreateIncomePayload = Omit<Income, 'id' | 'month' | 'year'> & { month?: number | null; year?: number | null };

export const useCreateIncome = (month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncomePayload) =>
      client.post<Income>('/income', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(month, year) }),
  });
};

export const useDeleteIncome = (month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/income/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(month, year) }),
  });
};

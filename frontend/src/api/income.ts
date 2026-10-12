import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Income, IncomeDeduction } from '../types/api';
import { client } from './client';

type RawIncomeDeduction = Omit<IncomeDeduction, 'amount'> & { amount: number | string };
type RawIncome = Omit<Income, 'amount' | 'deductions'> & {
  amount: number | string;
  deductions?: RawIncomeDeduction[];
};

const toDeduction = (raw: RawIncomeDeduction): IncomeDeduction => ({
  ...raw,
  amount: Number(raw.amount),
});

const toIncome = (raw: RawIncome): Income => ({
  ...raw,
  amount: Number(raw.amount),
  deductions: (raw.deductions ?? []).map(toDeduction),
});

const queryKey = (month: number, year: number) => ['income', month, year];

export const useIncome = (month: number, year: number) =>
  useQuery<Income[]>({
    queryKey: queryKey(month, year),
    queryFn: async () => {
      const res = await client.get<RawIncome[]>('/income', { params: { month, year } });
      return res.data.map(toIncome);
    },
  });

export type CreateIncomePayload = Omit<Income, 'id' | 'month' | 'year' | 'deductions'> & {
  month?: number | null;
  year?: number | null;
  deductions?: { label: string; amount: number }[];
};

export const useCreateIncome = (month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateIncomePayload) =>
      client.post<RawIncome>('/income', data).then((r) => toIncome(r.data)),
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

export const useAddDeduction = (incomeId: string, month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { label: string; amount: number }) =>
      client
        .post<RawIncomeDeduction>(`/income/${incomeId}/deductions`, data)
        .then((r) => toDeduction(r.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(month, year) }),
  });
};

export const useRemoveDeduction = (incomeId: string, month: number, year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deductionId: string) =>
      client.delete(`/income/${incomeId}/deductions/${deductionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKey(month, year) }),
  });
};

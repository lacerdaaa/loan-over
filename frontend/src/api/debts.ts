import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Debt } from '../types/api';
import { client } from './client';
import { toNullableNumber } from './numbers';

type RawDebt = Omit<Debt, 'installment_amount' | 'principal' | 'monthly_rate'> & {
  installment_amount: number | string;
  principal?: number | string | null;
  monthly_rate?: number | string | null;
};

const toDebt = (raw: RawDebt): Debt => ({
  ...raw,
  installment_amount: Number(raw.installment_amount),
  principal: toNullableNumber(raw.principal),
  monthly_rate: toNullableNumber(raw.monthly_rate),
});

const QUERY_KEY = ['debts'];

export const useDebts = () =>
  useQuery<Debt[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<RawDebt[]>('/debts');
      return res.data.map(toDebt);
    },
  });

export const useCreateDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Debt, 'id' | 'closed'>) =>
      client.post<RawDebt>('/debts', data).then((r) => toDebt(r.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const usePayInstallment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.patch<RawDebt>(`/debts/${id}/pay`).then((r) => toDebt(r.data)),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<Debt[]>(QUERY_KEY);
      qc.setQueryData<Debt[]>(QUERY_KEY, (old = []) =>
        old.map((d) =>
          d.id === id
            ? { ...d, paid_installments: d.paid_installments + 1, closed: d.paid_installments + 1 === d.total_installments }
            : d,
        ),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useUpdateDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Omit<Debt, 'closed'>> & { id: string }) =>
      client.patch<RawDebt>(`/debts/${id}`, data).then((r) => toDebt(r.data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useDeleteDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

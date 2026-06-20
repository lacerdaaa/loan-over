import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Debt } from '../types/api';
import { client } from './client';

const QUERY_KEY = ['debts'];

export const useDebts = () =>
  useQuery<Debt[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<Debt[]>('/debts');
      return res.data;
    },
  });

export const useCreateDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Debt, 'id' | 'closed'>) =>
      client.post<Debt>('/debts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const usePayInstallment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.patch<Debt>(`/debts/${id}/pay`).then((r) => r.data),
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

export const useDeleteDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccountType, Me } from '../types/api';
import { client } from './client';

const QUERY_KEY = ['me'];

export const useMe = () =>
  useQuery<Me>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<Me>('/auth/me');
      return res.data;
    },
    staleTime: Infinity,
  });

export const useSetAccountType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (account_type: AccountType) =>
      client.patch<Me>('/users/me', { account_type }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

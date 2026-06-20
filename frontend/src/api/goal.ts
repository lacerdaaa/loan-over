import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Goal } from '../types/api';
import { client } from './client';

const QUERY_KEY = ['goal'];

export const useGoal = () =>
  useQuery<Goal | null>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<Goal | null>('/goal');
      return res.data;
    },
  });

export const useUpsertGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Goal, 'id'>) =>
      client.post<Goal>('/goal', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

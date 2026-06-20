import { useQuery } from '@tanstack/react-query';
import type { MonthlySnapshot } from '../types/api';
import { client } from './client';

export const useSnapshot = (month: number, year: number) =>
  useQuery<MonthlySnapshot>({
    queryKey: ['snapshot', month, year],
    queryFn: async () => {
      const res = await client.get<MonthlySnapshot>('/snapshot', { params: { month, year } });
      return res.data;
    },
  });

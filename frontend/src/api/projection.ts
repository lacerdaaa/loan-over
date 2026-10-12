import { useQuery } from '@tanstack/react-query';
import type { ProjectedMonth } from '../types/api';
import { client } from './client';

export type RawProjectedMonth = Omit<ProjectedMonth, 'cumulative_balance'> & {
  cumulative_balance?: number | string | null;
};

export const toProjectedMonth = (raw: RawProjectedMonth): ProjectedMonth => ({
  ...raw,
  cumulative_balance: Number(raw.cumulative_balance ?? 0),
});

export const useProjection = (month: number, year: number, horizon = 24, enabled = true) =>
  useQuery<ProjectedMonth[]>({
    queryKey: ['projection', month, year, horizon],
    queryFn: async () => {
      const res = await client.get<RawProjectedMonth[]>('/projection', {
        params: { month, year, horizon },
      });
      return res.data.map(toProjectedMonth);
    },
    enabled,
  });

import { useQuery } from '@tanstack/react-query';
import type { ProjectedMonth } from '../types/api';
import { client } from './client';

export const useProjection = (month: number, year: number, horizon = 24) =>
  useQuery<ProjectedMonth[]>({
    queryKey: ['projection', month, year, horizon],
    queryFn: async () => {
      const res = await client.get<ProjectedMonth[]>('/projection', {
        params: { month, year, horizon },
      });
      return res.data;
    },
  });

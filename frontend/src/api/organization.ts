import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Organization } from '../types/api';
import { client } from './client';

const QUERY_KEY = ['organization'];

export const useOrganization = () =>
  useQuery<Organization | null>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<Organization | null>('/organization');
      return res.data;
    },
  });

export const useUpsertOrganization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Organization, 'id'>) =>
      client.post<Organization>('/organization', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

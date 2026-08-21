import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Employee } from '../types/api';
import { client } from './client';

const QUERY_KEY = ['employees'];
const SNAPSHOT_KEY = ['snapshot'];
const PROJECTION_KEY = ['projection'];

export const useEmployees = () =>
  useQuery<Employee[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.get<Employee[]>('/employees');
      return res.data;
    },
  });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Employee, 'id'>) =>
      client.post<Employee>('/employees', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: SNAPSHOT_KEY });
      qc.invalidateQueries({ queryKey: PROJECTION_KEY });
    },
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Employee> & { id: string }) =>
      client.patch<Employee>(`/employees/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: SNAPSHOT_KEY });
      qc.invalidateQueries({ queryKey: PROJECTION_KEY });
    },
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete(`/employees/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: SNAPSHOT_KEY });
      qc.invalidateQueries({ queryKey: PROJECTION_KEY });
    },
  });
};

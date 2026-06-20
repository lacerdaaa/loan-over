import { useQuery } from '@tanstack/react-query';
import { client } from './client';

interface Me {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export const useMe = () =>
  useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await client.get<Me>('/auth/me');
      return res.data;
    },
    staleTime: Infinity,
  });

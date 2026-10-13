import type { QueryClient } from '@tanstack/react-query';

export const invalidateFinancials = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ['snapshot'] }),
    queryClient.invalidateQueries({ queryKey: ['projection'] }),
  ]);

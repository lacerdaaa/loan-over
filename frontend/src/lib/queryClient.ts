import { MutationCache, QueryClient } from '@tanstack/react-query';
import { getErrorMessage } from './errorMessage';
import { showErrorToast } from './toast';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => showErrorToast(getErrorMessage(error)),
  }),
});

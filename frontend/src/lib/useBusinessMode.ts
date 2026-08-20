import { useMe } from '../api/auth';
import { BUSINESS_MODE_ENABLED } from './flags';

export const useBusinessMode = (): boolean => {
  const { data: me } = useMe();
  return BUSINESS_MODE_ENABLED && me?.account_type === 'business';
};

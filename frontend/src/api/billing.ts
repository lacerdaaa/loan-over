import { type Query, useMutation, useQuery } from '@tanstack/react-query';
import { BILLING_ENABLED } from '../lib/flags';
import { client } from './client';

export type Plan = 'free' | 'pro';

export interface BillingStatus {
  billing_enabled: boolean;
  plan: Plan;
  is_pro: boolean;
  status: string | null;
  current_period_end: string | null;
}

interface RedirectResponse {
  url: string;
}

export const BILLING_STATUS_KEY = ['billing', 'status'];

export const useBillingStatus = (refetchInterval?: (query: Query<BillingStatus>) => number | false) =>
  useQuery<BillingStatus>({
    queryKey: BILLING_STATUS_KEY,
    queryFn: async () => (await client.get<BillingStatus>('/billing/status')).data,
    enabled: BILLING_ENABLED,
    refetchInterval,
  });

const redirectTo = (data: RedirectResponse) => {
  window.location.assign(data.url);
};

export const useCheckout = () =>
  useMutation({
    mutationFn: async () => (await client.post<RedirectResponse>('/billing/checkout')).data,
    onSuccess: redirectTo,
  });

export const usePortal = () =>
  useMutation({
    mutationFn: async () => (await client.post<RedirectResponse>('/billing/portal')).data,
    onSuccess: redirectTo,
  });

/** True when the user may use Pro features. Without billing everyone is Pro and no request is made. */
export const usePro = (): boolean => {
  const { data } = useBillingStatus();
  if (!BILLING_ENABLED) return true;
  return data?.is_pro ?? false;
};

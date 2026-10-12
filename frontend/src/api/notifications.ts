import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from './client';

export interface NotificationPreferences {
  email_notifications: boolean;
  monthly_report: boolean;
}

const QUERY_KEY = ['notifications', 'preferences'];

export const useNotificationPreferences = () =>
  useQuery<NotificationPreferences>({
    queryKey: QUERY_KEY,
    queryFn: async () => (await client.get<NotificationPreferences>('/notifications/preferences')).data,
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) =>
      (await client.patch<NotificationPreferences>('/notifications/preferences', patch)).data,
    onSuccess: (data) => qc.setQueryData(QUERY_KEY, data),
  });
};

export const useSendTestEmail = () =>
  useMutation({
    mutationFn: () => client.post('/notifications/test'),
  });

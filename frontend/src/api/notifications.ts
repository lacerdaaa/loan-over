import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from './client';

export interface NotificationPreferences {
  email_notifications: boolean;
  monthly_report: boolean;
}

export const NOTIFICATION_PREFERENCES_KEY = ['notifications', 'preferences'];

export const useNotificationPreferences = () =>
  useQuery<NotificationPreferences>({
    queryKey: NOTIFICATION_PREFERENCES_KEY,
    queryFn: async () => (await client.get<NotificationPreferences>('/notifications/preferences')).data,
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) =>
      (await client.patch<NotificationPreferences>('/notifications/preferences', patch)).data,
    onSuccess: (data) => qc.setQueryData(NOTIFICATION_PREFERENCES_KEY, data),
  });
};

export const useSendTestEmail = () =>
  useMutation({
    mutationFn: () => client.post('/notifications/test'),
  });

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface NotifChannels { email: boolean; push: boolean }

export interface NotifPrefs {
  restock: NotifChannels;
  priceTarget: NotifChannels;
  weeklyDigest: { email: boolean };
  quietHours: { enabled: boolean; start: string; end: string; timezone: string };
}

export interface Me {
  id: string;
  email: string;
  displayName: string | null;
  preferredCurrency: string;
  subscriptionTier: 'free' | 'collector' | 'investor';
  trialEndsAt: string | null;
  featureFlags: Record<string, boolean>;
  notificationPrefs: NotifPrefs;
}

export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/me');
      return data.data as Me;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateNotifPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: Partial<NotifPrefs>) => {
      const { data } = await api.patch('/me/notifications', prefs);
      return data.data as NotifPrefs;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

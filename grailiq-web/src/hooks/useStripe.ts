import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SubscriptionInfo {
  tier: 'free' | 'collector' | 'investor';
  trialEndsAt: string | null;
  hasCustomer: boolean;
}

export function useSubscription() {
  return useQuery<SubscriptionInfo>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/stripe/subscription');
      return data.data as SubscriptionInfo;
    },
    retry: 0,
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: async (tier: 'collector' | 'investor') => {
      const { data } = await api.post('/stripe/checkout', { tier });
      return data.data as { id: string; url: string };
    },
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}

export function useOpenBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/stripe/portal', {});
      return data.data as { url: string };
    },
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });
}

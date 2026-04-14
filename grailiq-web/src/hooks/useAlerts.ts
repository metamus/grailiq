import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AlertSubscription } from '@/types';

/** Fetch user's alert subscriptions */
export function useAlerts() {
  return useQuery<AlertSubscription[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alerts');
      return data.data;
    },
  });
}

/** Create a new alert subscription */
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: {
      productId: string;
      retailer?: string;
    }) => {
      const { data } = await api.post('/alerts', alert);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/** Toggle an alert's active status */
export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await api.patch(`/alerts/${alertId}/toggle`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/** Delete an alert subscription */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      await api.delete(`/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

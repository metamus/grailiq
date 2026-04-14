import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product } from '@/types';

export interface Mover {
  product: Product;
  scoreNow: number;
  scorePrior: number;
  delta: number;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Real week-over-week movers from score_history snapshots.
 * Returns top `limit` products by absolute score delta over `days` window.
 */
export function useMovers(days = 7, limit = 10) {
  return useQuery<{ data: Mover[]; windowDays: number; note?: string }>({
    queryKey: ['movers', days, limit],
    queryFn: async () => {
      const { data } = await api.get('/products/movers', {
        params: { days, limit },
      });
      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 min
  });
}

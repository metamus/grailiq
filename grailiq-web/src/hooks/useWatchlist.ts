import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product } from '@/types';

export interface WatchlistEntry {
  id: string;
  productId: string;
  note: string | null;
  targetPrice: string | null;
  createdAt: string;
  product: Pick<
    Product,
    'id' | 'name' | 'type' | 'msrp' | 'imageUrl' | 'grailiqScore' | 'investmentSignal'
  >;
  currentPrice: number | null;
}

export function useWatchlist() {
  return useQuery<WatchlistEntry[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data } = await api.get('/watchlist');
      return data.data as WatchlistEntry[];
    },
  });
}

/** Check whether a single product is on the watchlist (used by ProductDetail). */
export function useIsWatching(productId: string | undefined) {
  const { data } = useWatchlist();
  if (!productId || !data) return { watching: false, entryId: null };
  const entry = data.find((w) => w.productId === productId);
  return { watching: !!entry, entryId: entry?.id ?? null };
}

export function useToggleWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post('/watchlist/toggle', { productId });
      return data.data as { watching: boolean; id?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useRemoveWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/watchlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

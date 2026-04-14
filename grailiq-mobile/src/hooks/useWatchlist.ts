import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface WatchlistEntry {
  id: string;
  productId: string;
  note: string | null;
  targetPrice: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    type: string;
    msrp: string | null;
    imageUrl: string | null;
    grailiqScore: string | null;
    investmentSignal: 'buy' | 'hold' | 'watch' | 'avoid' | null;
  };
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

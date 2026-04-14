import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PortfolioItem } from '@/types';

/** Fetch user's portfolio */
export function usePortfolio() {
  return useQuery<PortfolioItem[]>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await api.get('/portfolio');
      return data.data;
    },
  });
}

/** Add an item to portfolio */
export function useAddPortfolioItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      productId: string;
      quantity: number;
      purchasePrice: number;
      purchaseDate?: string;
      source?: string;
      notes?: string;
    }) => {
      const { data } = await api.post('/portfolio', item);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

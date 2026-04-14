import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PortfolioResponse } from '@/types';

/** Fetch user's portfolio with aggregate summary */
export function usePortfolio() {
  return useQuery<PortfolioResponse>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await api.get('/portfolio');
      return data as PortfolioResponse;
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

/** Delete an item from portfolio */
export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/portfolio/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

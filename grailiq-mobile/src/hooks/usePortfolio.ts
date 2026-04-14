import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PortfolioItem } from '../types';

export function usePortfolio() {
  return useQuery<PortfolioItem[]>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await api.get('/portfolio');
      return data?.data ?? [];
    },
  });
}

export function useAddPortfolioItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      productId: string;
      quantity: number;
      purchasePrice: string;
      purchaseDate: string;
      source?: string;
      notes?: string;
    }) => {
      const { data } = await api.post('/portfolio', item);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Product, PricePoint, TimeRange } from '../types';

const DAYS_MAP: Record<TimeRange, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
  all: null,
};

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products');
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function usePriceHistory(productId: string, timeRange: TimeRange = '30d') {
  return useQuery<PricePoint[]>({
    queryKey: ['priceHistory', productId, timeRange],
    queryFn: async () => {
      const days = DAYS_MAP[timeRange];
      const params = days ? { days } : {};
      const { data } = await api.get(`/products/${productId}/prices`, { params });
      return data;
    },
    enabled: !!productId,
  });
}

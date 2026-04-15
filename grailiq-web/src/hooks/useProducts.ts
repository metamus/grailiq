import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product, PricePoint, TimeRange } from '@/types';

/** Fetch all products */
export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products');
      return data.data;
    },
  });
}

/** Fetch top products by score */
export function useTopProducts(limit = 4) {
  return useQuery<Product[]>({
    queryKey: ['products', 'top', limit],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: { limit },
      });
      // Sort by score descending
      return (data.data ?? []).sort(
        (a: Product, b: Product) =>
          parseFloat(b.grailiqScore || '0') - parseFloat(a.grailiqScore || '0'),
      );
    },
  });
}

/** Fetch a single product by ID */
export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

/** Fetch price history for a product */
export function usePriceHistory(productId: string, timeRange: TimeRange = '30d') {
  const daysMap: Record<TimeRange, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
    'all': 9999,
  };

  return useQuery<PricePoint[]>({
    queryKey: ['price-history', productId, timeRange],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}/price-history`, {
        params: { days: daysMap[timeRange] },
      });
      return data.data;
    },
    enabled: !!productId,
  });
}

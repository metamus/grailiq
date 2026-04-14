import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Set, Product } from '@/types';

/** Fetch all sets */
export function useSets() {
  return useQuery<Set[]>({
    queryKey: ['sets'],
    queryFn: async () => {
      const { data } = await api.get('/sets');
      return data.data;
    },
  });
}

/** Fetch a single set by ID with its products */
export function useSet(id: string) {
  return useQuery<Set & { products: Product[] }>({
    queryKey: ['sets', id],
    queryFn: async () => {
      const { data } = await api.get(`/sets/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

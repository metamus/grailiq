import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Set } from '../types';

export function useSets() {
  return useQuery<Set[]>({
    queryKey: ['sets'],
    queryFn: async () => {
      const { data } = await api.get('/sets');
      return data;
    },
  });
}

export function useSet(id: string) {
  return useQuery<Set>({
    queryKey: ['sets', id],
    queryFn: async () => {
      const { data } = await api.get(`/sets/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

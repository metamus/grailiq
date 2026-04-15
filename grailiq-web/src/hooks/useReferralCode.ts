import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReferralResponse {
  code: string;
  url: string;
}

/**
 * Fetch the user's referral code.
 * Falls back gracefully if 401 (not authed) or 404 (not available).
 */
export function useReferralCode() {
  return useQuery<ReferralResponse | null>({
    queryKey: ['referralCode'],
    queryFn: async () => {
      try {
        const { data } = await api.get<{ data: ReferralResponse }>('/me/referral-code');
        return data.data ?? null;
      } catch (error: any) {
        // Graceful degradation: 401 (not signed in) or 404 (not available)
        if (error.response?.status === 401 || error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

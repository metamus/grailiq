import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  tier: 'free' | 'collector' | 'investor';
  trialDaysLeft: number | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setTier: (tier: 'free' | 'collector' | 'investor') => void;
  setTrialDaysLeft: (days: number | null) => void;
  setLoading: (loading: boolean) => void;
}

/** Global auth state store powered by Supabase */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  tier: 'free',
  trialDaysLeft: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setTier: (tier) => set({ tier }),
  setTrialDaysLeft: (trialDaysLeft) => set({ trialDaysLeft }),
  setLoading: (isLoading) => set({ isLoading }),
}));

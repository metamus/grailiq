import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  tier: 'free' | 'collector' | 'investor';
  trialDaysLeft: number;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setTier: (tier: 'free' | 'collector' | 'investor') => void;
  setTrialDaysLeft: (days: number) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  tier: 'free',
  trialDaysLeft: 0,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setTier: (tier) => set({ tier }),
  setTrialDaysLeft: (days) => set({ trialDaysLeft: days }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

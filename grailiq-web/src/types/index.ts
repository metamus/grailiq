export interface Set {
  id: string;
  name: string;
  code: string;
  series: string;
  releaseDate: string | null;
  totalCards: number | null;
  isOutOfPrint: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  setId: string;
  name: string;
  type: 'booster_box' | 'etb' | 'booster_pack' | 'collection_box' | 'blister_pack' | 'tin' | 'premium_collection' | 'other';
  msrp: string | null;
  imageUrl: string | null;
  tcgplayerId: string | null;
  grailiqScore: string | null;
  investmentSignal: 'buy' | 'hold' | 'watch' | 'avoid' | null;
  signalRationale: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricePoint {
  id: number;
  productId: string;
  source: 'tcgplayer' | 'ebay';
  price: string;
  marketPrice: string | null;
  lowPrice: string | null;
  highPrice: string | null;
  recordedAt: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  purchasePrice: string;
  purchaseDate: string | null;
  source: string | null;
  notes: string | null;
  product?: Product;
  currentPrice?: string;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  displayName: string | null;
  preferredCurrency: string;
  subscriptionTier: 'free' | 'collector' | 'investor';
  trialEndsAt: string | null;
}

export interface AlertSubscription {
  id: string;
  userId: string;
  productId: string;
  retailer: 'pokemon_center' | 'amazon' | 'target' | 'walmart' | 'best_buy' | 'all';
  isActive: boolean;
  product?: Product;
}

export interface GrailIQScore {
  score: number;
  signal: 'buy' | 'hold' | 'watch' | 'avoid';
  rationale: string;
  updatedAt: string;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

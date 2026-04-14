/** Pokemon TCG Set */
export interface Set {
  id: string;
  name: string;
  code: string;
  series: string;
  releaseDate: string;
  totalCards: number;
  isOutOfPrint: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

/** Sealed product types */
export type ProductType =
  | 'booster_box'
  | 'etb'
  | 'booster_pack'
  | 'collection_box'
  | 'blister_pack'
  | 'tin'
  | 'premium_collection'
  | 'other';

/** Sealed product */
export interface Product {
  id: string;
  setId: string;
  name: string;
  type: ProductType;
  msrp: string | null;
  imageUrl: string | null;
  tcgplayerId: string | null;
  grailiqScore: string | null;
  investmentSignal: 'buy' | 'hold' | 'watch' | 'avoid' | null;
  signalRationale: string | null;
  scoreUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Price data point */
export interface PricePoint {
  id: string;
  productId: string;
  source: 'tcgplayer' | 'ebay';
  price: string;
  marketPrice: string | null;
  lowPrice: string | null;
  highPrice: string | null;
  recordedAt: string;
}

/** Portfolio holding */
export interface PortfolioItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  purchasePrice: string;
  purchaseDate: string;
  source: string | null;
  notes: string | null;
  product: Product;
  currentPrice?: string;
}

/** User profile */
export interface User {
  id: string;
  clerkId: string;
  email: string;
  displayName: string | null;
  preferredCurrency: string;
  subscriptionTier: 'free' | 'collector' | 'investor';
  trialEndsAt: string | null;
}

/** Alert subscription */
export interface AlertSubscription {
  id: string;
  userId: string;
  productId: string;
  retailer: 'pokemon_center' | 'amazon' | 'target' | 'walmart' | 'best_buy' | 'all';
  isActive: boolean;
  product: Product;
}

/** GrailIQ Score breakdown */
export interface GrailIQScore {
  score: number;
  signal: 'buy' | 'hold' | 'watch' | 'avoid';
  rationale: string;
  updatedAt: string;
}

/** Time range for charts */
export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

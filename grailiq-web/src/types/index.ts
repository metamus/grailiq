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
  thesis: string | null;
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
  productId: string;
  quantity: number;
  purchasePrice: string;
  purchaseDate: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    type: Product['type'];
    imageUrl: string | null;
    msrp: string | null;
    grailiqScore: string | null;
    investmentSignal: Product['investmentSignal'];
  };
  currentPrice: string;
  currentValue: string;
  unrealizedPnl: string;
  unrealizedPnlPct: string;
}

export interface PortfolioSummary {
  totalValue: number | string;
  costBasis: number | string;
  unrealizedPnl: number | string;
  unrealizedPnlPct: number | string;
  holdings: number;
  uniqueProducts: number;
  bestHolding: {
    id: string;
    name: string;
    pnl: string;
    pnlPct: string;
  } | null;
  worstHolding: {
    id: string;
    name: string;
    pnl: string;
    pnlPct: string;
  } | null;
}

export interface PortfolioResponse {
  data: PortfolioItem[];
  summary: PortfolioSummary;
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
  productId: string;
  retailer: 'pokemon_center' | 'amazon' | 'target' | 'walmart' | 'best_buy' | 'all';
  isActive: boolean;
  createdAt: string;
  product: Product;
}

export interface GrailIQScore {
  score: number;
  signal: 'buy' | 'hold' | 'watch' | 'avoid';
  rationale: string;
  updatedAt: string;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

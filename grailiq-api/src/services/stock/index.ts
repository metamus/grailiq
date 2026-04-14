import { PokemonCenterAdapter } from './pokemonCenter.js';
import { TargetAdapter } from './target.js';
import { BestBuyAdapter } from './bestBuy.js';
import { AmazonAdapter } from './amazon.js';
import { WalmartAdapter } from './walmart.js';
import type { Retailer, RetailerAdapter } from './types.js';

export * from './types.js';

/**
 * Registry of retailer adapters, keyed by the canonical retailer enum value.
 * Used by the restock worker to dispatch per-retailer stock checks.
 */
export const stockAdapters: Record<Retailer, RetailerAdapter> = {
  pokemon_center: new PokemonCenterAdapter(),
  target: new TargetAdapter(),
  best_buy: new BestBuyAdapter(),
  amazon: new AmazonAdapter(),
  walmart: new WalmartAdapter(),
};

export const ALL_RETAILERS: Retailer[] = [
  'pokemon_center',
  'target',
  'best_buy',
  'amazon',
  'walmart',
];

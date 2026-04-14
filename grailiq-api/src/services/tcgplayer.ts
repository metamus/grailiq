import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { fetchScrapedPrices } from './scraper.js';

/**
 * Fetch prices from the best available source.
 *
 * Priority:
 * 1. TCGPlayer API (if configured — currently closed to new registrations)
 * 2. TCGPlayer web scraper (if proxy configured for production)
 * 3. Realistic mock data based on MSRP and product type patterns
 */
export async function fetchTCGPlayerPrices(tier: string): Promise<number> {
  const isApiConfigured = !!env.TCGPLAYER_API_KEY;

  if (isApiConfigured) {
    // TODO: If API key is ever obtained, implement OAuth bearer token flow:
    // POST https://api.tcgplayer.com/token with grant_type=client_credentials
    // Then GET /pricing/product/{productIds} with Bearer token
    logger.info({ tier }, 'TCGPlayer API key detected — API integration not yet implemented');
  }

  // Use the scraper service (which falls back to mock data if no proxy)
  logger.info({ tier }, 'Fetching prices via scraper/mock pipeline');
  return await fetchScrapedPrices(tier);
}

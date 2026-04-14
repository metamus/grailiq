import type { RetailerAdapter, StockCheckResult, StockMapping } from './types.js';

/**
 * Amazon stock adapter — NOT YET IMPLEMENTED.
 *
 * Amazon aggressively blocks direct scraping (captchas, IP bans, dynamic
 * rendering, etc). The right integrations here are:
 *   1. Product Advertising API 5.0 (requires seller/affiliate account with
 *      sales history — gated).
 *   2. Keepa API (paid, $19-49/mo, well-maintained, returns real-time
 *      availability and pricing for any ASIN).
 *   3. Third-party scraping services (ScraperAPI, Bright Data) with rotating
 *      residential proxies.
 *
 * Until one of those is wired up this adapter returns a clear `not_implemented`
 * error result so the worker records the gap and never falsely reports stock.
 *
 * Mapping note: when implementing, `sku` should be the ASIN.
 */
export class AmazonAdapter implements RetailerAdapter {
  readonly retailer = 'amazon' as const;
  readonly label = 'Amazon';

  async check(mapping: StockMapping): Promise<StockCheckResult> {
    return {
      inStock: false,
      url: mapping.url,
      checkedAt: new Date(),
      error: 'not_implemented',
    };
  }
}

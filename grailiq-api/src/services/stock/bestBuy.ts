import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { stockFetch } from './http.js';
import type { RetailerAdapter, StockCheckResult, StockMapping } from './types.js';

/**
 * Best Buy stock adapter — uses the Best Buy Developer API.
 *
 *   https://api.bestbuy.com/v1/products(sku=<sku>)?apiKey=<key>&format=json&show=onlineAvailability,salePrice,regularPrice,url
 *
 * The `onlineAvailability` boolean is the canonical in-stock signal.
 * Requires a free API key from https://developer.bestbuy.com — set
 * `BEST_BUY_API_KEY` in the environment. Without a key, checks return
 * a clear error result rather than silently guessing.
 *
 * Mapping requirements: `sku` must be the numeric Best Buy SKU.
 */
export class BestBuyAdapter implements RetailerAdapter {
  readonly retailer = 'best_buy' as const;
  readonly label = 'Best Buy';

  async check(mapping: StockMapping): Promise<StockCheckResult> {
    const checkedAt = new Date();

    if (!env.BEST_BUY_API_KEY) {
      return {
        inStock: false,
        url: mapping.url,
        checkedAt,
        error: 'missing_api_key',
      };
    }

    if (!mapping.sku) {
      return {
        inStock: false,
        url: mapping.url,
        checkedAt,
        error: 'missing_sku',
      };
    }

    const apiUrl =
      `https://api.bestbuy.com/v1/products(sku=${encodeURIComponent(mapping.sku)})` +
      `?apiKey=${env.BEST_BUY_API_KEY}&format=json&show=onlineAvailability,salePrice,regularPrice,url`;

    try {
      const response = await stockFetch(apiUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return {
          inStock: false,
          url: mapping.url,
          checkedAt,
          error: `http_${response.status}`,
        };
      }

      const json = (await response.json()) as BestBuyResponse;
      const product = json?.products?.[0];

      if (!product) {
        return {
          inStock: false,
          url: mapping.url,
          checkedAt,
          error: 'product_not_found',
        };
      }

      const price = product.salePrice ?? product.regularPrice;

      return {
        inStock: Boolean(product.onlineAvailability),
        price: typeof price === 'number' && price > 0 ? price : undefined,
        url: product.url ?? mapping.url,
        checkedAt,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.warn({ sku: mapping.sku, error }, 'best_buy check failed');
      return { inStock: false, url: mapping.url, checkedAt, error };
    }
  }
}

interface BestBuyResponse {
  products?: Array<{
    onlineAvailability?: boolean;
    salePrice?: number;
    regularPrice?: number;
    url?: string;
  }>;
}

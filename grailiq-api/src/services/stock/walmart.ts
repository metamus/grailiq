import { logger } from '../../lib/logger.js';
import { stockFetch } from './http.js';
import type { RetailerAdapter, StockCheckResult, StockMapping } from './types.js';

/**
 * Walmart stock adapter — best-effort HTML scrape.
 *
 * Walmart's Affiliate API was deprecated in 2020 and the replacement
 * (Walmart.io Partner API) is gated to approved affiliates. Their product
 * pages embed a Next.js data island (`__NEXT_DATA__`) that includes
 * availabilityStatus ("IN_STOCK" | "OUT_OF_STOCK") — we parse that.
 *
 * Walmart does use aggressive bot detection. Expect ~30-60% success rate
 * without a proxy pool. Consider routing through PROXY_URL in production.
 *
 * Mapping note: `sku` is informational; the URL is what we fetch.
 */
export class WalmartAdapter implements RetailerAdapter {
  readonly retailer = 'walmart' as const;
  readonly label = 'Walmart';

  async check(mapping: StockMapping): Promise<StockCheckResult> {
    const checkedAt = new Date();

    try {
      const response = await stockFetch(mapping.url);
      if (!response.ok) {
        return {
          inStock: false,
          url: mapping.url,
          checkedAt,
          error: `http_${response.status}`,
        };
      }

      const html = await response.text();
      const dataMatch = html.match(
        /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
      );

      if (dataMatch) {
        try {
          const parsed = JSON.parse(dataMatch[1]);
          const status = findAvailabilityStatus(parsed);
          const price = findCurrentPrice(parsed);
          if (status) {
            return {
              inStock: status === 'IN_STOCK',
              price,
              url: mapping.url,
              checkedAt,
            };
          }
        } catch {
          // fall through to text scan
        }
      }

      // Text fallback
      const outOfStock = /out\s*of\s*stock|sold\s*out/i.test(html);
      const addToCart = /add\s*to\s*cart/i.test(html) && !outOfStock;
      if (addToCart || outOfStock) {
        return { inStock: addToCart, url: mapping.url, checkedAt };
      }

      return {
        inStock: false,
        url: mapping.url,
        checkedAt,
        error: 'no_signal_found',
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.warn({ url: mapping.url, error }, 'walmart check failed');
      return { inStock: false, url: mapping.url, checkedAt, error };
    }
  }
}

function findAvailabilityStatus(obj: unknown): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findAvailabilityStatus(item);
      if (found) return found;
    }
    return undefined;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.availabilityStatus === 'string') return record.availabilityStatus;
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const found = findAvailabilityStatus(value);
      if (found) return found;
    }
  }
  return undefined;
}

function findCurrentPrice(obj: unknown): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findCurrentPrice(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const record = obj as Record<string, unknown>;
  const priceInfo = record.priceInfo as Record<string, unknown> | undefined;
  if (priceInfo) {
    const current = priceInfo.currentPrice as Record<string, unknown> | undefined;
    if (current && typeof current.price === 'number') return current.price;
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const found = findCurrentPrice(value);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

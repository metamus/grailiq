import { logger } from '../../lib/logger.js';
import { stockFetch, extractFirstPrice } from './http.js';
import type { RetailerAdapter, StockCheckResult, StockMapping } from './types.js';

/**
 * Pokemon Center stock adapter.
 *
 * pokemoncenter.com renders product pages with availability baked into the
 * markup. We use two signals, in order of reliability:
 *
 *   1. `application/ld+json` structured data — `offers.availability` is
 *      either `https://schema.org/InStock` or `.../OutOfStock`. This is the
 *      canonical signal.
 *   2. DOM text fallback — "Add to Cart" / "Out of Stock" / "Sold Out"
 *      visible near the buy box.
 *
 * If neither signal is found, the check is recorded as failed (inStock=false,
 * error set). That way bad mappings don't silently report "in stock".
 */
export class PokemonCenterAdapter implements RetailerAdapter {
  readonly retailer = 'pokemon_center' as const;
  readonly label = 'Pokemon Center';

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

      // Signal 1: JSON-LD offers.availability
      const ldMatches = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      );

      if (ldMatches) {
        for (const block of ldMatches) {
          const jsonText = block
            .replace(/<script[^>]*>/i, '')
            .replace(/<\/script>/i, '')
            .trim();
          try {
            const parsed = JSON.parse(jsonText);
            const availability = findAvailability(parsed);
            const price = findPrice(parsed);
            if (availability) {
              return {
                inStock: availability.toLowerCase().includes('instock'),
                price,
                url: mapping.url,
                checkedAt,
              };
            }
          } catch {
            // malformed JSON-LD block — fall through to next
          }
        }
      }

      // Signal 2: DOM text fallback
      const lower = html.toLowerCase();
      const outOfStock =
        /out\s*of\s*stock|sold\s*out|notify\s*me\s*when\s*available/i.test(html);
      const addToCart = /add\s*to\s*(cart|bag)/i.test(html) && !outOfStock;

      if (addToCart || outOfStock) {
        return {
          inStock: addToCart,
          price: extractFirstPrice(html),
          url: mapping.url,
          checkedAt,
        };
      }

      return {
        inStock: false,
        url: mapping.url,
        checkedAt,
        error: 'no_signal_found',
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.warn({ url: mapping.url, error }, 'pokemon_center check failed');
      return { inStock: false, url: mapping.url, checkedAt, error };
    }
  }
}

/** Recursively find the first `availability` string in a JSON-LD object. */
function findAvailability(obj: unknown): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findAvailability(item);
      if (found) return found;
    }
    return undefined;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.availability === 'string') return record.availability;
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const found = findAvailability(value);
      if (found) return found;
    }
  }
  return undefined;
}

/** Recursively find the first numeric `price` field in a JSON-LD object. */
function findPrice(obj: unknown): number | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findPrice(item);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const record = obj as Record<string, unknown>;
  if (record.price !== undefined) {
    const n = typeof record.price === 'number' ? record.price : parseFloat(String(record.price));
    if (Number.isFinite(n) && n > 0) return n;
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const found = findPrice(value);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * Retailer stock check adapter contract.
 *
 * Each retailer adapter takes a mapping (URL + optional SKU) and returns a
 * canonical stock result. Adapters must:
 *   - Never throw for expected failures (timeouts, 404s, layout changes).
 *     Return `{ inStock: false, error }` instead so the worker can log + persist.
 *   - Respect a tight timeout (default 10s).
 *   - Use realistic headers to avoid trivial bot blocks.
 */

export type Retailer =
  | 'pokemon_center'
  | 'amazon'
  | 'target'
  | 'walmart'
  | 'best_buy';

export interface StockMapping {
  /** Retailer product detail page URL */
  url: string;
  /** Optional retailer-specific SKU/TCIN/ASIN for API-backed adapters */
  sku?: string | null;
}

export interface StockCheckResult {
  inStock: boolean;
  /** Price in USD at check time, if parseable */
  price?: number;
  /** Final product URL (may differ from input after redirects) */
  url: string;
  /** When the check completed */
  checkedAt: Date;
  /** Error message if the check failed — still returned with inStock=false */
  error?: string;
}

export interface RetailerAdapter {
  readonly retailer: Retailer;
  /** Human-readable label, e.g. "Pokemon Center" */
  readonly label: string;
  /** Perform a single stock check. Must not throw for normal failures. */
  check(mapping: StockMapping): Promise<StockCheckResult>;
}

/** Default per-check timeout for retailer HTTP calls. */
export const DEFAULT_CHECK_TIMEOUT_MS = 10_000;

/** Realistic desktop user agent to avoid the laziest bot filters. */
export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

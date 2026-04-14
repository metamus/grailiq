import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { stockFetch } from './http.js';
import type { RetailerAdapter, StockCheckResult, StockMapping } from './types.js';

/**
 * Target stock adapter — uses the RedSky PDP aggregation endpoint.
 *
 * URL shape:
 *   https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1
 *     ?key=<redsky_key>&tcin=<tcin>&store_id=<store_id>
 *
 * The response includes `data.product.fulfillment.shipping_options.availability_status`
 * ("IN_STOCK" / "OUT_OF_STOCK" / "LIMITED_STOCK") and `price.current_retail`.
 *
 * RedSky keys rotate but a given key is usable for weeks at a time.
 * We pull the key from `TARGET_REDSKY_KEY` with a public-default fallback.
 *
 * Mapping requirements: `sku` must be the 8-digit TCIN.
 */
export class TargetAdapter implements RetailerAdapter {
  readonly retailer = 'target' as const;
  readonly label = 'Target';

  async check(mapping: StockMapping): Promise<StockCheckResult> {
    const checkedAt = new Date();

    if (!mapping.sku) {
      return {
        inStock: false,
        url: mapping.url,
        checkedAt,
        error: 'missing_tcin',
      };
    }

    const key = env.TARGET_REDSKY_KEY ?? '9f36aeafbe60771e321a7cc95a78140772ab3e96';
    const storeId = env.TARGET_STORE_ID ?? '3991';
    const apiUrl =
      'https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1' +
      `?key=${key}&tcin=${encodeURIComponent(mapping.sku)}&store_id=${storeId}&has_store_id=true`;

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

      const json = (await response.json()) as RedSkyResponse;
      const product = json?.data?.product;

      if (!product) {
        return {
          inStock: false,
          url: mapping.url,
          checkedAt,
          error: 'no_product_in_response',
        };
      }

      const status = product.fulfillment?.shipping_options?.availability_status;
      const inStock = status === 'IN_STOCK' || status === 'LIMITED_STOCK';
      const price = product.price?.current_retail;

      return {
        inStock,
        price: typeof price === 'number' && price > 0 ? price : undefined,
        url: mapping.url,
        checkedAt,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.warn({ tcin: mapping.sku, error }, 'target check failed');
      return { inStock: false, url: mapping.url, checkedAt, error };
    }
  }
}

interface RedSkyResponse {
  data?: {
    product?: {
      fulfillment?: {
        shipping_options?: {
          availability_status?: string;
        };
      };
      price?: {
        current_retail?: number;
      };
    };
  };
}

import { Worker, Job } from 'bullmq';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { redis } from '../../config/redis.js';
import { db } from '../../config/database.js';
import {
  alertSubscriptions,
  products,
  users,
  retailerProducts,
} from '../../db/schema.js';
import { notificationQueue } from '../queues.js';
import { logger } from '../../lib/logger.js';
import { stockAdapters, ALL_RETAILERS, type Retailer } from '../../services/stock/index.js';

if (!redis) {
  logger.info('Redis not available — restock worker disabled');
}

const connection = redis ? { host: redis.options.host, port: redis.options.port } : undefined;

/** Cache TTL for individual retailer check results (avoids hammering on parallel alerts). */
const CHECK_CACHE_TTL_SECONDS = 120;

interface CachedCheck {
  inStock: boolean;
  price?: number;
  url: string;
  error?: string;
  checkedAt: string;
}

/**
 * Load or perform a fresh stock check, caching the result in Redis for
 * CHECK_CACHE_TTL_SECONDS. Multiple alerts subscribed to the same
 * retailer/product within that window share a single HTTP call.
 */
async function checkWithCache(
  retailer: Retailer,
  mappingId: string,
  url: string,
  sku: string | null,
): Promise<CachedCheck> {
  const cacheKey = `restock:check:${mappingId}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as CachedCheck;
    }
  }

  const adapter = stockAdapters[retailer];
  const result = await adapter.check({ url, sku });

  const payload: CachedCheck = {
    inStock: result.inStock,
    price: result.price,
    url: result.url,
    error: result.error,
    checkedAt: result.checkedAt.toISOString(),
  };

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(payload), 'EX', CHECK_CACHE_TTL_SECONDS);
  }

  return payload;
}

/**
 * Process restock check jobs.
 *
 * Flow:
 *   1. Load every active alert joined to its product + user.
 *   2. For each alert, expand "all" into the concrete retailer list.
 *   3. For each (product, retailer) pair, look up a `retailer_products` row
 *      for the concrete URL/SKU mapping. If no mapping, skip (we can't
 *      check what we don't have a listing for).
 *   4. Run the adapter (with per-mapping Redis cache de-duplication).
 *   5. If the previous `last_in_stock` was false and the current check is
 *      true, fire a notification. Always persist the new state.
 */
export const restockWorker = connection
  ? new Worker(
      'restock-checks',
      async (job: Job) => {
        const startTime = Date.now();
        logger.info({ jobId: job.id }, 'Starting restock check');

        const activeAlerts = await db
          .select({
            alertId: alertSubscriptions.id,
            userId: alertSubscriptions.userId,
            productId: alertSubscriptions.productId,
            retailer: alertSubscriptions.retailer,
            productName: products.name,
            productType: products.type,
            userEmail: users.email,
            displayName: users.displayName,
          })
          .from(alertSubscriptions)
          .innerJoin(products, eq(alertSubscriptions.productId, products.id))
          .innerJoin(users, eq(alertSubscriptions.userId, users.id))
          .where(eq(alertSubscriptions.isActive, true));

        if (activeAlerts.length === 0) {
          logger.info('No active alerts to check');
          return { checked: 0, restocked: 0, duration: Date.now() - startTime };
        }

        // Load all enabled retailer_products rows for the relevant products in one query.
        const productIds = Array.from(new Set(activeAlerts.map((a) => a.productId)));
        const mappings = await db
          .select()
          .from(retailerProducts)
          .where(
            and(
              inArray(retailerProducts.productId, productIds),
              eq(retailerProducts.isEnabled, true),
            ),
          );

        // Index mappings by (productId, retailer) for O(1) lookup.
        const mappingIndex = new Map<string, typeof mappings[number][]>();
        for (const m of mappings) {
          const key = `${m.productId}:${m.retailer}`;
          const bucket = mappingIndex.get(key);
          if (bucket) bucket.push(m);
          else mappingIndex.set(key, [m]);
        }

        let mappingsChecked = 0;
        let mappingsMissing = 0;
        let transitionsDetected = 0;
        let notificationsQueued = 0;
        let errors = 0;

        for (const alert of activeAlerts) {
          const targetRetailers: Retailer[] =
            alert.retailer === 'all'
              ? ALL_RETAILERS
              : ([alert.retailer] as Retailer[]);

          for (const retailer of targetRetailers) {
            const bucket = mappingIndex.get(`${alert.productId}:${retailer}`);
            if (!bucket || bucket.length === 0) {
              mappingsMissing++;
              continue;
            }

            for (const mapping of bucket) {
              let result: CachedCheck;
              try {
                result = await checkWithCache(
                  retailer,
                  mapping.id,
                  mapping.url,
                  mapping.sku,
                );
                mappingsChecked++;
              } catch (err) {
                errors++;
                logger.warn(
                  { mappingId: mapping.id, retailer, error: err },
                  'Adapter threw (should be caught in adapter)',
                );
                continue;
              }

              const wasInStock = mapping.lastInStock;
              const isInStock = result.inStock;

              // Persist new state — always, even on error, so operators can see
              // lastCheckedAt and lastError in the DB.
              await db
                .update(retailerProducts)
                .set({
                  lastInStock: isInStock,
                  lastCheckedAt: new Date(result.checkedAt),
                  lastPrice: result.price ? result.price.toFixed(2) : null,
                  lastError: result.error ?? null,
                  updatedAt: sql`NOW()`,
                })
                .where(eq(retailerProducts.id, mapping.id));

              // Fire notification only on transitions from out-of-stock -> in-stock
              // and only when we have a notification queue.
              if (!wasInStock && isInStock && notificationQueue) {
                transitionsDetected++;
                await notificationQueue.add('restock-notification', {
                  type: 'restock',
                  userId: alert.userId,
                  userEmail: alert.userEmail,
                  displayName: alert.displayName,
                  alertId: alert.alertId,
                  productId: alert.productId,
                  productName: alert.productName,
                  productType: alert.productType,
                  retailer,
                  price: result.price,
                  url: result.url,
                });
                notificationsQueued++;
              }
            }
          }
        }

        const duration = Date.now() - startTime;
        logger.info(
          {
            jobId: job.id,
            alertCount: activeAlerts.length,
            mappingsChecked,
            mappingsMissing,
            transitionsDetected,
            notificationsQueued,
            errors,
            duration,
          },
          'Restock check complete',
        );

        return {
          checked: mappingsChecked,
          restocked: transitionsDetected,
          missing: mappingsMissing,
          notificationsQueued,
          errors,
          duration,
        };
      },
      { connection, concurrency: 1 },
    )
  : null;

if (restockWorker) {
  restockWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Restock worker job failed');
  });

  restockWorker.on('completed', (job, result) => {
    if (result.restocked > 0) {
      logger.info(
        { jobId: job.id, restocked: result.restocked },
        'Restock alerts triggered',
      );
    }
  });
}

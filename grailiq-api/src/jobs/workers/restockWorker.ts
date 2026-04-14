import { Worker, Job } from 'bullmq';
import { eq, and } from 'drizzle-orm';
import { redis } from '../../config/redis.js';
import { db } from '../../config/database.js';
import { alertSubscriptions, products, users } from '../../db/schema.js';
import { notificationQueue } from '../queues.js';
import { logger } from '../../lib/logger.js';

if (!redis) {
  logger.info('Redis not available — restock worker disabled');
}

const connection = redis ? { host: redis.options.host, port: redis.options.port } : undefined;

/** Retailer check URLs (for future real integration) */
const RETAILER_URLS: Record<string, string> = {
  pokemon_center: 'https://www.pokemoncenter.com',
  amazon: 'https://www.amazon.com',
  target: 'https://www.target.com',
  walmart: 'https://www.walmart.com',
  best_buy: 'https://www.bestbuy.com',
};

interface RestockResult {
  productId: string;
  productName: string;
  retailer: string;
  inStock: boolean;
  price?: number;
  url?: string;
}

/**
 * Check if a product is in stock at a given retailer.
 * Currently uses mock logic — replace with real scraping or API calls per retailer.
 */
async function checkRetailerStock(
  productName: string,
  retailer: string,
): Promise<{ inStock: boolean; price?: number; url?: string }> {
  if (!redis) {
    return { inStock: false };
  }

  // Cache key to avoid re-checking within a short window
  const cacheKey = `restock:${retailer}:${productName.replace(/\s+/g, '_').toLowerCase()}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // TODO: Replace with real retailer checks
  const inStock = Math.random() < 0.05; // 5% chance simulated restock
  const result = {
    inStock,
    price: inStock ? Math.round(Math.random() * 100 + 30) : undefined,
    url: inStock ? `${RETAILER_URLS[retailer] ?? ''}/search?q=${encodeURIComponent(productName)}` : undefined,
  };

  // Cache for 5 minutes to avoid hammering retailers
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

  return result;
}

/**
 * Process restock check jobs.
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

        logger.info({ alertCount: activeAlerts.length }, 'Checking restock for active alerts');

        const results: RestockResult[] = [];
        let notificationsQueued = 0;

        const checkCache = new Map<string, { inStock: boolean; price?: number; url?: string }>();

        for (const alert of activeAlerts) {
          const retailers =
            alert.retailer === 'all'
              ? Object.keys(RETAILER_URLS)
              : [alert.retailer];

          for (const retailer of retailers) {
            const cacheKey = `${retailer}:${alert.productName}`;

            let stockResult = checkCache.get(cacheKey);
            if (!stockResult) {
              try {
                stockResult = await checkRetailerStock(alert.productName, retailer);
                checkCache.set(cacheKey, stockResult);
              } catch (err) {
                logger.warn({ retailer, product: alert.productName, error: err }, 'Retailer check failed');
                continue;
              }
            }

            if (stockResult.inStock && notificationQueue) {
              results.push({
                productId: alert.productId,
                productName: alert.productName,
                retailer,
                inStock: true,
                price: stockResult.price,
                url: stockResult.url,
              });

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
                price: stockResult.price,
                url: stockResult.url,
              });
              notificationsQueued++;
            }
          }
        }

        const duration = Date.now() - startTime;
        logger.info(
          {
            jobId: job.id,
            alertsChecked: activeAlerts.length,
            restocksFound: results.length,
            notificationsQueued,
            duration,
          },
          'Restock check complete',
        );

        return {
          checked: activeAlerts.length,
          restocked: results.length,
          notificationsQueued,
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

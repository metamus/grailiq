import { Worker, Job } from 'bullmq';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { redis } from '../../config/redis.js';
import { db } from '../../config/database.js';
import {
  watchlistItems,
  products,
  users,
  priceHistory,
} from '../../db/schema.js';
import { notificationQueue } from '../queues.js';
import { logger } from '../../lib/logger.js';

if (!redis) logger.info('Redis not available — price target worker disabled');

const connection = redis ? { host: redis.options.host, port: redis.options.port } : undefined;

/**
 * Price target worker.
 *
 * Runs on a schedule (every 10 minutes via scheduler.ts). For every
 * watchlist item with a `target_price` set, compares the latest market
 * price against the target. If `current <= target`, enqueues a
 * notification (subject to per-user prefs in the notificationWorker) and
 * writes a dedupe key so we don't spam the user on every run.
 *
 * Dedupe lives 24 hours per (user, product) — if the price bounces back
 * above target and drops below again next week, we'll notify again.
 */

interface TargetHitPayload {
  type: 'price_target';
  userId: string;
  userEmail: string;
  displayName: string | null;
  watchlistId: string;
  productId: string;
  productName: string;
  productType: string;
  retailer: 'watchlist';
  targetPrice: number;
  currentPrice: number;
}

export const priceTargetWorker = connection
  ? new Worker(
      'price-targets',
      async (job: Job) => {
        const started = Date.now();
        if (!redis) return { checked: 0, reason: 'no_redis' };

        // Pull every watchlist row with a target, joined to product + user
        const rows = await db
          .select({
            watchlistId: watchlistItems.id,
            userId: watchlistItems.userId,
            productId: watchlistItems.productId,
            targetPrice: watchlistItems.targetPrice,
            productName: products.name,
            productType: products.type,
            userEmail: users.email,
            displayName: users.displayName,
          })
          .from(watchlistItems)
          .innerJoin(products, eq(products.id, watchlistItems.productId))
          .innerJoin(users, eq(users.id, watchlistItems.userId))
          .where(isNotNull(watchlistItems.targetPrice));

        if (rows.length === 0) {
          return { checked: 0, hits: 0, duration: Date.now() - started };
        }

        // Latest price per productId in a single query
        const productIds = [...new Set(rows.map((r) => r.productId))];
        const latest = await db
          .selectDistinctOn([priceHistory.productId], {
            productId: priceHistory.productId,
            price: priceHistory.price,
            recordedAt: priceHistory.recordedAt,
          })
          .from(priceHistory)
          .where(inArray(priceHistory.productId, productIds))
          .orderBy(priceHistory.productId, desc(priceHistory.recordedAt));
        const priceMap = new Map(latest.map((r) => [r.productId, parseFloat(r.price)]));

        let hits = 0;
        let notified = 0;
        let deduped = 0;

        for (const row of rows) {
          const current = priceMap.get(row.productId);
          const target = parseFloat(row.targetPrice!);
          if (current == null || !Number.isFinite(target)) continue;
          if (current > target) continue;

          hits++;
          const dedupeKey = `target:sent:${row.userId}:${row.productId}`;
          const already = await redis.get(dedupeKey);
          if (already) {
            deduped++;
            continue;
          }

          if (notificationQueue) {
            const payload: TargetHitPayload = {
              type: 'price_target',
              userId: row.userId,
              userEmail: row.userEmail,
              displayName: row.displayName,
              watchlistId: row.watchlistId,
              productId: row.productId,
              productName: row.productName,
              productType: row.productType,
              retailer: 'watchlist',
              targetPrice: target,
              currentPrice: current,
            };
            await notificationQueue.add('price-target', payload);
            notified++;
          }

          await redis.set(dedupeKey, '1', 'EX', 24 * 60 * 60);
        }

        const duration = Date.now() - started;
        logger.info({ jobId: job.id, rows: rows.length, hits, notified, deduped, duration }, 'Price target sweep');
        return { checked: rows.length, hits, notified, deduped, duration };
      },
      { connection, concurrency: 1 },
    )
  : null;

if (priceTargetWorker) {
  priceTargetWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'priceTargetWorker failed');
  });
}

// Silence unused-import warning for `and` reserved for future filters.
void and;
void sql;

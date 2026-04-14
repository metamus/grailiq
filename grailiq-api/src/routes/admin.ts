import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq, sql, desc } from 'drizzle-orm';
import { syncSetsFromPokemonTCG, generateSealedProductsForSets } from '../services/pokemontcg.js';
import { fetchTCGPlayerPrices } from '../services/tcgplayer.js';
import { fetchEbayPrices } from '../services/ebay.js';
import { db } from '../config/database.js';
import {
  retailerProducts,
  priceHistory,
  products,
  users,
  alertSubscriptions,
  portfolioItems,
  pushTokens,
} from '../db/schema.js';
import {
  priceUpdateQueue,
  restockCheckQueue,
  notificationQueue,
  scoreQueue,
  digestQueue,
} from '../jobs/queues.js';
import { redis } from '../config/redis.js';
import { logger } from '../lib/logger.js';

const retailerEnumValues = [
  'pokemon_center',
  'amazon',
  'target',
  'walmart',
  'best_buy',
] as const;

const retailerMappingSchema = z.object({
  productId: z.string().uuid(),
  retailer: z.enum(retailerEnumValues),
  url: z.string().url(),
  sku: z.string().optional().nullable(),
  isEnabled: z.boolean().optional().default(true),
});

const bulkMappingSchema = z.object({
  mappings: z.array(retailerMappingSchema).min(1).max(500),
});

/**
 * Admin routes for data pipeline management.
 * In production, these should be protected by an admin middleware.
 * For now, they're open for development convenience.
 */
export async function adminRoutes(app: FastifyInstance) {
  /**
   * POST /admin/sync-catalog
   * Sync all Pokemon TCG sets from pokemontcg.io and generate sealed products
   */
  app.post('/admin/sync-catalog', async (_request, reply) => {
    try {
      logger.info('Admin: Starting catalog sync...');

      // Step 1: Sync sets from Pokemon TCG API
      const setsCount = await syncSetsFromPokemonTCG();

      // Step 2: Generate sealed products for new sets
      const productsCount = await generateSealedProductsForSets();

      return reply.send({
        success: true,
        data: {
          setsUpserted: setsCount,
          productsGenerated: productsCount,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Catalog sync failed');
      return reply.status(500).send({
        success: false,
        error: 'Catalog sync failed',
        message: (error as Error).message,
      });
    }
  });

  /**
   * POST /admin/retailer-mappings
   *
   * Bulk-upsert retailer product mappings (URL + SKU per retailer per product).
   * These mappings are what the restock worker actually checks — without a
   * mapping for a product/retailer pair the worker logs `mappingsMissing` and
   * skips that pair.
   *
   * Body: `{ mappings: [{ productId, retailer, url, sku?, isEnabled? }] }`
   *
   * Upsert key: (product_id, retailer, url). Re-posting the same URL updates
   * the row (e.g. to change sku or toggle isEnabled) without creating a dup.
   */
  app.post('/admin/retailer-mappings', async (request, reply) => {
    const parsed = bulkMappingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ success: false, error: 'Validation failed', details: parsed.error.issues });
    }

    let upserted = 0;
    let updated = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < parsed.data.mappings.length; i++) {
      const m = parsed.data.mappings[i];
      try {
        // Try insert; on conflict on (product_id, retailer, url) update fields.
        const existing = await db
          .select({ id: retailerProducts.id })
          .from(retailerProducts)
          .where(
            and(
              eq(retailerProducts.productId, m.productId),
              eq(retailerProducts.retailer, m.retailer),
              eq(retailerProducts.url, m.url),
            ),
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(retailerProducts)
            .set({
              sku: m.sku ?? null,
              isEnabled: m.isEnabled ?? true,
              updatedAt: new Date(),
            })
            .where(eq(retailerProducts.id, existing[0].id));
          updated++;
        } else {
          await db.insert(retailerProducts).values({
            productId: m.productId,
            retailer: m.retailer,
            url: m.url,
            sku: m.sku ?? null,
            isEnabled: m.isEnabled ?? true,
          });
          upserted++;
        }
      } catch (err) {
        errors.push({ index: i, error: (err as Error).message });
      }
    }

    return reply.send({
      success: true,
      data: { inserted: upserted, updated, failed: errors.length, errors },
    });
  });

  /**
   * POST /admin/fetch-prices
   * Manually trigger a price fetch for all products
   */
  app.post('/admin/fetch-prices', async (request, reply) => {
    const { tier = 'hot' } = request.body as { tier?: string };

    try {
      logger.info({ tier }, 'Admin: Starting manual price fetch...');

      const [tcgResults, ebayResults] = await Promise.allSettled([
        fetchTCGPlayerPrices(tier),
        fetchEbayPrices(tier),
      ]);

      const tcgCount = tcgResults.status === 'fulfilled' ? tcgResults.value : 0;
      const ebayCount = ebayResults.status === 'fulfilled' ? ebayResults.value : 0;

      return reply.send({
        success: true,
        data: { tcgCount, ebayCount, tier },
      });
    } catch (error) {
      logger.error({ error }, 'Price fetch failed');
      return reply.status(500).send({
        success: false,
        error: 'Price fetch failed',
        message: (error as Error).message,
      });
    }
  });

  /**
   * GET /admin/retailer-mappings?limit=50&offset=0
   * List all retailer mappings with joined product name for the editor UI.
   */
  app.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/admin/retailer-mappings',
    async (request, reply) => {
      const limit = Math.min(500, Math.max(1, parseInt(request.query.limit ?? '100', 10)));
      const offset = Math.max(0, parseInt(request.query.offset ?? '0', 10));

      const rows = await db
        .select({
          id: retailerProducts.id,
          productId: retailerProducts.productId,
          productName: products.name,
          retailer: retailerProducts.retailer,
          url: retailerProducts.url,
          sku: retailerProducts.sku,
          isEnabled: retailerProducts.isEnabled,
          lastInStock: retailerProducts.lastInStock,
          lastCheckedAt: retailerProducts.lastCheckedAt,
          lastPrice: retailerProducts.lastPrice,
          lastError: retailerProducts.lastError,
        })
        .from(retailerProducts)
        .innerJoin(products, eq(products.id, retailerProducts.productId))
        .orderBy(desc(retailerProducts.updatedAt))
        .limit(limit)
        .offset(offset);

      const [{ n }] = await db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(retailerProducts);

      return reply.send({ data: rows, total: n, limit, offset });
    },
  );

  /**
   * PATCH /admin/retailer-mappings/:id
   * Body: { url?, sku?, isEnabled? } — partial update
   */
  app.patch<{ Params: { id: string }; Body: { url?: string; sku?: string | null; isEnabled?: boolean } }>(
    '/admin/retailer-mappings/:id',
    async (request, reply) => {
      const patch = request.body ?? {};
      const [updated] = await db
        .update(retailerProducts)
        .set({
          url: patch.url ?? undefined,
          sku: patch.sku === undefined ? undefined : patch.sku,
          isEnabled: patch.isEnabled ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(retailerProducts.id, request.params.id))
        .returning();
      if (!updated) return reply.status(404).send({ error: 'not_found' });
      return reply.send({ data: updated });
    },
  );

  /** DELETE /admin/retailer-mappings/:id */
  app.delete<{ Params: { id: string } }>(
    '/admin/retailer-mappings/:id',
    async (request, reply) => {
      const deleted = await db
        .delete(retailerProducts)
        .where(eq(retailerProducts.id, request.params.id))
        .returning();
      if (deleted.length === 0) return reply.status(404).send({ error: 'not_found' });
      return reply.send({ data: deleted[0] });
    },
  );

  /**
   * GET /admin/health
   *
   * Operational observability snapshot. No auth on purpose — this is safe
   * to expose (counts only, no PII) and lets you wire a status page or
   * Uptime Robot check without a token.
   *
   * Returns:
   *   - counts: products, sets, users, portfolio items, alerts, push tokens,
   *     retailer mappings
   *   - price feed health: most-recent recorded_at, rows in last 1h / 24h
   *   - restock worker health: enabled mappings count, last-checked summary,
   *     adapter error distribution from `last_error`
   *   - queue depths: wait/active/completed/failed per queue
   *   - signal distribution: count per investment_signal
   */
  app.get('/admin/health', async (_request, reply) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      productCount,
      usersByTier,
      portfolioCount,
      activeAlertCount,
      pushTokenCount,
      mappingCount,
      mappingsEnabled,
      mappingsInStock,
      latestPrice,
      pricesLastHour,
      pricesLastDay,
      signalDist,
      retailerErrors,
    ] = await Promise.all([
      db.select({ n: sql<number>`COUNT(*)::int` }).from(products),
      db
        .select({ tier: users.subscriptionTier, n: sql<number>`COUNT(*)::int` })
        .from(users)
        .groupBy(users.subscriptionTier),
      db.select({ n: sql<number>`COUNT(*)::int` }).from(portfolioItems),
      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(alertSubscriptions)
        .where(eq(alertSubscriptions.isActive, true)),
      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(pushTokens)
        .where(eq(pushTokens.isEnabled, true)),
      db.select({ n: sql<number>`COUNT(*)::int` }).from(retailerProducts),
      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(retailerProducts)
        .where(eq(retailerProducts.isEnabled, true)),
      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(retailerProducts)
        .where(
          and(
            eq(retailerProducts.isEnabled, true),
            eq(retailerProducts.lastInStock, true),
          ),
        ),
      db
        .select({ at: sql<Date>`MAX(recorded_at)` })
        .from(priceHistory),
      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(priceHistory)
        .where(sql`recorded_at > ${oneHourAgo.toISOString()}`),
      db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(priceHistory)
        .where(sql`recorded_at > ${oneDayAgo.toISOString()}`),
      db
        .select({ signal: products.investmentSignal, n: sql<number>`COUNT(*)::int` })
        .from(products)
        .groupBy(products.investmentSignal),
      db
        .select({
          error: retailerProducts.lastError,
          retailer: retailerProducts.retailer,
          n: sql<number>`COUNT(*)::int`,
        })
        .from(retailerProducts)
        .where(sql`last_error IS NOT NULL`)
        .groupBy(retailerProducts.lastError, retailerProducts.retailer)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10),
    ]);

    // Queue depths (best-effort — Redis may not be available in dev).
    const queueStats: Record<string, unknown> = {};
    async function snapshot(q: typeof priceUpdateQueue, name: string) {
      if (!q) {
        queueStats[name] = { status: 'offline' };
        return;
      }
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          q.getWaitingCount(),
          q.getActiveCount(),
          q.getCompletedCount(),
          q.getFailedCount(),
          q.getDelayedCount(),
        ]);
        queueStats[name] = { waiting, active, completed, failed, delayed };
      } catch (err) {
        queueStats[name] = { status: 'error', error: (err as Error).message };
      }
    }
    await Promise.all([
      snapshot(priceUpdateQueue, 'priceUpdates'),
      snapshot(restockCheckQueue, 'restockChecks'),
      snapshot(notificationQueue, 'notifications'),
      snapshot(scoreQueue, 'scores'),
      snapshot(digestQueue, 'digests'),
    ]);

    const now = new Date();
    const priceFeedLatencyMs = latestPrice[0]?.at
      ? now.getTime() - new Date(latestPrice[0].at).getTime()
      : null;

    return reply.send({
      ok: true,
      serverTime: now.toISOString(),
      uptime: {
        priceFeed: {
          latestRecordedAt: latestPrice[0]?.at ?? null,
          latencyMs: priceFeedLatencyMs,
          rowsLastHour: pricesLastHour[0]?.n ?? 0,
          rowsLastDay: pricesLastDay[0]?.n ?? 0,
        },
        redis: redis ? 'connected' : 'offline',
      },
      counts: {
        products: productCount[0]?.n ?? 0,
        portfolioItems: portfolioCount[0]?.n ?? 0,
        activeAlerts: activeAlertCount[0]?.n ?? 0,
        enabledPushTokens: pushTokenCount[0]?.n ?? 0,
        retailerMappingsTotal: mappingCount[0]?.n ?? 0,
        retailerMappingsEnabled: mappingsEnabled[0]?.n ?? 0,
        retailerMappingsInStock: mappingsInStock[0]?.n ?? 0,
      },
      usersByTier: usersByTier.reduce<Record<string, number>>((acc, r) => {
        acc[r.tier] = r.n;
        return acc;
      }, {}),
      signalDistribution: signalDist.reduce<Record<string, number>>((acc, r) => {
        acc[r.signal ?? 'unscored'] = r.n;
        return acc;
      }, {}),
      topRetailerErrors: retailerErrors.map((r) => ({
        retailer: r.retailer,
        error: r.error,
        count: r.n,
      })),
      queues: queueStats,
    });
  });
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { syncSetsFromPokemonTCG, generateSealedProductsForSets } from '../services/pokemontcg.js';
import { fetchTCGPlayerPrices } from '../services/tcgplayer.js';
import { fetchEbayPrices } from '../services/ebay.js';
import { db } from '../config/database.js';
import { retailerProducts } from '../db/schema.js';
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
}

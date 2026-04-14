import { FastifyInstance } from 'fastify';
import { syncSetsFromPokemonTCG, generateSealedProductsForSets } from '../services/pokemontcg.js';
import { fetchTCGPlayerPrices } from '../services/tcgplayer.js';
import { fetchEbayPrices } from '../services/ebay.js';
import { logger } from '../lib/logger.js';

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

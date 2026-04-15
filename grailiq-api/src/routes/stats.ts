import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { products, sets } from '../db/schema.js';
import { count } from 'drizzle-orm';

/**
 * Statistics routes
 * GET /api/v1/stats — returns platform statistics
 */

export async function statsRoutes(app: FastifyInstance) {
  /** Get platform statistics */
  app.get('/stats', async (_request, reply) => {
    try {
      // Count total products
      const [productsResult] = await db
        .select({ count: count() })
        .from(products);
      const totalProducts = productsResult.count;

      // Count total sets
      const [setsResult] = await db
        .select({ count: count() })
        .from(sets);
      const totalSets = setsResult.count;

      // Count buy signals
      const allProducts = await db.select({ signal: products.investmentSignal }).from(products);
      const buySignals = allProducts.filter((p) => p.signal === 'buy').length;

      // Average score
      const scoredProducts = allProducts
        .map((p) => parseFloat(p.signal || '0'))
        .filter((s) => !isNaN(s));
      const avgScore =
        scoredProducts.length > 0
          ? scoredProducts.reduce((a, b) => a + b, 0) / scoredProducts.length
          : 0;

      return reply.send({
        data: {
          totalProducts,
          totalSets,
          buySignals,
          avgScore: parseFloat(avgScore.toFixed(1)),
        },
      });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

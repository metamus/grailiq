import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { products, priceHistory, scoreHistory } from '../db/schema.js';
import { eq, desc, sql, inArray, and, gte } from 'drizzle-orm';

/** Register product-related API routes */
export async function productRoutes(app: FastifyInstance) {
  /** List all products */
  app.get('/products', async (_request, reply) => {
    const allProducts = await db.select().from(products);
    return reply.send({ data: allProducts });
  });

  /** Get a single product by ID */
  app.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    const { id } = request.params;
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    return reply.send({ data: product });
  });

  /** Get price history for a product */
  app.get<{ Params: { id: string }; Querystring: { days?: string } }>(
    '/products/:id/price-history',
    async (request, reply) => {
      const { id } = request.params;
      const days = parseInt(request.query.days || '30', 10);

      const since = new Date();
      since.setDate(since.getDate() - days);

      const history = await db
        .select()
        .from(priceHistory)
        .where(eq(priceHistory.productId, id))
        .orderBy(desc(priceHistory.recordedAt));

      return reply.send({ data: history });
    },
  );

  /**
   * GET /products/movers?days=7
   *
   * Real week-over-week (or N-day) movers using score_history snapshots.
   * Returns products sorted by absolute score delta with direction.
   * Response: { data: [{ product, scoreNow, scorePrior, delta, direction }] }
   */
  app.get<{ Querystring: { days?: string; limit?: string } }>(
    '/products/movers',
    async (request, reply) => {
      const days = Math.min(365, Math.max(1, parseInt(request.query.days || '7', 10)));
      const limit = Math.min(50, Math.max(1, parseInt(request.query.limit || '10', 10)));

      const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Grab the earliest score_history row per product since `windowStart`
      // using DISTINCT ON. This is our "score N days ago" reference.
      const priorSnapshots = await db
        .selectDistinctOn([scoreHistory.productId], {
          productId: scoreHistory.productId,
          score: scoreHistory.score,
          signal: scoreHistory.signal,
          recordedAt: scoreHistory.recordedAt,
        })
        .from(scoreHistory)
        .where(gte(scoreHistory.recordedAt, windowStart))
        .orderBy(scoreHistory.productId, scoreHistory.recordedAt);

      if (priorSnapshots.length === 0) {
        return reply.send({ data: [], note: 'insufficient_history' });
      }

      const productIds = priorSnapshots.map((s) => s.productId);
      const currentProducts = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      const productMap = new Map(currentProducts.map((p) => [p.id, p]));

      const movers = priorSnapshots
        .map((prior) => {
          const product = productMap.get(prior.productId);
          if (!product || !product.grailiqScore) return null;
          const now = parseFloat(product.grailiqScore);
          const then = parseFloat(prior.score);
          const delta = now - then;
          return { product, scoreNow: now, scorePrior: then, delta };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, limit)
        .map((m) => ({
          ...m,
          direction: m.delta > 0 ? 'up' : m.delta < 0 ? 'down' : 'flat',
        }));

      return reply.send({ data: movers, windowDays: days });
    },
  );
}
// Silence unused-import linters — `and` reserved for future filters.
void and;

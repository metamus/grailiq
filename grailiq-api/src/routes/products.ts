import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { products, priceHistory } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

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
}

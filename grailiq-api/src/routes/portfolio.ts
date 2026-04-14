import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { portfolioItems, products, priceHistory } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  purchasePrice: z.number().positive(),
  purchaseDate: z.string().optional(),
  source: z.enum(['pokemon_center', 'amazon', 'target', 'walmart', 'best_buy', 'lgs', 'ebay', 'other']).optional(),
  notes: z.string().max(500).optional(),
});

/** Register portfolio API routes */
export async function portfolioRoutes(app: FastifyInstance) {
  // All portfolio routes require authentication
  app.addHook('preHandler', requireAuth);

  /** Get user's portfolio with current values */
  app.get('/portfolio', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const items = await db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.userId, user.id));

    return reply.send({ data: items });
  });

  /** Add item to portfolio */
  app.post('/portfolio', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const parsed = addItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { productId, quantity, purchasePrice, purchaseDate, source, notes } = parsed.data;

    const [item] = await db.insert(portfolioItems).values({
      userId: user.id,
      productId,
      quantity,
      purchasePrice: purchasePrice.toString(),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      source: source ?? null,
      notes: notes ?? null,
    }).returning();

    return reply.status(201).send({ data: item });
  });

  /** Delete portfolio item */
  app.delete<{ Params: { id: string } }>('/portfolio/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const { id } = request.params;

    const deleted = await db
      .delete(portfolioItems)
      .where(and(eq(portfolioItems.id, id), eq(portfolioItems.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return reply.status(404).send({ error: 'Portfolio item not found' });
    }

    return reply.send({ data: deleted[0] });
  });
}

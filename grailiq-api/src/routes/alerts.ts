import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { alertSubscriptions, products, sets } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const createAlertSchema = z.object({
  productId: z.string().uuid(),
  retailer: z
    .enum(['pokemon_center', 'amazon', 'target', 'walmart', 'best_buy', 'all'])
    .optional()
    .default('all'),
});

/** Register alert subscription API routes */
export async function alertRoutes(app: FastifyInstance) {
  // All alert routes require authentication
  app.addHook('preHandler', requireAuth);

  /** Get user's active alerts */
  app.get('/alerts', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const alerts = await db
      .select({
        id: alertSubscriptions.id,
        productId: alertSubscriptions.productId,
        retailer: alertSubscriptions.retailer,
        isActive: alertSubscriptions.isActive,
        createdAt: alertSubscriptions.createdAt,
        productName: products.name,
        productType: products.type,
        setName: sets.name,
      })
      .from(alertSubscriptions)
      .leftJoin(products, eq(alertSubscriptions.productId, products.id))
      .leftJoin(sets, eq(products.setId, sets.id))
      .where(eq(alertSubscriptions.userId, user.id));

    return reply.send({ data: alerts });
  });

  /** Create a new restock alert */
  app.post('/alerts', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const parsed = createAlertSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { productId, retailer } = parsed.data;

    // Check for duplicate alert
    const existing = await db
      .select()
      .from(alertSubscriptions)
      .where(
        and(
          eq(alertSubscriptions.userId, user.id),
          eq(alertSubscriptions.productId, productId),
          eq(alertSubscriptions.retailer, retailer),
        ),
      );

    if (existing.length > 0) {
      return reply.status(409).send({ error: 'Alert already exists for this product/retailer' });
    }

    const [alert] = await db
      .insert(alertSubscriptions)
      .values({
        userId: user.id,
        productId,
        retailer,
      })
      .returning();

    return reply.status(201).send({ data: alert });
  });

  /** Toggle alert active/inactive */
  app.patch<{ Params: { id: string } }>('/alerts/:id/toggle', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const { id } = request.params;

    // Fetch current state
    const [current] = await db
      .select()
      .from(alertSubscriptions)
      .where(and(eq(alertSubscriptions.id, id), eq(alertSubscriptions.userId, user.id)));

    if (!current) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    const [updated] = await db
      .update(alertSubscriptions)
      .set({ isActive: !current.isActive })
      .where(eq(alertSubscriptions.id, id))
      .returning();

    return reply.send({ data: updated });
  });

  /** Delete an alert */
  app.delete<{ Params: { id: string } }>('/alerts/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const { id } = request.params;

    const deleted = await db
      .delete(alertSubscriptions)
      .where(and(eq(alertSubscriptions.id, id), eq(alertSubscriptions.userId, user.id)))
      .returning();

    if (deleted.length === 0) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    return reply.send({ data: deleted[0] });
  });
}

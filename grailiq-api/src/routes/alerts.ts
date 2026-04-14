import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { alertSubscriptions, products } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

/** Free-tier active alert cap. Paid tiers are unlimited. */
const FREE_TIER_ALERT_CAP = 3;

const createAlertSchema = z.object({
  productId: z.string().uuid(),
  retailer: z
    .enum(['pokemon_center', 'amazon', 'target', 'walmart', 'best_buy', 'all'])
    .optional()
    .default('all'),
});

const toggleBodySchema = z.object({
  isActive: z.boolean(),
});

/** Register alert subscription API routes */
export async function alertRoutes(app: FastifyInstance) {
  // All alert routes require authentication
  app.addHook('preHandler', requireAuth);

  /**
   * GET /alerts
   *
   * Returns the user's alert subscriptions with the joined product object
   * (nested, not flattened) so web and mobile clients can render rich cards.
   */
  app.get('/alerts', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const rows = await db
      .select({
        id: alertSubscriptions.id,
        productId: alertSubscriptions.productId,
        retailer: alertSubscriptions.retailer,
        isActive: alertSubscriptions.isActive,
        createdAt: alertSubscriptions.createdAt,
        product: products,
      })
      .from(alertSubscriptions)
      .innerJoin(products, eq(alertSubscriptions.productId, products.id))
      .where(eq(alertSubscriptions.userId, user.id))
      .orderBy(desc(alertSubscriptions.createdAt));

    return reply.send({ data: rows });
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

    // Free tier cap on active alerts
    if ((user.subscriptionTier ?? 'free') === 'free') {
      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(alertSubscriptions)
        .where(
          and(eq(alertSubscriptions.userId, user.id), eq(alertSubscriptions.isActive, true)),
        );
      if (count >= FREE_TIER_ALERT_CAP) {
        return reply.status(402).send({
          error: 'free_tier_limit',
          detail: `Free plan supports up to ${FREE_TIER_ALERT_CAP} active alerts. Pause existing or upgrade to Collector for unlimited.`,
          currentCount: count,
          limit: FREE_TIER_ALERT_CAP,
          upgradeUrl: '/app/pricing',
        });
      }
    }

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

  /**
   * PATCH /alerts/:id
   *
   * Body: `{ isActive: boolean }` — set the alert's active state explicitly.
   * Clients can use this to pause or resume without needing to know current state.
   */
  app.patch<{ Params: { id: string } }>('/alerts/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const { id } = request.params;
    const parsed = toggleBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const [updated] = await db
      .update(alertSubscriptions)
      .set({ isActive: parsed.data.isActive })
      .where(and(eq(alertSubscriptions.id, id), eq(alertSubscriptions.userId, user.id)))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Alert not found' });
    }

    return reply.send({ data: updated });
  });

  /**
   * PATCH /alerts/:id/toggle — legacy toggle endpoint, kept for back-compat.
   * Flips the active state without needing a body.
   */
  app.patch<{ Params: { id: string } }>('/alerts/:id/toggle', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const { id } = request.params;

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

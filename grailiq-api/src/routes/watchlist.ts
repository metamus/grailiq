import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../config/database.js';
import { watchlistItems, products, priceHistory } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const addSchema = z.object({
  productId: z.string().uuid(),
  note: z.string().max(500).optional(),
  targetPrice: z.number().positive().optional(),
});

const updateSchema = z.object({
  note: z.string().max(500).nullable().optional(),
  targetPrice: z.number().positive().nullable().optional(),
});

/**
 * Watchlist routes.
 *
 *   GET    /watchlist           list with joined product + latest price
 *   POST   /watchlist           add (409 if already present)
 *   PATCH  /watchlist/:id       edit note / target price
 *   DELETE /watchlist/:id       remove
 *   POST   /watchlist/toggle    convenience — add or remove by productId
 */
export async function watchlistRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/watchlist', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });

    const rows = await db
      .select({ item: watchlistItems, product: products })
      .from(watchlistItems)
      .innerJoin(products, eq(products.id, watchlistItems.productId))
      .where(eq(watchlistItems.userId, user.id))
      .orderBy(desc(watchlistItems.createdAt));

    if (rows.length === 0) return reply.send({ data: [] });

    // Enrich with latest price
    const productIds = rows.map((r) => r.product.id);
    const latest = await db
      .selectDistinctOn([priceHistory.productId], {
        productId: priceHistory.productId,
        price: priceHistory.price,
      })
      .from(priceHistory)
      .where(inArray(priceHistory.productId, productIds))
      .orderBy(priceHistory.productId, desc(priceHistory.recordedAt));
    const priceMap = new Map(latest.map((r) => [r.productId, parseFloat(r.price)]));

    return reply.send({
      data: rows.map(({ item, product }) => ({
        id: item.id,
        productId: item.productId,
        note: item.note,
        targetPrice: item.targetPrice,
        createdAt: item.createdAt,
        product: {
          id: product.id,
          name: product.name,
          type: product.type,
          msrp: product.msrp,
          imageUrl: product.imageUrl,
          grailiqScore: product.grailiqScore,
          investmentSignal: product.investmentSignal,
        },
        currentPrice: priceMap.get(product.id) ?? null,
      })),
    });
  });

  app.post('/watchlist', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });
    const parsed = addSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_failed', details: parsed.error.issues });
    }

    const existing = await db
      .select({ id: watchlistItems.id })
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, user.id), eq(watchlistItems.productId, parsed.data.productId)))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: 'already_watching', data: existing[0] });
    }

    const [inserted] = await db
      .insert(watchlistItems)
      .values({
        userId: user.id,
        productId: parsed.data.productId,
        note: parsed.data.note ?? null,
        targetPrice: parsed.data.targetPrice?.toFixed(2) ?? null,
      })
      .returning();
    return reply.status(201).send({ data: inserted });
  });

  app.patch<{ Params: { id: string } }>('/watchlist/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_failed', details: parsed.error.issues });
    }

    const [updated] = await db
      .update(watchlistItems)
      .set({
        note: parsed.data.note ?? undefined,
        targetPrice:
          parsed.data.targetPrice === null
            ? null
            : parsed.data.targetPrice !== undefined
              ? parsed.data.targetPrice.toFixed(2)
              : undefined,
      })
      .where(and(eq(watchlistItems.id, request.params.id), eq(watchlistItems.userId, user.id)))
      .returning();

    if (!updated) return reply.status(404).send({ error: 'not_found' });
    return reply.send({ data: updated });
  });

  app.delete<{ Params: { id: string } }>('/watchlist/:id', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });
    const deleted = await db
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.id, request.params.id), eq(watchlistItems.userId, user.id)))
      .returning();
    if (deleted.length === 0) return reply.status(404).send({ error: 'not_found' });
    return reply.send({ data: deleted[0] });
  });

  /**
   * POST /watchlist/toggle  Body: { productId }
   * Adds if not present, removes if present. Returns the resulting state.
   */
  app.post<{ Body: { productId: string } }>('/watchlist/toggle', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });
    const productId = request.body?.productId;
    if (!productId) return reply.status(400).send({ error: 'missing_product_id' });

    const existing = await db
      .select({ id: watchlistItems.id })
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, user.id), eq(watchlistItems.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(watchlistItems).where(eq(watchlistItems.id, existing[0].id));
      return reply.send({ data: { watching: false } });
    }

    const [inserted] = await db
      .insert(watchlistItems)
      .values({ userId: user.id, productId })
      .returning();
    return reply.send({ data: { watching: true, id: inserted.id } });
  });
}

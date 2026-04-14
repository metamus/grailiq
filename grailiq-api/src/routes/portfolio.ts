import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { portfolioItems, products, priceHistory } from '../db/schema.js';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  purchasePrice: z.number().positive(),
  purchaseDate: z.string().optional(),
  source: z
    .enum(['pokemon_center', 'amazon', 'target', 'walmart', 'best_buy', 'lgs', 'ebay', 'other'])
    .optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Get the latest known price for each product in `productIds`.
 * Uses a single SQL query with DISTINCT ON for efficiency.
 */
async function getLatestPricesForProducts(
  productIds: string[]
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  // DISTINCT ON gives us the most recent row per product_id.
  const rows = await db
    .selectDistinctOn([priceHistory.productId], {
      productId: priceHistory.productId,
      price: priceHistory.price,
      marketPrice: priceHistory.marketPrice,
      recordedAt: priceHistory.recordedAt,
    })
    .from(priceHistory)
    .where(inArray(priceHistory.productId, productIds))
    .orderBy(priceHistory.productId, desc(priceHistory.recordedAt));

  const map = new Map<string, number>();
  for (const row of rows) {
    const value = parseFloat(row.marketPrice || row.price || '0');
    if (value > 0) map.set(row.productId, value);
  }
  return map;
}

/** Register portfolio API routes */
export async function portfolioRoutes(app: FastifyInstance) {
  // All portfolio routes require authentication
  app.addHook('preHandler', requireAuth);

  /**
   * GET /portfolio
   *
   * Returns the user's portfolio items enriched with the joined product
   * record, current market price, per-item P&L, and an aggregated summary
   * (total value, cost basis, unrealized P&L, best/worst holdings).
   */
  app.get('/portfolio', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    // Pull holdings joined to product metadata in one shot
    const rows = await db
      .select({
        item: portfolioItems,
        product: products,
      })
      .from(portfolioItems)
      .innerJoin(products, eq(products.id, portfolioItems.productId))
      .where(eq(portfolioItems.userId, user.id));

    if (rows.length === 0) {
      return reply.send({
        data: [],
        summary: {
          totalValue: 0,
          costBasis: 0,
          unrealizedPnl: 0,
          unrealizedPnlPct: 0,
          holdings: 0,
          uniqueProducts: 0,
          bestHolding: null,
          worstHolding: null,
        },
      });
    }

    const productIds = [...new Set(rows.map((r) => r.item.productId))];
    const latestPrices = await getLatestPricesForProducts(productIds);

    let totalValue = 0;
    let costBasis = 0;

    const enriched = rows.map(({ item, product }) => {
      const quantity = item.quantity;
      const purchasePrice = parseFloat(item.purchasePrice);
      const currentPrice = latestPrices.get(item.productId) ?? purchasePrice;

      const itemValue = currentPrice * quantity;
      const itemCost = purchasePrice * quantity;
      const itemPnl = itemValue - itemCost;
      const itemPnlPct = itemCost > 0 ? (itemPnl / itemCost) * 100 : 0;

      totalValue += itemValue;
      costBasis += itemCost;

      return {
        id: item.id,
        productId: item.productId,
        quantity,
        purchasePrice: item.purchasePrice,
        purchaseDate: item.purchaseDate,
        source: item.source,
        notes: item.notes,
        createdAt: item.createdAt,
        product: {
          id: product.id,
          name: product.name,
          type: product.type,
          imageUrl: product.imageUrl,
          msrp: product.msrp,
          grailiqScore: product.grailiqScore,
          investmentSignal: product.investmentSignal,
        },
        currentPrice: currentPrice.toFixed(2),
        currentValue: itemValue.toFixed(2),
        unrealizedPnl: itemPnl.toFixed(2),
        unrealizedPnlPct: itemPnlPct.toFixed(2),
      };
    });

    const pnl = totalValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    // Best / worst by absolute $ gain
    const sortedByPnl = [...enriched].sort(
      (a, b) => parseFloat(b.unrealizedPnl) - parseFloat(a.unrealizedPnl)
    );
    const bestHolding = sortedByPnl[0] ?? null;
    const worstHolding = sortedByPnl[sortedByPnl.length - 1] ?? null;

    return reply.send({
      data: enriched,
      summary: {
        totalValue: totalValue.toFixed(2),
        costBasis: costBasis.toFixed(2),
        unrealizedPnl: pnl.toFixed(2),
        unrealizedPnlPct: pnlPct.toFixed(2),
        holdings: enriched.length,
        uniqueProducts: productIds.length,
        bestHolding: bestHolding
          ? {
              id: bestHolding.id,
              name: bestHolding.product.name,
              pnl: bestHolding.unrealizedPnl,
              pnlPct: bestHolding.unrealizedPnlPct,
            }
          : null,
        worstHolding:
          worstHolding && worstHolding !== bestHolding
            ? {
                id: worstHolding.id,
                name: worstHolding.product.name,
                pnl: worstHolding.unrealizedPnl,
                pnlPct: worstHolding.unrealizedPnlPct,
              }
            : null,
      },
    });
  });

  /** Add item to portfolio */
  app.post('/portfolio', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const parsed = addItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { productId, quantity, purchasePrice, purchaseDate, source, notes } = parsed.data;

    const [item] = await db
      .insert(portfolioItems)
      .values({
        userId: user.id,
        productId,
        quantity,
        purchasePrice: purchasePrice.toString(),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        source: source ?? null,
        notes: notes ?? null,
      })
      .returning();

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

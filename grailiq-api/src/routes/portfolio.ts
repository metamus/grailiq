import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { portfolioItems, products, priceHistory, sets } from '../db/schema.js';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { requireAuth, requireTier } from '../middleware/auth.js';
import { z } from 'zod';
import { generateInsurancePdf } from '../services/insurancePdf.js';

/** Free-tier portfolio item cap. Paid tiers are unlimited. */
const FREE_TIER_ITEM_CAP = 25;

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

    // Free tier cap: block new items past the limit but let existing items
    // edit/delete. Paid tiers have no cap.
    if ((user.subscriptionTier ?? 'free') === 'free') {
      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(portfolioItems)
        .where(eq(portfolioItems.userId, user.id));
      if (count >= FREE_TIER_ITEM_CAP) {
        return reply.status(402).send({
          error: 'free_tier_limit',
          detail: `Free plan supports up to ${FREE_TIER_ITEM_CAP} portfolio items. Upgrade to Collector for unlimited.`,
          currentCount: count,
          limit: FREE_TIER_ITEM_CAP,
          upgradeUrl: '/app/pricing',
        });
      }
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

  /**
   * GET /portfolio/export.pdf
   *
   * Collector / Investor tier only. Streams an insurance-grade portfolio
   * statement with per-holding cost basis, current value, and P&L, plus a
   * summary. Response is a `application/pdf` stream — the client can save
   * or print.
   */
  app.get(
    '/portfolio/export.pdf',
    { preHandler: [requireTier('collector')] },
    async (request, reply) => {
      const user = (request as any).user;
      if (!user) return reply.status(401).send({ error: 'User not found' });

      const rows = await db
        .select({
          item: portfolioItems,
          product: products,
          setName: sets.name,
          setCode: sets.code,
        })
        .from(portfolioItems)
        .innerJoin(products, eq(products.id, portfolioItems.productId))
        .innerJoin(sets, eq(sets.id, products.setId))
        .where(eq(portfolioItems.userId, user.id))
        .orderBy(desc(portfolioItems.createdAt));

      const productIds = [...new Set(rows.map((r) => r.item.productId))];
      const latestPrices = await getLatestPricesForProducts(productIds);

      let totalValue = 0;
      let costBasis = 0;

      const holdings = rows.map(({ item, product, setName, setCode }) => {
        const quantity = item.quantity;
        const purchasePrice = parseFloat(item.purchasePrice);
        const currentPrice = latestPrices.get(item.productId) ?? purchasePrice;

        const itemValue = currentPrice * quantity;
        const itemCost = purchasePrice * quantity;
        totalValue += itemValue;
        costBasis += itemCost;

        return {
          productName: product.name,
          setName,
          setCode,
          quantity,
          purchaseDate: item.purchaseDate,
          costBasis: itemCost,
          currentValue: itemValue,
          unrealizedPnl: itemValue - itemCost,
        };
      });

      const stream = generateInsurancePdf({
        user: { displayName: user.displayName ?? null, email: user.email },
        summary: {
          totalValue,
          costBasis,
          unrealizedPnl: totalValue - costBasis,
          holdings: holdings.length,
          uniqueProducts: productIds.length,
        },
        holdings,
      });

      reply
        .header(
          'Content-Disposition',
          `attachment; filename="grailiq-portfolio-${new Date().toISOString().slice(0, 10)}.pdf"`,
        )
        .type('application/pdf');
      return reply.send(stream);
    },
  );

  /**
   * GET /portfolio/export.csv
   *
   * CSV export for tax / spreadsheet workflows. Columns:
   *   product, set_name, set_code, type, quantity, purchase_price,
   *   purchase_date, current_price, cost_basis, current_value,
   *   unrealized_pnl, unrealized_pnl_pct
   *
   * Available to all tiers — csv is a baseline capability.
   */
  app.get('/portfolio/export.csv', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const rows = await db
      .select({
        item: portfolioItems,
        product: products,
        setName: sets.name,
        setCode: sets.code,
      })
      .from(portfolioItems)
      .innerJoin(products, eq(products.id, portfolioItems.productId))
      .innerJoin(sets, eq(sets.id, products.setId))
      .where(eq(portfolioItems.userId, user.id))
      .orderBy(desc(portfolioItems.createdAt));

    const productIds = [...new Set(rows.map((r) => r.item.productId))];
    const latestPrices = await getLatestPricesForProducts(productIds);

    const lines: string[] = [
      'product,set_name,set_code,type,quantity,purchase_price,purchase_date,current_price,cost_basis,current_value,unrealized_pnl,unrealized_pnl_pct',
    ];
    for (const { item, product, setName, setCode } of rows) {
      const qty = item.quantity;
      const pPrice = parseFloat(item.purchasePrice);
      const cur = latestPrices.get(item.productId) ?? pPrice;
      const costBasis = pPrice * qty;
      const currentValue = cur * qty;
      const pnl = currentValue - costBasis;
      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      const purchaseDate = item.purchaseDate
        ? new Date(item.purchaseDate).toISOString().slice(0, 10)
        : '';
      lines.push(
        [
          csv(product.name),
          csv(setName),
          setCode,
          product.type,
          qty,
          pPrice.toFixed(2),
          purchaseDate,
          cur.toFixed(2),
          costBasis.toFixed(2),
          currentValue.toFixed(2),
          pnl.toFixed(2),
          pnlPct.toFixed(2),
        ].join(','),
      );
    }

    reply
      .header(
        'Content-Disposition',
        `attachment; filename="grailiq-portfolio-${new Date().toISOString().slice(0, 10)}.csv"`,
      )
      .type('text/csv');
    return reply.send(lines.join('\n'));
  });
}

/** Escape a field for CSV (wraps in quotes and escapes inner quotes). */
function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

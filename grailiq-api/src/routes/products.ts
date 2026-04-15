import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { products, priceHistory, scoreHistory } from '../db/schema.js';
import { eq, desc, sql, inArray, and, gte } from 'drizzle-orm';
import { getCommunitySignals } from '../services/community-signals.js';
import { computeRipHoldSignal } from '../services/ripHoldSignal.js';

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

    // Fetch community signals
    const communitySignals = await getCommunitySignals(id);

    // Compute rip/hold signal (stub for now — data not in schema)
    // TODO: Wire in actual market price and print status once available
    const ripHoldSignal = computeRipHoldSignal({
      inPrint: undefined, // Not tracked yet
      currentPrice: undefined, // Not in products table
      msrp: product.msrp ? parseFloat(product.msrp) : undefined,
    });

    return reply.send({ data: { ...product, communitySignals, ripHoldSignal } });
  });

  /** Generate a shareable score card image (SVG) */
  app.get<{ Params: { productId: string } }>('/score-card/:productId', async (request, reply) => {
    const { productId } = request.params;
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    const score = product.grailiqScore ? parseFloat(product.grailiqScore) : 0;
    const signal = product.investmentSignal || 'hold';

    // Color mapping for signal
    const signalColors: Record<string, { bg: string; text: string }> = {
      buy: { bg: '#10b981', text: '#10b981' },
      hold: { bg: '#f59e0b', text: '#f59e0b' },
      watch: { bg: '#6b7280', text: '#6b7280' },
      avoid: { bg: '#ef4444', text: '#ef4444' },
    };

    const colors = signalColors[signal] || signalColors.hold;

    // 24h delta (stub for now)
    const delta24h = '+0.0%';

    // Generate SVG Open Graph card (1200x630)
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark gradient background -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f1419;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1f2e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- GrailIQ logo top-left -->
  <text x="40" y="60" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#FFDB6E">
    GrailIQ
  </text>

  <!-- Product name -->
  <text x="40" y="150" font-family="system-ui, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="start">
    <tspan>${product.name}</tspan>
  </text>

  <!-- Score circle -->
  <circle cx="1000" cy="200" r="70" fill="${colors.bg}" opacity="0.2" />
  <circle cx="1000" cy="200" r="65" fill="none" stroke="${colors.bg}" stroke-width="3" />
  <text x="1000" y="220" font-family="system-ui, sans-serif" font-size="60" font-weight="bold" fill="${colors.text}" text-anchor="middle">
    ${score.toFixed(0)}
  </text>

  <!-- Signal label -->
  <text x="1000" y="290" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="${colors.text}" text-anchor="middle" text-transform="uppercase">
    ${signal.toUpperCase()}
  </text>

  <!-- 24h delta -->
  <text x="40" y="320" font-family="system-ui, sans-serif" font-size="18" fill="#9ca3af">
    24H Change:
  </text>
  <text x="220" y="320" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#10b981">
    ${delta24h}
  </text>

  <!-- Footer -->
  <text x="600" y="590" font-family="system-ui, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">
    Pokemon TCG Price Intelligence • grailiq.com
  </text>
</svg>`;

    return reply.type('image/svg+xml').send(svg);
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

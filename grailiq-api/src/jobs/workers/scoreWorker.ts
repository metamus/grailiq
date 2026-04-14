import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { db } from '../../config/database.js';
import { products, priceHistory, sets } from '../../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { logger } from '../../lib/logger.js';

const connection = { host: redis.options.host, port: redis.options.port };

interface PriceStats {
  avgPrice: number;
  latestPrice: number;
  priceChange7d: number;
  priceChange30d: number;
  volatility: number;
  dataPoints: number;
}

/**
 * GrailIQ Score Algorithm
 *
 * The score is 0-100 and represents the investment quality of a sealed product.
 * Components:
 *   - Price Trend (35%)  : Is the price trending up? Momentum factor
 *   - MSRP Premium (25%) : How much above/below MSRP? Value factor
 *   - Volatility (15%)   : Low volatility = more stable = higher score
 *   - Demand (15%)       : Data point density = market activity proxy
 *   - Scarcity (10%)     : Out-of-print sets get a boost
 *
 * Investment Signals:
 *   - buy   : Score >= 70 AND positive trend AND not overpriced
 *   - hold  : Score >= 50 AND stable trend
 *   - watch : Score >= 30 OR declining but valuable
 *   - avoid : Score < 30 OR extremely overpriced with declining trend
 */
async function calculateScore(productId: string): Promise<{
  score: number;
  signal: 'buy' | 'hold' | 'watch' | 'avoid';
  rationale: string;
}> {
  // Fetch recent price history (last 90 days)
  const history = await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.productId, productId))
    .orderBy(desc(priceHistory.recordedAt))
    .limit(200);

  // Fetch product details
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product || history.length < 2) {
    return { score: 0, signal: 'watch', rationale: 'Insufficient data for scoring' };
  }

  // Fetch set details for scarcity
  const [set] = await db
    .select()
    .from(sets)
    .where(eq(sets.id, product.setId))
    .limit(1);

  const msrp = parseFloat(product.msrp || '0');
  const prices = history.map((h) => parseFloat(h.price)).reverse(); // oldest first
  const latestPrice = prices[prices.length - 1];

  // ── Price Trend Score (35%) ──
  const recentSlice = prices.slice(-7);
  const olderSlice = prices.slice(-30, -7);
  const recentAvg = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  const olderAvg = olderSlice.length > 0
    ? olderSlice.reduce((a, b) => a + b, 0) / olderSlice.length
    : recentAvg;

  const trendPct = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  // Positive trend up to +20% = full points, negative = penalty
  const trendScore = Math.max(0, Math.min(100, 50 + trendPct * 2.5));

  // ── MSRP Premium Score (25%) ──
  let msrpScore = 50;
  if (msrp > 0) {
    const premium = ((latestPrice - msrp) / msrp) * 100;
    if (premium < 0) {
      // Below MSRP = great deal
      msrpScore = Math.min(100, 80 + Math.abs(premium));
    } else if (premium < 30) {
      // 0-30% above MSRP = still reasonable
      msrpScore = 70 - premium;
    } else if (premium < 100) {
      // 30-100% above = getting pricey
      msrpScore = 40 - (premium - 30) * 0.3;
    } else {
      // 100%+ above = very overpriced (unless OOP)
      msrpScore = Math.max(10, 20 - (premium - 100) * 0.1);
    }
  }

  // ── Volatility Score (15%) ──
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, p) => a + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0; // Coefficient of variation
  // Low volatility (<5% CV) = 100, high (>30%) = 0
  const volatilityScore = Math.max(0, Math.min(100, 100 - cv * 3));

  // ── Demand Score (15%) ──
  // More data points = more market activity
  const demandScore = Math.min(100, (history.length / 100) * 100);

  // ── Scarcity Score (10%) ──
  const isOOP = set?.isOutOfPrint ?? false;
  const releaseYear = set?.releaseDate ? new Date(set.releaseDate).getFullYear() : 2024;
  const age = new Date().getFullYear() - releaseYear;
  const scarcityScore = isOOP ? 90 + Math.min(10, age) : Math.min(50, age * 5);

  // ── Weighted Total ──
  const score = Math.round(
    trendScore * 0.35 +
    msrpScore * 0.25 +
    volatilityScore * 0.15 +
    demandScore * 0.15 +
    scarcityScore * 0.10
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  // ── Determine Signal ──
  let signal: 'buy' | 'hold' | 'watch' | 'avoid';
  let rationale: string;

  if (clampedScore >= 70 && trendPct > -5) {
    signal = 'buy';
    rationale = `Strong score (${clampedScore}/100) with ${trendPct > 0 ? 'positive' : 'stable'} trend.`;
    if (msrp > 0 && latestPrice < msrp * 1.1) {
      rationale += ' Near MSRP — excellent entry point.';
    }
    if (isOOP) rationale += ' Out-of-print adds scarcity value.';
  } else if (clampedScore >= 50) {
    signal = 'hold';
    rationale = `Solid score (${clampedScore}/100).`;
    if (trendPct < 0) rationale += ` Price dipping ${Math.abs(trendPct).toFixed(1)}% — monitor closely.`;
    else rationale += ' Stable fundamentals.';
  } else if (clampedScore >= 30) {
    signal = 'watch';
    rationale = `Moderate score (${clampedScore}/100).`;
    if (trendPct < -10) rationale += ' Significant price decline — wait for floor.';
    else rationale += ' Needs more data or better fundamentals.';
  } else {
    signal = 'avoid';
    rationale = `Low score (${clampedScore}/100).`;
    if (msrp > 0 && latestPrice > msrp * 2) rationale += ` Overpriced at ${((latestPrice / msrp - 1) * 100).toFixed(0)}% above MSRP.`;
    if (trendPct < -15) rationale += ' Strong downward trend.';
  }

  return { score: clampedScore, signal, rationale };
}

/** Process score calculation jobs */
export const scoreWorker = new Worker('score-calculations', async (job: Job) => {
  const startTime = Date.now();
  logger.info({ jobId: job.id }, 'Starting score recalculation');

  try {
    const allProducts = await db.select({ id: products.id }).from(products);
    let updated = 0;

    for (const product of allProducts) {
      try {
        const { score, signal, rationale } = await calculateScore(product.id);

        await db
          .update(products)
          .set({
            grailiqScore: score.toFixed(1),
            investmentSignal: signal,
            signalRationale: rationale,
            scoreUpdatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));

        updated++;
      } catch (error) {
        logger.warn({ productId: product.id, error }, 'Failed to score product');
      }
    }

    const duration = Date.now() - startTime;
    logger.info({ jobId: job.id, updated, duration }, 'Score recalculation complete');
    return { updated, duration };
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Score recalculation failed');
    throw error;
  }
}, { connection, concurrency: 1 });

scoreWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Score worker job failed');
});

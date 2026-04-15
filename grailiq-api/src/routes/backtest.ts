import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { scoreHistory, priceHistory } from '../db/schema.js';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

/**
 * Backtested Score Performance
 *
 * Computes historical performance of BUY signals:
 * - What was the avg return for products rated BUY N months ago?
 * - Win rate = % that increased in price
 *
 * If insufficient data, returns stub with insufficient_data flag.
 */

export async function backtestRoutes(app: FastifyInstance) {
  app.get('/score-backtest', async (_request, reply) => {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Query: Get products rated BUY 6 months ago
      const buySixMonths = await db
        .select({
          productId: scoreHistory.productId,
          signal: scoreHistory.signal,
          score: scoreHistory.score,
          recordedAt: scoreHistory.recordedAt,
        })
        .from(scoreHistory)
        .where(
          and(
            gte(scoreHistory.recordedAt, sixMonthsAgo),
            eq(scoreHistory.signal, 'buy')
          )
        )
        .orderBy(scoreHistory.recordedAt);

      const buyThreeMonths = await db
        .select({
          productId: scoreHistory.productId,
          signal: scoreHistory.signal,
          score: scoreHistory.score,
          recordedAt: scoreHistory.recordedAt,
        })
        .from(scoreHistory)
        .where(
          and(
            gte(scoreHistory.recordedAt, threeMonthsAgo),
            eq(scoreHistory.signal, 'buy')
          )
        )
        .orderBy(scoreHistory.recordedAt);

      // Compute returns
      const compute = async (buySignals: typeof buySixMonths) => {
        if (buySignals.length === 0) {
          return {
            buys: 0,
            avg_return_pct: null,
            win_rate_pct: null,
            insufficient_data: true,
          };
        }

        const productIds = [...new Set(buySignals.map(s => s.productId))];
        let wins = 0;
        let returns: number[] = [];

        for (const productId of productIds) {
          const oldest = buySignals
            .filter(s => s.productId === productId)
            .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())[0];

          const newest = await db
            .select()
            .from(priceHistory)
            .where(eq(priceHistory.productId, productId))
            .orderBy(desc(priceHistory.recordedAt))
            .limit(1);

          if (oldest && newest.length > 0) {
            const oldestPrice = parseFloat(oldest.score);
            const newestPrice = parseFloat(newest[0].price);
            const returnPct = ((newestPrice - oldestPrice) / oldestPrice) * 100;
            returns.push(returnPct);
            if (returnPct > 0) wins++;
          }
        }

        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const winRate = productIds.length > 0 ? (wins / productIds.length) * 100 : 0;

        return {
          buys: productIds.length,
          avg_return_pct: Math.round(avgReturn * 10) / 10,
          win_rate_pct: Math.round(winRate),
          insufficient_data: false,
        };
      };

      const result6mo = await compute(buySixMonths);
      const result3mo = await compute(buyThreeMonths);

      return reply.send({
        data: {
          trailing_6mo: result6mo,
          trailing_3mo: result3mo,
        },
      });
    } catch (err) {
      logger.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

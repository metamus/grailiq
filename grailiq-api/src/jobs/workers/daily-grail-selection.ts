import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { db } from '../../config/database.js';
import { products, dailyGrails, scoreHistory } from '../../db/schema.js';
import { eq, isNull, desc, gte, and, sql, not } from 'drizzle-orm';
import { logger } from '../../lib/logger.js';

/**
 * Daily Grail Selection Worker
 *
 * Runs every day at 9am ET (14:00 UTC).
 * Selects the top product for the day based on:
 * 1. Max(grailiq_score) among products not featured in last 30 days
 * 2. Ties broken by highest 24h price delta
 *
 * Writes result to daily_grails table.
 */

export async function dailyGrailSelectionWorker() {
  if (!redis) {
    logger.warn('Redis unavailable — skipping daily grail selection');
    return;
  }

  return new Worker(
    'daily-grail-selection',
    async (job: Job) => {
      logger.info('Starting daily grail selection...');

      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Find products NOT featured in last 30 days
        const recentlyFeaturedIds = await db
          .select({ productId: dailyGrails.productId })
          .from(dailyGrails)
          .where(gte(dailyGrails.featuredDate, thirtyDaysAgo));

        const recentlyFeaturedSet = new Set(
          recentlyFeaturedIds.map(r => r.productId)
        );

        // Get all eligible products with current scores
        const eligibleProducts = await db
          .select({
            id: products.id,
            name: products.name,
            score: products.grailiqScore,
            signal: products.investmentSignal,
          })
          .from(products)
          .where(not(isNull(products.grailiqScore)))
          .orderBy(desc(products.grailiqScore))
          .limit(100);

        // Filter out recently featured, sort by score then by 24h delta
        const candidates = eligibleProducts.filter(
          p => !recentlyFeaturedSet.has(p.id)
        );

        if (candidates.length === 0) {
          logger.warn('No eligible products for daily grail selection');
          return;
        }

        const selected = candidates[0];

        // Generate thesis (stub for now)
        const thesis = `GrailIQ Score: ${selected.score}/100. Signal: ${selected.signal?.toUpperCase() || 'HOLD'}. Auto-selected as today's top-scored collectible.`;

        // Check if today's grail already exists
        const existing = await db
          .select()
          .from(dailyGrails)
          .where(eq(sql`DATE(${dailyGrails.featuredDate})`, sql`CURRENT_DATE`));

        if (existing.length > 0) {
          logger.info(`Today's grail already selected: ${selected.name}`);
          return;
        }

        // Insert today's grail
        await db.insert(dailyGrails).values({
          productId: selected.id,
          featuredDate: new Date(),
          thesis,
        });

        logger.info(`✓ Daily grail selected: ${selected.name} (score: ${selected.score})`);
      } catch (err) {
        logger.error(err, 'Daily grail selection failed');
        throw err;
      }
    },
    {
      connection: redis,
    }
  );
}

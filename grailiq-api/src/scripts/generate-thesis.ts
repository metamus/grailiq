import { db } from '../config/database.js';
import { products, priceHistory } from '../db/schema.js';
import { eq, isNull, desc } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

/**
 * Investment Thesis Generator
 *
 * Generates rule-based investment thesis for products without one.
 * Thesis template: "Last [N]-day price movement: [up/down] [X]%. Current score: [Y].
 *                  [In print/Out of print]. [Buy/Hold/Watch/Avoid] signal."
 *
 * Usage:
 *   npx tsx src/scripts/generate-thesis.ts [--dry-run] [--limit=10]
 */

interface ThesisOptions {
  dryRun: boolean;
  limit: number;
}

async function main() {
  const args = process.argv.slice(2);
  const options: ThesisOptions = {
    dryRun: args.includes('--dry-run'),
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50', 10),
  };

  logger.info(`Starting thesis generation (dry-run: ${options.dryRun}, limit: ${options.limit})`);

  try {
    // Find products without thesis
    const productsWithoutThesis = await db
      .select()
      .from(products)
      .where(isNull(products.thesis))
      .limit(options.limit);

    logger.info(`Found ${productsWithoutThesis.length} products without thesis`);

    let successCount = 0;

    for (const product of productsWithoutThesis) {
      try {
        // Get recent price history
        const priceData = await db
          .select()
          .from(priceHistory)
          .where(eq(priceHistory.productId, product.id))
          .orderBy(desc(priceHistory.recordedAt))
          .limit(60); // ~2 months

        let priceDelta = 0;
        let direction = 'stable';

        if (priceData.length >= 2) {
          const current = parseFloat(priceData[0].price);
          const past = parseFloat(priceData[Math.min(59, priceData.length - 1)].price);
          priceDelta = ((current - past) / past) * 100;
          direction = priceDelta > 0.5 ? 'up' : priceDelta < -0.5 ? 'down' : 'stable';
        }

        const score = product.grailiqScore ? parseInt(product.grailiqScore) : 0;
        const signal = (product.investmentSignal || 'hold').toUpperCase();

        const thesis = `Last ${priceData.length > 30 ? '30' : priceData.length}-day price movement: ${
          direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'
        } ${Math.abs(priceDelta).toFixed(1)}%. Current GrailIQ Score: ${score}/100. Signal: ${signal}.`;

        if (!options.dryRun) {
          await db
            .update(products)
            .set({ thesis })
            .where(eq(products.id, product.id));
        }

        logger.info(`✓ ${product.name} (${product.id}): thesis generated`);
        successCount++;
      } catch (err) {
        logger.error(`✗ ${product.name} (${product.id}): ${err}`);
      }
    }

    logger.info(`\nThesis generation complete: ${successCount} succeeded`);
    if (options.dryRun) {
      logger.info('(Dry run — no changes written)');
    }

    process.exit(0);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();

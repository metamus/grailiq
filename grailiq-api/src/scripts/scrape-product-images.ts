import { db } from '../config/database.js';
import { products, retailerProducts } from '../db/schema.js';
import { eq, isNull, and, not } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

/**
 * Product Photography Scraper
 *
 * Fetches product images from Target scene7 for products without image_url.
 * Uses Target TCIN from retailer_products table.
 *
 * Usage:
 *   npx tsx src/scripts/scrape-product-images.ts [--dry-run] [--limit=10]
 */

interface ScraperOptions {
  dryRun: boolean;
  limit: number;
}

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const options: ScraperOptions = {
    dryRun: args.includes('--dry-run'),
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50', 10),
  };

  logger.info(`Starting product image scraper (dry-run: ${options.dryRun}, limit: ${options.limit})`);

  try {
    // Find products without image_url that have Target TCIN
    const productsToScrape = await db
      .select({
        productId: products.id,
        productName: products.name,
        sku: retailerProducts.sku,
      })
      .from(products)
      .leftJoin(retailerProducts, and(
        eq(products.id, retailerProducts.productId),
        eq(retailerProducts.retailer, 'target')
      ))
      .where(and(
        isNull(products.imageUrl),
        not(isNull(retailerProducts.id))
      ))
      .limit(options.limit);

    logger.info(`Found ${productsToScrape.length} products without images`);

    let successCount = 0;
    let failureCount = 0;

    for (const item of productsToScrape) {
      if (!item.sku) {
        logger.warn(`Product ${item.productId} has no TCIN, skipping`);
        failureCount++;
        continue;
      }

      const imageUrl = `https://target.scene7.com/is/image/Target/GUEST_${item.sku}?wid=500`;

      try {
        // Validate URL is accessible (HEAD request)
        const response = await fetch(imageUrl, { method: 'HEAD' });
        if (!response.ok) {
          logger.warn(`✗ ${item.productName} (${item.productId}): Invalid image URL`);
          failureCount++;
          continue;
        }

        if (!options.dryRun) {
          // Update product with image URL
          await db
            .update(products)
            .set({ imageUrl })
            .where(eq(products.id, item.productId));
        }

        logger.info(`✓ ${item.productName} (${item.productId}): ${imageUrl}`);
        successCount++;
      } catch (err) {
        logger.error(`✗ ${item.productName} (${item.productId}): ${err}`);
        failureCount++;
      }

      // Rate limiting: 500ms delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.info(`\nScraper complete: ${successCount} succeeded, ${failureCount} failed`);
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

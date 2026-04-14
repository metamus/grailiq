/**
 * Standalone script to sync the Pokemon TCG catalog from pokemontcg.io
 * and generate sealed product entries.
 *
 * Usage:
 *   npx tsx src/scripts/sync-catalog.ts
 *   npx tsx src/scripts/sync-catalog.ts --prices   (also fetch initial prices)
 */
import 'dotenv/config';
import { syncSetsFromPokemonTCG, generateSealedProductsForSets } from '../services/pokemontcg.js';
import { fetchTCGPlayerPrices } from '../services/tcgplayer.js';
import { fetchEbayPrices } from '../services/ebay.js';
import { logger } from '../lib/logger.js';

async function main() {
  const fetchPrices = process.argv.includes('--prices');

  logger.info('=== GrailIQ Catalog Sync ===');

  // Step 1: Sync sets from pokemontcg.io
  logger.info('Step 1: Syncing sets from pokemontcg.io...');
  const setsCount = await syncSetsFromPokemonTCG();
  logger.info(`  ✓ ${setsCount} sets synced`);

  // Step 2: Generate sealed products for sets without products
  logger.info('Step 2: Generating sealed product entries...');
  const productsCount = await generateSealedProductsForSets();
  logger.info(`  ✓ ${productsCount} new products generated`);

  // Step 3 (optional): Fetch initial prices
  if (fetchPrices) {
    logger.info('Step 3: Fetching initial prices...');
    const [tcg, ebay] = await Promise.allSettled([
      fetchTCGPlayerPrices('hot'),
      fetchEbayPrices('hot'),
    ]);
    const tcgCount = tcg.status === 'fulfilled' ? tcg.value : 0;
    const ebayCount = ebay.status === 'fulfilled' ? ebay.value : 0;
    logger.info(`  ✓ TCGPlayer: ${tcgCount} prices, eBay: ${ebayCount} prices`);
  }

  logger.info('=== Sync complete ===');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ error: err }, 'Catalog sync failed');
  process.exit(1);
});

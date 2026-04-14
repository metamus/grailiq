import { db } from '../config/database.js';
import { products, priceHistory } from '../db/schema.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

/** Fetch completed sold listings from eBay (or mock data if no API key) */
export async function fetchEbayPrices(tier: string): Promise<number> {
  const isConfigured = !!env.EBAY_APP_ID;

  if (!isConfigured) {
    logger.warn('eBay API key not configured — using mock sold listing data');
    return await fetchMockEbaySales(tier);
  }

  // TODO: Implement real eBay Marketplace API integration
  // 1. Authenticate with OAuth2 client credentials
  // 2. GET /buy/browse/v1/item_summary/search for each product.ebaySearchTerm
  // 3. Filter for completed/sold listings
  // 4. Calculate median sold price and insert into price_history
  logger.info({ tier }, 'eBay API integration pending — using mock data');
  return await fetchMockEbaySales(tier);
}

/** Generate mock eBay sold listing data */
async function fetchMockEbaySales(tier: string): Promise<number> {
  const allProducts = await db.select({
    id: products.id,
    msrp: products.msrp,
    type: products.type,
  }).from(products);

  const targetProducts = tier === 'hot' ? allProducts : allProducts.filter((_, i) => i % 4 === 0);

  let inserted = 0;
  for (const product of targetProducts) {
    const msrp = parseFloat(product.msrp || '100');
    // eBay prices tend to be slightly higher than retail (+ shipping, seller markup)
    const variance = 0.9 + Math.random() * 1.3;
    const price = +(msrp * variance).toFixed(2);

    await db.insert(priceHistory).values({
      productId: product.id,
      source: 'ebay',
      price: price.toString(),
      marketPrice: null,
      lowPrice: +(price * 0.8).toFixed(2) + '',
      highPrice: +(price * 1.2).toFixed(2) + '',
    });
    inserted++;
  }

  logger.info({ inserted, tier }, 'Mock eBay prices inserted');
  return inserted;
}

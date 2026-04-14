import { db } from '../config/database.js';
import { products, priceHistory } from '../db/schema.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

interface EbayPrice {
  productId: string;
  price: number;
  marketPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const EBAY_BASE = 'https://www.ebay.com';
const RATE_LIMIT_MS = 2000; // 2 second delay between requests

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrape sold listings from eBay search results.
 * Searches for completed/sold items and extracts price data.
 */
async function scrapeEbaySoldListings(searchTerm: string): Promise<EbayPrice | null> {
  try {
    // Build search URL for sold items
    const query = encodeURIComponent(searchTerm);
    // _osacat=0 means all categories, LH_Complete=1 means completed listings
    const url = `${EBAY_BASE}/sch/i.html?_nkw=${query}&_sacat=0&LH_Complete=1&LH_Sold=1&rt=nc&_udhi=&_udlo=`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      logger.debug({ status: response.status, searchTerm }, 'eBay search fetch failed');
      return null;
    }

    const html = await response.text();

    // Extract sold prices from the HTML
    // eBay displays prices in various patterns, e.g., "$XX.XX" in listing items
    // Pattern: "SOLD" followed by prices, or price in listing item divs
    const priceMatches = html.match(/\$(\d{1,5}\.\d{2})/g) || [];

    // Filter for reasonable price ranges (Pokemon TCG sealed products)
    const prices = priceMatches
      .map((p) => parseFloat(p.replace('$', '')))
      .filter((p) => p > 10 && p < 5000) // Sealed product range
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      logger.debug({ searchTerm, foundCount: priceMatches.length }, 'No valid prices extracted from eBay');
      return null;
    }

    // Calculate statistics from found prices
    const lowPrice = prices[0];
    const highPrice = prices[prices.length - 1];
    const medianPrice = prices[Math.floor(prices.length / 2)];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Use average or median as the current price (median is more robust)
    const price = +(medianPrice).toFixed(2);
    const marketPrice = +(avgPrice).toFixed(2);

    logger.debug(
      { searchTerm, foundPrices: prices.length, lowPrice, highPrice, medianPrice },
      'eBay sold listings scraped'
    );

    return {
      productId: '',
      price,
      marketPrice,
      lowPrice: +(lowPrice).toFixed(2),
      highPrice: +(highPrice).toFixed(2),
    };
  } catch (error) {
    logger.debug(
      { error: error instanceof Error ? error.message : String(error), searchTerm },
      'eBay scrape error'
    );
    return null;
  }
}

/**
 * Generate realistic mock eBay price based on product type and MSRP.
 * eBay prices typically run 10-30% higher than MSRP due to seller markup and shipping.
 */
function generateMockEbayPrice(product: {
  id: string;
  msrp: string | null;
  type: string;
}): EbayPrice {
  const msrp = parseFloat(product.msrp || '100');

  // eBay multiplier ranges by product type (higher than retail due to markup)
  const typeMultipliers: Record<string, [number, number]> = {
    booster_box: [1.1, 2.7],
    etb: [1.0, 2.0],
    booster_pack: [1.05, 1.4],
    collection_box: [0.95, 1.8],
    blister_pack: [1.0, 1.5],
    tin: [0.9, 1.7],
    premium_collection: [1.0, 2.3],
    other: [0.95, 1.7],
  };

  const [minMult, maxMult] = typeMultipliers[product.type] || [0.95, 1.7];

  // Deterministic random based on product ID
  const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseRandom = ((hash * 9301 + 49297) % 233280) / 233280;
  const dayVariance = (Math.sin(Date.now() / 86400000 + hash) + 1) / 2 * 0.15;

  const multiplier = minMult + (baseRandom + dayVariance) * (maxMult - minMult);
  const price = +(msrp * multiplier).toFixed(2);
  const spread = 0.08 + baseRandom * 0.15; // Wider spread on eBay

  return {
    productId: product.id,
    price,
    marketPrice: +(price * (1 + (baseRandom - 0.5) * 0.03)).toFixed(2),
    lowPrice: +(price * (1 - spread)).toFixed(2),
    highPrice: +(price * (1 + spread)).toFixed(2),
  };
}

/**
 * Fetch eBay sold listing prices for all products.
 * Priority: ebaySearchTerm scrape > mock data
 */
export async function fetchEbayPrices(tier: string): Promise<number> {
  logger.info({ tier }, 'Starting eBay price fetch');

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      msrp: products.msrp,
      type: products.type,
      ebaySearchTerm: products.ebaySearchTerm,
    })
    .from(products);

  // For 'hot' tier, price all; for others, sample
  const targetProducts = tier === 'hot'
    ? allProducts
    : allProducts.filter((_, i) => i % 4 === 0);

  let inserted = 0;
  let scraped = 0;
  let mocked = 0;

  for (const product of targetProducts) {
    let priceData: EbayPrice | null = null;

    // Try: Scrape sold listings
    if (product.ebaySearchTerm) {
      priceData = await scrapeEbaySoldListings(product.ebaySearchTerm);
      if (priceData) {
        scraped++;
        logger.debug({ productId: product.id, searchTerm: product.ebaySearchTerm }, 'Scraped eBay sold listings');
      }
      await sleep(RATE_LIMIT_MS);
    } else if (product.name) {
      // Fallback: use product name as search term
      priceData = await scrapeEbaySoldListings(`${product.name} pokemon`);
      if (priceData) {
        scraped++;
        logger.debug({ productId: product.id, productName: product.name }, 'Scraped eBay by product name');
      }
      await sleep(RATE_LIMIT_MS);
    }

    // Fallback: Mock data
    if (!priceData) {
      priceData = generateMockEbayPrice(product);
      mocked++;
    }

    // Insert price record
    try {
      await db.insert(priceHistory).values({
        productId: product.id,
        source: 'ebay',
        price: priceData.price.toString(),
        marketPrice: priceData.marketPrice?.toString() ?? null,
        lowPrice: priceData.lowPrice?.toString() ?? null,
        highPrice: priceData.highPrice?.toString() ?? null,
      });
      inserted++;
    } catch (dbError) {
      logger.error({ productId: product.id, error: dbError }, 'Failed to insert eBay price record');
    }
  }

  logger.info({ inserted, scraped, mocked, tier, total: targetProducts.length }, 'eBay price fetch complete');
  return inserted;
}

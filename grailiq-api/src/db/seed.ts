import { db } from '../config/database.js';
import { sets, products, priceHistory, scoreHistory } from './schema.js';
import { sql } from 'drizzle-orm';

// ──────────────────────────────────────────────
// Logging utilities
// ──────────────────────────────────────────────

const log = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  success: (msg: string) => console.log(`[SUCCESS] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
};

// ──────────────────────────────────────────────
// Type Definitions
// ──────────────────────────────────────────────

interface SetData {
  name: string;
  code: string;
  series: string;
  releaseDate: Date;
  totalCards: number;
  isOutOfPrint: boolean;
}

interface ProductData {
  setId: string;
  name: string;
  type: 'booster_box' | 'etb' | 'booster_pack' | 'collection_box' | 'blister_pack' | 'tin' | 'premium_collection' | 'other';
  msrp: string;
}

// ──────────────────────────────────────────────
// Master Dataset: Pokemon TCG Sets & Products
// ──────────────────────────────────────────────

const POKEMON_TCG_SETS: SetData[] = [
  // Scarlet & Violet Era
  {
    name: 'Scarlet & Violet',
    code: 'SV01',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2023-03-31'),
    totalCards: 198,
    isOutOfPrint: false,
  },
  {
    name: 'Paldea Evolved',
    code: 'SV02',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2023-06-09'),
    totalCards: 279,
    isOutOfPrint: false,
  },
  {
    name: 'Obsidian Flames',
    code: 'SV03',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2023-08-11'),
    totalCards: 230,
    isOutOfPrint: false,
  },
  {
    name: 'Pokemon 151',
    code: 'SV3.5',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2023-09-22'),
    totalCards: 207,
    isOutOfPrint: false,
  },
  {
    name: 'Paradox Rift',
    code: 'SV04',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2023-11-03'),
    totalCards: 266,
    isOutOfPrint: false,
  },
  {
    name: 'Paldean Fates',
    code: 'SV4.5',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2024-01-26'),
    totalCards: 245,
    isOutOfPrint: false,
  },
  {
    name: 'Temporal Forces',
    code: 'SV05',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2024-03-22'),
    totalCards: 218,
    isOutOfPrint: false,
  },
  {
    name: 'Twilight Masquerade',
    code: 'SV06',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2024-05-24'),
    totalCards: 226,
    isOutOfPrint: false,
  },
  {
    name: 'Shrouded Fable',
    code: 'SV6.5',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2024-08-02'),
    totalCards: 99,
    isOutOfPrint: false,
  },
  {
    name: 'Stellar Crown',
    code: 'SV07',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2024-09-13'),
    totalCards: 175,
    isOutOfPrint: false,
  },
  {
    name: 'Surging Sparks',
    code: 'SV08',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2024-11-01'),
    totalCards: 252,
    isOutOfPrint: false,
  },
  {
    name: 'Prismatic Evolutions',
    code: 'SV8.5',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2025-01-24'),
    totalCards: 186,
    isOutOfPrint: false,
  },
  {
    name: 'Journey Together',
    code: 'SV09',
    series: 'Scarlet & Violet',
    releaseDate: new Date('2025-03-21'),
    totalCards: 162,
    isOutOfPrint: false,
  },

  // Sword & Shield Era (key sets)
  {
    name: 'Sword & Shield',
    code: 'SWSH01',
    series: 'Sword & Shield',
    releaseDate: new Date('2020-02-07'),
    totalCards: 202,
    isOutOfPrint: true,
  },
  {
    name: 'Evolving Skies',
    code: 'SWSH07',
    series: 'Sword & Shield',
    releaseDate: new Date('2021-08-27'),
    totalCards: 237,
    isOutOfPrint: true,
  },
  {
    name: 'Brilliant Stars',
    code: 'SWSH09',
    series: 'Sword & Shield',
    releaseDate: new Date('2022-02-25'),
    totalCards: 186,
    isOutOfPrint: true,
  },
  {
    name: 'Lost Origin',
    code: 'SWSH11',
    series: 'Sword & Shield',
    releaseDate: new Date('2022-09-09'),
    totalCards: 247,
    isOutOfPrint: true,
  },
  {
    name: 'Crown Zenith',
    code: 'SWSH12.5',
    series: 'Sword & Shield',
    releaseDate: new Date('2023-01-20'),
    totalCards: 230,
    isOutOfPrint: true,
  },
];

// ──────────────────────────────────────────────
// Product Templates by Set Code
// ──────────────────────────────────────────────

const PRODUCT_TEMPLATES: Record<string, ProductData[]> = {
  // Default template for most sets
  default: [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
    { name: 'Premium Collection', type: 'premium_collection', msrp: '29.99', setId: '' },
  ],
  'SV3.5': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Collection Box', type: 'collection_box', msrp: '39.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
  ],
  'SV4.5': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
    { name: 'Collection Box', type: 'collection_box', msrp: '44.99', setId: '' },
  ],
  'SV6.5': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
    { name: 'Premium Collection', type: 'premium_collection', msrp: '24.99', setId: '' },
  ],
  'SWSH01': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
  ],
  'SWSH07': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
    { name: 'Tin Collection', type: 'tin', msrp: '44.99', setId: '' },
  ],
  'SWSH09': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
  ],
  'SWSH11': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
    { name: 'Premium Collection', type: 'premium_collection', msrp: '29.99', setId: '' },
  ],
  'SWSH12.5': [
    { name: 'Booster Box', type: 'booster_box', msrp: '143.64', setId: '' },
    { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', setId: '' },
    { name: 'Booster Pack', type: 'booster_pack', msrp: '3.99', setId: '' },
  ],
};

// ──────────────────────────────────────────────
// Helper: Generate price history data
// ──────────────────────────────────────────────

interface PricePoint {
  price: number;
  marketPrice: number;
  lowPrice: number;
  highPrice: number;
  recordedAt: Date;
}

function generatePriceHistory(msrp: number, isOutOfPrint: boolean, daysBack: number = 30): PricePoint[] {
  const history: PricePoint[] = [];
  const now = new Date();

  // Out of print sets trade at 20-80% above MSRP, in print sets fluctuate around MSRP
  const baseFactor = isOutOfPrint ? 1.4 : 1.0;

  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 0.3; // +/- 15%
    const multiplier = baseFactor + variation;

    const price = msrp * multiplier;
    const marketPrice = price;
    const lowPrice = price * 0.95;
    const highPrice = price * 1.08;

    history.push({
      price: parseFloat(price.toFixed(2)),
      marketPrice: parseFloat(marketPrice.toFixed(2)),
      lowPrice: parseFloat(lowPrice.toFixed(2)),
      highPrice: parseFloat(highPrice.toFixed(2)),
      recordedAt: date,
    });
  }

  return history;
}

// ──────────────────────────────────────────────
// Seed Function
// ──────────────────────────────────────────────

async function seed() {
  try {
    log.info('Starting database seed...');

    // Step 1: Clear existing data
    log.info('Clearing existing data...');
    try {
      await db.delete(scoreHistory).where(sql`1=1`);
      log.success('Cleared score_history');
    } catch (e) {
      log.warn('Could not clear score_history (may not exist yet)');
    }

    try {
      await db.delete(priceHistory).where(sql`1=1`);
      log.success('Cleared price_history');
    } catch (e) {
      log.warn('Could not clear price_history (may not exist yet)');
    }

    try {
      await db.delete(products).where(sql`1=1`);
      log.success('Cleared products');
    } catch (e) {
      log.warn('Could not clear products (may not exist yet)');
    }

    try {
      await db.delete(sets).where(sql`1=1`);
      log.success('Cleared sets');
    } catch (e) {
      log.warn('Could not clear sets (may not exist yet)');
    }

    // Step 2: Insert sets
    log.info('Inserting Pokemon TCG sets...');
    const insertedSets: Array<{ id: string; code: string }> = [];

    for (const setData of POKEMON_TCG_SETS) {
      try {
        const result = await db
          .insert(sets)
          .values({
            name: setData.name,
            code: setData.code,
            series: setData.series,
            releaseDate: setData.releaseDate,
            totalCards: setData.totalCards,
            isOutOfPrint: setData.isOutOfPrint,
          })
          .returning({ id: sets.id, code: sets.code });

        if (result.length > 0) {
          insertedSets.push(result[0]);
          log.success(`Inserted set: ${setData.code} - ${setData.name}`);
        }
      } catch (e) {
        log.error(`Failed to insert set ${setData.code}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    log.info(`Total sets inserted: ${insertedSets.length}`);

    // Step 3: Insert products for each set
    log.info('Inserting products...');
    const insertedProducts: Array<{ id: string; setCode: string; type: string }> = [];
    let productCount = 0;

    for (const setRecord of insertedSets) {
      const setData = POKEMON_TCG_SETS.find((s) => s.code === setRecord.code);
      if (!setData) continue;

      // Get product template for this set, or use default
      const template = PRODUCT_TEMPLATES[setRecord.code] || PRODUCT_TEMPLATES.default;

      for (const productTemplate of template) {
        try {
          const result = await db
            .insert(products)
            .values({
              setId: setRecord.id,
              name: productTemplate.name,
              type: productTemplate.type,
              msrp: productTemplate.msrp,
            })
            .returning({ id: products.id });

          if (result.length > 0) {
            insertedProducts.push({
              id: result[0].id,
              setCode: setRecord.code,
              type: productTemplate.type,
            });
            productCount++;
          }
        } catch (e) {
          log.error(
            `Failed to insert product ${productTemplate.name} for set ${setRecord.code}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }

    log.success(`Total products inserted: ${productCount}`);

    // Step 4: Insert price history for first 10 products
    log.info('Inserting price history data...');
    let priceHistoryCount = 0;

    const productsForPricing = insertedProducts.slice(0, 10);

    for (const product of productsForPricing) {
      const setData = POKEMON_TCG_SETS.find((s) => s.code === product.setCode);
      if (!setData) continue;

      const template = PRODUCT_TEMPLATES[product.setCode] || PRODUCT_TEMPLATES.default;
      const productTemplate = template.find((p) => p.type === product.type);
      if (!productTemplate) continue;

      const msrp = parseFloat(productTemplate.msrp);
      const pricePoints = generatePriceHistory(msrp, setData.isOutOfPrint, 30);

      for (const point of pricePoints) {
        try {
          await db.insert(priceHistory).values({
            productId: product.id,
            source: 'tcgplayer',
            price: String(point.price),
            marketPrice: String(point.marketPrice),
            lowPrice: String(point.lowPrice),
            highPrice: String(point.highPrice),
            recordedAt: point.recordedAt,
          });

          priceHistoryCount++;
        } catch (e) {
          log.error(`Failed to insert price history: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      log.success(`Inserted ${pricePoints.length} price points for product ${product.id}`);
    }

    log.info(`Total price history records inserted: ${priceHistoryCount}`);

    // Step 5: Insert scores for products
    log.info('Inserting score data...');
    let scoreCount = 0;

    // Assign realistic scores based on set properties
    // Out-of-print sets get higher scores, newer sets start mid-range
    const scoreMapping: Record<string, { baseScore: number; signal: 'buy' | 'hold' | 'watch' | 'avoid' }> = {
      'SV01': { baseScore: 60, signal: 'hold' },
      'SV02': { baseScore: 62, signal: 'hold' },
      'SV03': { baseScore: 65, signal: 'hold' },
      'SV3.5': { baseScore: 78, signal: 'buy' },
      'SV04': { baseScore: 58, signal: 'watch' },
      'SV4.5': { baseScore: 72, signal: 'buy' },
      'SV05': { baseScore: 61, signal: 'hold' },
      'SV06': { baseScore: 59, signal: 'hold' },
      'SV6.5': { baseScore: 64, signal: 'hold' },
      'SV07': { baseScore: 66, signal: 'hold' },
      'SV08': { baseScore: 75, signal: 'buy' },
      'SV8.5': { baseScore: 82, signal: 'buy' },
      'SV09': { baseScore: 70, signal: 'buy' },
      'SWSH01': { baseScore: 88, signal: 'buy' },
      'SWSH07': { baseScore: 91, signal: 'buy' },
      'SWSH09': { baseScore: 85, signal: 'buy' },
      'SWSH11': { baseScore: 87, signal: 'buy' },
      'SWSH12.5': { baseScore: 84, signal: 'hold' },
    };

    for (const product of insertedProducts) {
      const setCode = product.setCode;
      const scoreData = scoreMapping[setCode] || { baseScore: 60, signal: 'hold' as const };

      // Add slight variation based on product type
      let typeBoost = 0;
      if (product.type === 'booster_box') typeBoost = 2;
      else if (product.type === 'etb') typeBoost = 1;
      else if (product.type === 'collection_box') typeBoost = 3;

      const finalScore = Math.min(100, Math.max(0, scoreData.baseScore + typeBoost));

      try {
        await db.insert(scoreHistory).values({
          productId: product.id,
          score: String(finalScore.toFixed(1)),
          signal: scoreData.signal,
          recordedAt: new Date(),
        });
        scoreCount++;
      } catch (e) {
        log.error(`Failed to insert score for product ${product.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Also update the products table with current scores
    for (const product of insertedProducts) {
      const setCode = product.setCode;
      const scoreData = scoreMapping[setCode] || { baseScore: 60, signal: 'hold' as const };
      let typeBoost = 0;
      if (product.type === 'booster_box') typeBoost = 2;
      else if (product.type === 'etb') typeBoost = 1;
      else if (product.type === 'collection_box') typeBoost = 3;
      const finalScore = Math.min(100, Math.max(0, scoreData.baseScore + typeBoost));

      try {
        await db
          .update(products)
          .set({
            grailiqScore: String(finalScore.toFixed(1)),
            investmentSignal: scoreData.signal,
            scoreUpdatedAt: new Date(),
          })
          .where(sql`id = ${product.id}`);
      } catch (e) {
        log.error(`Failed to update product score ${product.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    log.success(`Total score records inserted: ${scoreCount}`);

    // Summary
    log.success('\n========================================');
    log.success('DATABASE SEEDING COMPLETE');
    log.success('========================================');
    log.success(`Sets inserted: ${insertedSets.length}`);
    log.success(`Products inserted: ${productCount}`);
    log.success(`Price history records: ${priceHistoryCount}`);
    log.success(`Score history records: ${scoreCount}`);
    log.success('========================================\n');

    process.exit(0);
  } catch (error) {
    log.error(`Critical error during seeding: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    process.exit(1);
  }
}

// ──────────────────────────────────────────────
// Execute
// ──────────────────────────────────────────────

seed();

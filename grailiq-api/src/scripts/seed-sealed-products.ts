import { db } from '../config/database.js';
import { sets, products } from '../db/schema.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

/** Realistic Pokemon TCG sealed products with MSRP and collector appeal */
interface ProductTemplate {
  name: string;
  type: 'booster_box' | 'etb' | 'booster_pack' | 'collection_box' | 'blister_pack' | 'tin' | 'premium_collection' | 'other';
  msrp: string;
  baseScore: number; // Base score before adjustments
}

const PRODUCT_TEMPLATES: ProductTemplate[] = [
  { name: 'Booster Box', type: 'booster_box', msrp: '143.99', baseScore: 65 },
  { name: 'Elite Trainer Box', type: 'etb', msrp: '49.99', baseScore: 55 },
  { name: 'Premium Collection Box', type: 'collection_box', msrp: '29.99', baseScore: 50 },
  { name: 'Build & Battle Box', type: 'booster_pack', msrp: '19.99', baseScore: 45 },
  { name: 'Booster Bundle (5 packs)', type: 'collection_box', msrp: '26.99', baseScore: 48 },
  { name: 'Mini Tin', type: 'tin', msrp: '4.99', baseScore: 40 },
  { name: 'Booster Pack', type: 'booster_pack', msrp: '4.49', baseScore: 42 },
];

/**
 * Calculate GrailIQ score and investment signal based on product type, MSRP, and set age.
 * Older out-of-print sets get higher scores (collectible premium).
 */
function getScoreAndSignal(
  baseScore: number,
  msrp: number,
  isOutOfPrint: boolean,
  releaseDate: Date | null,
): { score: number; signal: 'buy' | 'hold' | 'watch' | 'avoid' } {
  let score = baseScore;

  // Out-of-print sets get +10-20 points (higher collector value)
  if (isOutOfPrint) {
    score += 15;
  }

  // Age adjustment: older sets trending up
  if (releaseDate) {
    const now = new Date();
    const ageMonths = (now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths > 24) {
      score += Math.min(10, Math.floor(ageMonths / 12)); // +1 per year, max +10
    }
  }

  // Premium products (higher MSRP) tend to have better long-term ROI
  if (msrp > 100) {
    score += 5;
  } else if (msrp < 20) {
    score -= 3;
  }

  // Cap score at 0-100
  score = Math.max(0, Math.min(100, score));

  // Map score to signal
  let signal: 'buy' | 'hold' | 'watch' | 'avoid';
  if (score >= 75) {
    signal = 'buy';
  } else if (score >= 60) {
    signal = 'hold';
  } else if (score >= 45) {
    signal = 'watch';
  } else {
    signal = 'avoid';
  }

  return { score, signal };
}

async function seedProducts() {
  try {
    console.log('Fetching all sets...');
    const allSets = await db.select().from(sets);
    console.log(`Found ${allSets.length} sets`);

    let totalInserted = 0;

    for (const set of allSets) {
      console.log(`\nSeeding products for: ${set.name} (${set.code})`);

      for (const template of PRODUCT_TEMPLATES) {
        const msrpNum = parseFloat(template.msrp);
        const { score, signal } = getScoreAndSignal(
          template.baseScore,
          msrpNum,
          set.isOutOfPrint,
          set.releaseDate,
        );

        // Check if product already exists for this set (idempotent)
        const existing = await db.execute(sql`
          SELECT id FROM products
          WHERE set_id = ${set.id} AND name = ${template.name}
          LIMIT 1
        `);

        if (existing.rowCount === 0) {
          // Insert new product only if it doesn't exist
          await db.execute(sql`
            INSERT INTO products (
              id,
              set_id,
              name,
              type,
              msrp,
              grailiq_score,
              investment_signal,
              signal_rationale,
              created_at,
              updated_at
            ) VALUES (
              gen_random_uuid(),
              ${set.id},
              ${template.name},
              ${template.type},
              ${msrpNum},
              ${score},
              ${signal},
              ${'Auto-generated sealed product'},
              now(),
              now()
            )
          `);
          totalInserted++;
        }
      }

      console.log(`  ✓ Added ${PRODUCT_TEMPLATES.length} products`);
    }

    console.log(`\n✅ Seed complete! Inserted up to ${totalInserted} product records (idempotent).`);
    console.log(`Each of ${allSets.length} sets now has up to ${PRODUCT_TEMPLATES.length} products.`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedProducts();

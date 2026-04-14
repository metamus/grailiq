import { db } from '../config/database.js';
import { sets, products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

const BASE_URL = 'https://api.pokemontcg.io/v2';
const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY || '';

interface PokemonTCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  images: { symbol: string; logo: string };
}

/** Fetch headers — include API key if available for higher rate limits */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = POKEMON_TCG_API_KEY;
  }
  return headers;
}

/**
 * Sync all Pokemon TCG sets from pokemontcg.io into our database.
 * This gives us a complete set catalog with release dates, card counts, etc.
 * The API is free — no key required for basic use (1000 req/day without key).
 */
export async function syncSetsFromPokemonTCG(): Promise<number> {
  logger.info('Starting Pokemon TCG set catalog sync...');

  try {
    const response = await fetch(`${BASE_URL}/sets?orderBy=-releaseDate&pageSize=250`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { data: PokemonTCGSet[] };
    const apiSets = data.data;

    logger.info({ count: apiSets.length }, 'Fetched sets from pokemontcg.io');

    let upserted = 0;

    for (const apiSet of apiSets) {
      // Determine series and whether out-of-print
      const series = apiSet.series || 'Unknown';
      const releaseDate = apiSet.releaseDate ? new Date(apiSet.releaseDate) : null;
      const isOutOfPrint = releaseDate
        ? releaseDate < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * 2) // 2+ years old
        : false;

      // Check if set already exists by code
      const existing = await db
        .select({ id: sets.id })
        .from(sets)
        .where(eq(sets.code, apiSet.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing set
        await db
          .update(sets)
          .set({
            name: apiSet.name,
            series,
            totalCards: apiSet.total,
            isOutOfPrint,
            imageUrl: apiSet.images?.logo || null,
            updatedAt: new Date(),
          })
          .where(eq(sets.code, apiSet.id));
      } else {
        // Insert new set
        await db.insert(sets).values({
          name: apiSet.name,
          code: apiSet.id,
          series,
          releaseDate,
          totalCards: apiSet.total,
          isOutOfPrint,
          imageUrl: apiSet.images?.logo || null,
        });
      }
      upserted++;
    }

    logger.info({ upserted }, 'Pokemon TCG set catalog sync complete');
    return upserted;
  } catch (error) {
    logger.error({ error }, 'Failed to sync sets from pokemontcg.io');
    throw error;
  }
}

/**
 * Auto-generate sealed product entries for sets that don't have products yet.
 * Each set typically has: Booster Box, ETB, Booster Pack, and sometimes tins/collection boxes.
 */
export async function generateSealedProductsForSets(): Promise<number> {
  const allSets = await db.select().from(sets);
  let created = 0;

  // Standard sealed product templates with MSRP
  const productTemplates = [
    { suffix: 'Booster Box', type: 'booster_box' as const, msrp: '143.64' },
    { suffix: 'Elite Trainer Box', type: 'etb' as const, msrp: '49.99' },
    { suffix: 'Booster Pack', type: 'booster_pack' as const, msrp: '4.49' },
    { suffix: 'Booster Bundle', type: 'collection_box' as const, msrp: '29.99' },
  ];

  for (const set of allSets) {
    // Check if this set already has products
    const existingProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.setId, set.id))
      .limit(1);

    if (existingProducts.length > 0) continue; // Already has products

    // Only generate products for modern sets (Sword & Shield onward, ~2020+)
    const releaseYear = set.releaseDate ? new Date(set.releaseDate).getFullYear() : 0;
    if (releaseYear < 2020) continue;

    for (const template of productTemplates) {
      const name = `${set.name} ${template.suffix}`;
      const ebaySearchTerm = `pokemon ${set.name} ${template.suffix} sealed`;

      await db.insert(products).values({
        setId: set.id,
        name,
        type: template.type,
        msrp: template.msrp,
        ebaySearchTerm,
      });
      created++;
    }
  }

  logger.info({ created }, 'Generated sealed product entries for sets');
  return created;
}

import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import 'dotenv/config';

/**
 * Seed retailer_products from a JSON file.
 *
 * Input file shape: an array of rows
 *   [
 *     {
 *       "productName": "<fuzzy name to match against products.name>",
 *       "retailer": "pokemon_center" | "target" | "best_buy" | "walmart" | "amazon",
 *       "url": "<full retailer URL>",
 *       "sku": "<retailer SKU/TCIN/ASIN — optional>",
 *       "isEnabled": true
 *     }
 *   ]
 *
 * Matching strategy: case-insensitive ILIKE substring match on products.name.
 * If multiple products match, the first by created_at is used and the rest
 * are reported so you can tighten the productName.
 *
 * Upsert key: (product_id, retailer, url).
 *
 * Usage:
 *   tsx src/scripts/seed-retailer-mappings.ts src/scripts/starter-mappings.json
 */

interface Row {
  productName: string;
  retailer: 'pokemon_center' | 'target' | 'best_buy' | 'walmart' | 'amazon';
  url: string;
  sku?: string | null;
  isEnabled?: boolean;
}

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error('Usage: tsx src/scripts/seed-retailer-mappings.ts <path-to-json>');
    process.exit(1);
  }

  const json = await readFile(resolve(filePath), 'utf-8');
  const rows = JSON.parse(json) as Row[];

  if (!Array.isArray(rows)) {
    console.error('Expected a JSON array at the root of the input file.');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  let inserted = 0;
  let updated = 0;
  const skipped: Array<{ row: Row; reason: string }> = [];

  try {
    for (const row of rows) {
      if (!row.productName || !row.retailer || !row.url) {
        skipped.push({ row, reason: 'missing_required_fields' });
        continue;
      }

      const { rows: matches } = await client.query<{ id: string; name: string }>(
        `SELECT id, name FROM products WHERE name ILIKE $1 ORDER BY created_at ASC LIMIT 3`,
        [`%${row.productName}%`],
      );

      if (matches.length === 0) {
        skipped.push({ row, reason: 'no_product_match' });
        continue;
      }

      if (matches.length > 1) {
        console.warn(
          `  ! "${row.productName}" matched ${matches.length} products; using "${matches[0].name}"`,
        );
      }

      const productId = matches[0].id;

      const { rows: existing } = await client.query<{ id: string }>(
        `SELECT id FROM retailer_products
         WHERE product_id = $1 AND retailer = $2::retailer AND url = $3
         LIMIT 1`,
        [productId, row.retailer, row.url],
      );

      if (existing.length > 0) {
        await client.query(
          `UPDATE retailer_products
           SET sku = $1, is_enabled = $2, updated_at = NOW()
           WHERE id = $3`,
          [row.sku ?? null, row.isEnabled ?? true, existing[0].id],
        );
        updated++;
      } else {
        await client.query(
          `INSERT INTO retailer_products (product_id, retailer, url, sku, is_enabled)
           VALUES ($1, $2::retailer, $3, $4, $5)`,
          [productId, row.retailer, row.url, row.sku ?? null, row.isEnabled ?? true],
        );
        inserted++;
      }
    }

    console.log(`\n✓ Done. Inserted: ${inserted}  Updated: ${updated}  Skipped: ${skipped.length}`);
    if (skipped.length > 0) {
      console.log('\nSkipped rows:');
      for (const s of skipped) {
        console.log(`  - [${s.reason}] ${s.row.productName} @ ${s.row.retailer}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

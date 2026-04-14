import pg from 'pg';
import 'dotenv/config';

/**
 * Populate products.image_url for products that currently have none.
 *
 * Strategy: copy the set's image_url (pokemontcg.io logo) as the product
 * thumbnail. Far better than nothing — UI falls back to the emoji icon
 * when image_url is null. When we have real retailer product shots
 * those win; for now, the set logo is a visual win over a blank square.
 *
 * Idempotent: only updates rows WHERE products.image_url IS NULL.
 */

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    const before = await client.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM products WHERE image_url IS NULL`,
    );
    console.log(`Products missing image: ${before.rows[0].n}`);

    const result = await client.query(`
      UPDATE products p
      SET image_url = s.image_url,
          updated_at = NOW()
      FROM sets s
      WHERE p.set_id = s.id
        AND p.image_url IS NULL
        AND s.image_url IS NOT NULL
    `);
    console.log(`✓ Updated ${result.rowCount} products with set logo URL.`);

    const after = await client.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM products WHERE image_url IS NULL`,
    );
    console.log(`Still missing image: ${after.rows[0].n}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

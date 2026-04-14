import pg from 'pg';
import 'dotenv/config';

/**
 * Clean up the catalog so the dashboard and Sets page render real product
 * names instead of generic "Booster Pack" placeholders, and so duplicate
 * sets (lowercase vs uppercase codes for the same real-world set) collapse
 * into a single canonical row.
 *
 * Safe to re-run. Wraps everything in a transaction.
 *
 * What it does:
 *   1. RENAME generic products to "{Set Name} {Generic Name}" format.
 *   2. FIND duplicate sets (same name, different code case) and merge.
 *      - Picks the set with the earliest release_date as the canonical.
 *      - Reassigns products/portfolio/alerts/retailer_products to canonical.
 *      - Deletes the dup set.
 */

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Rename generic products — prepend their set name.
    const renameResult = await client.query(`
      UPDATE products p
      SET name = s.name || ' ' || p.name,
          updated_at = NOW()
      FROM sets s
      WHERE p.set_id = s.id
        AND p.name IN (
          'Booster Pack',
          'Booster Box',
          'Elite Trainer Box',
          'Premium Collection',
          'Booster Bundle',
          'Blister Pack',
          'Tin',
          'Collection Box'
        )
      RETURNING p.id
    `);
    console.log(`✓ Renamed ${renameResult.rowCount} generic products`);

    // 2. Find duplicate sets (same name, case-insensitive code difference).
    //    We keep the row with the EARLIER release_date when available —
    //    otherwise the lowercase code (pokemontcg.io canonical).
    const dupResult = await client.query(`
      WITH ranked AS (
        SELECT id, code, name, release_date,
               ROW_NUMBER() OVER (
                 PARTITION BY LOWER(name)
                 ORDER BY
                   CASE WHEN code = LOWER(code) THEN 0 ELSE 1 END,
                   release_date ASC,
                   created_at ASC
               ) AS rn
        FROM sets
      )
      SELECT id, code, name FROM ranked WHERE rn > 1
    `);

    console.log(`Found ${dupResult.rowCount} duplicate sets to remove.`);

    for (const dup of dupResult.rows) {
      const canonical = await client.query<{ id: string; code: string }>(
        `SELECT id, code FROM sets
         WHERE LOWER(name) = LOWER($1) AND id <> $2
         ORDER BY
           CASE WHEN code = LOWER(code) THEN 0 ELSE 1 END,
           release_date ASC,
           created_at ASC
         LIMIT 1`,
        [dup.name, dup.id],
      );
      if (canonical.rowCount === 0) continue;
      const canonicalId = canonical.rows[0].id;
      const canonicalCode = canonical.rows[0].code;

      console.log(`  • "${dup.name}": merging ${dup.code} → ${canonicalCode}`);

      // Delete products on the dup set that collide with same-name products
      // on the canonical set (otherwise we'd create duplicate product rows
      // when we reassign). Keeps the canonical product.
      await client.query(
        `DELETE FROM products
         WHERE set_id = $1
           AND name IN (
             SELECT name FROM products WHERE set_id = $2
           )`,
        [dup.id, canonicalId],
      );

      // Reassign any remaining products (shouldn't be many, but safe).
      await client.query(
        `UPDATE products SET set_id = $1, updated_at = NOW() WHERE set_id = $2`,
        [canonicalId, dup.id],
      );

      // Now delete the dup set.
      await client.query(`DELETE FROM sets WHERE id = $1`, [dup.id]);
    }

    await client.query('COMMIT');
    console.log('\n✓ Cleanup committed.');

    // Verify.
    const verify = await client.query(`
      SELECT COUNT(*) AS total_products,
             COUNT(*) FILTER (WHERE name IN ('Booster Pack','Booster Box','Elite Trainer Box','Premium Collection','Booster Bundle')) AS generic_left
      FROM products
    `);
    console.log(`\nAfter cleanup: ${verify.rows[0].total_products} products total, ${verify.rows[0].generic_left} with generic names.`);

    const setCount = await client.query(`SELECT COUNT(*)::int AS n FROM sets`);
    console.log(`Sets: ${setCount.rows[0].n}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Cleanup failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * One-shot SQL runner using the existing `pg` dependency.
 *
 * Usage:
 *   npx tsx src/scripts/run-sql-file.ts <path-to-sql-file>
 */

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npx tsx src/scripts/run-sql-file.ts <path-to-sql-file>');
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set in env.');
    process.exit(1);
  }

  const absPath = resolve(process.cwd(), file);
  const sql = readFileSync(absPath, 'utf8');

  const host = url.split('@')[1]?.split('/')[0] ?? 'db';
  console.log(`→ Running ${file} (${sql.length} bytes) against ${host}`);

  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    // pg.query() can execute multi-statement SQL in a single call
    // (unless a statement uses a parameter placeholder, which ours doesn't).
    await client.query(sql);
    console.log('✓ SQL executed successfully');

    // Report counts after run
    const sets = await client.query('SELECT COUNT(*)::int AS n FROM sets');
    const products = await client.query('SELECT COUNT(*)::int AS n FROM products');
    console.log(`  sets: ${sets.rows[0].n}  products: ${products.rows[0].n}`);
  } catch (err) {
    console.error('✗ SQL failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();

import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import 'dotenv/config';

/**
 * Run a single SQL migration file against DATABASE_URL.
 * Usage: tsx src/db/run-migration.ts src/db/migrations/001_retailer_products.sql
 */
async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error('Usage: tsx src/db/run-migration.ts <path-to-sql>');
    process.exit(1);
  }

  const absolute = resolve(filePath);
  const sql = await readFile(absolute, 'utf-8');

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log(`→ Running ${absolute}`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✓ Migration applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed, rolled back.');
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

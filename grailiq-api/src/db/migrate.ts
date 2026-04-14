import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import 'dotenv/config';

/** Run database migrations */
async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');

  // Enable TimescaleDB and create hypertable
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
    await client.query(`
      SELECT create_hypertable('price_history', 'recorded_at',
        if_not_exists => TRUE,
        migrate_data => TRUE
      );
    `);
    console.log('TimescaleDB hypertable configured.');
  } catch (err) {
    console.warn('TimescaleDB setup warning:', err);
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch(console.error);

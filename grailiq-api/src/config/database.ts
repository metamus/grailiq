import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from './env.js';
import * as schema from '../db/schema.js';

/** PostgreSQL connection pool (Supabase PostgreSQL) */
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/** Drizzle ORM database instance */
export const db = drizzle(pool, { schema });

/** Check database connectivity */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

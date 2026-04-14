import pg from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'retailer_products'
      ORDER BY ordinal_position;
    `);
    console.log('retailer_products columns:');
    console.table(columns.rows);

    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'retailer_products';
    `);
    console.log('retailer_products indexes:');
    for (const r of indexes.rows) console.log(`  ${r.indexname}`);

    const rowCount = await client.query(
      `SELECT COUNT(*)::int AS count FROM retailer_products;`,
    );
    console.log(`Row count: ${rowCount.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

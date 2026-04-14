import pg from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const top = await pool.query(`
    SELECT p.name, p.type, p.msrp, p.grailiq_score, s.name AS set_name, s.code
    FROM products p LEFT JOIN sets s ON s.id = p.set_id
    ORDER BY p.grailiq_score DESC NULLS LAST
    LIMIT 10
  `);
  console.log('Top 10 products by score:');
  console.table(top.rows);

  const badNames = await pool.query(`
    SELECT COUNT(*) AS cnt
    FROM products
    WHERE name IN ('Booster Pack','Booster Box','Elite Trainer Box','Premium Collection','Booster Bundle')
       OR name NOT LIKE '% %'
       OR LENGTH(name) < 15
  `);
  console.log(`Products with generic/short names: ${badNames.rows[0].cnt}`);

  const dup = await pool.query(`
    SELECT code, name, series, release_date
    FROM sets WHERE LOWER(name) LIKE '%journey together%' ORDER BY release_date
  `);
  console.log('\nJourney Together variants:');
  console.table(dup.rows);

  const nonStandardCodes = await pool.query(`
    SELECT code, name, series, release_date, total_cards
    FROM sets
    WHERE code = UPPER(code) AND LENGTH(code) > 3
    ORDER BY release_date DESC NULLS LAST LIMIT 20
  `);
  console.log('\nSets with all-caps codes (potential dupes of lowercase):');
  console.table(nonStandardCodes.rows);

  const productCountBySetCount = await pool.query(`
    SELECT set_count, COUNT(*) AS num_sets
    FROM (SELECT set_id, COUNT(*)::int AS set_count FROM products GROUP BY set_id) x
    GROUP BY set_count
    ORDER BY set_count
  `);
  console.log('\nSets grouped by product count:');
  console.table(productCountBySetCount.rows);

  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });

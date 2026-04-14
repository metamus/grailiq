import pg from 'pg';
import 'dotenv/config';

/**
 * Auto-discover Pokemon Center product URLs for every product in the DB.
 *
 * Pokemon Center runs on VTEX. Their public catalog search endpoint returns
 * structured JSON product data, no login or key required:
 *
 *   https://www.pokemoncenter.com/api/catalog_system/pub/products/search?ft=<query>
 *
 * Strategy:
 *   1. Load every canonical product from the DB.
 *   2. Build a search query from the product name (stripped of type suffixes).
 *   3. For each result, score similarity against the source name — take the
 *      best match above a confidence floor.
 *   4. Upsert into retailer_products with retailer='pokemon_center'.
 *
 * Safe to re-run — upsert key is (product_id, 'pokemon_center', url).
 *
 * Usage:
 *   tsx src/scripts/discover-pokemon-center.ts            # discover all
 *   tsx src/scripts/discover-pokemon-center.ts --dry-run  # log matches, no writes
 *   tsx src/scripts/discover-pokemon-center.ts --limit=25 # limit for testing
 */

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const MIN_SIMILARITY = 0.45;
const REQUEST_DELAY_MS = 800;

interface VtexProduct {
  productId: string;
  productName: string;
  linkText: string;
  link: string;
  items?: Array<{ itemId: string }>;
}

interface Product {
  id: string;
  name: string;
  type: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Lowercased, whitespace-collapsed tokens with stopwords removed. */
function tokenize(s: string): string[] {
  const stop = new Set([
    'pokemon',
    'tcg',
    'the',
    'a',
    'an',
    'of',
    'and',
    '&',
  ]);
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stop.has(t));
}

/** Jaccard similarity on token sets. */
function similarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersect = 0;
  for (const t of setA) if (setB.has(t)) intersect++;
  const union = setA.size + setB.size - intersect;
  return intersect / union;
}

/** Convert product name + type into a VTEX search query. */
function buildQuery(name: string, type: string): string {
  const typeWord: Record<string, string> = {
    booster_box: 'booster box',
    etb: 'elite trainer box',
    booster_pack: 'booster pack',
    collection_box: 'collection',
    blister_pack: 'blister',
    tin: 'tin',
    premium_collection: 'premium collection',
    other: '',
  };
  const suffix = typeWord[type] ?? '';
  const base = name.replace(/\b(booster box|elite trainer box|etb|tin|blister|pack)\b/gi, '').trim();
  return [base, suffix].filter(Boolean).join(' ').slice(0, 80);
}

async function searchPokemonCenter(query: string): Promise<VtexProduct[]> {
  const url = `https://www.pokemoncenter.com/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as VtexProduct[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseArgs(argv: string[]) {
  const args = { dryRun: false, limit: Infinity };
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--limit=')) args.limit = parseInt(arg.split('=')[1], 10);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  const { rows: products } = await client.query<Product>(
    `SELECT id, name, type::text AS type FROM products ORDER BY created_at DESC`,
  );

  const targets = products.slice(0, args.limit);
  console.log(`Discovering Pokemon Center URLs for ${targets.length} products ${args.dryRun ? '(DRY RUN)' : ''}\n`);

  let matched = 0;
  let inserted = 0;
  let updated = 0;
  let noResults = 0;
  let belowThreshold = 0;

  try {
    for (const product of targets) {
      const query = buildQuery(product.name, product.type);
      const results = await searchPokemonCenter(query);

      if (results.length === 0) {
        noResults++;
        console.log(`  ✗ no_results  "${product.name}"`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      let best: { product: VtexProduct; score: number } | null = null;
      for (const r of results) {
        const score = similarity(product.name, r.productName);
        if (!best || score > best.score) best = { product: r, score };
      }

      if (!best || best.score < MIN_SIMILARITY) {
        belowThreshold++;
        console.log(
          `  ~ low_confidence (${best?.score.toFixed(2) ?? '0'})  "${product.name}" vs "${best?.product.productName ?? ''}"`,
        );
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      matched++;
      const url = best.product.link;
      const sku = best.product.items?.[0]?.itemId ?? best.product.productId;

      console.log(
        `  ✓ ${best.score.toFixed(2)}  "${product.name}" → ${url}`,
      );

      if (!args.dryRun) {
        const { rows: existing } = await client.query<{ id: string }>(
          `SELECT id FROM retailer_products
           WHERE product_id = $1 AND retailer = 'pokemon_center' AND url = $2
           LIMIT 1`,
          [product.id, url],
        );

        if (existing.length > 0) {
          await client.query(
            `UPDATE retailer_products SET sku = $1, is_enabled = TRUE, updated_at = NOW() WHERE id = $2`,
            [sku, existing[0].id],
          );
          updated++;
        } else {
          await client.query(
            `INSERT INTO retailer_products (product_id, retailer, url, sku)
             VALUES ($1, 'pokemon_center', $2, $3)`,
            [product.id, url, sku],
          );
          inserted++;
        }
      }

      await sleep(REQUEST_DELAY_MS);
    }

    console.log(
      `\nDone. Matched: ${matched}  Inserted: ${inserted}  Updated: ${updated}` +
        `  NoResults: ${noResults}  BelowThreshold: ${belowThreshold}`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import pg from 'pg';
import 'dotenv/config';

/**
 * Auto-discover Target TCINs for every product in the catalog, using the
 * public RedSky search endpoint.
 *
 * RedSky's `plp_search_v2` is the same endpoint target.com's web frontend
 * uses — no auth beyond the well-known public key. We query with the
 * product's name + "pokemon" as the keyword, pick the best-scoring
 * result, and upsert a retailer_products row.
 *
 * Idempotent. Skips products that already have a Target mapping.
 *
 * Flags:
 *   --dry-run          log matches without writing
 *   --limit=N          only process N products (good for testing)
 *   --min-score=0.45   minimum token-Jaccard similarity to accept
 *
 * Run:
 *   npx tsx src/scripts/discover-target.ts --dry-run --limit=10
 *   npx tsx src/scripts/discover-target.ts --limit=50
 */

const REDSKY_KEY = '9f36aeafbe60771e321a7cc95a78140772ab3e96';
const STORE_ID = '1286'; // Real store (not a digital-only SDS)
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const REQUEST_DELAY_MS = 1000; // Be polite
const MIN_PRICE = 1; // Ignore sub-$1 results (not a sealed product)

interface TargetProduct {
  tcin: string;
  title: string;
  url: string;
  brand?: string;
  price?: number;
  inStock?: boolean;
}

interface Product {
  id: string;
  name: string;
  type: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function tokenize(s: string): string[] {
  const stop = new Set(['pokemon', 'tcg', 'the', 'a', 'of', 'and', '&', 'trading', 'card', 'game']);
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stop.has(t));
}

function similarity(a: string, b: string): number {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function buildQuery(name: string): string {
  return `pokemon ${name}`.replace(/\s+/g, ' ').trim();
}

async function searchTarget(query: string): Promise<TargetProduct[]> {
  const params = new URLSearchParams({
    key: REDSKY_KEY,
    channel: 'WEB',
    count: '24',
    default_purchasability_filter: 'true',
    include_sponsored: 'false',
    keyword: query,
    page: `/s/${query}`,
    platform: 'desktop',
    pricing_store_id: STORE_ID,
    scheduled_delivery_store_id: STORE_ID,
    store_ids: STORE_ID,
    useragent: USER_AGENT,
    visitor_id: 'grailiq-discover',
  });
  const url = `https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?${params}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (!response.ok) return [];
    const json = (await response.json()) as any;
    const products = json?.data?.search?.search_response?.products ?? [];
    return products.map((p: any): TargetProduct => {
      const item = p?.item ?? {};
      const price = p?.price ?? {};
      const availability = p?.fulfillment?.shipping_options?.availability_status ?? '';
      const enrichment = item?.enrichment ?? {};
      return {
        tcin: p?.tcin ?? item?.tcin ?? '',
        title: enrichment?.title ?? item?.product_description?.title ?? '',
        url: enrichment?.buy_url ?? `https://www.target.com/p/-/A-${p?.tcin ?? ''}`,
        brand: item?.primary_brand?.name,
        price: typeof price?.current_retail === 'number' ? price.current_retail : undefined,
        inStock: availability === 'IN_STOCK' || availability === 'LIMITED_STOCK',
      };
    }).filter((p: TargetProduct) => p.tcin && p.title);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseArgs(argv: string[]) {
  const args = { dryRun: false, limit: Infinity, minScore: 0.45 };
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.split('=')[1], 10);
    else if (a.startsWith('--min-score=')) args.minScore = parseFloat(a.split('=')[1]);
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

  try {
    // Only target products WITHOUT an existing Target mapping.
    const { rows: products } = await client.query<Product>(`
      SELECT p.id, p.name, p.type::text AS type
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM retailer_products rp
        WHERE rp.product_id = p.id AND rp.retailer = 'target'
      )
        AND p.name NOT ILIKE '%Booster Pack%'  -- single packs are rarely on Target.com
      ORDER BY p.grailiq_score DESC NULLS LAST, p.created_at DESC
    `);

    const targets = products.slice(0, args.limit);
    console.log(
      `Discovering Target mappings for ${targets.length} products ${args.dryRun ? '(DRY RUN)' : ''}\n`,
    );

    let matched = 0;
    let inserted = 0;
    let skipped = 0;
    let below = 0;
    let noResults = 0;

    for (const p of targets) {
      const query = buildQuery(p.name);
      const results = await searchTarget(query);

      if (results.length === 0) {
        noResults++;
        console.log(`  ✗ no_results  "${p.name}"`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      // Filter to likely-sealed results: Pokemon brand + reasonable price
      const candidates = results.filter((r) => {
        const isPokemon = (r.brand || '').toLowerCase().includes('pokemon') ||
          (r.title || '').toLowerCase().includes('pokemon');
        const hasPrice = (r.price ?? 0) >= MIN_PRICE;
        return isPokemon && hasPrice;
      });

      if (candidates.length === 0) {
        noResults++;
        console.log(`  ✗ no_pokemon_candidates  "${p.name}"`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      let best: { target: TargetProduct; score: number } | null = null;
      for (const r of candidates) {
        const score = similarity(p.name, r.title);
        if (!best || score > best.score) best = { target: r, score };
      }

      if (!best || best.score < args.minScore) {
        below++;
        console.log(
          `  ~ low_confidence (${best?.score.toFixed(2) ?? '0'})  "${p.name}" vs "${best?.target.title ?? ''}"`,
        );
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      matched++;
      console.log(
        `  ✓ ${best.score.toFixed(2)}  "${p.name}" → TCIN ${best.target.tcin} (${best.target.title})`,
      );

      if (!args.dryRun) {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM retailer_products
           WHERE product_id = $1 AND retailer = 'target'
           LIMIT 1`,
          [p.id],
        );
        if (existing.rowCount && existing.rowCount > 0) {
          skipped++;
          await sleep(REQUEST_DELAY_MS);
          continue;
        }
        await client.query(
          `INSERT INTO retailer_products (product_id, retailer, url, sku, last_in_stock)
           VALUES ($1, 'target', $2, $3, $4)`,
          [p.id, best.target.url, best.target.tcin, !!best.target.inStock],
        );
        inserted++;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    console.log(
      `\nDone. Matched: ${matched}  Inserted: ${inserted}  Skipped (dup): ${skipped}  NoResults: ${noResults}  BelowThreshold: ${below}`,
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

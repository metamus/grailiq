import pg from 'pg';
import 'dotenv/config';

/**
 * Auto-discover Best Buy retailer mappings for every product in the
 * catalog, using the Best Buy Developer API.
 *
 * Unlike Target/Pokemon Center, Best Buy's API is the official way they
 * WANT you to query their catalog — no anti-bot, fully public with an
 * API key. This should reliably populate mappings for every product that
 * Best Buy actually carries.
 *
 * Search:
 *   GET https://api.bestbuy.com/v1/products(search=<query>&categoryPath.id=pcmcat1485282896020)?apiKey=...
 *   (categoryPath filters to Trading Cards → Pokemon)
 *
 * Strategy:
 *   1. Pull every product without an existing Best Buy mapping.
 *   2. Build a query like "pokemon <product name>".
 *   3. Hit search API, score top results by token-Jaccard similarity.
 *   4. Upsert best match (sku + url + current stock) if score ≥ threshold.
 *
 * Flags: --dry-run, --limit=N, --min-score=0.45
 */

const API_BASE = 'https://api.bestbuy.com/v1';
const REQUEST_DELAY_MS = 500; // Polite rate
const MIN_PRICE = 1;

interface BestBuyProduct {
  sku: number;
  name: string;
  url: string;
  onlineAvailability: boolean;
  salePrice?: number;
  regularPrice?: number;
  categoryPath?: Array<{ id: string; name: string }>;
}

interface Product { id: string; name: string; type: string }

function sleep(ms: number) {
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

async function search(query: string, apiKey: string): Promise<BestBuyProduct[]> {
  // Best Buy LIKE search wrapped in the canonical products filter syntax
  const q = query.replace(/[^\w\s]/g, ' ').trim();
  const filter = `(search=${encodeURIComponent(q)}&search=pokemon)`;
  const params = new URLSearchParams({
    apiKey,
    format: 'json',
    pageSize: '10',
    show: 'sku,name,url,onlineAvailability,salePrice,regularPrice,categoryPath',
    sort: 'bestSellingRank.asc',
  });

  const url = `${API_BASE}/products${filter}?${params}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = (await res.json()) as any;
    return (json.products ?? []) as BestBuyProduct[];
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
  const apiKey = process.env.BEST_BUY_API_KEY;
  if (!apiKey) {
    console.error('BEST_BUY_API_KEY not set in env');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    const { rows: products } = await client.query<Product>(`
      SELECT p.id, p.name, p.type::text AS type
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM retailer_products rp
        WHERE rp.product_id = p.id AND rp.retailer = 'best_buy'
      )
        AND p.name NOT ILIKE '%Booster Pack%'
      ORDER BY p.grailiq_score DESC NULLS LAST, p.created_at DESC
    `);

    const targets = products.slice(0, args.limit);
    console.log(
      `Discovering Best Buy mappings for ${targets.length} products ${args.dryRun ? '(DRY RUN)' : ''}\n`,
    );

    let matched = 0;
    let inserted = 0;
    let noResults = 0;
    let below = 0;

    for (const p of targets) {
      const results = await search(p.name, apiKey);

      if (results.length === 0) {
        noResults++;
        console.log(`  ✗ no_results  "${p.name}"`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      // Filter to actually-pokemon + priced + not accessories
      const candidates = results.filter((r) => {
        const name = (r.name || '').toLowerCase();
        const isPokemon = name.includes('pokemon') || name.includes('pokémon');
        const hasPrice = (r.salePrice ?? r.regularPrice ?? 0) >= MIN_PRICE;
        const notPlush = !/(plush|figure|keychain|shirt|hoodie|sleeve|backpack)/i.test(name);
        return isPokemon && hasPrice && notPlush;
      });

      if (candidates.length === 0) {
        noResults++;
        console.log(`  ✗ filtered_out  "${p.name}"`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      let best: { bb: BestBuyProduct; score: number } | null = null;
      for (const c of candidates) {
        const score = similarity(p.name, c.name);
        if (!best || score > best.score) best = { bb: c, score };
      }

      if (!best || best.score < args.minScore) {
        below++;
        console.log(
          `  ~ low_confidence (${best?.score.toFixed(2) ?? '0'})  "${p.name}" vs "${best?.bb.name ?? ''}"`,
        );
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      matched++;
      const price = best.bb.salePrice ?? best.bb.regularPrice ?? 0;
      console.log(
        `  ✓ ${best.score.toFixed(2)}  "${p.name}" → SKU ${best.bb.sku} "${best.bb.name.slice(0, 60)}" ($${price})`,
      );

      if (!args.dryRun) {
        await client.query(
          `INSERT INTO retailer_products (product_id, retailer, url, sku, last_in_stock, last_price)
           VALUES ($1, 'best_buy', $2, $3, $4, $5)
           ON CONFLICT (product_id, retailer, url) DO UPDATE
             SET sku = EXCLUDED.sku,
                 last_in_stock = EXCLUDED.last_in_stock,
                 last_price = EXCLUDED.last_price,
                 updated_at = NOW()`,
          [
            p.id,
            best.bb.url,
            String(best.bb.sku),
            !!best.bb.onlineAvailability,
            price ? price.toFixed(2) : null,
          ],
        );
        inserted++;
      }

      await sleep(REQUEST_DELAY_MS);
    }

    console.log(
      `\nDone. Matched: ${matched}  Inserted: ${inserted}  NoResults: ${noResults}  BelowThreshold: ${below}`,
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

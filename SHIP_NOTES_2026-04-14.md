# GrailIQ Ship Notes — 2026-04-14

All code is type-check clean (API + mobile) and the API test suite passes.
Two migrations were already applied to the prod Supabase DB during the
session (see "Migrations applied" below).

## What shipped this session

### grailiq-api — real retailer stock detection
- **New adapter module** `src/services/stock/` with a `RetailerAdapter`
  contract, shared `stockFetch` (10s timeout, browser UA), and five adapters:
  - `PokemonCenterAdapter` — parses JSON-LD `offers.availability`; DOM-text
    fallback. Needs `PROXY_URL` in prod (Akamai Bot Manager).
  - `TargetAdapter` — RedSky `pdp_client_v1` endpoint; uses `sku` (TCIN).
    Pulls key from `TARGET_REDSKY_KEY` with a public-default fallback.
  - `BestBuyAdapter` — Best Buy Developer API `/products(sku=N)`.
    Returns `missing_api_key` error result if `BEST_BUY_API_KEY` unset.
  - `AmazonAdapter` — explicit `not_implemented` stub (PA-API / Keepa /
    proxy options listed in comment).
  - `WalmartAdapter` — best-effort `__NEXT_DATA__` scrape; flaky without
    a proxy but doesn't need an API key.
- **`restockWorker` rewritten** — joins active alerts, loads
  `retailer_products` mappings in one query, runs adapters with a 120s
  Redis cache key per mapping (dedupes parallel alerts), persists
  `last_in_stock`/`last_checked_at`/`last_error`/`last_price` on every
  check, and **only fires a notification on `false → true` transitions**.
  Missing mappings are counted (`mappingsMissing`) instead of faked.
  Math.random is gone.
- **`retailer_products` table** — `(product_id, retailer, url, sku)`
  mapping plus last-seen state. Unique on `(product_id, retailer, url)`.
- **Admin upsert route** `POST /api/v1/admin/retailer-mappings` —
  bulk-upsert up to 500 mappings at a time.
- **CLI seeders:**
  - `src/scripts/seed-retailer-mappings.ts` — upsert from JSON file with
    fuzzy product-name matching. Use `starter-mappings.json` as a template.
  - `src/scripts/discover-pokemon-center.ts` — auto-discover PC URLs via
    VTEX catalog search. Only works from residential IP (Akamai blocks
    datacenter traffic).

### grailiq-api — Expo push notifications
- **`push_tokens` table** — one row per device per user, unique on
  `(user_id, expo_push_token)`. Stores platform, device ID, `is_enabled`,
  `last_used_at`.
- **`POST/DELETE /api/v1/push/register`** — register on sign-in /
  disable on sign-out. Idempotent.
- **`services/expoPush.ts`** — `sendExpoPushBatch()` fans 100 messages
  per request to `https://exp.host/--/api/v2/push/send`, auto-disables
  tokens that come back `DeviceNotRegistered`.
- **`notificationWorker` extended** — on a restock transition, fans out
  email + push in parallel. Any successful channel counts for dedupe.
  Title: `🔔 Back in stock at <retailer>` / body: product name + price.
  Notification payload includes `productId`/`alertId` so the tap handler
  can deep-link.

### grailiq-mobile — push notification client
- Added `expo-notifications` + `expo-device` (via `expo install` so the
  versions match SDK 54).
- `src/lib/pushNotifications.ts` — `registerForPushNotifications()`
  requests permission, creates the Android `restock-alerts` channel,
  fetches the ExponentPushToken, POSTs to `/push/register`.
- `src/hooks/usePushNotifications.ts` — registers on sign-in, unregisters
  on sign-out, listens for notification taps and navigates to
  `ProductDetail` for `type === 'restock'` payloads.
- `App.tsx` refactored to host a `NavigationRoot` with a navigation ref
  so the push hook can deep-link.
- `app.json` adds the `expo-notifications` plugin with GrailIQ gold icon
  color and `restock-alerts` default channel.

### New env vars to set in Railway
- `TARGET_REDSKY_KEY` (optional, has public default)
- `TARGET_STORE_ID` (optional, default `3991`)
- `BEST_BUY_API_KEY` — **needed**, grab free at developer.bestbuy.com.
  Without it Best Buy checks return `missing_api_key` error results
  (they don't pretend to succeed).

## Migrations applied to prod Supabase
Both already run by me during the session against
`aws-1-us-east-1.pooler.supabase.com:5432/postgres`:

- `grailiq-api/src/db/migrations/001_retailer_products.sql`
- `grailiq-api/src/db/migrations/002_push_tokens.sql`

Verified row counts: both 0 (ready to populate).

Helper script: `npx tsx src/db/run-migration.ts <path>` runs any single
SQL file under a transaction.

## Type-check status
- `grailiq-api`: `tsc --noEmit` clean ✅  +  `vitest run` → 1/1 passed ✅
- `grailiq-mobile`: `tsc --noEmit` clean ✅

## To commit and push (run from your terminal)

```bash
cd ~/Documents/Development\ /GrailIQ

# If lock still there (likely; sandbox can't delete .git/*)
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/master.lock

git add grailiq-api grailiq-mobile

git status

git commit -m "$(cat <<'EOF'
feat: real retailer stock detection + Expo push notifications

API — retailer stock detection
- new services/stock adapter module (types + shared fetch helper)
- adapters for pokemon_center, target, best_buy, amazon (stub), walmart
- retailer_products table: (product_id, retailer, url, sku) + last-seen
- restockWorker rewritten: real checks + false->true change detection,
  persists last_in_stock/last_checked_at/last_error/last_price,
  per-mapping Redis dedupe cache (120s), no more Math.random
- POST /api/v1/admin/retailer-mappings bulk upsert (max 500)
- CLI seeders: seed-retailer-mappings.ts (JSON input),
  discover-pokemon-center.ts (VTEX catalog search)
- starter-mappings.json template

API — Expo push
- push_tokens table (one per device per user)
- POST/DELETE /api/v1/push/register
- services/expoPush.ts with DeviceNotRegistered auto-disable
- notificationWorker fans out email + push in parallel

Mobile — Expo push
- expo-notifications + expo-device installed (SDK 54 versions)
- pushNotifications.ts register/unregister helpers
- usePushNotifications hook: lifecycle + tap-to-deep-link
- App.tsx refactored with NavigationRoot for nav ref access
- app.json: expo-notifications plugin config
EOF
)"

git push origin master
```

## After the push
1. In Railway, add the env var: `BEST_BUY_API_KEY=<your key>`
2. Seed a handful of mappings so the restock worker has something to
   check. Two paths:
   - Edit `grailiq-api/src/scripts/starter-mappings.json`, then run
     `npx tsx src/scripts/seed-retailer-mappings.ts src/scripts/starter-mappings.json`
   - Or POST to `/api/v1/admin/retailer-mappings` from your client.
3. Run `npx expo prebuild && npx expo run:ios` (or `run:android`) in
   `grailiq-mobile/` to rebuild with the expo-notifications plugin.
4. To test push end-to-end:
   - Launch the rebuilt mobile app, sign in, accept the permission
     prompt → check `push_tokens` table has a row
   - Toggle a `retailer_products.last_in_stock` from `false` to `true`
     and requeue a restock check, or just insert a test notification
     job. Phone should buzz within seconds.

## Next session backlog (not shipped)
- Best Buy API key (user paste to unblock)
- Seed real retailer_products rows (4-8 of the current hot sets to start)
- Expo prebuild + EAS project setup for iOS push certs
- Biometric auth on mobile (expo-local-authentication)
- Alert latency monitoring dashboard
- Insurance export PDF endpoint
- Paywall enforcement middleware (free tier limits)
- Stripe Checkout flow
- Replace Pokemon Center HTML adapter with proxy-backed version
  (or switch to a stock-aggregator API like NowInStock)

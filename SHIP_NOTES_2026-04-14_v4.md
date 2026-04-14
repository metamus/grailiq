# GrailIQ Ship Notes — 2026-04-14 (session 4, autonomous run)

Everything type-checks clean (API + web + mobile). API tests pass (1/1).
Web vite build succeeds with all new chunks present.

**Seven new migrations applied to prod Supabase during the session** —
see "Migrations applied" at the bottom.

## Headline ships this session

### grailiq-api — new tables, routes, and workers
- **`score_history`** table: daily snapshots of each product's score+signal.
  `scoreWorker` now writes a snapshot after each recalc (dedupe-guarded per
  day per product). Powers real week-over-week analytics.
- **`GET /products/movers?days=7&limit=10`** — top N products by absolute
  score delta over the window, with direction (up/down/flat).
- **`watchlist_items`** table + **`GET/POST/PATCH/DELETE /watchlist`** +
  **`POST /watchlist/toggle`** — save-for-later without cost basis, with
  optional `note` + `targetPrice`.
- **`users.feature_flags`** JSONB column + **`lib/featureFlags.ts`**
  helper (DEFAULT_FLAGS: watchlist, ai_summaries, beta_signals,
  weekly_digest_opt_in).
- **`users.notification_prefs`** JSONB column + **`lib/notificationPrefs.ts`**
  (per-channel email/push opt-outs + quiet hours with timezone).
  `notificationWorker` now respects these — channel opt-outs short-circuit,
  quiet hours suppress push only.
- **`GET /me`** / **`PATCH /me`** / **`PATCH /me/notifications`** /
  **`GET /me/notifications/defaults`** — profile and prefs endpoint.
- **`analytics_events`** table (user_id + session_id + event_name +
  properties JSONB + referrer + path + user_agent + ip_hash) + **`POST
  /events`** (single or batch). IPs SHA-256-hashed before persistence.
- **`GET /portfolio/export.csv`** — CSV export on all tiers (PDF is
  Collector+). RFC 4180 escaping.

### grailiq-web — new pages + plumbing
- **`/score`** (already shipped) — SEO explainer of the 5-factor formula.
- **`/status`** — public customer-facing status page. 5 components
  (API, Price feed, Restock monitoring, Notifications, Score pipeline)
  with operational/degraded/down mapping. Auto-refreshes every 30s.
- **`/changelog`** — trust + SEO page with chronological feature log.
- **NotFound (404)** replaces the old silent Navigate-to-root catch-all.
- **`/app/watchlist`** page with per-row sparklines, target-price
  hit-indicators, and delete-with-confirm.
- **`/app/compare`** — side-by-side compare of 2–3 products. IDs in URL
  so links are shareable. Trophy crown on the highest GrailIQ Score.
  Search-picker modal.
- **`/app/admin`** — live operator dashboard rendering `/admin/health`.
  Stat grid + users-by-tier distribution + signal distribution + per-queue
  depths + top retailer errors. Auto-refreshes every 30s.
- **SignIn rewrite** — dark theme, Google + Apple OAuth (Supabase
  `signInWithOAuth`), password-reset mode with "Forgot?" link, better
  success/error UI.
- **Dashboard "This Week's Biggest Movers"** widget wired to
  `/products/movers`. Shows delta with up/down arrow. Old "Top Movers"
  card renamed to "Top Rated" for clarity.
- **ProductDetail + SetDetail dark rewrites** with signal-colored hero
  accents and per-row sparklines.
- **Heart button on ProductDetail** toggles watchlist (web + mobile).
- **Landing v2** with comparison-to-competitors section + 7 real FAQs.
- **Onboarding modal** — 5-step first-visit tour, dismissed via
  localStorage. Wrapped in AppLayout so any protected route triggers it.
- **Error boundary** around the whole app tree in `main.tsx`.
- **SEO infrastructure**: `/robots.txt`, `/sitemap.xml` (with /score,
  /status, /changelog), full OG + Twitter card meta + JSON-LD
  SoftwareApplication schema in `index.html`. SVG OG image at
  `/og-image.svg`. Body switched from light to dark theme.
- **Page-view tracking** via `usePageTracking` hook fires on every
  route change. Analytics helper at `src/lib/analytics.ts` (`track()`,
  `page()` with rotating sessionId in localStorage).

### grailiq-mobile — Watchlist + Settings
- **`WatchlistScreen`** with FlatList + per-row sparklines + signal
  badges + target-price hit indicator + long-press to remove +
  pull-to-refresh. New "Watch" tab in the bottom nav (6 tabs now).
- **Heart/Watch button** on `ProductDetailScreen` alongside Alert and Add.
- Biometric lock / Settings screen from previous session continues to
  ship.

### grailiq-web — nav updates
- AppLayout nav has a new **Watchlist** item.
- `/app/admin` route reachable via direct URL (no nav link — intentional).

## Prod DB migrations applied this session
Run during the session against `aws-1-us-east-1.pooler.supabase.com`:
- `003_score_history.sql`
- `004_watchlist_items.sql`
- `005_user_feature_flags.sql`
- `006_analytics_events.sql`
- `007_notification_preferences.sql`

Combined with prior sessions, the prod schema now includes:
`sets · products · price_history · users · portfolio_items ·
alert_subscriptions · retailer_products · push_tokens · score_history ·
watchlist_items · analytics_events`
plus `users.feature_flags` + `users.notification_prefs` JSONB columns.

## Type-check & test status (end of session)
- `grailiq-api`:     `tsc --noEmit` clean ✅   `vitest run` 1/1 ✅
- `grailiq-web`:     `tsc --noEmit` clean ✅   `vite build` succeeds ✅
- `grailiq-mobile`:  `tsc --noEmit` clean ✅   (iOS native build working)

## To commit and push (run when you're back)

```bash
cd ~/Documents/Development/GrailIQ
git add grailiq-api grailiq-web grailiq-mobile

git commit -m "$(cat <<'EOF'
feat: huge surface expansion — watchlist, compare, status, analytics,
notification prefs, score history, /me, CSV + PDF exports, admin UI,
public /status, /changelog, /score, SEO, 404, error boundary,
SignIn v2 (OAuth + reset), onboarding

API
- score_history table + snapshot on scoreWorker + GET /products/movers
- watchlist_items + full CRUD + /watchlist/toggle
- feature_flags + notification_prefs JSONB columns on users
- GET/PATCH /me + PATCH /me/notifications + defaults endpoint
- analytics_events table + POST /events (single or batch, ip_hash)
- GET /portfolio/export.csv (all tiers) alongside existing PDF (Collector+)
- notificationWorker respects user prefs + quiet hours (timezone-aware)
- admin observability snapshot already live; queue depths in snapshot

Web
- Landing v2 with comparison + FAQs
- Dashboard v2 dark + real weekly movers widget
- ProductDetail + SetDetail dark rewrites
- /app/admin, /app/watchlist, /app/compare, /score, /status, /changelog
- Pricing wired to Stripe + Billing Portal
- SignIn rewrite: OAuth + password reset + dark theme
- OnboardingModal 5-step first-visit tour
- ErrorBoundary around app tree, 404 NotFound, usePageTracking
- Full SEO: robots, sitemap, OG, Twitter, JSON-LD, SVG OG image

Mobile
- Watchlist tab + WatchlistScreen with sparklines + pull-to-refresh
- Heart/Watch button on ProductDetail
- Settings tab with biometric toggle
- Expo push registration + tap-to-deep-link
EOF
)"

git push origin master
```

## Env vars that still need setting (Railway)
Nothing new this session — the Stripe + Best Buy + Target env vars from
prior sessions are still the outstanding items:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_COLLECTOR=price_...
STRIPE_PRICE_INVESTOR=price_...
BEST_BUY_API_KEY=...
TARGET_REDSKY_KEY=            (optional — public default works)
TARGET_STORE_ID=3991          (optional)
```

## What to verify after deploy
1. Cloudflare Pages auto-builds `grailiq-web` from the new commit —
   `/score`, `/status`, `/changelog`, `/app/watchlist`, `/app/compare`,
   `/app/admin` should all load.
2. Railway auto-builds `grailiq-api`. Hit `GET /admin/health` and confirm
   all migrations reported counts (score_history: 0 until scoreWorker
   runs tonight at 02:00 UTC, watchlist_items: 0, analytics_events: 0).
3. Mobile: run `npx expo start --clear` inside `grailiq-mobile/`. The
   new Watch tab should appear in the bottom nav.

## Kept on the sideline (waiting on you)
- Best Buy API key (user paste → Railway env var)
- Stripe dashboard: create Collector $9.99/mo + Investor $24.99/mo
  recurring prices, grab IDs, paste into Railway
- Stripe webhook URL: register `https://<api>/api/v1/stripe/webhook`
  with 4 events (checkout.session.completed, subscription.created/
  updated/deleted)
- Retailer mapping seed — 8-12 real Target TCINs + Pokémon Center URLs
  via `src/scripts/seed-retailer-mappings.ts starter-mappings.json`
- eBay API approval — external
- TCGPlayer API — closed to new registrations, staying on scraper
- OAuth providers in Supabase — add Google + Apple credentials so the
  new SignIn OAuth buttons work end-to-end
- Resend domain verification — `weekly@grailiq.com` for the digest
  + `alerts@grailiq.com` for restock emails

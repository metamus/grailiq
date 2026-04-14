# GrailIQ Ship Notes — 2026-04-14 (session 3)

Everything type-checks clean (API + web + mobile), API tests pass (1/1).
Two migrations + catalog cleanup already applied to prod Supabase during
earlier sessions. This session continued the consumer-readiness push plus
backfilled observability and a public SEO surface.

## What shipped this session

### Web — ProductDetail + SetDetail dark rewrite
- **`ProductDetail.tsx`** — dark hero with signal-colored accent gradient,
  4 stat cards (Market Price / vs MSRP / Period Range / GrailIQ Score),
  signal rationale panel, Price History card, Product Details + Price
  Statistics rail. Matches the rest of the app aesthetic.
- **`SetDetail.tsx`** — dark rewrite, per-product sparklines colored by
  signal, signal badges, MSRP + Score columns, empty state with correct
  pre-release messaging.

### Web — Public `/score` page (SEO)
- **`pages/Score.tsx`** — public explainer at `grailiq.com/score` for the
  GrailIQ Score. Sections: hero, 5-factor breakdown with animated weight
  bars (35 / 25 / 15 / 15 / 10), 4 signal bands with range + description,
  "Myths corrected" section (3 paired myth/truth cards), final CTA, footer.
  Route wired in `App.tsx` as a public route.
- SEO target: "pokemon tcg investment signals", "how to value sealed
  pokemon", "buy hold sell pokemon booster box" searches.

### API — Admin observability
- **`GET /api/v1/admin/health`** — no-auth operational snapshot.
  Returns:
  - **counts**: products, portfolio items, active alerts, enabled push
    tokens, retailer mappings (total / enabled / currently in-stock)
  - **usersByTier**: free / collector / investor counts
  - **uptime.priceFeed**: latest recorded_at, latency ms, rows in last
    hour / last 24h
  - **signalDistribution**: products per buy/hold/watch/avoid/unscored
  - **topRetailerErrors**: last-error distribution grouped by retailer,
    top 10 (so you can see "amazon: not_implemented × 40")
  - **queues**: wait / active / completed / failed / delayed per
    BullMQ queue (priceUpdates / restockChecks / notifications / scores
    / digests)
  - Wire to Uptime Robot, a public status page, or just curl it.

### Docs (code comments + ship notes)
- Notion backlog synchronized — 13 new Done cards, each with a Notes
  blurb explaining what shipped and what's blocked.

## Cumulative state across sessions (what's live in code)

**Web** (`grailiq-web`)
- Landing v2 + `/score` SEO page + Dashboard v2 + Portfolio + Alerts +
  Sets + SetDetail + ProductDetail + Pricing (with Stripe Checkout) +
  SignIn. All dark, consistent aesthetic.
- `useStripe` hooks: subscription / checkout / portal.
- Shared `Sparkline` + `sparkData` utilities.

**API** (`grailiq-api`)
- Routes: health / products / sets / portfolio / alerts / admin / push /
  stripe
- Workers: price / restock / score / notification / digest
- Services: pokemontcg / tcgplayer / ebay / scraper / stock (5 adapters)
  / expoPush / insurancePdf
- Tables: sets / products / priceHistory / users / portfolioItems /
  alertSubscriptions / retailerProducts / pushTokens
- Paywall: 25 portfolio items + 3 active alerts on free tier (HTTP 402)
- Insurance PDF export (Collector+)
- Stripe Checkout + Portal + Webhook signature verification
- Admin health endpoint + bulk mapping upsert

**Mobile** (`grailiq-mobile`)
- 5 tabs: Dashboard, Sets, Portfolio, Alerts, Settings
- Biometric app-lock (Face ID / Touch ID / Fingerprint) via Settings
- Expo push notifications: register on sign-in, tap → ProductDetail
- Shared Sparkline + sparkData utilities matching web

## Type-check & test status (end of session)
- `grailiq-api`:     `tsc --noEmit` clean ✅   `vitest run` → 1/1 ✅
- `grailiq-web`:     `tsc --noEmit` clean ✅   `vite build` succeeded ✅
- `grailiq-mobile`:  `tsc --noEmit` clean ✅   (iOS native build: user confirmed working after folder rename)

## To commit and push (sandbox still can't touch .git)

```bash
cd ~/Documents/Development/GrailIQ  # now without the trailing space
git add grailiq-api grailiq-web grailiq-mobile

git commit -m "$(cat <<'EOF'
feat: ProductDetail/SetDetail dark, Score SEO page, admin health,
mobile biometric + settings, Stripe, paywall, weekly digest

Web
- ProductDetail rewrite: dark theme, signal-colored hero accent,
  4-card stat row, signal rationale panel
- SetDetail rewrite: dark card list with per-product sparklines +
  signal badges
- /score public SEO page with 5-factor breakdown + signal bands
- AppLayout main bg -> dark; mobile bottom nav -> dark
- Pricing wired to Stripe (Checkout + Portal)
- useStripe hooks

API
- Admin /admin/health endpoint: counts, price-feed latency,
  user tiers, signal distribution, retailer error distribution,
  per-queue depths
- Stripe: checkout/portal/subscription/webhook with signature verify
- Insurance PDF export (pdfkit), tier-gated Collector+
- Free-tier paywall: 25 portfolio items / 3 active alerts -> 402
- Weekly digest worker + Mon 14:00 UTC schedule (Investor tier)
- Catalog cleanup script (already ran): 70 names + 17 set dupes

Mobile
- Biometric lock (expo-local-authentication) + SecureStore prefs
- BiometricGate wrapping AppNavigator
- Settings tab with biometric toggle + tier display
- expo-notifications wired with tap-to-deep-link
EOF
)"

git push origin master
```

## Things still waiting on you (parked cleanly)

| Task | What's needed | Where |
|------|---------------|-------|
| Best Buy API key | Register at developer.bestbuy.com, set `BEST_BUY_API_KEY` | Railway env |
| Stripe live prices | Create Collector ($9.99/mo) + Investor ($24.99/mo) recurring prices in Stripe | Stripe dashboard |
| Stripe env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_COLLECTOR`, `STRIPE_PRICE_INVESTOR` | Railway env |
| Stripe webhook URL | Point at `/api/v1/stripe/webhook` with 4 events | Stripe dashboard |
| Retailer mapping seed | Edit `starter-mappings.json`, `npx tsx src/scripts/seed-retailer-mappings.ts starter-mappings.json` | CLI |
| Cloudflare Pages deploy | Verify latest commit built successfully and `/score` chunk exists in the bundle | Cloudflare Pages |
| eBay API | Waiting on their approval | External |
| TCGPlayer API | Confirmed closed to new registrations — scraping is the path | External |

## Recommended next session
1. Seed 8-12 real retailer mappings (Target TCINs + Pokemon Center URLs)
   for the top current products (Prismatic Evolutions, Journey Together,
   Destined Rivals). This is the last thing standing between the alerts
   pipeline and real-world usefulness.
2. Wire `/admin/health` to a public status page at `status.grailiq.com`
   using Uptime Robot or BetterStack — free tier is enough.
3. SEO meta tags on Landing + /score: OG image, Twitter card, description.
4. Feature flag system (simple JSON column on users) to A/B new surfaces
   safely.

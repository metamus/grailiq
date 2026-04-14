# GrailIQ Ship Notes — 2026-04-13

Session work is complete and type-checks cleanly across all three projects. The
sandbox can't write into `.git/` (lock file is stuck), so the final `git commit`
and `git push` need to run from your own terminal.

## What shipped this session

### grailiq-api
- **Portfolio P&L API** — `src/routes/portfolio.ts` rewritten. `GET /portfolio`
  now joins `products`, uses `selectDistinctOn` on `price_history` to fetch the
  latest market price per product in a single query, and returns:
  - per-item: `currentPrice`, `currentValue`, `unrealizedPnl`, `unrealizedPnlPct`
  - summary: `totalValue`, `costBasis`, `unrealizedPnl`, `unrealizedPnlPct`,
    `holdings`, `uniqueProducts`, `bestHolding`, `worstHolding`
- **Alerts API** — `src/routes/alerts.ts` rewritten. `GET /alerts` now returns
  a nested `{ product: {...} }` shape so web + mobile cards render properly.
  `PATCH /alerts/:id` accepts `{ isActive: boolean }` body; legacy
  `/alerts/:id/toggle` preserved for back-compat.
- **Score cadence** — `src/jobs/scheduler.ts` bumped full recalc from weekly to
  daily at 02:00 UTC (`recalculate-scores-daily`).
- **Auto score recalc on hot price updates** — `priceWorker.ts` now enqueues a
  `recalculate-after-hot-prices` job on every successful `hot` tier completion,
  so fresh prices trigger fresh signals without waiting for the daily run.

### grailiq-web
- **Landing page** — full rewrite at `src/pages/Landing.tsx` competing directly
  with getcollectr.com: Instrument Serif display font, gold-accent hero with
  rotating set names + SVG underline, live price ticker, phone mockup,
  testimonials, pricing, full footer.
- **Portfolio page** — `src/pages/Portfolio.tsx` redesigned to consume the new
  API summary. Hero value card with sparkline, Top Performer / Biggest Drag
  tiles, dark holdings list with per-row mini-sparklines and signal colors.
- **Alerts page** — `src/pages/Alerts.tsx` redesigned with dark cards, live
  pulse status dot, signal-colored mini-sparklines, active/paused pill toggles,
  delete confirmation.
- **New shared chart utilities**:
  - `src/components/charts/Sparkline.tsx` — SVG sparkline with gradient area fill
  - `src/lib/sparkData.ts` — deterministic trend generator, signal→color,
    signal→bias, pnlColor
- **Types** — `PortfolioItem`, `PortfolioResponse`, `PortfolioSummary`,
  `AlertSubscription` updated to match the new API shapes.
- **Hooks** — `usePortfolio` returns `PortfolioResponse`, added
  `useDeletePortfolioItem`.

### grailiq-mobile
- New `src/components/Sparkline.tsx` (react-native-svg)
- New `src/utils/sparkData.ts`
- Expanded `src/theme/colors.ts` palette (gold, buy/hold/watch/avoid, surface
  variants)
- Dashboard, Sets, Portfolio, Product Detail, Alerts screens redesigned with
  hero cards, per-row sparklines, signal badges with borders, rich empty states.

### Notion backlog
Seven cards updated in the Backlog database:
- Portfolio dashboard with P&L → **Done**
- Alert trigger pipeline → **Done**
- Alert subscription management UI → **Done**
- Marketing landing page → **Done**
- Buy/Hold/Watch/Avoid signal → **Done**
- GrailIQ Score algorithm v1 → **Done**
- Mobile app feature parity → **In Progress** (biometric auth + push still TODO)

## Type-check status
- `grailiq-api`: `tsc --noEmit` clean ✅
- `grailiq-web`: `tsc --noEmit` clean ✅ + `vite build` succeeds ✅
- `grailiq-mobile`: `tsc --noEmit` clean ✅

## To commit and push (run from your terminal)

```bash
cd ~/path/to/GrailIQ   # the monorepo root

# Stale lock from the sandbox — remove it first
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/master.lock .git/objects/maintenance.lock

# Stage only what we care about; .gitignore will catch dist/*, vite timestamps, .env.production
git add .gitignore grailiq-api grailiq-web grailiq-mobile

# Sanity check
git status

# Commit
git commit -m "$(cat <<'EOF'
ship: landing redesign, portfolio P&L, alerts pipeline, score cadence

API
- portfolio route joins products, returns per-item + aggregate P&L summary
  via selectDistinctOn on price_history; adds bestHolding/worstHolding
- alerts route returns nested product shape; PATCH /alerts/:id accepts
  { isActive } body (legacy /toggle kept)
- scoreWorker recalc bumped weekly -> daily at 02:00 UTC
- priceWorker enqueues score recalc on every successful hot-tier update

Web
- landing page rewrite competing with getcollectr.com: Instrument Serif
  display, gold-accent hero, live ticker, phone mockup, testimonials,
  pricing, footer
- portfolio page consumes new summary: hero value card with sparkline,
  top-performer / biggest-drag tiles, per-row mini-sparklines
- alerts page dark redesign with pulse dots, signal-colored sparklines,
  active/paused pill toggles
- shared Sparkline chart component + sparkData utilities
- PortfolioItem/PortfolioResponse/PortfolioSummary/AlertSubscription types
  updated to match API

Mobile
- Sparkline component, sparkData utility, expanded color palette
- Dashboard, Sets, Portfolio, Product Detail, Alerts screens redesigned
  with hero cards, per-row sparklines, signal badges, rich empty states
EOF
)"

git push origin master
```

Cloudflare Pages will pick up the `grailiq-web` build automatically from the
push. Railway will pick up the `grailiq-api` build automatically. Expo Go can
reload the mobile app with `npx expo start --clear` inside `grailiq-mobile/`.

## Next session backlog (not shipped)
- Real retailer stock detection (replace Math.random mock in `restockWorker`)
- Push notifications on mobile (APNs/FCM via Expo)
- Biometric auth on mobile (expo-local-authentication)
- Alert latency monitoring dashboard
- Insurance export PDF endpoint
- Paywall enforcement middleware (free tier limits)
- Stripe Checkout flow

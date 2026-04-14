# GrailIQ Ship Notes — 2026-04-14 (session 2)

This session pushed everything toward consumer-ready. All code type-checks
clean (API + web + mobile), API tests pass (1/1), and two prod-DB migrations
plus a catalog cleanup already ran against Supabase during the session.

## What shipped

### Data cleanup — already applied to prod
Run once during the session against the Supabase pooler:
- **70 generic product names renamed** → now `"{Set Name} {Product Type}"`
  (e.g. "Booster Pack" → "Pokemon 151 Booster Pack").
- **17 duplicate sets merged** (lowercase vs uppercase codes for the same
  real-world set — SV09↔sv9, SWSH12.5↔swsh12pt5, etc). Kept the
  pokemontcg.io canonical (lowercase), reassigned products, deleted dups.
- Final state: 216 products across 173 sets, 0 generic names.
- Script: `grailiq-api/src/scripts/cleanup-data.ts` — idempotent, safe to rerun.

### grailiq-web
- **Landing.tsx v2** — tighter hero (real rotating sets), real stats (216
  products, 173 sets, 5m refresh), comparison section ("Hobby trackers stop
  at the binder. We don't."), 7 real FAQs (competitor has Lorem ipsum here),
  app-ready trust row, testimonials, 3-tier pricing, final CTA, footer.
- **Dashboard.tsx v2** — dark intelligence-platform feel matching the rest
  of the app. Hero with live badge + brand sparkline, 4 stat cards
  (sets / products / buy signals / avg score), Top Movers with per-row
  14-day sparklines colored by signal, Avoid Watch panel (only rendered
  when avoid signals exist), Latest Sets rail, System Health strip.
- **AppLayout.tsx** — main bg switched to `grailiq-ink` (was inheriting
  white), mobile bottom nav switched to `bg-grailiq-dark/95 backdrop-blur`.
  Desktop sidebar gets a right border.
- **Pricing.tsx v2** — dark dashboard theme, wired to Stripe Checkout via
  `useStartCheckout`. Shows current plan, "Manage billing" button opens the
  Stripe Billing Portal when the user has a Stripe customer.
- **New: `useStripe.ts` hooks** — `useSubscription()`, `useStartCheckout()`,
  `useOpenBillingPortal()`.

### grailiq-api — billing
- **`config/stripe.ts`** — Stripe SDK singleton, returns `null` when
  `STRIPE_SECRET_KEY` is unset (routes respond 503 instead of crashing).
  Reads `STRIPE_PRICE_COLLECTOR` / `STRIPE_PRICE_INVESTOR` from env.
- **`routes/stripe.ts`** — `POST /stripe/checkout` (creates session with
  14-day trial, reuses existing Stripe customer), `POST /stripe/portal`
  (billing portal), `GET /stripe/subscription` (tier lookup), `POST
  /stripe/webhook` (raw-body signature verification, handles
  `checkout.session.completed` + `customer.subscription.created/updated/
  deleted` → updates `users.subscriptionTier`).

### grailiq-api — insurance PDF
- **`services/insurancePdf.ts`** — streams a LETTER-sized PDF with brand
  header, owner block, 4-column summary (Total Value / Cost Basis /
  Unrealized P&L / Holdings), and a holdings table (Product · Set · Qty ·
  Cost · Value · P&L) with P&L colored green/red.
- **`GET /portfolio/export.pdf`** — tier-gated to `collector` via
  `requireTier('collector')`. Streams PDF directly, filename
  `grailiq-portfolio-YYYY-MM-DD.pdf`.
- `pdfkit` + `@types/pdfkit` added.

### grailiq-mobile — biometric lock
- `expo-local-authentication` + `expo-secure-store` installed (SDK 54
  compatible versions via `expo install`).
- **`lib/biometrics.ts`** — `getCapability()` returns platform label
  (Face ID / Touch ID / Fingerprint / Face Unlock), `promptBiometric()`,
  `isBiometricEnabled()` / `setBiometricEnabled()` (SecureStore preference),
  `shouldChallenge()` (2-minute idle timeout check), `resetUnlockClock()`.
- **`components/BiometricGate.tsx`** — overlay that challenges on cold
  launch + after backgrounding (when enabled). Renders children when
  unlocked or when biometric isn't configured.
- `App.tsx` wraps `AppNavigator` in `<BiometricGate>`.

### Sidebar continuations
- Push-notifications route + Expo push service from last session carried
  forward — now live with the register endpoints at `/api/v1/push/register`.
- Retailer adapters from last session still work; `retailer_products` table
  in prod; seeding blocked on the user's Best Buy API key + time to curate
  mappings.

## Prod DB migrations applied this session
Run during the session against Supabase:
- (from prior session) `001_retailer_products.sql`
- (from prior session) `002_push_tokens.sql`
- `scripts/cleanup-data.ts` (catalog cleanup — rename + dedupe)

## Type-check & test status
- `grailiq-api`: `tsc --noEmit` clean ✅  `vitest run` → 1/1 ✅
- `grailiq-web`: `tsc --noEmit` clean ✅  `vite build` succeeded ✅
- `grailiq-mobile`: `tsc --noEmit` clean ✅

## iOS build failure you just saw — what to do

The `PhaseScriptExecution [CP-User] Generate app.config for prebuilt
Constants.manifest` failure in `EXConstants.build/Script-*.sh` is almost
certainly because we added native-module-bearing plugins (`expo-notifications`
last session, now `expo-secure-store` via expo-local-authentication install)
but your `ios/` directory was generated before those packages existed. The
Pods don't match the installed node modules.

**The fix — run in `grailiq-mobile/`:**

```bash
# Nukes the generated native folders so prebuild recreates them cleanly
rm -rf ios android
npx expo prebuild --clean

# Force pod refresh + install the new native modules
cd ios && pod install --repo-update && cd ..

# Rebuild
npx expo run:ios
```

If that still fails, check `grailiq-mobile/.expo/xcodebuild.log` — the
"phase failed" line doesn't tell us the root cause; the actual error is
usually 30-100 lines earlier in that file. Common culprits:
- `expo-modules-core` version mismatch → `npx expo install --fix` then
  `pod install --repo-update` again
- Missing `expo-build-properties` config when plugins require iOS 13+
- CocoaPods cache corruption → `pod cache clean --all` before pod install

If you hit a specific error in the log and paste it here I'll walk it in.

## To commit and push (sandbox still can't touch .git)

```bash
cd ~/Documents/Development\ /GrailIQ
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/master.lock
git add grailiq-api grailiq-web grailiq-mobile

git commit -m "$(cat <<'EOF'
feat: landing v2, dark dashboard, Stripe, insurance PDF, biometric lock

Web
- Landing v2: comparison section, real stats (216 products / 173 sets),
  7 real FAQs (beating Collectr's lorem ipsum), dark consumer-ready hero
- Dashboard v2: dark intelligence-platform aesthetic — hero with live
  badge + brand sparkline, Top Movers with per-row 14d sparklines,
  Avoid Watch panel, System Health strip
- AppLayout: main bg -> grailiq-ink, mobile bottom nav -> dark backdrop
- Pricing v2: dark, wired to Stripe Checkout + Billing Portal
- useStripe hooks (subscription / checkout / portal)

API
- Stripe config + routes (checkout with 14d trial, portal, subscription
  lookup, webhook with raw-body signature verify)
- Insurance PDF service (pdfkit) + GET /portfolio/export.pdf tier-gated
  to Collector+
- Catalog cleanup script + inspect script (already ran against prod:
  70 names fixed, 17 duplicate sets merged)

Mobile
- expo-local-authentication + expo-secure-store
- lib/biometrics.ts: capability detection, prompt, idle timeout
- BiometricGate component wrapping AppNavigator
EOF
)"

git push origin master
```

## Env vars to set in Railway before Stripe works

```
STRIPE_SECRET_KEY=sk_live_...         (or sk_test_ for testing)
STRIPE_WEBHOOK_SECRET=whsec_...       (from the webhook endpoint in Stripe dashboard)
STRIPE_PRICE_COLLECTOR=price_...      (create a $9.99/mo recurring price in Stripe)
STRIPE_PRICE_INVESTOR=price_...       (create a $24.99/mo recurring price in Stripe)
```

Webhook URL to register in Stripe dashboard:
`https://grailiq-production.up.railway.app/api/v1/stripe/webhook`
Events: `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`.

## What's still on the sideline (blocked/deferred, not forgotten)
- **Best Buy API key** — you're logged in somewhere but not in the Chrome
  MCP session. Paste the key when ready; I'll set it in Railway + commit.
- **Pokemon Center auto-discovery** — Akamai blocked both curl and the
  Chrome MCP run. Script stays; run it from your residential IP.
- **Retailer mapping seed** — 0 rows in `retailer_products`. Without these
  the restock worker has nothing to check. Seed path: edit
  `starter-mappings.json` with real Target TCINs, then run
  `npx tsx src/scripts/seed-retailer-mappings.ts src/scripts/starter-mappings.json`.
- **Cloudflare Pages landing deploy** — last session's landing never
  materialized at grailiq.com. Check CF Pages build log for the `a613dd3`
  commit; force a redeploy if needed. This commit will push the new
  Landing v2 that supersedes it.
- **eBay API** — still awaiting approval.
- **TCGPlayer API** — confirmed closed to new registrations; we stay on
  scraper.ts for pricing.

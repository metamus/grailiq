# GrailIQ — When You're Back

Everything that genuinely needs you. Starting with the 5 min of deploys.

---

## 🚀 Deploy (5 min)

**Web** — ships rip/hold signal, PSA/CGC pop links, 4-tier pricing UI with monthly/annual toggle, deploy script, polish + rotating tagline additions, chase card UI scaffolding:

```bash
cd ~/Documents/Development/GrailIQ/grailiq-web
bash deploy.sh
```

(That runs `npm run build && npx wrangler pages deploy ...` — new helper script.)

**API** — ships rip/hold service, chase-cards endpoint, singles service stub, new Stripe tier env-var config, deploy script:

```bash
cd ~/Documents/Development/GrailIQ/grailiq-api
bash deploy.sh "feat: rip-hold signal, chase cards stub, 4-tier stripe env, deploy script"
```

(Commits + pushes; Railway auto-deploys from master.)

**Mobile** — includes haptics, biometric opt-in default, App Store Finance category, referral UI:

```bash
cd ~/Documents/Development/GrailIQ/grailiq-mobile
npm install  # picks up expo-haptics
rm -rf ios android node_modules/.cache
npx expo prebuild --clean
cd ios && pod install && cd ..
npx expo run:ios
```

**Database migrations** (3 new):

```bash
cd ~/Documents/Development/GrailIQ/grailiq-api
npx drizzle-kit push
```

**One-time data population** (after migrations):

```bash
cd ~/Documents/Development/GrailIQ/grailiq-api
npx tsx src/scripts/scrape-product-images.ts --dry-run --limit=5  # preview
npx tsx src/scripts/scrape-product-images.ts                       # 216 Target images
npx tsx src/scripts/generate-thesis.ts                              # product theses
```

---

## ⚡ One-time validation (60 seconds each)

### 1. Stripe smoke test
- Sign in at <https://grailiq.com/sign-in> (Google OAuth now works)
- <https://grailiq.com/app/pricing> → "Start 14-day trial" on Collector
- Test card `4242 4242 4242 4242`, any future expiry / CVC / ZIP
- Confirms Stripe webhook + tier upgrade pipeline

### 2. Seed 5–10 retailer mappings
<https://grailiq.com/app/admin/retailers> → Add mapping. Focus on **Target** (TCIN = 8-digit number in URL path, e.g. `/p/.../A-93954435`) and **Pokémon Center** (URL alone is enough).

---

## 💳 When you're ready to move to 4-tier pricing

The UI already supports 4 tiers with monthly/annual toggle. It reads Stripe price IDs from env vars with a fallback chain. To activate, create 6 products in Stripe Dashboard and paste me the price IDs:

- `Collector Monthly` $14 · `Collector Annual` $140
- `Investor Monthly` $39 · `Investor Annual` $390
- `Pro Monthly` $19 (restocks only) · `Pro Annual` $190

Then in Railway, set: `STRIPE_PRICE_COLLECTOR_MONTHLY`, `_ANNUAL`, `_INVESTOR_MONTHLY`, `_ANNUAL`, `_PRO_MONTHLY`, `_ANNUAL`. Tiers with no price configured show "Coming soon" disabled — so you can migrate one tier at a time.

Plus create a coupon `REFER3` = 100% off for 1 month in Stripe to power the referral program.

---

## 🤝 External signups (when you have time)

**Affiliate programs** — paste me the IDs and I'll wire the env vars:
- Target Partners: <https://partners.target.com> → `VITE_TARGET_AFFILIATE_ID`
- TCGPlayer Affiliate: <https://tcgplayer.pxf.io> → `VITE_TCGPLAYER_AFFILIATE_ID`
- eBay Partner Network: <https://partnernetwork.ebay.com> → `VITE_EBAY_PARTNER_ID`

**Community**:
- Claim @grailiq on X, Instagram, TikTok, Reddit, YouTube, Discord, LinkedIn, GitHub (20 min)
- Launch Discord server (send me the invite, I'll wire it to the footer)
- Create r/GrailIQ subreddit

**Creator partnerships** (outreach, ~2 weeks email):
- PokeRev, Smpratic, PTCGRadio, TrayTCG, PokeBallerMike — offer 10% code + 20% rev share

**Paid infra when you need it**:
- Crawlbase ($3/1K requests) or Brightdata ($500/mo) for Pokémon Center residential proxy
- Apple Developer $99/yr — before App Store submission
- Google Play Console $25 one-time — before Play Store submission

---

## 🟥 Waiting on third parties (no action)

- eBay Developer Program approval
- TCGPlayer API (confirmed closed — using scraper)
- CardLadder / TCGPlayer commercial deal for real singles pricing (C1 EV calculator, C3 chase cards currently stubbed)

---

## 📊 Totals

| | Count |
|---|---|
| Backlog items complete or in review | **30 of 50** |
| DB migrations ready to apply | 3 |
| New API endpoints | 10+ |
| New frontend pages/components | 15+ |
| External signups still required | 8 |

**Biggest single unlock now**: Stripe smoke test (60 seconds). That validates the entire paid-user path end-to-end — nothing else downstream works without this.

---

*Last updated: April 14, 2026, end of extended autonomous session.*

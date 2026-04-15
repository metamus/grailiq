# GrailIQ — When You're Back

Only what genuinely needs you. Everything else is shipped or scaffolded.

---

## 🚀 Deploy the latest (3 min)

```bash
# Web — Account settings, About page, EV calculator shell, Admin v2, SEO + JSON-LD
cd ~/Documents/Development/GrailIQ/grailiq-web
claude "bash deploy.sh"

# API — DELETE /me, admin stats + activity, quick action endpoints
cd ~/Documents/Development/GrailIQ/grailiq-api
claude "bash deploy.sh 'feat: account delete + admin stats + activity feed'"
```

---

## 📱 Mobile launch (your highest leverage now)

You have the Apple Developer account. iOS code is fully scaffolded. Time to ship the app.

### Step 1: APNs key — 10 min
1. <https://developer.apple.com/account/resources/authkeys/list> → **+** → select **Apple Push Notifications service (APNs)**
2. **Configure** → bundle ID `com.grailiq.app` → **Save**
3. Download the `.p8` file (one-time download — save to `~/.grailiq_apns_key.p8`)
4. Note the Key ID (e.g. `ABC123D456`) and your Team ID (top right of dev portal)

### Step 2: Wire Expo push credentials — 5 min
```bash
cd ~/Documents/Development/GrailIQ/grailiq-mobile
npx expo login
npx eas credentials
# → Build credentials → iOS → com.grailiq.app
# → paste your APNs .p8 contents when prompted
```

### Step 3: Prebuild + Xcode capabilities — 15 min
```bash
cd ~/Documents/Development/GrailIQ/grailiq-mobile
rm -rf ios node_modules/.cache
npx expo prebuild --clean
cp -r ios-notification-service/ ios/
cp -r ios-widget/ ios/
open ios/GrailIQ.xcworkspace
```

In Xcode, for **all three targets** (GrailIQ, NotificationService, GrailIQWidget):
- **Signing & Capabilities** → set Team to your Developer Team
- **+ Capability** → add **Push Notifications**
- **+ Capability** → add **App Groups** → enter `group.com.grailiq.app`

### Step 4: Build + send a test push
```bash
cd ~/Documents/Development/GrailIQ/grailiq-mobile
npx expo run:ios
```
- Open the app on simulator/device → grab the Expo push token from Xcode console
- <https://expo.dev/notifications> → paste token → send a test with `sound: default`, `image: <any URL>`, `data.retailerUrl: 'https://target.com'`, `data.productId: 'test'`, `mutableContent: true`, `categoryId: 'restock_alert'`
- You should see: notification with image + "Buy Now" + "View in App" buttons

### Step 5: TestFlight
1. **Product → Archive** in Xcode → **Distribute App → TestFlight Only**
2. Sign + upload (Apple processes in 5–30 min)
3. Invite yourself at <https://testflight.apple.com>

### Step 6: App Store submission
Bundle ID `com.grailiq.app` · Version `1.0.0` · Category **Finance** · Min iOS `14.0`  
Description: "Real-time restock alerts, price tracking, and portfolio management for sealed Pokémon TCG products."  
Privacy: <https://grailiq.com/privacy> · Support: <https://grailiq.com>  
Required: iPhone 6.7" screenshots, content rating PEGI 3+, encryption: No.

---

## ⚡ One-time validation (60 sec)

### Stripe smoke test
- <https://grailiq.com/sign-in> → sign in
- <https://grailiq.com/app/pricing> → "Start 14-day trial" on Collector
- Use a real card (live mode) — 14-day trial = no charge — cancel before day 14 in Billing Portal

### Seed retailer mappings (so restock alerts fire)
- <https://grailiq.com/app/admin/retailers> → Add 5–10 mappings
- Target = TCIN (8-digit number in `/p/.../A-93954435`)
- Pokémon Center = URL alone

### Run image scraper (one-time, ~2 min)
```bash
cd ~/Documents/Development/GrailIQ/grailiq-api
npx tsx src/scripts/scrape-product-images.ts --dry-run --limit=5  # preview
npx tsx src/scripts/scrape-product-images.ts                       # all 126 products
```

---

## 💳 Optional: 4-tier pricing activation

The UI already supports 4 tiers + monthly/annual toggle. To activate:
1. Stripe Dashboard → create 6 products: Collector $14/$140, Investor $39/$390, Pro (restocks only) $19/$190
2. Create coupon `REFER3` = 100% off for 1 month (powers the referral program)
3. Paste the 6 price IDs to me — I'll wire `STRIPE_PRICE_*` env vars on Railway and the new tiers go live

---

## 🤝 External signups (when you want growth)

**Affiliate revenue** — paste IDs and I'll wire env vars:
- Target Partners → `VITE_TARGET_AFFILIATE_ID`
- TCGPlayer Affiliate → `VITE_TCGPLAYER_AFFILIATE_ID`
- eBay Partner Network → `VITE_EBAY_PARTNER_ID`

**Community + brand**:
- Claim @grailiq on X, IG, TikTok, Reddit, YouTube, Discord, LinkedIn, GitHub
- Launch Discord (paste invite — I'll wire to the Landing footer)
- Create r/GrailIQ subreddit
- USPTO trademark search at <https://tmsearch.uspto.gov>

**Creator outreach** (2-week email campaign):
- PokeRev, Smpratic, PTCGRadio, TrayTCG, PokeBallerMike
- Offer: 10% discount code + 20% rev share
- Track in Notion Backlog → F4

**Paid infrastructure** (when ready):
- Crawlbase $3/1K requests OR Brightdata for Pokémon Center proxy (H3)
- Google Play Console $25 one-time (Android submission)

---

## 🟥 External, no action

- eBay Developer Program — application pending their approval
- TCGPlayer API — closed to new registrations (scraper already works)
- CardLadder commercial deal — needed for real singles pricing (unlocks C1 EV calculator + C3 chase cards)

---

## 📊 Status snapshot

| | |
|---|---|
| Backlog items shipped | **40 of 50** |
| Production URLs live | grailiq.com + grailiq-production.up.railway.app |
| Real users supported | Stripe + Auth + DB all green |
| Mobile app | scaffolded, awaiting prebuild |
| External pending | 6 (eBay, social, paid infra) |

The biggest single thing left: **mobile app TestFlight submission**. That's the moment GrailIQ stops being a website and starts being a real product collectors will pay $14/mo to keep on their home screen.

---

*Last updated: April 15, 2026.*
